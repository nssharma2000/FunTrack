package com.example.backend.dto;

import java.math.BigDecimal;
import java.time.Instant;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class TrackingHistoryResponse {

    private Long id;

    private Long gameId;

    private Instant startedAt;

    private Instant stoppedAt;

    private long durationSeconds;

    private BigDecimal progress;
}