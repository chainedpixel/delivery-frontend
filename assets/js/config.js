const CONFIG = {
  API_URL: "http://localhost:7319",
  ENDPOINTS: {
    LOGIN: "/api/v1/auth/login",
    LOGUOT: "/api/v1/auth/logout",
    PROFILE: "/api/v1/users/profile",
    PEDIDO: "/api/v1/orders",
    USUARIO: "/api/v1/users",
    ROLES_USUARIO: "/api/v1/users/roles",
    ROLES: "/api/v1/roles",
    SESIONES: "/api/v1/users/sessions",
    LOCATION:{
      UPDATE:"/api/v1/tracking/location/"
    },
    BRANCH: {
      BASE: "/api/v1/branches",
      DEACTIVATE: "/api/v1/branches/deactivate",
      REACTIVATE: "/api/v1/branches/reactivate",
      METRICS: "/api/v1/branches/metrics",
      AVAILABLE_ZONES: "/api/v1/branches/available-zones",
      ASSIGN_ZONE: "/api/v1/branches/zones"
    },
    PARTNERS: {
      // Companies endpoints (aligned with Swagger)
      BASE: "/api/v1/companies",
      GET_BY_ID: "/api/v1/companies", // Para concatenar ID: `${GET_BY_ID}/${id}`
      DEACTIVATE: "/api/v1/companies/deactivate",
      REACTIVATE: "/api/v1/companies/reactivate",
      METRICS: "/api/v1/companies/metrics",
      PROFILE: "/api/v1/companies/profile",

      // Addresses endpoints
      ADDRESSES: {
        BASE: "/api/v1/companies/addresses",
        BY_ID: "/api/v1/companies/addresses"
      },
      BRANCHES: {
        BASE: "/api/v1/companies/branches",
        BY_COMPANY_ID: "/api/v1/companies",
        ASSIGN: "/api/v1/companies/branches/assign",
        UNASSIGN: "/api/v1/companies/branches/unassign"
      },

      // Available branches
      AVAILABLE_BRANCHES: {
        BASE: "/api/v1/companies/available-branches",
        BY_COMPANY_ID: "/api/v1/companies"
      },
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
