import { Timestamped, Uuided } from '@/models/data';
import { Polygon } from 'geojson';

export interface Parcel extends Uuided, Timestamped {
    idParcellaire: string;
    prefix: string;
    section: string;
    numParcel: string;
    geometry: Polygon;
}
