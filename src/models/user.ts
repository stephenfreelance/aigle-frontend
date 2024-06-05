import { Timestamped, Uuided } from '@/models/data';

export const userRoles = ['SUPER_ADMIN', 'ADMIN', 'REGULAR'] as const;
export type UserRole = (typeof userRoles)[number];

export interface User extends Uuided, Timestamped {
    email: string;
    userRole: UserRole;
}
