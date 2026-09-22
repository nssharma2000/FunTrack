package com.example.backend.services;

import java.util.Optional;

import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.example.backend.dto.AuthResponse;
import com.example.backend.dto.LoginRequest;
import com.example.backend.dto.RegisterRequest;
import com.example.backend.dto.UserResponse;
import com.example.backend.entities.RefreshToken;
import com.example.backend.entities.User;
import com.example.backend.enums.Provider;
import com.example.backend.repositories.RefreshTokenRepository;
import com.example.backend.repositories.UserRepository;

import jakarta.servlet.http.HttpServletResponse;

@Service
public class AuthService {

    private final UserRepository userRepository;

    private final RefreshTokenRepository refreshTokenRepository;

    private final PasswordEncoder passwordEncoder;

    private final JwtService jwtService;

    private final RefreshTokenService refreshTokenService;

    public AuthService(
            UserRepository userRepository,
            RefreshTokenRepository refreshTokenRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            RefreshTokenService refreshTokenService
    ) {

        this.userRepository
                = userRepository;
        this.refreshTokenRepository
                = refreshTokenRepository;

        this.passwordEncoder
                = passwordEncoder;

        this.jwtService
                = jwtService;

        this.refreshTokenService
                = refreshTokenService;
    }

    private AuthResponse buildAuthResponse(
            User user
    ) {

        String jwt
                = jwtService
                        .generateAccessToken(
                                user
                        );

        UserResponse userResponse
                = UserResponse.builder()
                        .id(
                                user.getId()
                        )
                        .firstName(
                                user.getFirstName()
                        )
                        .lastName(
                                user.getLastName()
                        )
                        .email(
                                user.getEmail()
                        )
                        .build();

        return AuthResponse.builder()
                .accessToken(
                        jwt
                )
                .tokenType(
                        "Bearer"
                )
                .user(
                        userResponse
                )
                .build();
    }

    public AuthResponse register(RegisterRequest request,
            HttpServletResponse response
    ) {

        if (userRepository
                .existsByEmail(
                        request.getEmail()
                )) {

            throw new RuntimeException(
                    "Email already exists."
            );
        }

        User user = new User();

        user.setFirstName(
                request.getFirstName()
        );

        user.setLastName(
                request.getLastName()
        );

        user.setEmail(
                request.getEmail()
        );

        user.setPassword(
                passwordEncoder.encode(
                        request.getPassword()
                )
        );

        user.setProvider(Provider.Null);

        user = userRepository.save(user);

        RefreshToken refreshToken
                = refreshTokenService
                        .createRefreshToken(
                                user
                        );

        ResponseCookie cookie
                = refreshTokenService
                        .createRefreshTokenCookie(
                                refreshToken
                                        .getToken()
                        );

        response.addHeader(
                HttpHeaders.SET_COOKIE,
                cookie.toString()
        );

        return buildAuthResponse(
                user
        );
    }

    public AuthResponse login(LoginRequest request,
            HttpServletResponse response
    ) {

        User user = userRepository
                .findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException(
                "Invalid credentials."
        )
                );
        
        
        if (user.getProvider() == Provider.GOOGLE) {
        

            throw new RuntimeException(
                    """
                    This account uses Google.
                    Please sign in with Google.
                    """
            );

        }

        boolean passwordMatches
                = passwordEncoder.matches(
                        request.getPassword(),
                        user.getPassword()
                );

        if (!passwordMatches) {

            throw new RuntimeException(
                    "Invalid credentials."
            );
        }

        refreshTokenService.revokeAllTokens(user);


        RefreshToken refreshToken
                = refreshTokenService
                        .createRefreshToken(
                                user
                        );

        ResponseCookie cookie
                = refreshTokenService
                        .createRefreshTokenCookie(
                                refreshToken
                                        .getToken()
                        );

        response.addHeader(
                HttpHeaders.SET_COOKIE,
                cookie.toString()
        );

        return buildAuthResponse(
                user
        );

    }

    public void logout(
            String token,
            HttpServletResponse response
    ) {
        
        Optional<RefreshToken> refreshToken = refreshTokenRepository.findByToken(token);
        
        if(refreshToken.isPresent())
        {
                User user = refreshToken.get().getUser();
                refreshTokenService.revokeAllTokens(user);
        }
        

        ResponseCookie cookie
                = refreshTokenService
                        .clearRefreshTokenCookie();

        response.addHeader(
                HttpHeaders.SET_COOKIE,
                cookie.toString()
        );
    }

    public AuthResponse refresh(
            String refreshTokenValue,
            HttpServletResponse response
    ) {

        try 
        {
                RefreshToken refreshToken
                        = refreshTokenService
                                .validateRefreshToken(
                                        refreshTokenValue
                                );

        User user
                = refreshToken
                        .getUser();

        refreshTokenService.revokeAllTokens(user);        

        RefreshToken newRefreshToken
                = refreshTokenService
                        .createRefreshToken(
                                user
                        );

        ResponseCookie cookie
                = refreshTokenService
                        .createRefreshTokenCookie(
                                newRefreshToken
                                        .getToken()
                        );

        response.addHeader(
                HttpHeaders.SET_COOKIE,
                cookie.toString()
        );
         

        return buildAuthResponse(
                user
                );
        }

        catch(Exception e)
        {
           

           System.out.println("********* REFRESH ERROR **********");

           throw e;
        }
    }
}
