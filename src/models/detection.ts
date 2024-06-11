import { FeatureCollection, Polygon } from 'geojson';

export const detectionControlStatuses = ['NO_CONTROL', 'SIGNALED_INTERNALLY', 'SIGNALED_COLLECTIVITY'] as const;
export type DetectionControlStatus = (typeof detectionControlStatuses)[number];

export const detectionValidationStatuses = ['SUSPECT', 'LEGITIMATE', 'INVALIDATED'] as const;
export type DetectionValidationStatus = (typeof detectionValidationStatuses)[number];

export interface DetectionProperties {
    uuid: string;
    objectTypeUuid: string;
    objectTypeColor: string;
    detectionControlStatus: DetectionControlStatus;
    detectionValidationStatus: DetectionValidationStatus;
}

export interface DetectionGeojsonData extends FeatureCollection<Polygon, DetectionProperties> {}
