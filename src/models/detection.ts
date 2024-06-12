import { Timestamped, Uuided } from '@/models/data';
import { ObjectType } from '@/models/object-type';
import { FeatureCollection, Polygon } from 'geojson';

export const detectionControlStatuses = ['NO_CONTROL', 'SIGNALED_INTERNALLY', 'SIGNALED_COLLECTIVITY'] as const;
export type DetectionControlStatus = (typeof detectionControlStatuses)[number];

export const detectionValidationStatuses = ['SUSPECT', 'LEGITIMATE', 'INVALIDATED'] as const;
export type DetectionValidationStatus = (typeof detectionValidationStatuses)[number];

export const detectionSources = ['INTERFACE_DRAWN', 'ANALYSIS'];
export type DetectionSource = (typeof detectionSources)[number];

export interface DetectionProperties {
    id: number;
    uuid: string;
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

export interface DetectionObject extends Uuided, Timestamped {
    address: string;
    objectType: ObjectType;
}

export interface DetectionDetail extends Uuided, Timestamped {
    id: number;
    geometry: Polygon;
    score: number;
    detectionSource: DetectionSource;
    detectionData: DetectionData;
    detectionObject: DetectionObject;
}
