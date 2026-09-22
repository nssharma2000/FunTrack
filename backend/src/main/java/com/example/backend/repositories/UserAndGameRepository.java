package com.example.backend.repositories;

import java.util.List;
import java.util.Optional;


import org.springframework.data.domain.OffsetScrollPosition;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Window;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.backend.entities.User;
import com.example.backend.entities.UserAndGame;
import com.example.backend.entities.UserGame;

@Repository
public interface UserAndGameRepository extends JpaRepository<UserAndGame, Long> {
   Optional<UserAndGame> findByUserAndUserGame(User user, UserGame userGame);
   
   @Query("SELECT uag.userGame FROM UserAndGame uag WHERE uag.user = :user ORDER BY uag.userGame.name ASC")
   List<UserGame> findFirst10UserGamesByUser(@Param("user") User user, Pageable pageable);

   @Query("""
            SELECT uag.userGame FROM UserAndGame uag 
            WHERE uag.user = :user AND 
            LOWER(uag.userGame.name) LIKE LOWER(CONCAT('%', :query, '%')) 
            ORDER BY uag.userGame.name ASC
        """)
   List<UserGame> findFirst10UserGamesSearch(@Param("user") User user, @Param("query") String query, Pageable pageable);
   
   @Query("SELECT uag FROM UserAndGame uag WHERE user = :user AND isFavorite = true")
   List<UserAndGame> findFavoriteGamesByUser(@Param("user") User user);

   @Query("""
            SELECT COUNT(uag) FROM UserAndGame uag WHERE uag.user = :user 
            AND LOWER(uag.userGame.name) LIKE LOWER(CONCAT('%', :q, '%')) 
            """
         )
   Long countUserGamesSearch(@Param("user") User user, @Param("q") String q);

   @Query("SELECT COUNT(uag) FROM UserAndGame uag WHERE uag.user = :user")
   Long countUserGamesByUser(User user);
}
