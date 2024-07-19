import { CollectivityType } from '@/models/geo/_common';
import { GeoZone } from '@/models/geo/geo-zone';
import { SelectOption } from '@/models/ui/select-option';
import { bboxPolygon, booleanWithin } from '@turf/turf';
import { Polygon } from 'geojson';

export type LngLat = [number, number];

export type GeoValues = {
    [key in CollectivityType]: SelectOption[];
};

export const geoZoneToGeoOption = (geoZone: GeoZone): SelectOption => ({
    value: geoZone.uuid,
    label: geoZone.name,
});

export const extendBbox = (
    bbox: [number, number, number, number],
    level: number = 1,
): [number, number, number, number] => {
    const width = bbox[2] - bbox[0];
    const height = bbox[3] - bbox[1];

    return [
        bbox[0] - level * width,
        bbox[1] - level * height, // minY - height
        bbox[2] + level * width, // maxX + width
        bbox[3] + level * height, // maxY + height
    ];
};

const MAX_LEVEL_FIT = 5;

export const getBoundsFitGeometryExtendedLevel = (geometry: Polygon, bounds: [number, number, number, number]) => {
    let currentExtendedLevel = 0;

    while (true) {
        const extendedBounds = extendBbox(bounds, currentExtendedLevel);

        if (currentExtendedLevel === MAX_LEVEL_FIT || booleanWithin(geometry, bboxPolygon(extendedBounds))) {
            return extendedBounds;
        }

        currentExtendedLevel++;
    }
};
