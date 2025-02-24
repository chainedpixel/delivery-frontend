import CookieManager from "../utils/cookieManager.js";

export default class TokenService {
  static TOKEN_KEY = "auth_token";

  static setToken(token) {
    CookieManager.set(this.TOKEN_KEY, token);
  }

  static getToken() {
    return CookieManager.get(this.TOKEN_KEY);
  }

  static removeToken() {
    CookieManager.delete(this.TOKEN_KEY);
  }

  static isAuthenticated() {
    return !!this.getToken();
  }
}
