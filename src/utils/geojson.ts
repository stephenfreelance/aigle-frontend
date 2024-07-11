import { CollectivityType, GeoCollectivity } from '@/models/geo/_common';
import { SelectOption } from '@/models/ui/select-option';

export type LngLat = [number, number];

export type GeoValues = {
    [key in CollectivityType]: SelectOption[];
};

export const geoCollectivityToGeoOption = (geoCollectivity: GeoCollectivity): SelectOption => ({
    value: geoCollectivity.uuid,
    label: geoCollectivity.name,
});

export const extendBbox = (bbox: [number, number, number, number]): [number, number, number, number] => {
    const width = bbox[2] - bbox[0];
    const height = bbox[3] - bbox[1];

    // Calculate the new bbox by extending it by 100%
    return [
        bbox[0] - width, // minX - width
        bbox[1] - height, // minY - height
        bbox[2] + width, // maxX + width
        bbox[3] + height, // maxY + height
    ];
};
