package com.example.backend.dto;

import java.math.BigDecimal;
import java.time.Instant;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class TrackingResponse {

    private Long id;

    private String trackingId;

    private Long gameId;

    private Instant startedAt;

    private Instant stoppedAt;

    private BigDecimal progress;

    private boolean active;

    private long elapsedSeconds;
}