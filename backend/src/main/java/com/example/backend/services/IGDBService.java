package com.example.backend.services;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import com.example.backend.config.IGDBProperties;
import com.example.backend.dto.TwitchTokenResponse;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class IGDBService {

    private final RestClient restClient;
    private final IGDBProperties properties;

    private String accessToken;
    private Instant expiresAt;

    private synchronized String getAccessToken() {

        if (accessToken != null &&
                expiresAt != null &&
                Instant.now().isBefore(expiresAt.minus(5, ChronoUnit.MINUTES))) {

            return accessToken;
        }

        TwitchTokenResponse response = restClient.post()
                .uri(uriBuilder -> uriBuilder
                        .scheme("https")
                        .host("id.twitch.tv")
                        .path("/oauth2/token")
                        .queryParam("client_id", properties.getClientId())
                        .queryParam("client_secret", properties.getClientSecret())
                        .queryParam("grant_type", "client_credentials")
                        .build())
                .retrieve()
                .body(TwitchTokenResponse.class);

        accessToken = response.getAccessToken();
        expiresAt = Instant.now().plusSeconds(response.getExpiresIn());

        return accessToken;
    }

    public String searchGames(String search, Integer offset) 
    {

        String query = """
                fields
                    name,
                    cover.url,
                    first_release_date,
                    summary,
                    genres.name;

                search "%s";

                limit 10; 
                offset %d;
                """.formatted(search, offset);

        return restClient.post()
                .uri("https://api.igdb.com/v4/games")
                .header("Client-ID", properties.getClientId())
                .header("Authorization", "Bearer " + getAccessToken())
                .body(query)
                .retrieve()
                .body(String.class);

    }


}