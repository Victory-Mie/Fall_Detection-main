package com.falldetection.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

// 记录用户和AI的一问一答
@Data
@AllArgsConstructor
@NoArgsConstructor
public class ChatDialog implements Serializable {
    private static final long serialVersionUID = 1L;

    private String question;
    private String answer;

    @Override
    public String toString() {
        return "ChatDialog{" +
                "question='" + question +
                ", answer='" + answer +
                "}\n";
    }
}