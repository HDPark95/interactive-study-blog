package com.studyblog.lab.database.index;

import lombok.Data;

@Data
public class SpatialSearchRequest {
    private double longitude;
    private double latitude;
    private double radiusMeters;
}
