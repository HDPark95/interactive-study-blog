package com.studyblog.lab.database.index;

import lombok.Data;

@Data
public class SpatialSearchResult {
    private long id;
    private String name;
    private String category;
    private double longitude;
    private double latitude;
    private double distanceMeters;
}
