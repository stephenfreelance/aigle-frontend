import { ParcelMinimal } from '@/models/parcel';

export const formatParcel = (parcel: ParcelMinimal) => {
    return `${parcel.prefix} ${parcel.section} ${parcel.numParcel}`;
};
