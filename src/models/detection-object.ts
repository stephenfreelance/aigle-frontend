import { Timestamped, Uuided } from '@/models/data';
import { DetectionWithTile } from '@/models/detection';
import { ObjectType } from '@/models/object-type';
import { TileSet } from '@/models/tile-set';

export interface DetectionObjectDetail extends Uuided, Timestamped {
    id: number;
    address: string;
    objectType: ObjectType;
    detections: DetectionWithTile[];
    tileSetsPreviews: TileSet[];
}
