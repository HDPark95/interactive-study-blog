package com.studyblog.lab.database;

import lombok.Data;

@Data
public class IsolationLabRequest {
    private String isolationLevel; // READ_UNCOMMITTED, READ_COMMITTED, REPEATABLE_READ, SERIALIZABLE
    private String dbType;         // POSTGRESQL, MYSQL
    private String scenario;       // DIRTY_READ, NON_REPEATABLE_READ, PHANTOM_READ
}
