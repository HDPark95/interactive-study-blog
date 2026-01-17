package com.studyblog.lab.database.index;

import lombok.Data;
import java.util.List;
import java.util.Map;

@Data
public class IndexStructure {
    private String indexName;
    private int treeLevel;
    private long rootBlockNo;
    private long fastRoot;
    private int totalPages;
    private List<IndexPage> pages;
    private Map<Integer, Long> pagesPerLevel;
    private String error;
}
