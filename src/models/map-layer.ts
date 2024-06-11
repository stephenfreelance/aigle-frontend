import { TileSet } from '@/models/tile-set';

export interface MapLayer {
    tileSet: TileSet;
    displayed: boolean;
}
