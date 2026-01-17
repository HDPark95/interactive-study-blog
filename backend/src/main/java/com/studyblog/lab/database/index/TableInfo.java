package com.studyblog.lab.database.index;

import lombok.Data;

@Data
public class TableInfo {
    private String tableName;
    private String totalSize;
    private int columnCount;
    private long rowCount;
}
