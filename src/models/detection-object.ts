import { Timestamped, Uuided } from '@/models/data';
import { DetectionWithTile, DetectionWithTileMinimal } from '@/models/detection';
import { ObjectType } from '@/models/object-type';
import { Parcel } from '@/models/parcel';
import { TileSet } from '@/models/tile-set';
import { UserGroupRight } from '@/models/user';

interface DetectionObjectDetailTilesetPreview {
    preview: boolean;
    tileSet: TileSet;
}

export interface DetectionObjectMinimal extends Uuided, Timestamped {
    id: number;
    address: string;
    objectType: ObjectType;
}

export interface DetectionObjectDetail extends DetectionObjectMinimal {
    detections: DetectionWithTile[];
    tileSets: DetectionObjectDetailTilesetPreview[];
    parcel: Parcel | null;
    userGroupRights: UserGroupRight[];
}

export interface DetectionObjectHistoryItem {
    detection?: DetectionWithTileMinimal;
    tileSet: TileSet;
}

export interface DetectionObjectHistory extends Uuided, Timestamped {
    detections: DetectionObjectHistoryItem[];
    id: number;
    address: string;
    objectType: ObjectType;
    tileSets: TileSet[];
}
