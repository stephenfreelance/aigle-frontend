import { Timestamped, Uuided } from '@/models/data';
import { DetectionWithTile, DetectionWithTileMinimal } from '@/models/detection';
import { ObjectType } from '@/models/object-type';
import { ParcelMinimal } from '@/models/parcel';
import { TileSet } from '@/models/tile-set';

interface DetectionObjectDetailTilesetPreview {
    preview: boolean;
    tileSet: TileSet;
}

export interface DetectionObjectDetail extends Uuided, Timestamped {
    id: number;
    address: string;
    objectType: ObjectType;
    detections: DetectionWithTile[];
    tileSets: DetectionObjectDetailTilesetPreview[];
    parcel: ParcelMinimal;
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
