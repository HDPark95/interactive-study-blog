package com.studyblog.lab.database.index;

import lombok.Data;

@Data
public class IndexInfo {
    private String indexName;
    private String indexDefinition;
    private String indexSize;
    private String indexType;
    private boolean isUnique;
    private boolean isPrimary;
    private String columns;
}
