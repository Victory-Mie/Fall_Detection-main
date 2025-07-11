package com.falldetection.backend.entity;

import java.io.Serializable;

// 记录用户和AI的一问一答
public class ChatDialog implements Serializable {
    private static final long serialVersionUID = 1L;

    private String question;
    private String answer;

    public ChatDialog() {}

    public ChatDialog(String question, String answer) {
        this.question = question;
        this.answer = answer;
    }

    public String getQuestion() {
        return question;
    }

    public void setQuestion(String question) {
        this.question = question;
    }

    public String getAnswer() {
        return answer;
    }

    public void setAnswer(String answer) {
        this.answer = answer;
    }

    @Override
    public String toString() {
        return "ChatDialog{" +
                "question='" + question +
                ", answer='" + answer +
                "}\n";
    }
} 