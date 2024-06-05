const BASE_AUTH = '/auth/';
export const AUTH_REGISTER_ENDPOINT = `${BASE_AUTH}users/`;
export const AUTH_LOGIN_ENDPOINT = `${BASE_AUTH}jwt/create/`;
export const AUTH_REFRESH_TOKEN_ENDPOINT = `${BASE_AUTH}jwt/refresh/`;
export const AUTH_ME_ENDPOINT = `${BASE_AUTH}users/me/`;

const BASE_API = '/api/';

const BASE_USERS = `${BASE_API}users/`;
export const USERS_LIST_ENDPOINT = `${BASE_USERS}`;
export const getUserDetailEndpoint = (uuid: string) => `${USERS_LIST_ENDPOINT}${uuid}/`;

const BASE_GEO = `${BASE_API}geo/`;

const BASE_GEO_REGION = `${BASE_GEO}region/`;
export const GEO_REGION_LIST_ENDPOINT = `${BASE_GEO_REGION}`;

const BASE_GEO_DEPARTMENT = `${BASE_GEO}department/`;
export const GEO_DEPARTMENT_LIST_ENDPOINT = `${BASE_GEO_DEPARTMENT}`;

const BASE_GEO_COMMUNE = `${BASE_GEO}commune/`;
export const GEO_COMMUNE_LIST_ENDPOINT = `${BASE_GEO_COMMUNE}`;

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
