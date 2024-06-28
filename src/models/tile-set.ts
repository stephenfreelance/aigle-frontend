import { Timestamped, Uuided } from '@/models/data';
import { GeoCommune } from '@/models/geo/geo-commune';
import { GeoDepartment } from '@/models/geo/geo-department';
import { GeoRegion } from '@/models/geo/geo-region';
import { Geometry } from 'geojson';

export const tileSetStatuses = ['VISIBLE', 'HIDDEN', 'DEACTIVATED'] as const;
export type TileSetStatus = (typeof tileSetStatuses)[number];

export const tileSetSchemes = ['tms', 'xyz'] as const;
export type TileSetScheme = (typeof tileSetSchemes)[number];

export const tileSetTypes = ['BACKGROUND', 'PARTIAL', 'INDICATIVE'] as const;
export type TileSetType = (typeof tileSetTypes)[number];

export interface TileSet extends Uuided, Timestamped {
    date: string;
    name: string;
    url: string;
    tileSetStatus: TileSetStatus;
    tileSetScheme: TileSetScheme;
    tileSetType: TileSetType;
    geometry?: Geometry;
}

export interface TileSetDetail extends TileSet {
    communes: GeoCommune[];
    departments: GeoDepartment[];
    regions: GeoRegion[];
}

export interface TileSetDetailWithGeometry extends TileSetDetail {
    geometry: Geometry;
}
