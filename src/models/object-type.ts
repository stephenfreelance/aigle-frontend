import { Timestamped, Uuided } from "@/models/data";

export interface ObjectType extends Uuided, Timestamped {
    name: string;
    color: string;
}

