package com.svms.controller;

import com.svms.dto.ApiResponse;
import com.svms.entity.Department;
import com.svms.repository.DepartmentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/departments")
public class DepartmentController {

    @Autowired
    private DepartmentRepository departmentRepository;

    // 1. Get all departments
    @GetMapping
    public ResponseEntity<List<Department>> getAllDepartments() {
        return ResponseEntity.ok(departmentRepository.findAll());
    }

    // 2. Create department
    @PostMapping
    public ResponseEntity<?> createDepartment(@RequestBody Department department) {
        if (department.getName() == null || department.getName().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, "Department name is required."));
        }
        if (departmentRepository.findByName(department.getName().trim()).isPresent()) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, "Department name already exists."));
        }
        department.setName(department.getName().trim());
        Department saved = departmentRepository.save(department);
        return ResponseEntity.ok(saved);
    }

    // 3. Update department
    @PutMapping("/{id}")
    public ResponseEntity<?> updateDepartment(@PathVariable Integer id, @RequestBody Department details) {
        return departmentRepository.findById(id)
                .<ResponseEntity<?>>map(dept -> {
                    if (details.getName() == null || details.getName().trim().isEmpty()) {
                        return ResponseEntity.badRequest().body(new ApiResponse(false, "Department name is required."));
                    }
                    String newName = details.getName().trim();
                    if (!dept.getName().equalsIgnoreCase(newName) && departmentRepository.findByName(newName).isPresent()) {
                        return ResponseEntity.badRequest().body(new ApiResponse(false, "Department name already exists."));
                    }
                    dept.setName(newName);
                    dept.setRoomNo(details.getRoomNo());
                    dept.setFloor(details.getFloor());
                    Department updated = departmentRepository.save(dept);
                    return ResponseEntity.ok(updated);
                })
                .orElse(ResponseEntity.notFound().build());
    }
    // 4. Delete department
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteDepartment(@PathVariable Integer id) {
        return departmentRepository.findById(id)
                .<ResponseEntity<?>>map(dept -> {
                    departmentRepository.delete(dept);
                    return ResponseEntity.ok(new ApiResponse(true, "Department deleted successfully!"));
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
