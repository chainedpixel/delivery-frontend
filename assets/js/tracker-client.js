class OrderTracker {
    constructor(token, orderID) {
        this.token = token;
        this.orderID = orderID;
        this.socket = null;
        this.connected = false;
        this.onOrderUpdate = null;
        this.onLocationUpdate = null;
        this.onError = null;
        this.onOpen = null;
        this.onClose = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectTimeout = null;
        this.timeout = null;
    }

    /**
     * Conectar al servidor WebSocket
     */
    connect() {
        if (this.socket) {
            this.socket.close();
        }

        const socketUrl = `${this.getWebSocketUrl()}/api/v1/tracking/ws?token=${encodeURIComponent(this.token)}`;
        console.log("Connecting to WebSocket URL:", socketUrl);
        this.socket = new WebSocket(socketUrl);

        this.socket.onopen = this.handleOpen.bind(this);
        this.socket.onmessage = this.handleMessage.bind(this);
        this.socket.onclose = this.handleClose.bind(this);
        this.socket.onerror = this.handleError.bind(this);
    }

    /**
     * Determinar la URL correcta para WebSocket en entorno local HTTP
     */
    getWebSocketUrl() {
        return 'ws://localhost:7319';
    }

    /**
     * Manejar la apertura de la conexión
     */
    handleOpen(event) {
        console.log("WebSocket connection established successfully!");
        this.connected = true;
        this.reconnectAttempts = 0;

        this.subscribeToOrder(this.orderID);

        if (this.onOpen) {
            this.onOpen(event);
        }
    }

    /**
     * Manejar mensajes recibidos
     */
    handleMessage(event) {
        try {
            console.log("WebSocket message received:", event.data);
            const message = JSON.parse(event.data);

            switch (message.type) {
                case 'ORDER_UPDATE':
                    if (this.onOrderUpdate) {
                        this.onOrderUpdate(message.data);
                    }z
                    break;
                case 'LOCATION':
                    if (this.onLocationUpdate) {
                        this.onLocationUpdate(message.data);
                    }
                    break;
                case 'ERROR':
                    if (this.onError) {
                        this.onError(message.data);
                    }
                    break;
                default:
                    console.log("Unknown message type:", message.type);
            }
        } catch (error) {
            console.error('Error parsing WebSocket message:', error);
        }
    }

    /**
     * Manejar cierre de conexión
     */
    handleClose(event) {
        this.connected = false;
        console.log("WebSocket connection closed:", event.code, event.reason);

        if (this.onClose) {
            this.onClose(event);
        }

        if (event.code !== 1000) {
            this.tryReconnect();
        }
    }

    /**
     * Manejar errores de conexión
     */
    handleError(error) {
        console.error("WebSocket connection error:", error);

        if (this.onError) {
            this.onError({
                code: 'CONNECTION_ERROR',
                message: 'Error en la conexión WebSocket',
                details: error.toString()
            });
        }
    }

    /**
     * Intentar reconexión con backoff exponencial
     */
    tryReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            if (this.onError) {
                this.onError({
                    code: 'RECONNECT_FAILED',
                    message: 'No se pudo reconectar después de varios intentos'
                });
            }
            return;
        }

        this.reconnectAttempts++;
        const delay = Math.min(30000, 1000 * Math.pow(2, this.reconnectAttempts));

        console.log(`Attempting to reconnect in ${delay/1000} seconds (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);

        this.reconnectTimeout = setTimeout(() => {
            if (this.onError) {
                this.onError({
                    code: 'RECONNECTING',
                    message: `Intentando reconectar (intento ${this.reconnectAttempts})`
                });
            }
            this.connect();
        }, delay);
    }

    /**
     * Suscribirse a actualizaciones de un pedido
     */
    subscribeToOrder(orderID) {
        if (!this.connected) {
            console.warn("Cannot subscribe: WebSocket not connected");
            return false;
        }

        this.orderID = orderID;
        const subscribeMessage = {
            type: 'SUBSCRIBE',
            order_id: orderID,
            timestamp: new Date()
        };

        console.log("Subscribing to order:", orderID);
        this.socket.send(JSON.stringify(subscribeMessage));

        return true;
    }

    /**
     * Cancelar suscripción a un pedido
     */
    unsubscribeFromOrder(orderID) {
        if (!this.connected) {
            console.warn("Cannot unsubscribe: WebSocket not connected");
            return false;
        }

        const idToUnsubscribe = orderID || this.orderID;
        const unsubscribeMessage = {
            type: 'UNSUBSCRIBE',
            order_id: idToUnsubscribe,
            timestamp: new Date()
        };

        console.log("Unsubscribing from order:", idToUnsubscribe);
        this.socket.send(JSON.stringify(unsubscribeMessage));

        return true;
    }

    /**
     * Cerrar la conexión WebSocket
     */
    disconnect() {
        console.log("Disconnecting WebSocket...");

        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }

        if (this.socket) {
            this.socket.close(1000, 'Desconexión normal');
            this.socket = null;
        }

        this.connected = false;
    }
}

function initializeTracker(token, orderID) {
    console.log("Initializing order tracker for order:", orderID);
    const tracker = new OrderTracker(token, orderID);

    tracker.onOpen = () => {
        console.log('Conexión WebSocket establecida');
        updateStatus('Conectado');
    };

    tracker.onClose = () => {
        console.log('Conexión WebSocket cerrada');
        updateStatus('Desconectado');
    };

    tracker.onError = (error) => {
        console.error('Error en WebSocket:', error);
        updateStatus(`Error: ${error.message}`);
    };

    tracker.onOrderUpdate = (data) => {
        console.log('Actualización de pedido recibida:', data);

      

        updateOrderInfo(data);
    };

    tracker.onLocationUpdate = (data) => {
       clearTimeout(tracker.timeout);
        tracker.timeout = setTimeout(() => {
             updateOrderInfo({
                status: 'DELIVERED',
                description: 'Tu pedido ha sido entregado correctamente',
                order: {
                    progress: 100,
                    estimated_time: 0
                }
            });
        },5000);
         updateOrderInfo({
                status: 'IN_TRANSIT',
                description: 'Tu pedido ha sido entregado correctamente',
                order: {
                    progress: 75,
                    estimated_time: 0
                }
            });
        console.log('Actualización de ubicación recibida:', data);
        updateDriverLocation(data);
    };

    tracker.connect();

    return tracker;
}

function updateStatus(status) {
    const statusElement = document.getElementById('connection-status');
    if (statusElement) {
        statusElement.textContent = status;

        statusElement.className = 'status-badge';
        if (status === 'Conectado') {
            statusElement.classList.add('status-connected');
        } else if (status === 'Desconectado') {
            statusElement.classList.add('status-disconnected');
        } else if (status.includes('Error')) {
            statusElement.classList.add('status-disconnected');
        } else if (status.includes('Reconectando')) {
            statusElement.classList.add('status-reconnecting');
        }
    }
}

function updateOrderInfo(data) {
    const statusElement = document.getElementById('order-status');
    const descriptionElement = document.getElementById('status-description');
    const progressElement = document.getElementById('order-progress');

    if (statusElement) {
        statusElement.textContent = data.status;
    }

    if (descriptionElement) {
        descriptionElement.textContent = data.description;
    }

    if (progressElement && data.order && data.order.progress) {
        progressElement.style.width = `${data.order.progress}%`;
    }

    if (data.status) {
        updateStatusSteps(data.status);
    }
}

function updateDriverLocation(data) {
    const locationElement = document.getElementById('driver-location');
    if (locationElement) {
        locationElement.textContent = `Lat: ${data.latitude.toFixed(6)}, Lng: ${data.longitude.toFixed(6)}`;
    }

    if (window.map && window.driverMarker) {
        window.driverMarker.setLngLat([data.longitude, data.latitude]);
        try {
            
         window.map.PanTo({
    center: [data.longitude, data.latitude],
    duration: 1000
  });
        } catch (error) {

        }
    }
}

function updateStatusSteps(status) {
    const statusSteps = document.querySelectorAll('.status-step');
    if (!statusSteps.length) return;

    const steps = ['PENDING', 'ACCEPTED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED'];
    const currentIndex = steps.indexOf(status);

    if (currentIndex >= 0) {
        statusSteps.forEach((step, index) => {
            if (index <= currentIndex) {
                step.classList.add('active');
            } else {
                step.classList.remove('active');
            }
        });
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { OrderTracker };
}