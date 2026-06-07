package com.cj.englishagenthub.menu.application;

import com.cj.englishagenthub.common.exception.BusinessException;
import com.cj.englishagenthub.common.exception.ErrorCode;
import com.cj.englishagenthub.menu.domain.Menu;
import com.cj.englishagenthub.menu.infrastructure.MenuRepository;
import com.cj.englishagenthub.menu.presentation.dto.CreateMenuRequest;
import com.cj.englishagenthub.menu.presentation.dto.MenuResponse;
import com.cj.englishagenthub.menu.presentation.dto.UpdateMenuRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MenuService {

    private final MenuRepository menuRepository;

    @Transactional(readOnly = true)
    public List<MenuResponse> getAll() {
        return menuRepository.findAllOrderByDisplayOrder()
                .stream()
                .map(MenuResponse::from)
                .toList();
    }

    @Transactional
    public MenuResponse create(CreateMenuRequest req) {
        if (menuRepository.existsByCode(req.code())) {
            throw new BusinessException(ErrorCode.MENU_CODE_DUPLICATE);
        }
        Menu parent = resolveParent(req.parentId());
        Menu menu = Menu.create(
                req.code(), parent, req.label(), req.labelKey(),
                req.path(), req.icon(), req.isExternal(),
                req.requiredRole(), req.requiredPermission(),
                req.visible(), req.displayOrder()
        );
        return MenuResponse.from(menuRepository.save(menu));
    }

    @Transactional
    public MenuResponse update(Long id, UpdateMenuRequest req) {
        Menu menu = getById(id);
        Menu parent = resolveParent(req.parentId());
        menu.update(
                parent, req.label(), req.labelKey(),
                req.path(), req.icon(), req.isExternal(),
                req.requiredRole(), req.requiredPermission(),
                req.visible(), req.displayOrder()
        );
        return MenuResponse.from(menu);
    }

    @Transactional
    public void delete(Long id) {
        Menu menu = getById(id);
        menuRepository.delete(menu);
    }

    private Menu getById(Long id) {
        return menuRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.MENU_NOT_FOUND));
    }

    private Menu resolveParent(Long parentId) {
        if (parentId == null) return null;
        return menuRepository.findById(parentId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MENU_PARENT_NOT_FOUND));
    }
}
