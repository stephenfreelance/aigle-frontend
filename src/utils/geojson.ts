import { Polygon } from 'geojson';

export type LngLat = [number, number];

export const getCenterPoint = (polygon: Polygon): LngLat => {
    const coordinates = polygon.coordinates[0];

    let minx = 1000;
    let miny = 1000;
    let maxx = -1000;
    let maxy = -1000;
    for (let i = 0; i < coordinates.length; i++) {
        const point = coordinates[i];
        const x = point[0];
        const y = point[1];

        if (x < minx) minx = x;
        else if (x > maxx) maxx = x;
        if (y < miny) miny = y;
        else if (y > maxy) maxy = y;
    }

    return [minx + (maxx - minx) / 2, miny + (maxy - miny) / 2];
};

const arePositionsEqual = (pos1: number[], pos2: number[]): boolean => {
    if (pos1.length !== pos2.length) {
        return false;
    }
    return pos1.every((coord, index) => coord === pos2[index]);
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isPolygon = (obj: any): obj is Polygon => {
    if (typeof obj !== 'object' || obj === null) {
        return false;
    }

    if (obj.type !== 'Polygon') {
        return false;
    }

    if (!Array.isArray(obj.coordinates)) {
        return false;
    }

    for (const ring of obj.coordinates) {
        if (!Array.isArray(ring)) {
            return false;
        }

        for (const position of ring) {
            if (
                !Array.isArray(position) ||
                position.length < 2 ||
                !position.every((coord) => typeof coord === 'number')
            ) {
                return false;
            }
        }

        if (ring.length < 4 || !arePositionsEqual(ring[0], ring[ring.length - 1])) {
            return false;
        }
    }

    return true;
};

// [sw.lng, sw.lat, ne.lng, ne.lat]
type BoundingBox = [number, number, number, number];

export const getBoundingBox = (polygon: Polygon): BoundingBox => {
    let minX = Infinity,
        minY = Infinity,
        maxX = -Infinity,
        maxY = -Infinity;

    for (const ring of polygon.coordinates) {
        for (const [x, y] of ring) {
            if (x < minX) minX = x;
            if (y < minY) minY = y;
            if (x > maxX) maxX = x;
            if (y > maxY) maxY = y;
        }
    }
    return [minX, minY, maxX, maxY];
};

export const boundingBoxToPolygon = ([minX, minY, maxX, maxY]: BoundingBox): Polygon => {
    return {
        type: 'Polygon',
        coordinates: [
            [
                [minX, minY],
                [minX, maxY],
                [maxX, maxY],
                [maxX, minY],
                [minX, minY],
            ],
        ],
    };
};

export const pointInPolygon = (polygon: Polygon, point: LngLat): boolean => {
    const [lng, lat] = point;
    let inside = false;

    for (const ring of polygon.coordinates) {
        for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
            const [xi, yi] = ring[i];
            const [xj, yj] = ring[j];

            const intersect = yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
            if (intersect) inside = !inside;
        }
    }

    return inside;
};
