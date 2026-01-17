package com.studyblog.lab.database.index;

import lombok.Data;

@Data
public class BulkInsertRequest {
    private int count;
    private String prefix;
}
