const CONFIG = {
  API_URL: "http://localhost:7319/api/v1/",
  ENDPOINTS: {
    LOGIN: "auth/login",
    LOGOUT: "auth/logout",
    PROFILE: "users/profile",
    ORDERS: "orders",
    USUARIO: "users",
    ROLES_USUARIO: "users/roles",
    ROLES: "roles",
    SESIONES: "users/sessions",
    ZONES: "zones",
    COMPANIES: "companies",
    DASHBOARD: "dashboard",

    // Definición completa de BRANCH y todos sus sub-endpoints
    BRANCH: {
      BASE: "branches",
      DEACTIVATE: "branches/deactivate",
      REACTIVATE: "branches/reactivate",
      METRICS: "branches/metrics",
      AVAILABLE_ZONES: "branches/available-zones",
      ASSIGN_ZONE: "branches/zones"
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
