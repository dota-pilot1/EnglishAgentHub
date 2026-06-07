package com.cj.englishagenthub.character.infrastructure;

import com.cj.englishagenthub.character.domain.Character;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CharacterRepository extends JpaRepository<Character, Long> {
    List<Character> findAllByOrderByCreatedAtAsc();
}
