package com.example.backend.dto;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class UpdateTrackingProgressRequest {

    @NotNull
    @DecimalMin("0.0")
    @DecimalMax("100.0")
    private BigDecimal progress;
}