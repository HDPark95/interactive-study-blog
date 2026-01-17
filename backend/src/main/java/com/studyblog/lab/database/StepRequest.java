package com.studyblog.lab.database;

import lombok.Data;

@Data
public class StepRequest {
    private String transaction; // A or B
    private int step;
}
