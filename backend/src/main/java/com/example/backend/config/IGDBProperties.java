package com.example.backend.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Data
@ConfigurationProperties(prefix = "igdb")
public class IGDBProperties {

    private String clientId;
    private String clientSecret;

}