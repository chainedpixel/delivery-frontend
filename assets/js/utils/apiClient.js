import TokenService from "../auth/tokenService.js";
import CONFIG from "../config.js";

export default class ApiClient {
  static async request(endpoint, options = {}) {
    const token = TokenService.getToken();

    // Si la solicitud requiere autenticación pero no hay token, redirigir al login
    if (endpoint !== CONFIG.ENDPOINTS.LOGIN && !token) {
      window.location.href = "../login";
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
      console.log(`Realizando petición a: ${CONFIG.API_URL}${endpoint}`, config);

      const response = await fetch(`${CONFIG.API_URL}${endpoint}`, config);

      console.log(`Respuesta recibida de ${endpoint}:`, response.status);

      if (response.status === 401) {
        console.error("Error de autenticación: Token inválido o expirado");
        TokenService.removeToken();
        window.location.href = "../login";
        throw new Error("401: Unauthorized - Authentication required");
      }

      if (!response.ok) {
        console.error(`Error en petición: ${response.status}`);
        const errorData = await response.json().catch(() => ({}));
        console.error('Detalles del error:', errorData);
        throw new Error(`HTTP error! status: ${response.status}${errorData.error ? `: ${errorData.error.message || 'Error desconocido'}` : ''}`);
      }

      const data = await response.json();
      console.log(`Datos recibidos de ${endpoint}:`, data);

      // Verificar si la respuesta indica un problema de autenticación
      if (data && data.status === "error" && data.message &&
          (data.message.includes("token") || data.message.includes("auth"))) {
        TokenService.removeToken();
        window.location.href = "../login";
        throw new Error("Authentication error from API");
      }

      return data;
    } catch (error) {
      console.error("API request failed:", error);
      throw error;
    }
  }
}
