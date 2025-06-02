const CONFIG = {
  API_URL: "http://localhost:7319",
    API_BASE_URL: 'http://localhost:7319/api/v1',
    WS_BASE_URL: 'ws://localhost:7319/api/v1',
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
     DEFAULT_MAP_CENTER: {
        lat: 13.6929,
        lng: -89.2182,
        zoom: 13
    },

    DEFAULT_COORDINATES: {
        pickup: { lat: 13.6762, lng: -89.2874 },
        delivery: { lat: 13.6783, lng: -89.2353 },
        driver: { lat: 13.6772, lng: -89.2650 }
    },

    WEBSOCKET: {
        maxReconnectAttempts: 5,
        reconnectDelay: 1000,
        maxReconnectDelay: 30000
    },
UI: {
        progressMap: {
            'PENDING': 10,
            'ACCEPTED': 25,
            'PICKED_UP': 50,
            'IN_WAREHOUSE': 60,
            'IN_TRANSIT': 75,
            'DELIVERED': 90,
            'COMPLETED': 100,
            'CANCELLED': 0,
            'RETURNED': 0,
            'LOST': 0
        },
        statusDescriptions: {
            'PENDING': 'Tu pedido está pendiente de confirmación',
            'ACCEPTED': 'Tu pedido ha sido aceptado',
            'PICKED_UP': 'El repartidor ha recogido tu pedido',
            'IN_WAREHOUSE': 'Tu pedido está en el almacén',
            'IN_TRANSIT': 'Tu pedido está en camino',
            'DELIVERED': 'Tu pedido ha sido entregado correctamente',
            'COMPLETED': 'Tu pedido ha sido completado',
            'CANCELLED': 'Tu pedido ha sido cancelado',
            'RETURNED': 'Tu pedido ha sido retornado',
            'LOST': 'Tu pedido se ha perdido'
        },
        statusSteps: ['PENDING', 'ACCEPTED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED'],
        allStatuses: ['PENDING', 'ACCEPTED', 'PICKED_UP', 'IN_WAREHOUSE', 'IN_TRANSIT', 'DELIVERED', 'COMPLETED', 'CANCELLED', 'RETURNED', 'LOST'],
        errorMessages: {
            'NETWORK_ERROR': 'Error de conexión. Verifica tu conexión a internet.',
            'ORDER_NOT_FOUND': 'El pedido no fue encontrado.',
            'SIMULATION_ERROR': 'Error en la simulación. Inténtalo nuevamente.',
            'DRIVER_ASSIGNMENT_ERROR': 'No se pudo asignar un conductor. La simulación continuará sin conductor.',
            'STATUS_CHANGE_ERROR': 'Error al cambiar el estado del pedido.',
            'WEBSOCKET_ERROR': 'Error en la conexión en tiempo real.'
        }
    },

  PAGINATION: {
    DEFAULT_PAGE_SIZE: 10,
    DEFAULT_PAGE: 1
  },
  
    ENVIRONMENTS: {
        development: {
            API_BASE_URL: 'http://localhost:7319/api/v1',
            WS_BASE_URL: 'ws://localhost:7319/api/v1',
            DEBUG: true
        }
    }
};

function getEnvironmentConfig(env = 'development') {
    const envConfig = CONFIG.ENVIRONMENTS['development'];
    if (!envConfig) {
        console.warn(`Environment ${env} not found, using development`);
        return { ...CONFIG, ...CONFIG.ENVIRONMENTS.development };
    }
    return { ...CONFIG, ...envConfig };
}

function detectEnvironment() {
    const hostname = window.location.hostname;

    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'development';
    } else if (hostname.includes('staging')) {
        return 'staging';
    } else {
        return 'production';
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CONFIG, getEnvironmentConfig, detectEnvironment };
}

export default CONFIG;