import { DetectionControlStatus, DetectionValidationStatus } from '@/models/detection';

export interface ObjectsFilter {
    objectTypesUuids: string[];
    detectionValidationStatuses: DetectionValidationStatus[];
    detectionControlStatuses: DetectionControlStatus[];
    score: number;
    prescripted: boolean | null;
    customZonesUuids: string[];
}
