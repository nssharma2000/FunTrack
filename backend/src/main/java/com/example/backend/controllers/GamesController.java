package com.example.backend.controllers;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.data.domain.OffsetScrollPosition;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.ScrollPosition;
import org.springframework.data.domain.Sort;
import org.springframework.data.domain.Window;
import org.springframework.data.repository.query.Param;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.backend.dto.APIGameSearchRequest;
import com.example.backend.dto.UserGameSearchRequest;
import com.example.backend.entities.User;
import com.example.backend.entities.UserAndGame;
import com.example.backend.entities.UserGame;
import com.example.backend.repositories.UserAndGameRepository;
import com.example.backend.repositories.UserGameRepository;
import com.example.backend.repositories.UserRepository;
import com.example.backend.services.IGDBService;

import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import jakarta.websocket.server.PathParam;
import lombok.RequiredArgsConstructor;


@RestController
@RequiredArgsConstructor
@RequestMapping("/games")
public class GamesController {

        private final IGDBService IGDBservice;
        private final UserGameRepository userGameRepository;
        private final UserAndGameRepository userAndGameRepository;
        private final UserRepository userRepository;
        

        @PostMapping("/api_search")
        public String APIGameSearch(@RequestBody APIGameSearchRequest request)
        {
                String q = request.getQuery();
                Integer offset = request.getOffset();


                return IGDBservice.searchGames(q, offset);
        }

        @PostMapping("/user_games_search")
        public List<UserGame> UserGamesSearch(@RequestBody UserGameSearchRequest request, @AuthenticationPrincipal(expression = "username") String email)
        {
                User user = userRepository.findByEmail(email).orElseThrow();
                String q = request.getQuery();
                Integer pageNumber = request.getPageNumber();

                Integer page = pageNumber - 1;
                Integer limit = 10;

                Pageable pageable = PageRequest.of(page, limit);

                List<UserGame> games = userAndGameRepository.findFirst10UserGamesSearch(user, q, pageable);

                return games;

                
        }

        @PostMapping("/add_game")
        public UserAndGame AddUserGame(@RequestBody UserGame game, @AuthenticationPrincipal(expression = "username") String email)
        {
                userGameRepository.save(game);

                User user = userRepository.findByEmail(email).orElseThrow();

                UserAndGame userAndGame = UserAndGame.builder()
                                                .isFavorite(false)
                                                .rating(null)
                                                .review(null)
                                                .user(user)
                                                .userGame(game)
                                                .build();

                return userAndGameRepository.save(userAndGame);
        }

        @PatchMapping("/rate_game")
        public UserAndGame RateGame(@RequestBody Map<String, Integer> gameRating, @RequestParam(value = "gameId") long gameId, @AuthenticationPrincipal(expression = "username") String email)
        {
                User user = userRepository.findByEmail(email).orElseThrow();
                UserGame game = userGameRepository.findById(gameId).orElseThrow();

                UserAndGame userAndGame = userAndGameRepository.findByUserAndUserGame(user, game).orElseThrow();
                userAndGame.setRating(gameRating.get("rating"));

                return userAndGameRepository.save(userAndGame);
        }

        @Transactional 
        @PatchMapping("/favorite_game")
        public UserAndGame FavoriteGame(@RequestParam(value = "gameId") long gameId, @AuthenticationPrincipal(expression = "username") String email)
        {
                User user = userRepository.findByEmail(email).orElseThrow();
                UserGame game = userGameRepository.findById(gameId).orElseThrow();

                List<UserAndGame> favoriteGames = userAndGameRepository.findFavoriteGamesByUser(user);

                favoriteGames.forEach((g) -> {
                        g.setFavorite(false);
                });

                userAndGameRepository.saveAll(favoriteGames);

                UserAndGame userAndGame = userAndGameRepository.findByUserAndUserGame(user, game).orElseThrow();
                userAndGame.setFavorite(true);

                return userAndGameRepository.save(userAndGame);
        }

        @Transactional 
        @PatchMapping("/defavorite_game")
        public UserAndGame DefavoriteGame(@RequestParam(value = "gameId") long gameId, @AuthenticationPrincipal(expression = "username") String email)
        {
                User user = userRepository.findByEmail(email).orElseThrow();
                UserGame game = userGameRepository.findById(gameId).orElseThrow();

                UserAndGame userAndGame = userAndGameRepository.findByUserAndUserGame(user, game).orElseThrow();
                userAndGame.setFavorite(false);

                return userAndGameRepository.save(userAndGame);
        }

        @PatchMapping("/save_review")
        public UserAndGame SaveReview(@RequestBody Map<String, String> review, @RequestParam(value = "gameId") long gameId, @AuthenticationPrincipal(expression = "username") String email)
        {
                User user = userRepository.findByEmail(email).orElseThrow();
                UserGame game = userGameRepository.findById(gameId).orElseThrow();

                UserAndGame userAndGame = userAndGameRepository.findByUserAndUserGame(user, game).orElseThrow();
                userAndGame.setReview(review.get("review"));

                return userAndGameRepository.save(userAndGame);
        }

        @GetMapping("/{pageNumber}")
        public List<UserGame> GetUserGames(@PathVariable Integer pageNumber, @AuthenticationPrincipal(expression = "username") String email)
        {
                User user = userRepository.findByEmail(email).orElseThrow();

                Integer page = pageNumber - 1;
                Integer limit = 10;

                Pageable pageable = PageRequest.of(page, limit);

                List<UserGame> games = userAndGameRepository.findFirst10UserGamesByUser(user, pageable);

                return games;
        }

        @GetMapping("/user_games_total_pages")
        public long GetUserGamesTotalPages(@AuthenticationPrincipal(expression = "username") String email)
        {
                User user = userRepository.findByEmail(email).orElseThrow();
                
                long count = userAndGameRepository.countUserGamesByUser(user);
                long totalPages = Math.ceilDiv(count, 10);
                return totalPages;
        }

        @GetMapping("/user_games_search_total_pages")
        public long GetUserGamesSearchTotalPages(@RequestParam String q, @AuthenticationPrincipal(expression = "username") String email)
        {
                User user = userRepository.findByEmail(email).orElseThrow();

                long count = userAndGameRepository.countUserGamesSearch(user, q);

                long totalPages = Math.ceilDiv(count, 10);
                
                return totalPages;
        }

        @GetMapping("/get_user_and_game")
        public UserAndGame GetUserAndGame(@RequestParam(value = "id") long gameId, @AuthenticationPrincipal(expression = "username") String email)
        {
                User user = userRepository.findByEmail(email).orElseThrow();
                UserGame game = userGameRepository.findById(gameId).orElseThrow();

                UserAndGame userAndGame = userAndGameRepository.findByUserAndUserGame(user, game).orElseThrow();

                return userAndGame;
        }

        @GetMapping("/fetch_game_info")
        public UserGame GetGameInfo(@RequestParam(value = "id") long gameId)
        {
                UserGame game = userGameRepository.findById(gameId).orElseThrow();
                return game;
        }

        @DeleteMapping("/delete_game/{id}")
        public UserAndGame DeleteGame(@PathVariable Long id, @AuthenticationPrincipal(expression = "username") String email)
        {
                UserGame game = userGameRepository.findById(id).orElseThrow();
                User user = userRepository.findByEmail(email).orElseThrow();
                UserAndGame userAndGame = userAndGameRepository.findByUserAndUserGame(user, game).orElseThrow();
                userAndGameRepository.delete(userAndGame);
                return userAndGame;
        }

}