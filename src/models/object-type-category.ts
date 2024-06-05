import { Timestamped, Uuided } from '@/models/data';
import { ObjectType } from '@/models/object-type';

export interface ObjectTypeCategory extends Uuided, Timestamped {
    name: string;
}

export interface ObjectTypeCategoryDetail extends ObjectTypeCategory {
    objectTypes: ObjectType[];
}
