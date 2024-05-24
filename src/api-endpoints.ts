const BASE_URL = import.meta.env.VITE_API_BASE_URL;

const BASE_AUTH = `${BASE_URL}/auth`;
export const AUTH_REGISTER_ENDPOINT = `${BASE_AUTH}/users/`;
export const AUTH_LOGIN_ENDPOINT = `${BASE_AUTH}/jwt/create/`;
export const AUTH_ME_ENDPOINT = `${BASE_AUTH}/users/me/`;
