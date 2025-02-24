import CONFIG from "../config.js";
import TokenService from "./tokenService.js";

export default class AuthService {
  static async login(payload) {
    try {
      const response = await fetch(
        `${CONFIG.API_URL}${CONFIG.ENDPOINTS.LOGIN}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            email: payload.email,
            password: payload.password,
            device_info: payload.deviceInfo,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Login failed");
      }

      const data = await response.json();

      if (data.success) {
        console.log("Unexpected error!");
      }

      console.log(data);
      if (data.data.token) {
        TokenService.setToken(data.data.token);
        return data.success;
      }

      return false;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  }

  static logout() {
    localStorage.removeItem("auth_token");
    window.location.href = "/login.html";
  }
}
