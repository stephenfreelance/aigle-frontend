import { CollectivityType, GeoCollectivity } from '@/models/geo/_common';
import { SelectOption } from '@/models/ui/select-option';

export type LngLat = [number, number];

export type GeoValues = {
    [key in CollectivityType]: SelectOption[];
};

export const geoCollectivityToGeoOption = (geoCollectivity: GeoCollectivity): SelectOption => ({
    value: geoCollectivity.uuid,
    label: geoCollectivity.displayName,
});
