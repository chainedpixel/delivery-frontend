import TokenService from "../auth/tokenService.js";
import CONFIG from "../config.js";

export default class ApiClient {
  static async request(endpoint, options = {}) {
    const token = TokenService.getToken();

    // Si la solicitud requiere autenticación pero no hay token, redirigir al login
    if (endpoint !== CONFIG.ENDPOINTS.LOGIN && !token) {
      window.location.href = "/login.html";
      throw new Error("No authentication token available");
    }

    const defaultHeaders = {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    };

    const config = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(`${CONFIG.API_URL}${endpoint}`, config);

      if (response.status === 401) {
        console.error("Error de autenticación: Token inválido o expirado");
        TokenService.removeToken();
        window.location.href = "/login.html";
        throw new Error("401: Unauthorized - Authentication required");
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Verificar si la respuesta indica un problema de autenticación
      if (data && data.status === "error" && data.message &&
          (data.message.includes("token") || data.message.includes("auth"))) {
        TokenService.removeToken();
        window.location.href = "/login.html";
        throw new Error("Authentication error from API");
      }

      return data;
    } catch (error) {
      console.error("API request failed:", error);
      throw error;
    }
  }
}
