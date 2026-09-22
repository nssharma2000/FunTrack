package com.example.backend.controllers;

import java.time.LocalDate;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.backend.dto.DailyTrackingResponse;
import com.example.backend.dto.StartTrackingRequest;
import com.example.backend.dto.TrackingHistoryResponse;
import com.example.backend.dto.TrackingResponse;
import com.example.backend.dto.TrackingStopResponse;
import com.example.backend.dto.UpdateTrackingProgressRequest;
import com.example.backend.services.TrackingService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;


@RestController
@RequiredArgsConstructor
@RequestMapping("/tracking")
@Validated
public class TrackingController {


    private final TrackingService trackingService;


    /* ---------------------------------------------------------------------- */
    /*                                START                                   */
    /* ---------------------------------------------------------------------- */

    @PostMapping("/start")
    public ResponseEntity<TrackingResponse> startTracking(
        @Valid @RequestBody StartTrackingRequest request
    ) {

        TrackingResponse response =
            trackingService.startTracking(
                request
            );

        return ResponseEntity
            .status(HttpStatus.CREATED)
            .body(response);
    }


    /* ---------------------------------------------------------------------- */
    /*                                ACTIVE                                  */
    /* ---------------------------------------------------------------------- */

    @GetMapping("/active")
    public ResponseEntity<TrackingResponse> getActiveTracking(
        @RequestParam String trackingId
    ) {

        TrackingResponse response =
            trackingService.getActiveTracking(
                trackingId
            );

        return ResponseEntity.ok(response);
    }


    /* ---------------------------------------------------------------------- */
    /*                                 STOP                                    */
    /* ---------------------------------------------------------------------- */

    @PostMapping("/stop")
    public ResponseEntity<TrackingStopResponse> stopTracking(
        @RequestParam String trackingId
    ) {

        TrackingStopResponse response =
            trackingService.stopTracking(
                trackingId
            );

        return ResponseEntity.ok(response);
    }


    /* ---------------------------------------------------------------------- */
    /*                               PROGRESS                                  */
    /* ---------------------------------------------------------------------- */

    @PatchMapping("/progress")
    public ResponseEntity<TrackingResponse> updateProgress(
        @RequestParam String trackingId,
        @Valid @RequestBody UpdateTrackingProgressRequest request
    ) {

        TrackingResponse response =
            trackingService.updateProgress(
                trackingId,
                request
            );

        return ResponseEntity.ok(response);
    }


    /* ---------------------------------------------------------------------- */
    /*                                STREAK                                   */
    /* ---------------------------------------------------------------------- */

    @GetMapping("/streak")
    public ResponseEntity<Integer> getCurrentStreak(
        @RequestParam String trackingId
    ) {

        int streak =
            trackingService.getCurrentStreak(
                trackingId
            );

        return ResponseEntity.ok(streak);
    }


    /* ---------------------------------------------------------------------- */
    /*                           DAILY STATISTICS                              */
    /* ---------------------------------------------------------------------- */

    @GetMapping("/daily")
    public ResponseEntity<List<DailyTrackingResponse>> getDailyTracking(
        @RequestParam String trackingId,
        @RequestParam LocalDate startDate,
        @RequestParam LocalDate endDate
    ) {

        List<DailyTrackingResponse> response =
            trackingService.getDailyTracking(
                trackingId,
                startDate,
                endDate
            );

        return ResponseEntity.ok(response);
    }


    /* ---------------------------------------------------------------------- */
    /*                                HISTORY                                  */
    /* ---------------------------------------------------------------------- */

    @GetMapping("/history")
    public ResponseEntity<List<TrackingHistoryResponse>> getHistory(
        @RequestParam String trackingId
    ) {

        List<TrackingHistoryResponse> response =
            trackingService.getHistory(
                trackingId
            );

        return ResponseEntity.ok(response);
    }
}