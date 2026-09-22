package com.example.backend.services;

import java.io.IOException;
import java.security.GeneralSecurityException;
import java.util.Collections;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Service;

import com.example.backend.dto.AuthResponse;
import com.example.backend.dto.UserResponse;
import com.example.backend.entities.RefreshToken;
import com.example.backend.entities.User;
import com.example.backend.enums.Provider;
import com.example.backend.repositories.UserRepository;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;

import jakarta.servlet.http.HttpServletResponse;

@Service
public class GoogleAuthService {

    private final RefreshTokenService refreshTokenService;

    private AuthResponse buildAuthResponse(User user) {

    String jwt =
            jwtService.generateAccessToken(
                    user
            );

    UserResponse userResponse =
            UserResponse.builder()
                    .id(user.getId())
                    .firstName(user.getFirstName())
                    .lastName(user.getLastName())
                    .email(user.getEmail())
                    .build();

    return AuthResponse.builder()
            .accessToken(jwt)
            .tokenType("Bearer")
            .user(userResponse)
            .build();
}

    @Value("${spring.security.oauth2.client.registration.google.client-id}")
    private String googleClientId;

    private final UserRepository
            userRepository;

    private final JwtService
            jwtService;

    public GoogleAuthService(
            UserRepository userRepository,
            JwtService jwtService,
            RefreshTokenService refreshTokenService
    ) {
        this.userRepository =
                userRepository;

        this.jwtService =
                jwtService;
        this.refreshTokenService = refreshTokenService;
    }

    public AuthResponse authenticate(
            String credential,
            HttpServletResponse response
    )
            throws GeneralSecurityException,
            IOException {

        GoogleIdTokenVerifier
                verifier =
                new GoogleIdTokenVerifier
                        .Builder(
                        new NetHttpTransport(),
                        GsonFactory
                                .getDefaultInstance()
                )
                        .setAudience(
                                Collections
                                        .singletonList(
                                                googleClientId
                                        )
                        )
                        .build();

        GoogleIdToken idToken =
                verifier.verify(
                        credential
                );

        if (idToken == null) {
            throw new RuntimeException(
                    "Invalid Google token"
            );
        }

        GoogleIdToken.Payload payload = idToken.getPayload();

        String email = payload.getEmail();

        String firstName = (String) payload.get("given_name");

        String lastName = (String) payload.get("family_name");

        User user = userRepository.findByEmail(email).orElse(null);
        if (user != null && user.getProvider() == Provider.Null) {

        throw new RuntimeException(
            "Account with this email and password already exists."
    );
}

        if (user == null) {

            user = new User();

            user.setEmail(email);
            user.setFirstName(firstName);
            user.setLastName(lastName);
            user.setProvider(Provider.GOOGLE);

            user = userRepository.save(user);
        }

        RefreshToken refreshToken =
                refreshTokenService
                        .createRefreshToken(
                                user
                        );

        ResponseCookie cookie =
                refreshTokenService
                        .createRefreshTokenCookie(
                                refreshToken
                                        .getToken()
                        );

        response.addHeader(
                HttpHeaders.SET_COOKIE,
                cookie.toString()
        );


        return buildAuthResponse(user);
    
        }
}