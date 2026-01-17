package com.studyblog.session;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface LabSessionRepository extends JpaRepository<LabSession, UUID> {

    List<LabSession> findByLabTypeAndLabCategory(String labType, String labCategory);

    List<LabSession> findByExpiresAtBefore(LocalDateTime dateTime);

    void deleteByExpiresAtBefore(LocalDateTime dateTime);
}
