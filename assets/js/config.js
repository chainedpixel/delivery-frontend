const CONFIG = {
  API_URL: "http://localhost:7319",
  ENDPOINTS: {
    LOGIN: "/api/v1/auth/login",
    LOGOUT: "/api/v1/auth/logout",
    PROFILE: "/api/v1/users/profile",
    ORDERS: "/api/v1/orders", 
    USUARIO: "/api/v1/users",
    ROLES_USUARIO: "/api/v1/users/roles",
    ROLES: "/api/v1/roles",
    SESIONES: "/api/v1/users/sessions",
    ZONES: "/api/v1/zones",
    COMPANIES: "/api/v1/companies",
    DASHBOARD: "/api/v1/dashboard",

    // Definición completa de BRANCH y todos sus sub-endpoints
    BRANCH: {
      BASE: "/api/v1/branches",
      DEACTIVATE: "/api/v1/branches/deactivate",
      REACTIVATE: "/api/v1/branches/reactivate",
      METRICS: "/api/v1/branches/metrics",
      AVAILABLE_ZONES: "/api/v1/branches/available-zones",
      ASSIGN_ZONE: "/api/v1/branches/zones"
    }
  },

  MAPBOX: {
    token: "pk.eyJ1IjoiZXJpa2EtY2hhdmV6IiwiYSI6ImNtN3R1eXZxdjEwYjgybm9pbG0zMmMwdjkifQ.sbLOn7V51w73DL4agaV2KQ",
    mapZoom: 12,
    mapZoomCloser: 18,
    mapInitialCoords: [-89.190918, 13.698971],
    mapRadiusMultiplier: 1000,
    mapZoomMultiplePoint: 7,
  },

  PAGINATION: {
    DEFAULT_PAGE_SIZE: 10,
    DEFAULT_PAGE: 1
  }
};

export default CONFIG;
