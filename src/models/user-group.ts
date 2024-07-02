import { Timestamped, Uuided } from '@/models/data';
import { GeoZone } from '@/models/geo/geo-zone';
import { ObjectTypeCategory } from '@/models/object-type-category';

export interface UserGroup extends Uuided, Timestamped {
    name: string;
}

export interface UserGroupDetail extends UserGroup {
    communes: GeoZone[];
    departments: GeoZone[];
    regions: GeoZone[];
    objectTypeCategories: ObjectTypeCategory[];
}
