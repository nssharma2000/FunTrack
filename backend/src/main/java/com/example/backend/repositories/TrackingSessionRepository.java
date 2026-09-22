package com.example.backend.repositories;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.backend.entities.TrackingSession;

public interface TrackingSessionRepository
        extends JpaRepository<TrackingSession, Long> {

    /*
     * Find the currently active session for a browser.
     */
    Optional<TrackingSession> findByTrackingIdAndStoppedAtIsNull(
        String trackingId
    );

    /*
     * Used for calculating historical gameplay/streaks.
     */
    List<TrackingSession> findByTrackingIdAndStoppedAtIsNotNullOrderByStartedAtAsc(
        String trackingId
    );

    /*
     * Useful for history.
     */
    List<TrackingSession> findByTrackingIdOrderByStartedAtDesc(
        String trackingId
    );

    /*
     * Prevents accidentally allowing two active sessions.
     */
    boolean existsByTrackingIdAndStoppedAtIsNull(
        String trackingId
    );

    /*
     * Optional database-level query for completed sessions.
     */
    @Query("""
        SELECT t
        FROM TrackingSession t
        WHERE t.trackingId = :trackingId
        AND t.stoppedAt IS NOT NULL
        AND t.startedAt < :end
        AND t.stoppedAt > :start
        ORDER BY t.startedAt ASC
    """)
    List<TrackingSession> findSessionsOverlappingRange(
        @Param("trackingId") String trackingId,
        @Param("start") Instant start,
        @Param("end") Instant end
    );
}