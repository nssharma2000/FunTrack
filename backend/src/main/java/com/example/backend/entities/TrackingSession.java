package com.example.backend.entities;

import java.math.BigDecimal;
import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "tracking_sessions")
@Getter
@Setter
@NoArgsConstructor
public class TrackingSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /*
     * This identifies the browser/device.
     *
     * It works whether the user is logged in or not.
     */
    @Column(name = "tracking_id", nullable = false, length = 100)
    private String trackingId;

    /*
     * IGDB/game ID.
     *
     * We deliberately store the ID instead of creating a foreign-key
     * relationship because your games are currently represented by
     * IGDB IDs in the existing application.
     */
    @Column(name = "game_id", nullable = false)
    private Long gameId;

    /*
     * When tracking started.
     *
     * Stored as UTC.
     */
    @Column(name = "started_at", nullable = false)
    private Instant startedAt;

    /*
     * When tracking stopped.
     *
     * NULL means this session is currently active.
     */
    @Column(name = "stopped_at")
    private Instant stoppedAt;

    /*
     * Last saved game completion percentage.
     */
    @Column(
        name = "progress",
        nullable = false,
        precision = 5,
        scale = 1
    )
    private BigDecimal progress = BigDecimal.ZERO;
}