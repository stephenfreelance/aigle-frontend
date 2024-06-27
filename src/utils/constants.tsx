import { GEO_COMMUNE_LIST_ENDPOINT, GEO_DEPARTMENT_LIST_ENDPOINT, GEO_REGION_LIST_ENDPOINT } from '@/api-endpoints';
import { CollectivityType } from '@/models/geo/_common';
import { TileSetStatus, TileSetType } from '@/models/tile-set';
import { UserGroupRight, UserRole } from '@/models/user';

export const DEFAULT_ROUTE = '/';

export const AUTH_ACCESS_TOKEN_STORAGE_KEY = 'auth_access_token';
export const AUTH_REFRESH_TOKEN_STORAGE_KEY = 'auth_refresh_token';

export const TILES_URL_FALLBACK = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

export const PASSWORD_MIN_LENGTH = 8;

export const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

export const ROLES_NAMES_MAP: { [role in UserRole]: string } = {
    SUPER_ADMIN: 'super admin',
    ADMIN: 'admin',
    REGULAR: 'normal',
} as const;
export const COLLECTIVITY_TYPES_NAMES_MAP: {
    [role in CollectivityType]: string;
} = {
    region: 'région',
    department: 'département',
    commune: 'commune',
} as const;
export const TILE_SET_STATUSES_NAMES_MAP: {
    [role in TileSetStatus]: string;
} = {
    VISIBLE: 'visible',
    HIDDEN: 'caché par défaut',
    DEACTIVATED: 'désactivé',
} as const;
export const TILE_SET_TYPES_NAMES_MAP: {
    [role in TileSetType]: string;
} = {
    BACKGROUND: 'Arrière-plan',
    PARTIAL: 'Partiel',
    INDICATIVE: 'Indicative',
} as const;

export const USER_GROUP_RIGHTS_ORDERED: UserGroupRight[] = ['WRITE', 'ANNOTATE', 'READ'] as const;
export const USER_GROUP_RIGHTS_NAMES_MAP: {
    [role in UserGroupRight]: string;
} = {
    WRITE: 'Ecriture',
    ANNOTATE: 'Annotation',
    READ: 'Lecture',
} as const;

export const COLLECTIVITY_TYPES_ENDPOINTS_MAP: {
    [role in CollectivityType]: string;
} = {
    region: GEO_REGION_LIST_ENDPOINT,
    department: GEO_DEPARTMENT_LIST_ENDPOINT,
    commune: GEO_COMMUNE_LIST_ENDPOINT,
} as const;

export const DEFAULT_DATE_FORMAT = 'dd/MM/yyyy';
export const DEFAULT_DATETIME_FORMAT = 'dd/MM/yyyy à HH:mm';
