import { Timestamped, Uuided } from '@/models/data';
import { Polygon } from 'geojson';

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
    geometry?: Polygon;
}
