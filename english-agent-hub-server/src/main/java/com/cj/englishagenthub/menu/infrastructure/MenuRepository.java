package com.cj.englishagenthub.menu.infrastructure;

import com.cj.englishagenthub.menu.domain.Menu;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface MenuRepository extends JpaRepository<Menu, Long> {

    boolean existsByCode(String code);

    Optional<Menu> findByCode(String code);

    @Query("SELECT m FROM Menu m LEFT JOIN FETCH m.parent ORDER BY m.displayOrder ASC")
    List<Menu> findAllOrderByDisplayOrder();
}
