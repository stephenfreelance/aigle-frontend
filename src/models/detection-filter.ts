import { DetectionControlStatus, DetectionValidationStatus } from '@/models/detection';

export interface DetectionFilter {
    objectTypesUuids: string[];
    detectionValidationStatuses: DetectionValidationStatus[];
    detectionControlStatuses: DetectionControlStatus[];
}
