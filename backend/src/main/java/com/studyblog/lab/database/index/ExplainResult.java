package com.studyblog.lab.database.index;

import lombok.Data;

@Data
public class ExplainResult {
    private String originalQuery;
    private String plan;
    private boolean success;
    private String error;
    private boolean usesIndex;
    private boolean usesSeqScan;
}
