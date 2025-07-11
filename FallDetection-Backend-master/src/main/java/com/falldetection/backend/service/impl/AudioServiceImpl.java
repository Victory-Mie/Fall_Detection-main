package com.falldetection.backend.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.falldetection.backend.dto.TranscriptionResultDTO;
import com.falldetection.backend.service.IAudioService;
import okhttp3.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.FluxSink;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.Charset;
import java.text.SimpleDateFormat;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.Base64;
import java.net.URL;

@Service
public class AudioServiceImpl implements IAudioService {
    // 讯飞参数通过 Spring 注入
    @Value("${iflytek.appid}")
    private String appid;
    @Value("${iflytek.apikey}")
    private String apikey;
    @Value("${iflytek.secretKey}")
    private String secretKey;
    @Value("${iflytek.host}")
    private String hostUrl;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private OkHttpClient client = new OkHttpClient.Builder().build();

    // 用于管理每个 sessionId 的 WebSocket 连接和流
    private final Map<String, WebSocket> sessionWebSockets = new ConcurrentHashMap<>();
    private final Map<String, FluxSink<TranscriptionResultDTO>> sessionSinks = new ConcurrentHashMap<>();
    private final Map<String, AtomicInteger> sessionSeq = new ConcurrentHashMap<>();

    /**
     * 实现流式语音转写，前端每次传一片音频，后端实时推送转写结果
     */
    @Override
    public Flux<TranscriptionResultDTO> streamTranscribe(String sessionId, byte[] audioStream, boolean isLast) {
        return Flux.create(sink -> {
            try {
                // 若首次收到该 sessionId 的音频，建立 WebSocket 连接
                if (!sessionWebSockets.containsKey(sessionId)) {
                    String authUrl = getAuthUrl(hostUrl, apikey, secretKey);
                    String wsUrl = authUrl.replace("http://", "ws://").replace("https://", "wss://");
                    Request request = new Request.Builder().url(wsUrl).build();
                    AtomicInteger seq = new AtomicInteger(0);
                    sessionSeq.put(sessionId, seq);
                    // 创建 WebSocket 连接
                    WebSocket ws = client.newWebSocket(request, new WebSocketListener() {
                        @Override
                        public void onMessage(WebSocket webSocket, String text) {
                            try {
                                // 解析讯飞返回的 json 结果
                                Map<String, Object> jsonMap = objectMapper.readValue(text, Map.class);
                                Map<String, Object> header = (Map<String, Object>) jsonMap.get("header");
                                Map<String, Object> payload = (Map<String, Object>) jsonMap.get("payload");
                                if (header != null && (Integer) header.get("code") != 0) {
                                    sink.error(new RuntimeException("讯飞错误: " + header.get("message")));
                                    return;
                                }
                                if (payload != null) {
                                    Map<String, Object> result = (Map<String, Object>) payload.get("result");
                                    if (result != null && result.get("text") != null) {
                                        // 解码 base64 文本
                                        byte[] decodedBytes = Base64.getDecoder().decode((String) result.get("text"));
                                        String decodeRes = new String(decodedBytes, java.nio.charset.StandardCharsets.UTF_8);
                                        // 进一步解析识别文本
                                        Map<String, Object> textMap = objectMapper.readValue(decodeRes, Map.class);
                                        List<Map<String, Object>> wsList = (List<Map<String, Object>>) textMap.get("ws");
                                        StringBuilder sb = new StringBuilder();
                                        if (wsList != null) {
                                            for (Map<String, Object> wsObj : wsList) {
                                                List<Map<String, Object>> cwList = (List<Map<String, Object>>) wsObj.get("cw");
                                                if (cwList != null) {
                                                    for (Map<String, Object> cw : cwList) {
                                                        sb.append(cw.get("w"));
                                                    }
                                                }
                                            }
                                        }
                                        boolean last = (result.get("status") != null && ((Integer) result.get("status")) == 2);
                                        // 推送转写结果到前端
                                        sink.next(new TranscriptionResultDTO(sessionId, sb.toString(), last));
                                        if (last) {
                                            sink.complete();
                                            cleanupSession(sessionId);
                                        }
                                    }
                                }
                            } catch (Exception e) {
                                sink.error(e);
                            }
                        }
                        @Override
                        public void onFailure(WebSocket webSocket, Throwable t, Response response) {
                            sink.error(t);
                            cleanupSession(sessionId);
                        }
                        @Override
                        public void onClosed(WebSocket webSocket, int code, String reason) {
                            sink.complete();
                            cleanupSession(sessionId);
                        }
                    });
                    sessionWebSockets.put(sessionId, ws);
                    sessionSinks.put(sessionId, sink);
                }
                // 发送音频帧
                sendAudioFrame(sessionId, audioStream, isLast);
            } catch (Exception e) {
                sink.error(e);
                cleanupSession(sessionId);
            }
        });
    }

    /**
     * 发送音频帧到讯飞 WebSocket
     */
    private void sendAudioFrame(String sessionId, byte[] audioStream, boolean isLast) throws Exception {
        WebSocket ws = sessionWebSockets.get(sessionId);
        AtomicInteger seq = sessionSeq.get(sessionId);
        int status = seq.get() == 0 ? 0 : (isLast ? 2 : 1); // 0:首帧, 1:中间帧, 2:尾帧
        // 构造 json 消息体
        Map<String, Object> msg = new LinkedHashMap<>();
        Map<String, Object> header = new HashMap<>();
        header.put("app_id", appid);
        header.put("status", status);
        msg.put("header", header);
        if (status == 0) {
            // 首帧需带参数
            Map<String, Object> parameter = new HashMap<>();
            Map<String, Object> iat = new HashMap<>();
            iat.put("domain", "slm");
            iat.put("language", "mul_cn");
            iat.put("accent", "mandarin");
            iat.put("eos", 6000);
            iat.put("vinfo", 1);
            Map<String, Object> result = new HashMap<>();
            result.put("encoding", "utf8");
            result.put("compress", "raw");
            result.put("format", "json");
            iat.put("result", result);
            parameter.put("iat", iat);
            msg.put("parameter", parameter);
        }
        Map<String, Object> payload = new HashMap<>();
        Map<String, Object> audio = new HashMap<>();
        audio.put("encoding", "raw");
        audio.put("sample_rate", 16000);
        audio.put("channels", 1);
        audio.put("bit_depth", 16);
        audio.put("seq", seq.incrementAndGet());
        audio.put("status", status);
        audio.put("audio", status == 2 ? "" : Base64.getEncoder().encodeToString(audioStream));
        payload.put("audio", audio);
        msg.put("payload", payload);
        // 发送 json
        ws.send(objectMapper.writeValueAsString(msg));
    }

    /**
     * 生成讯飞 WebSocket 鉴权 URL
     */
    private String getAuthUrl(String hostUrl, String apiKey, String apiSecret) throws Exception {
        URL url = new URL(hostUrl);
        SimpleDateFormat format = new SimpleDateFormat("EEE, dd MMM yyyy HH:mm:ss z", Locale.US);
        format.setTimeZone(TimeZone.getTimeZone("GMT"));
        String date = format.format(new Date());
        StringBuilder builder = new StringBuilder("host: ").append(url.getHost()).append("\n").
                append("date: ").append(date).append("\n").
                append("GET ").append(url.getPath()).append(" HTTP/1.1");
        Charset charset = Charset.forName("UTF-8");
        Mac mac = Mac.getInstance("hmacsha256");
        SecretKeySpec spec = new SecretKeySpec(apiSecret.getBytes(charset), "hmacsha256");
        mac.init(spec);
        byte[] hexDigits = mac.doFinal(builder.toString().getBytes(charset));
        String sha = Base64.getEncoder().encodeToString(hexDigits);
        String authorization = String.format("api_key=\"%s\", algorithm=\"%s\", headers=\"%s\", signature=\"%s\"", apiKey, "hmac-sha256", "host date request-line", sha);
        HttpUrl httpUrl = HttpUrl.parse("https://" + url.getHost() + url.getPath()).newBuilder().
                addQueryParameter("authorization", Base64.getEncoder().encodeToString(authorization.getBytes(charset))).
                addQueryParameter("date", date).
                addQueryParameter("host", url.getHost()).
                build();
        return httpUrl.toString();
    }

    /**
     * 清理 session 资源
     */
    private void cleanupSession(String sessionId) {
        WebSocket ws = sessionWebSockets.remove(sessionId);
        if (ws != null) {
            ws.close(1000, "");
        }
        sessionSinks.remove(sessionId);
        sessionSeq.remove(sessionId);
    }
}
