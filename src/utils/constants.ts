import { GEO_REGION_LIST, GEO_DEPARTMENT_LIST, GEO_COMMUNE_LIST } from "@/api-endpoints";
import { CollectivityType } from "@/models/geo/_common";
import { UserRole } from "@/models/user";

export const DEFAULT_ROUTE = '/';

export const AUTH_ACCESS_TOKEN_STORAGE_KEY = 'auth_access_token';
export const AUTH_REFRESH_TOKEN_STORAGE_KEY = 'auth_refresh_token';

export const ROLES_NAMES_MAP: { [role in UserRole]: string } = {
    SUPER_ADMIN: 'super admin',
    ADMIN: 'admin',
    REGULAR: 'normal'
} as const;


export const COLLECTIVITY_TYPES_NAMES_MAP: {
    [role in CollectivityType]: string;
  } = {
    region: 'région',
    department: 'département',
    commune: 'commune',
  } as const;
export const COLLECTIVITY_TYPES_ENDPOINTS_MAP: {
    [role in CollectivityType]: string;
  } = {
    region: GEO_REGION_LIST,
    department: GEO_DEPARTMENT_LIST,
    commune: GEO_COMMUNE_LIST,
  } as const;

export const DEFAULT_DATE_FORMAT = 'dd/MM/yyyy';
export const DEFAULT_DATETIME_FORMAT = 'dd/MM/yyyy à HH:mm';