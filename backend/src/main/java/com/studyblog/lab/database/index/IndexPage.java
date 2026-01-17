package com.studyblog.lab.database.index;

import lombok.Data;
import java.util.List;

@Data
public class IndexPage {
    private long blockNo;
    private int level;
    private Boolean isLeaf;
    private int liveItems;
    private int deadItems;
    private int freeSize;
    private List<String> keys;
    private List<Long> childBlocks;
}
