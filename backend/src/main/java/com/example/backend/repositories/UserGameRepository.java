package com.example.backend.repositories;

import java.util.List;

import org.springframework.data.domain.OffsetScrollPosition;
import org.springframework.data.domain.Window;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.example.backend.entities.UserGame;

@Repository
public interface UserGameRepository extends JpaRepository<UserGame, Long> {
    Window<UserGame> findFirst10ByNameContainingIgnoreCaseOrderByNameAsc(String query, OffsetScrollPosition position);
    Long countByNameContainingIgnoreCase(String q);
}
