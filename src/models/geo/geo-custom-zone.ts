import { Timestamped, Uuided } from '@/models/data';
import { Geometry } from 'geojson';

export interface GeoCustomZone extends Uuided, Timestamped {
    name: string;
}

export interface GeoCustomZoneDetail extends GeoCustomZone {
    geometry: Geometry;
}
