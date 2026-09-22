package com.example.backend.services;

import java.util.Date;
import java.util.UUID;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.example.backend.entities.User;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;

@Service
public class JwtService {

        @Value("${jwt.secret}")
        private String secret;

        @Value("${jwt.access-token-expiration}")
        private long accessExpiration;

        @Value("${jwt.refresh-token-expiration}")
        private long refreshExpiration;

        private SecretKey getSigningKey() {

                byte[] keyBytes = Decoders.BASE64.decode(secret);

                return Keys.hmacShaKeyFor(keyBytes);
        }

        public String generateAccessToken(
                        User user) {

                return Jwts.builder()
                                .setSubject(user.getEmail())
                                .claim("userId", user.getId())
                                .claim("provider", user.getProvider().name())
                                .setIssuedAt(new Date())
                                .setExpiration(new Date(System.currentTimeMillis() + accessExpiration))
                                .signWith(getSigningKey())
                                .compact();
        }

        public String generateRefreshToken() {

                return UUID.randomUUID()
                .toString();
        }


        public String extractEmail(String token) {

                return extractClaims(token)
                                .getSubject();
        }

        public boolean isTokenValid(String token) {

                try {

                        extractClaims(token);

                        return true;

                } catch (Exception e) {

                        return false;
                }
        }

        public Claims extractClaims(String token) 
        {
                return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
                
        }

      


}