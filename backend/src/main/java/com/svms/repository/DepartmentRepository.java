package com.svms.repository;

import com.svms.entity.Department;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface DepartmentRepository extends JpaRepository<Department, Integer> {
    Optional<Department> findByName(String name);
    Optional<Department> findByNameIgnoreCase(String name);
}
