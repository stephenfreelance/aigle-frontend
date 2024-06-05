import { Timestamped, Uuided } from '@/models/data';

export const tileSetStatuses = ['VISIBLE', 'HIDDEN', 'DEACTIVATED'] as const;
export type TileSetStatus = (typeof tileSetStatuses)[number];

export interface TileSet extends Uuided, Timestamped {
    date: string;
    name: string;
    url: string;
    tileSetStatus: TileSetStatus;
}
