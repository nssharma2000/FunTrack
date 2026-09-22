package com.example.backend.services;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.ArrayList;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.example.backend.dto.DailyTrackingResponse;
import com.example.backend.dto.StartTrackingRequest;
import com.example.backend.dto.TrackingHistoryResponse;
import com.example.backend.dto.TrackingResponse;
import com.example.backend.dto.TrackingStopResponse;
import com.example.backend.dto.UpdateTrackingProgressRequest;
import com.example.backend.entities.TrackingSession;
import com.example.backend.repositories.TrackingSessionRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class TrackingService {

    private static final long ONE_HOUR_SECONDS = 60L * 60L;

    private final TrackingSessionRepository trackingSessionRepository;

    /*
     * Your users are in India, so the default is Asia/Kolkata.
     *
     * We still store timestamps as UTC Instants in PostgreSQL.
     *
     * The timezone is only used when deciding which calendar day
     * gameplay belongs to.
     */
    @Value("${app.tracking.zone-id:Asia/Kolkata}")
    private String trackingZoneId;


    /* ---------------------------------------------------------------------- */
    /*                                START                                   */
    /* ---------------------------------------------------------------------- */

    @Transactional
    public TrackingResponse startTracking(
        StartTrackingRequest request
    ) {

        validateTrackingId(request.getTrackingId());

        if (request.getGameId() == null) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "gameId is required"
            );
        }

        BigDecimal progress = normalizeProgress(
            request.getProgress()
        );

        /*
         * Only one active game can be tracked by one browser.
         */
        if (
            trackingSessionRepository
                .existsByTrackingIdAndStoppedAtIsNull(
                    request.getTrackingId()
                )
        ) {

            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "A game is already being tracked"
            );
        }

        TrackingSession session =
            new TrackingSession();

        session.setTrackingId(
            request.getTrackingId()
        );

        session.setGameId(
            request.getGameId()
        );

        session.setStartedAt(
            Instant.now()
        );

        session.setStoppedAt(null);

        session.setProgress(progress);

        TrackingSession saved =
            trackingSessionRepository.save(session);

        return toResponse(
            saved,
            Instant.now()
        );
    }


    /* ---------------------------------------------------------------------- */
    /*                             ACTIVE TRACKING                             */
    /* ---------------------------------------------------------------------- */

    @Transactional(readOnly = true)
    public TrackingResponse getActiveTracking(
        String trackingId
    ) {

        validateTrackingId(trackingId);

        TrackingSession session =
            trackingSessionRepository
                .findByTrackingIdAndStoppedAtIsNull(
                    trackingId
                )
                .orElseThrow(
                    () -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "No active tracking session"
                    )
                );

        return toResponse(
            session,
            Instant.now()
        );
    }


    /* ---------------------------------------------------------------------- */
    /*                                 STOP                                    */
    /* ---------------------------------------------------------------------- */

    @Transactional
    public TrackingStopResponse stopTracking(
        String trackingId
    ) {

        validateTrackingId(trackingId);

        TrackingSession session =
            trackingSessionRepository
                .findByTrackingIdAndStoppedAtIsNull(
                    trackingId
                )
                .orElseThrow(
                    () -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "No active tracking session"
                    )
                );

        Instant now = Instant.now();

        /*
         * Set the server-side stop time.
         */
        session.setStoppedAt(now);

        TrackingSession saved =
            trackingSessionRepository.save(session);

        long durationSeconds =
            calculateDurationSeconds(
                saved.getStartedAt(),
                saved.getStoppedAt()
            );

        int streak =
            calculateCurrentStreak(trackingId);

        boolean streakOccurred =
            streak >= 2;

        return new TrackingStopResponse(
            saved.getId(),
            saved.getTrackingId(),
            saved.getGameId(),
            durationSeconds,
            saved.getProgress(),
            streak,
            streakOccurred
        );
    }


    /* ---------------------------------------------------------------------- */
    /*                              PROGRESS                                   */
    /* ---------------------------------------------------------------------- */

    @Transactional
    public TrackingResponse updateProgress(
        String trackingId,
        UpdateTrackingProgressRequest request
    ) {

        validateTrackingId(trackingId);

        BigDecimal progress =
            normalizeProgress(
                request.getProgress()
            );

        TrackingSession session =
            trackingSessionRepository
                .findByTrackingIdAndStoppedAtIsNull(
                    trackingId
                )
                .orElseThrow(
                    () -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "No active tracking session"
                    )
                );

        session.setProgress(progress);

        TrackingSession saved =
            trackingSessionRepository.save(session);

        return toResponse(
            saved,
            Instant.now()
        );
    }


    /* ---------------------------------------------------------------------- */
    /*                                STREAK                                   */
    /* ---------------------------------------------------------------------- */

    @Transactional(readOnly = true)
    public int getCurrentStreak(
        String trackingId
    ) {

        validateTrackingId(trackingId);

        return calculateCurrentStreak(trackingId);
    }


    /*
     * Returns the current streak.
     *
     * A day counts when the user has played >= 1 hour.
     *
     * Today must satisfy the requirement too.
     *
     * Example:
     *
     * Sept 20 = 2h
     * Sept 21 = 1h
     * Sept 22 = 1.5h
     *
     * Result = 3
     */
    private int calculateCurrentStreak(
        String trackingId
    ) {

        Map<LocalDate, Long> dailySeconds =
            calculateDailySeconds(trackingId);

        ZoneId zone =
            ZoneId.of(trackingZoneId);

        LocalDate today =
            LocalDate.now(zone);

        int streak = 0;

        LocalDate date = today;

        while (
            dailySeconds.getOrDefault(
                date,
                0L
            ) >= ONE_HOUR_SECONDS
        ) {

            streak++;

            date = date.minusDays(1);
        }

        return streak;
    }


    /* ---------------------------------------------------------------------- */
    /*                           DAILY STATISTICS                              */
    /* ---------------------------------------------------------------------- */

    @Transactional(readOnly = true)
    public List<DailyTrackingResponse> getDailyTracking(
        String trackingId,
        LocalDate startDate,
        LocalDate endDate
    ) {

        validateTrackingId(trackingId);

        if (startDate == null || endDate == null) {

            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "startDate and endDate are required"
            );
        }

        if (endDate.isBefore(startDate)) {

            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "endDate cannot be before startDate"
            );
        }

        Map<LocalDate, Long> dailySeconds =
            calculateDailySeconds(trackingId);

        List<DailyTrackingResponse> result =
            new ArrayList<>();

        LocalDate current = startDate;

        while (!current.isAfter(endDate)) {

            result.add(
                new DailyTrackingResponse(
                    current,
                    dailySeconds.getOrDefault(
                        current,
                        0L
                    )
                )
            );

            current = current.plusDays(1);
        }

        return result;
    }


    /* ---------------------------------------------------------------------- */
    /*                         CALCULATE DAILY TIME                            */
    /* ---------------------------------------------------------------------- */

    private Map<LocalDate, Long> calculateDailySeconds(
        String trackingId
    ) {

        List<TrackingSession> sessions =
            trackingSessionRepository
                .findByTrackingIdAndStoppedAtIsNotNullOrderByStartedAtAsc(
                    trackingId
                );

        Map<LocalDate, Long> dailySeconds =
            new HashMap<>();

        ZoneId zone =
            ZoneId.of(trackingZoneId);

        for (TrackingSession session : sessions) {

            addSessionToDailyTotals(
                session,
                dailySeconds,
                zone
            );
        }

        return dailySeconds;
    }


    /*
     * This is important.
     *
     * If someone plays:
     *
     * 23:00 -> 01:00
     *
     * the server records:
     *
     * Day 1 = 1 hour
     * Day 2 = 1 hour
     *
     * rather than putting the entire 2 hours on one day.
     */
    private void addSessionToDailyTotals(
        TrackingSession session,
        Map<LocalDate, Long> dailySeconds,
        ZoneId zone
    ) {

        Instant start =
            session.getStartedAt();

        Instant end =
            session.getStoppedAt();

        if (
            start == null ||
            end == null ||
            !end.isAfter(start)
        ) {
            return;
        }

        ZonedDateTime current =
            start.atZone(zone);

        ZonedDateTime endDateTime =
            end.atZone(zone);

        while (
            current.toLocalDate()
                .isBefore(
                    endDateTime.toLocalDate()
                )
        ) {

            ZonedDateTime nextMidnight =
                current
                    .toLocalDate()
                    .plusDays(1)
                    .atStartOfDay(zone);

            long seconds =
                Duration.between(
                    current.toInstant(),
                    nextMidnight.toInstant()
                ).getSeconds();

            addDailySeconds(
                dailySeconds,
                current.toLocalDate(),
                seconds
            );

            current = nextMidnight;
        }

        long remainingSeconds =
            Duration.between(
                current.toInstant(),
                end
            ).getSeconds();

        if (remainingSeconds > 0) {

            addDailySeconds(
                dailySeconds,
                current.toLocalDate(),
                remainingSeconds
            );
        }
    }


    private void addDailySeconds(
        Map<LocalDate, Long> dailySeconds,
        LocalDate date,
        long seconds
    ) {

        dailySeconds.merge(
            date,
            seconds,
            Long::sum
        );
    }


    /* ---------------------------------------------------------------------- */
    /*                               HISTORY                                   */
    /* ---------------------------------------------------------------------- */

    @Transactional(readOnly = true)
    public List<TrackingHistoryResponse> getHistory(
        String trackingId
    ) {

        validateTrackingId(trackingId);

        List<TrackingSession> sessions =
            trackingSessionRepository
                .findByTrackingIdOrderByStartedAtDesc(
                    trackingId
                );

        return sessions.stream()
            .map(session -> {

                long durationSeconds = 0;

                if (
                    session.getStartedAt() != null &&
                    session.getStoppedAt() != null
                ) {

                    durationSeconds =
                        calculateDurationSeconds(
                            session.getStartedAt(),
                            session.getStoppedAt()
                        );
                }

                return new TrackingHistoryResponse(
                    session.getId(),
                    session.getGameId(),
                    session.getStartedAt(),
                    session.getStoppedAt(),
                    durationSeconds,
                    session.getProgress()
                );
            })
            .toList();
    }


    /* ---------------------------------------------------------------------- */
    /*                              HELPERS                                    */
    /* ---------------------------------------------------------------------- */

    private TrackingResponse toResponse(
        TrackingSession session,
        Instant now
    ) {

        boolean active =
            session.getStoppedAt() == null;

        long elapsedSeconds;

        if (active) {

            elapsedSeconds =
                calculateDurationSeconds(
                    session.getStartedAt(),
                    now
                );

        } else {

            elapsedSeconds =
                calculateDurationSeconds(
                    session.getStartedAt(),
                    session.getStoppedAt()
                );
        }

        return new TrackingResponse(
            session.getId(),
            session.getTrackingId(),
            session.getGameId(),
            session.getStartedAt(),
            session.getStoppedAt(),
            session.getProgress(),
            active,
            elapsedSeconds
        );
    }


    private long calculateDurationSeconds(
        Instant start,
        Instant end
    ) {

        if (
            start == null ||
            end == null ||
            !end.isAfter(start)
        ) {
            return 0;
        }

        return Duration.between(
            start,
            end
        ).getSeconds();
    }


    private BigDecimal normalizeProgress(
        BigDecimal progress
    ) {

        if (progress == null) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "progress is required"
            );
        }

        if (
            progress.compareTo(BigDecimal.ZERO) < 0 ||
            progress.compareTo(BigDecimal.valueOf(100)) > 0
        ) {

            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "progress must be between 0.0 and 100.0"
            );
        }

        return progress.setScale(
            1,
            RoundingMode.HALF_UP
        );
    }


    private void validateTrackingId(
        String trackingId
    ) {

        if (
            trackingId == null ||
            trackingId.isBlank()
        ) {

            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "trackingId is required"
            );
        }

        if (trackingId.length() > 100) {

            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "trackingId is too long"
            );
        }
    }
}