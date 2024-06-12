import { Polygon } from 'geojson';

export const getCenterPoint = (polygon: Polygon): [number, number] => {
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
