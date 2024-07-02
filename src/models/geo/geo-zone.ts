import { Timestamped, Uuided } from '@/models/data';
import { Geometry } from 'geojson';

export interface GeoZone extends Uuided, Timestamped {
    name: string;
}

export interface GeoZoneDetail extends GeoZone {
    geometry: Geometry;
}
