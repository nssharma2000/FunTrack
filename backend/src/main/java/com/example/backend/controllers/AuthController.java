package com.example.backend.controllers;

import java.io.IOException;
import java.security.GeneralSecurityException;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.backend.dto.AuthResponse;
import com.example.backend.dto.ErrorResponse;
import com.example.backend.dto.GoogleAuthRequest;
import com.example.backend.dto.LoginRequest;
import com.example.backend.dto.RegisterRequest;
import com.example.backend.services.AuthService;
import com.example.backend.services.GoogleAuthService;

import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;


@RestController
@RequestMapping("/auth")
public class AuthController {

    private final GoogleAuthService googleAuthService;

    private final AuthService authService;

    public AuthController(GoogleAuthService googleAuthService,
            AuthService authService
    ) {
        this.googleAuthService
                = googleAuthService;

        this.authService = authService;
    }
    

    @PostMapping("/register")
    public AuthResponse register(
            @RequestBody
            @Valid RegisterRequest request,
            HttpServletResponse response
    ) {

        return authService.register(request, response);
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(
            @RequestBody
            @Valid LoginRequest request,
            HttpServletResponse response
    ) {

        try 
        {
            AuthResponse authResponse = authService.login(request, response);
            return ResponseEntity.ok(authResponse);
        }
        catch(Exception e)
        {
               return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new ErrorResponse(e.getMessage()));
        }

    }

    @PostMapping("/google")
    public AuthResponse googleLogin(
            @RequestBody GoogleAuthRequest request,
            HttpServletResponse response
    ) throws GeneralSecurityException, IOException {

        return googleAuthService
                .authenticate(
                        request.getIdToken(),
                        response
                );
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(
            @CookieValue(
                    name = "refreshToken",
                    required = true
            ) String refreshToken,
            HttpServletResponse response
    ) {

            authService.logout(
                    refreshToken,
                    response
            );

        return ResponseEntity
                .noContent()
                .build();
    }

    @PostMapping("/refresh")
    public AuthResponse refresh(
            @CookieValue(
                    name = "refreshToken",
                    required = true
            ) String refreshToken,
            HttpServletResponse response
    ) {

        System.out.println("******************REFRESH****************" + refreshToken);



        return authService
                .refresh(
                        refreshToken,
                        response
                );
    }
}
