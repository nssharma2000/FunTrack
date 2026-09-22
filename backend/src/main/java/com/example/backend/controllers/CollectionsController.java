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
import com.example.backend.entities.Collection;
import com.example.backend.entities.User;
import com.example.backend.entities.UserAndGame;
import com.example.backend.entities.UserGame;
import com.example.backend.repositories.CollectionRepository;
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
@RequestMapping("/collections")
public class CollectionsController {

        private final UserGameRepository userGameRepository;
        private final UserRepository userRepository;
        private final CollectionRepository collectionRepository;
        
        @GetMapping("/get_collections")
        public List<Collection> getCollections(@AuthenticationPrincipal(expression = "username") String email)
        {
                User user = userRepository.findByEmail(email).orElseThrow();

                List<Collection> collections = collectionRepository.findAllByUser(user);

                return collections;
        }

        @PatchMapping("/add_game")
        public Collection addGameToCollection(@RequestBody long[] gameIds, @RequestParam(value = "collectionId") long collectionId)
        {
                Collection collection = collectionRepository.findById(collectionId).orElseThrow();

                collection.setGameIds(gameIds);

                return collectionRepository.save(collection);
        }

        @PatchMapping("/rename_collection")
        public Collection renameCollection(@RequestBody Map<String, String> newName, @RequestParam(value = "collectionId") long collectionId)
        {
                Collection collection = collectionRepository.findById(collectionId).orElseThrow();

                String name = newName.get("name");
                collection.setName(name);

                return collectionRepository.save(collection);
        }

        @PatchMapping("/delete_game")
        public Collection deleteGameFromCollection(@RequestBody long[] gameIds, @RequestParam(value = "collectionId") long collectionId)
        {
                Collection collection = collectionRepository.findById(collectionId).orElseThrow();

                collection.setGameIds(gameIds);

                return collectionRepository.save(collection);
        }

        @DeleteMapping("/delete_collection")
        public Collection deleteCollection(@RequestParam(value = "id") long collectionId)
        {
                Collection collection = collectionRepository.findById(collectionId).orElseThrow();

                collectionRepository.delete(collection);

                return collection;
        }



        @PostMapping("/create")
        public Collection createCollection(@RequestBody Collection collection, @AuthenticationPrincipal(expression = "username") String email)
        {
                User user = userRepository.findByEmail(email).orElseThrow();

                Collection newCollection = Collection.builder()
                                                        .name(collection.getName())
                                                        .gameIds(collection.getGameIds())
                                                        .user(user)
                                                        .build();
                
                return collectionRepository.save(newCollection);
        }

        

}