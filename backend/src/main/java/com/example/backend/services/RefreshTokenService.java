package com.example.backend.services;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.backend.entities.RefreshToken;
import com.example.backend.entities.User;
import com.example.backend.repositories.RefreshTokenRepository;

@Service
public class RefreshTokenService {

    @Value(
            "${jwt.refresh-token-expiration}"
    )
    private long refreshExpiration;

    private final RefreshTokenRepository refreshTokenRepository;

    public RefreshTokenService(
            RefreshTokenRepository refreshTokenRepository
    ) {

        this.refreshTokenRepository
                = refreshTokenRepository;
    }

    public RefreshToken
            createRefreshToken(
                    User user
            ) {

        RefreshToken token
                = new RefreshToken();

        token.setToken(
                UUID.randomUUID()
                        .toString()
        );

        token.setUser(
                user
        );

        token.setExpiryDate(
                LocalDateTime.now()
                        .plusSeconds(
                                refreshExpiration
                                / 1000
                        )
        );

        System.out.println("********************Saving token****************");

        return refreshTokenRepository
                .save(
                        token
                );
    }

    public RefreshToken validateRefreshToken(String token) {

        RefreshToken refreshToken
                = refreshTokenRepository
                        .findByToken(
                                token
                        )
                        .orElseThrow(
                                ()
                                -> new RuntimeException(
                                        "Refresh token not found."
                                )
                        );

        if (refreshToken
                .getExpiryDate()
                .isBefore(
                        LocalDateTime.now()
                )) {
        

            revokeToken(token);

            throw new RuntimeException(
                    "Refresh token expired."
            );
            
        }

        return refreshToken;
    }

    @Transactional
    public void revokeToken(String token) {

            refreshTokenRepository.deleteByToken(token);
    }

    @Transactional
    public void revokeAllTokens(User user)
    {
        refreshTokenRepository.deleteByUser(user);
    }

    public ResponseCookie createRefreshTokenCookie(String token) {

        return ResponseCookie
                .from(
                        "refreshToken",
                        token
                )
                .httpOnly(
                        true
                )
                .secure(
                        true
                )
                .sameSite(
                        "None"
                )
                .path(
                        "/"
                )
                .maxAge(
                        Duration.ofDays(
                                30
                        )
                )
                .build();
    }

    public ResponseCookie clearRefreshTokenCookie() {

        return ResponseCookie
                .from(
                        "refreshToken",
                        ""
                )
                .httpOnly(
                        true
                )
                .secure(
                        true
                )
                .sameSite(
                        "Lax"
                )
                .path(
                        "/"
                )
                .maxAge(
                        0
                )
                .build();
    }
}
