import { Timestamped, Uuided } from '@/models/data';
import { Polygon } from 'geojson';

export interface ParcelMinimal extends Uuided, Timestamped {
    idParcellaire: string;
    prefix: string;
    section: string;
    numParcel: string;
}

export interface Parcel extends ParcelMinimal {
    geometry: Polygon;
}
