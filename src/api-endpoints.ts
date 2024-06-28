import { CollectivityType } from '@/models/geo/_common';

const BASE_AUTH = '/auth/';
export const AUTH_REGISTER_ENDPOINT = `${BASE_AUTH}users/`;
export const AUTH_LOGIN_ENDPOINT = `${BASE_AUTH}jwt/create/`;
export const AUTH_REFRESH_TOKEN_ENDPOINT = `${BASE_AUTH}jwt/refresh/`;
export const AUTH_ME_ENDPOINT = `${BASE_AUTH}users/me/`;
export const AUTH_RESET_PASSWORD_ENDPOINT = `${BASE_AUTH}users/reset_password/`;
export const AUTH_RESET_PASSWORD_CONFIRM_ENDPOINT = `${BASE_AUTH}users/reset_password_confirm/`;

const BASE_API = '/api/';

const BASE_USERS = `${BASE_API}users/`;
export const USERS_LIST_ENDPOINT = `${BASE_USERS}`;
export const USERS_POST_ENDPOINT = `${BASE_USERS}`;
export const getUserDetailEndpoint = (uuid: string) => `${USERS_POST_ENDPOINT}${uuid}/`;

const BASE_USER_GROUP = `${BASE_API}user-group/`;
export const USER_GROUP_LIST_ENDPOINT = `${BASE_USER_GROUP}`;
export const USER_GROUP_POST_ENDPOINT = `${BASE_USER_GROUP}`;
export const getUserGroupDetailEndpoint = (uuid: string) => `${USER_GROUP_LIST_ENDPOINT}${uuid}/`;

// geo

const BASE_GEO = `${BASE_API}geo/`;

const BASE_GEO_REGION = `${BASE_GEO}region/`;
export const GEO_REGION_LIST_ENDPOINT = `${BASE_GEO_REGION}`;
export const GEO_REGION_POST_ENDPOINT = `${BASE_GEO_REGION}`;
export const getGeoRegionDetailEndpoint = (uuid: string) => `${GEO_REGION_POST_ENDPOINT}${uuid}/`;

const BASE_GEO_DEPARTMENT = `${BASE_GEO}department/`;
export const GEO_DEPARTMENT_LIST_ENDPOINT = `${BASE_GEO_DEPARTMENT}`;
export const GEO_DEPARTMENT_POST_ENDPOINT = `${BASE_GEO_DEPARTMENT}`;
export const getGeoDepartmentDetailEndpoint = (uuid: string) => `${GEO_DEPARTMENT_POST_ENDPOINT}${uuid}/`;

const BASE_GEO_COMMUNE = `${BASE_GEO}commune/`;
export const GEO_COMMUNE_LIST_ENDPOINT = `${BASE_GEO_COMMUNE}`;
export const GEO_COMMUNE_POST_ENDPOINT = `${BASE_GEO_COMMUNE}`;
export const getGeoCommuneDetailEndpoint = (uuid: string) => `${GEO_COMMUNE_POST_ENDPOINT}${uuid}/`;

export const getGeoListEndpoint = (collectivityType: CollectivityType) => {
    if (collectivityType === 'region') {
        return GEO_REGION_LIST_ENDPOINT;
    }

    if (collectivityType === 'department') {
        return GEO_DEPARTMENT_LIST_ENDPOINT;
    }

    if (collectivityType === 'commune') {
        return GEO_COMMUNE_LIST_ENDPOINT;
    }

    throw new Error(`Unknown collectivity type ${collectivityType}`);
};

const BASE_GEO_CUSTOM_ZONE = `${BASE_GEO}custom-zone/`;
export const GEO_CUSTOM_ZONE_LIST_ENDPOINT = `${BASE_GEO_CUSTOM_ZONE}`;
export const GEO_CUSTOM_ZONE_POST_ENDPOINT = `${BASE_GEO_CUSTOM_ZONE}`;
export const getGeoCustomZoneDetailEndpoint = (uuid: string) => `${GEO_CUSTOM_ZONE_POST_ENDPOINT}${uuid}/`;

export const getGeoPostEndpoint = (collectivityType: CollectivityType) => {
    if (collectivityType === 'region') {
        return GEO_REGION_POST_ENDPOINT;
    }

    if (collectivityType === 'department') {
        return GEO_DEPARTMENT_POST_ENDPOINT;
    }

    if (collectivityType === 'commune') {
        return GEO_COMMUNE_POST_ENDPOINT;
    }

    throw new Error(`Unknown collectivity type ${collectivityType}`);
};

export const getGeoDetailEndpoint = (collectivityType: CollectivityType, uuid: string) => {
    if (collectivityType === 'region') {
        return getGeoRegionDetailEndpoint(uuid);
    }

    if (collectivityType === 'department') {
        return getGeoDepartmentDetailEndpoint(uuid);
    }

    if (collectivityType === 'commune') {
        return getGeoCommuneDetailEndpoint(uuid);
    }

    throw new Error(`Unknown collectivity type ${collectivityType}`);
};

const BASE_OBJECT_TYPE = `${BASE_API}object-type/`;
export const OBJECT_TYPE_LIST_ENDPOINT = `${BASE_OBJECT_TYPE}`;
export const OBJECT_TYPE_POST_ENDPOINT = `${BASE_OBJECT_TYPE}`;
export const getObjectTypeDetailEndpoint = (uuid: string) => `${OBJECT_TYPE_LIST_ENDPOINT}${uuid}/`;

const BASE_OBJECT_TYPE_CATEGORY = `${BASE_API}object-type-category/`;
export const OBJECT_TYPE_CATEGORY_LIST_ENDPOINT = `${BASE_OBJECT_TYPE_CATEGORY}`;
export const OBJECT_TYPE_CATEGORY_POST_ENDPOINT = `${BASE_OBJECT_TYPE_CATEGORY}`;
export const getObjectTypeCategoryDetailEndpoint = (uuid: string) => `${OBJECT_TYPE_CATEGORY_LIST_ENDPOINT}${uuid}/`;

const BASE_TILE_SET = `${BASE_API}tile-set/`;
export const TILE_SET_LIST_ENDPOINT = `${BASE_TILE_SET}`;
export const TILE_SET_POST_ENDPOINT = `${BASE_TILE_SET}`;
export const getTileSetDetailEndpoint = (uuid: string) => `${BASE_TILE_SET}${uuid}/`;

export const MAP_SETTINGS_ENDPOINT = `${BASE_API}map-settings/`;

const BASE_DETECTION = `${BASE_API}detection/`;
export const DETECTION_POST_ENDPOINT = `${BASE_DETECTION}`;
export const getDetectionListEndpoint = (detail: boolean = false) => {
    const searchParams = new URLSearchParams();

    if (detail) {
        searchParams.set('detail', 'true');
    }

    return `${BASE_DETECTION}?${searchParams.toString()}`;
};
export const getDetectionDetailEndpoint = (uuid: string) => `${BASE_DETECTION}${uuid}/`;
