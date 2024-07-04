import { ObjectType } from '@/models/object-type';
import { TileSet } from '@/models/tile-set';
import { Geometry } from 'geojson';

export interface TileSetSetting {
    tileSet: TileSet;
    geometry: Geometry;
}

export interface MapSettings {
    objectTypes: ObjectType[];
    tileSetSettings: TileSetSetting[];
}
