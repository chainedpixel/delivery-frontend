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
  },
  MAPBOX:{
    token: "pk.eyJ1IjoiZXJpa2EtY2hhdmV6IiwiYSI6ImNtN3R1eXZxdjEwYjgybm9pbG0zMmMwdjkifQ.sbLOn7V51w73DL4agaV2KQ",
    mapZoom: 12,
    mapZoomCloser: 18,
    mapInitialCoords: [ -89.190918,13.698971],
    mapRadiusMultiplier:1000,
    mapZoomMultiplePoint:7,
  }
};

export default CONFIG;
