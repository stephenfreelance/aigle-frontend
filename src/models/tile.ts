import { Polygon } from 'geojson';

export interface Tile {
    x: number;
    y: number;
    z: number;
    geometry: Polygon;
}
