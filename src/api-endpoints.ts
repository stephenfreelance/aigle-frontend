const BASE_AUTH = '/auth/';
export const AUTH_REGISTER_ENDPOINT = `${BASE_AUTH}users/`;
export const AUTH_LOGIN_ENDPOINT = `${BASE_AUTH}jwt/create/`;
export const AUTH_REFRESH_TOKEN_ENDPOINT = `${BASE_AUTH}jwt/refresh/`;
export const AUTH_ME_ENDPOINT = `${BASE_AUTH}users/me/`;

const BASE_API = '/api/';

const BASE_USERS = `${BASE_API}users/`;
export const USERS_LIST = `${BASE_USERS}`;


const BASE_GEO =  `${BASE_API}geo/`;

const BASE_GEO_REGION = `${BASE_GEO}region/`;
export const GEO_REGION_LIST = `${BASE_GEO_REGION}`;

const BASE_GEO_DEPARTMENT = `${BASE_GEO}department/`;
export const GEO_DEPARTMENT_LIST = `${BASE_GEO_DEPARTMENT}`;

const BASE_GEO_COMMUNE = `${BASE_GEO}commune/`;
export const GEO_COMMUNE_LIST = `${BASE_GEO_COMMUNE}`;


const BASE_OBJECT_TYPE = `${BASE_API}object-type/`;
export const OBJECT_TYPE_LIST = `${BASE_OBJECT_TYPE}`;
export const OBJECT_TYPE_POST = `${BASE_OBJECT_TYPE}`;

