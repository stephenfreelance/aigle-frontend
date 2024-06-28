import { ObjectType } from '@/models/object-type';
import { TileSet } from '@/models/tile-set';
import { UserGroupRight } from '@/models/user';

export interface MapSetting {
    tileSet: TileSet;
    objectTypes: ObjectType[];
    userGroupRights: UserGroupRight[];
}

export interface MapSettings {
    settings: MapSetting[];
}
