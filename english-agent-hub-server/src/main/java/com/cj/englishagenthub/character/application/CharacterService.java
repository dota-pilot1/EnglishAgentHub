package com.cj.englishagenthub.character.application;

import com.cj.englishagenthub.auth.security.UserPrincipal;
import com.cj.englishagenthub.character.domain.Character;
import com.cj.englishagenthub.character.infrastructure.CharacterRepository;
import com.cj.englishagenthub.character.presentation.dto.CharacterResponse;
import com.cj.englishagenthub.character.presentation.dto.CharacterUpsertRequest;
import com.cj.englishagenthub.common.exception.BusinessException;
import com.cj.englishagenthub.common.exception.ErrorCode;
import com.cj.englishagenthub.config.RoleSeeder;
import com.cj.englishagenthub.user.domain.User;
import com.cj.englishagenthub.user.infrastructure.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CharacterService {

    private final CharacterRepository characterRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<CharacterResponse> list() {
        return characterRepository.findAllByOrderByCreatedAtAsc().stream()
                .map(CharacterResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public CharacterResponse get(Long id) {
        return CharacterResponse.from(loadOrThrow(id));
    }

    @Transactional(readOnly = true)
    public Character loadOrThrow(Long id) {
        return characterRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.CHARACTER_NOT_FOUND));
    }

    @Transactional
    public CharacterResponse create(UserPrincipal principal, CharacterUpsertRequest req) {
        User creator = userRepository.findById(principal.getId())
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        Character saved = characterRepository.save(Character.create(
                creator,
                req.title(),
                req.subtitle(),
                req.description(),
                req.level(),
                req.sessionGoal(),
                req.skills(),
                req.starterPrompts(),
                req.style(),
                req.scenario(),
                req.character(),
                req.knowledge(),
                req.news(),
                req.schedule()
        ));
        return CharacterResponse.from(saved);
    }

    @Transactional
    public CharacterResponse update(UserPrincipal principal, Long id, CharacterUpsertRequest req) {
        Character target = loadOrThrow(id);
        requireOwnerOrAdmin(principal, target);
        target.update(
                req.title(),
                req.subtitle(),
                req.description(),
                req.level(),
                req.sessionGoal(),
                req.skills(),
                req.starterPrompts(),
                req.style(),
                req.scenario(),
                req.character(),
                req.knowledge(),
                req.news(),
                req.schedule()
        );
        return CharacterResponse.from(target);
    }

    @Transactional
    public void delete(UserPrincipal principal, Long id) {
        Character target = loadOrThrow(id);
        requireOwnerOrAdmin(principal, target);
        characterRepository.delete(target);
    }

    private void requireOwnerOrAdmin(UserPrincipal principal, Character target) {
        if (RoleSeeder.ROLE_ADMIN.equals(principal.getRoleCode())) return;
        if (target.isOwnedBy(principal.getId())) return;
        throw new BusinessException(ErrorCode.CHARACTER_NOT_OWNER);
    }
}
