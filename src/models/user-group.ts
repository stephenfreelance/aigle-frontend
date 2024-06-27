import { Timestamped, Uuided } from '@/models/data';
import { GeoCommune } from '@/models/geo/geo-commune';
import { GeoDepartment } from '@/models/geo/geo-department';
import { GeoRegion } from '@/models/geo/geo-region';
import { ObjectTypeCategory } from '@/models/object-type-category';

export interface UserGroup extends Uuided, Timestamped {
    name: string;
}

export interface UserGroupDetail extends UserGroup {
    communes: GeoCommune[];
    departments: GeoDepartment[];
    regions: GeoRegion[];
    objectTypeCategories: ObjectTypeCategory[];
}
