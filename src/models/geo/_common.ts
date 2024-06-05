import { Timestamped, Uuided } from '@/models/data';

export const collectivityTypes = ['region', 'department', 'commune'] as const;
export type CollectivityType = (typeof collectivityTypes)[number];

export interface GeoCollectivity extends Uuided, Timestamped {
    code: string;
    name: string;
    displayName: string;
}
