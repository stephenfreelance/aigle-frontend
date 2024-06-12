import { ObjectType } from '@/models/object-type';
import { TileSet } from '@/models/tile-set';

export interface MapSettings {
    tileSets: TileSet[];
    objectTypes: ObjectType[];
}
