package com.example.backend.entities;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;


@Entity
@Table(name = "user_games")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UserGame {

    @Id
    private Integer id;

    @Column(nullable = false, columnDefinition = "text")
    private String name;

    @Column(name = "image_url", columnDefinition = "text")
    private String imageUrl;

    @Column(name = "release_date", columnDefinition = "text")
    private String releaseDate;

    @Column(name = "release_year")
    private Integer releaseYear;

    @Column(name="summary", columnDefinition = "text")
    private String summary;
}