import { Timestamped, Uuided } from '@/models/data';
import { DetectionObjectDetail } from '@/models/detection-object';
import { Tile } from '@/models/tile';
import { TileSet } from '@/models/tile-set';
import { FeatureCollection, Polygon } from 'geojson';

export const detectionControlStatuses = [
    'DETECTED',
    'SIGNALED_INTERNALLY',
    'SIGNALED_COLLECTIVITY',
    'CONFIRMED_FIELD',
    'INVALIDATED_FIELD',
] as const;
export type DetectionControlStatus = (typeof detectionControlStatuses)[number];

export const detectionValidationStatuses = [
    'DETECTED_NOT_VERIFIED',
    'SUSPECT',
    'LEGITIMATE',
    'INVALIDATED',
    'CONTROLLED',
] as const;
export type DetectionValidationStatus = (typeof detectionValidationStatuses)[number];

export const detectionSources = ['INTERFACE_DRAWN', 'ANALYSIS'];
export type DetectionSource = (typeof detectionSources)[number];

export interface DetectionProperties {
    uuid: string;
    detectionObjectUuid: string;
    objectTypeUuid: string;
    objectTypeColor: string;
    detectionControlStatus: DetectionControlStatus;
    detectionValidationStatus: DetectionValidationStatus;
}

export interface DetectionGeojsonData extends FeatureCollection<Polygon, DetectionProperties> {}

export interface DetectionData extends Uuided, Timestamped {
    detectionControlStatus: DetectionControlStatus;
    detectionValidationStatus: DetectionValidationStatus;
    userLastUpdateUuid: string;
}

export interface DetectionDetail extends Uuided, Timestamped {
    geometry: Polygon;
    score: number;
    detectionSource: DetectionSource;
    detectionData: DetectionData;
    detectionObject: Omit<DetectionObjectDetail, 'detections'>;
}

export interface DetectionWithTile extends Uuided, Timestamped {
    geometry: Polygon;
    score: number;
    detectionSource: DetectionSource;
    detectionData: DetectionData;
    tileSet: TileSet;
    tile: Tile;
}
