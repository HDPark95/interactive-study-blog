package com.studyblog.lab.database.index;

import lombok.Data;
import java.util.List;

@Data
public class CreateIndexRequest {
    private String tableName;
    private String indexName;
    private List<String> columns;
    private String indexType; // btree, hash, gist, etc.
}
