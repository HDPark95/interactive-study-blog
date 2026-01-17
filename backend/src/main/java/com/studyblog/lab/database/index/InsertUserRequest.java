package com.studyblog.lab.database.index;

import lombok.Data;

@Data
public class InsertUserRequest {
    private String username;
    private String email;
    private int age;
    private String department;
}
