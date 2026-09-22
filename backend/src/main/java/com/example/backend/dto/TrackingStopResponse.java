package com.example.backend.dto;

import java.math.BigDecimal;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class TrackingStopResponse {

    private Long id;

    private String trackingId;

    private Long gameId;

    private long durationSeconds;

    private BigDecimal progress;

    /*
     * Number of consecutive days where at least
     * one hour was played.
     */
    private int streak;

    /*
     * True when the user has reached at least
     * a 2-day streak.
     */
    private boolean streakOccurred;
}