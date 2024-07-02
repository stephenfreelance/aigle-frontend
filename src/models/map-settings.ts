import { ObjectType } from '@/models/object-type';
import { TileSet } from '@/models/tile-set';
import { UserGroupRight } from '@/models/user';
import { Geometry } from 'geojson';

export interface TileSetSetting {
    tileSet: TileSet;
    userGroupRights: UserGroupRight[];
    geometry: Geometry;
}

export interface MapSettings {
    objectTypes: ObjectType[];
    tileSetSettings: TileSetSetting[];
}
