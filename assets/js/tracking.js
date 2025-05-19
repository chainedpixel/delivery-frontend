










//js que rodrigo puso en la vista HTML lo movi a un archivio js

import Config from "./config.js";
import ApiClient from "./utils/apiClient.js";
import TokenService from "./auth/tokenService.js";

var orderData;
mapboxgl.accessToken = Config.MAPBOX.token;

document.addEventListener('DOMContentLoaded', async function () {
    const urlParams = new URLSearchParams(window.location.search);
    const pedidoId = urlParams.get('id');
    if (pedidoId) {

        orderData = await ApiClient.request(`${Config.ENDPOINTS.PEDIDO}/${pedidoId}`, {
            method: "GET",
        });
        orderData = orderData.data;

        orderData.current_location = {
            lat: 13.6772,
            lng: -89.2650
        }
        orderData.driver = {
            name: "Juan Pérez",
            rating: 4.5,
            vehicle: "Motocicleta",
            license_plate: "XYZ123"
        },
        orderData.progress = progreso_del_pediddo();
        orderData.estimated_time = Math.floor(Math.random() * (60 - 10 + 1)) + 10;
        console.log(orderData)
    } else {
        window.location.href = '../../pages/details';
    }
    initMap();
});

function initMap() {
    window.map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [orderData.current_location.lng, orderData.current_location.lat],
        zoom: 13
    });

    window.map.on('load', function () {

        initTracker();
    });
}
function progreso_del_pediddo() {
    return { "pending": 10, 'delivered': 100 }[orderData.status.toLowerCase().trim()];
}
function createMarkers() {
    let driverEl = document.createElement('div');
    driverEl.className = 'marker marker-driver';

    let pickupEl = document.createElement('div');
    pickupEl.className = 'marker marker-pickup';

    let deliveryEl = document.createElement('div');
    deliveryEl.className = 'marker marker-delivery';

    window.driverMarker = new mapboxgl.Marker(driverEl)
        .setLngLat([orderData.current_location.lng, orderData.current_location.lat])
        .addTo(window.map);

    window.pickupMarker = new mapboxgl.Marker(pickupEl)
        .setLngLat([orderData.pickup_address.longitude, orderData.pickup_address.latitude])
        .setPopup(new mapboxgl.Popup().setText('Punto de Recogida'))
        .addTo(window.map);

    window.deliveryMarker = new mapboxgl.Marker(deliveryEl)
        .setLngLat([orderData.delivery_address.longitude, orderData.delivery_address.latitude])
        .setPopup(new mapboxgl.Popup().setText('Punto de Entrega'))
        .addTo(window.map);
}

function addRoute() {
    if (window.map.getSource('route')) {
        return;
    }

    getRoute(
        [orderData.pickup_address.longitude, orderData.pickup_address.latitude],
        [orderData.delivery_address.longitude, orderData.delivery_address.latitude]
    );
}

async function getRoute(start, end) {
    const query = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${start[0]},${start[1]};${end[0]},${end[1]}?steps=true&geometries=geojson&access_token=${mapboxgl.accessToken}`,
        { method: 'GET' }
    );

    const json = await query.json();
    const data = json.routes[0];
    const route = data.geometry.coordinates;

    window.map.addSource('route', {
        type: 'geojson',
        data: {
            type: 'Feature',
            properties: {},
            geometry: {
                type: 'LineString',
                coordinates: route
            }
        }
    });

    window.map.addLayer({
        id: 'route',
        type: 'line',
        source: 'route',
        layout: {
            'line-join': 'round',
            'line-cap': 'round'
        },
        paint: {
            'line-color': '#4CAF50',
            'line-width': 5,
            'line-opacity': 0.8
        }
    });

    const bounds = new mapboxgl.LngLatBounds()
        .extend(start)
        .extend(end);

    window.map.fitBounds(bounds, {
        padding: 60
    });
}


function initTracker() {
    const token = TokenService.getToken();

    obtenerRutasEnElSalvador().then(ruta => {
        if (ruta) {
            console.log(`Ruta desde ${ruta.desde} hasta ${ruta.hasta}`);
            console.log('Coordenadas:', ruta.coordenadas);
        }
      /* orderData.pickup_address.longitude = ruta.coordenadas[0][0];
        orderData.pickup_address.latitude = ruta.coordenadas[0][1];
        orderData.delivery_address.longitude = ruta.coordenadas[ruta.coordenadas.length - 1][0];
        orderData.delivery_address.latitude = ruta.coordenadas[ruta.coordenadas.length - 1][1];
        */
        createMarkers();
        addRoute();
        addSimulationControl();
        const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${[orderData.pickup_address.longitude, orderData.pickup_address.latitude].join(',')};${[orderData.delivery_address.longitude, orderData.delivery_address.latitude].join(',')}?geometries=geojson&access_token=${Config.MAPBOX.token}`;
        tracker = initializeTracker(token, orderData.id);
        loadInitialOrderData();

        fetch(url)
            .then(response => response.json())
            .then(data => {
                const coordenadas_al_destino = data.routes[0].geometry.coordinates;
                console.log(coordenadas_al_destino)
                let coordenadas_al_destino_indice = 0;
                var coordenadas_al_destino_interval = setInterval(() => {
                    setTimeout(async () => {
                        if (coordenadas_al_destino_indice >= coordenadas_al_destino.length) {
                            updateOrderInfo({
                                status: 'DELIVERED',
                                description: 'Tu pedido ha sido entregado correctamente',
                                order: {
                                    progress: 100,
                                    estimated_time: 0
                                }
                            });
                            clearInterval(coordenadas_al_destino_interval);
                            return
                        }
                        let datos = {
                            "latitude": coordenadas_al_destino[coordenadas_al_destino_indice][1],
                            "longitude": coordenadas_al_destino[coordenadas_al_destino_indice][0]
                        }


                        coordenadas_al_destino_indice++;
                        await ApiClient.request(`${Config.ENDPOINTS.LOCATION.UPDATE}${orderData.id}`, {
                            method: "POST",
                            body: JSON.stringify(datos),
                        })

                        console.log(coordenadas_al_destino_indice);

                    }, Math.floor(Math.random() * (5000 - 1500 + 1) + 1500));
                }, 1000);
            })
            .catch(error => console.error('Error al obtener la ruta:', error));
    });



}

async function obtenerRutasEnElSalvador() {

    const lugares = [
        {  coords: [-89.8450, 13.9234] },
        {  coords: [-89.5570, 13.9946] },
        {  coords: [-89.7220, 13.7180] },
        {  coords: [-89.0506, 14.1700] },
        {  coords: [-89.3220, 13.6731] },
        {  coords: [-89.2182, 13.6929] },
        {  coords: [-88.9500, 13.7333] },
        {  coords: [-88.9667, 13.5167] },
        {  coords: [-88.7500, 13.8833] },
        {  coords: [-88.7667, 13.6333] },
        {  coords: [-88.4500, 13.3500] },
        {  coords: [-88.1779, 13.4824] },
        {  coords: [-88.1000, 13.7667] },
        {  coords: [-87.8500, 13.3333] }
    ];

    let puntoA, puntoB;
    do {
        puntoA = lugares[Math.floor(Math.random() * lugares.length)];
        puntoB = lugares[Math.floor(Math.random() * lugares.length)];
    } while (puntoA.coords === puntoB.coords);

    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${puntoA.coords.join(',')};${puntoB.coords.join(',')}?geometries=geojson&access_token=${Config.MAPBOX.token}`;

    try {
        const res = await fetch(url);
        const data = await res.json();

        const coordenadasRuta = data.routes[0]?.geometry?.coordinates;
        if (!coordenadasRuta) throw new Error('No se pudo obtener la ruta');

        return {
            desde: puntoA.nombre,
            hasta: puntoB.nombre,
            coordenadas: coordenadasRuta
        };
    } catch (error) {
        console.error('Error al obtener la ruta:', error);
        return null;
    }
}

function loadInitialOrderData() {
    document.getElementById('tracking-number').textContent = orderData.tracking_number;
    document.getElementById('company-name').textContent = orderData.company_name;
    document.getElementById('estimated-time').textContent = `${orderData.estimated_time || Math.floor(Math.random() * (60 - 10 + 1)) + 10} minutos`;
    document.getElementById('order-status').textContent = orderData.status;
    document.getElementById('order-progress').style.width = `${orderData.progress}%`;
    document.getElementById('driver-name').textContent = orderData.driver.name;
    document.getElementById('vehicle-info').textContent = `${orderData.driver.vehicle} - ${orderData.driver.license_plate}`;
    document.getElementById('pickup-address').textContent = `${orderData.pickup_address.city} - ${orderData.pickup_address.address_line1},${orderData.pickup_address.address_line2}`;
    document.getElementById('delivery-address').textContent = `${orderData.delivery_address.city} - ${orderData.delivery_address.address_line1}, ${orderData.delivery_address.address_line2}`;
    document.getElementById('driver-location').textContent = `Lat: ${orderData.current_location.lat.toFixed(6)}, Lng: ${orderData.current_location.lng.toFixed(6)}`;

    updateStatusSteps(orderData.status);
}

function simulateDriverMovement() {
    let currentLat = orderData.pickup.lat;
    let currentLng = orderData.pickup.lng;
    const targetLat = orderData.delivery.lat;
    const targetLng = orderData.delivery.lng;

    const steps = 100;
    const latIncrement = (targetLat - currentLat) / steps;
    const lngIncrement = (targetLng - currentLng) / steps;
    let step = 0;

    const interval = setInterval(() => {
        if (step >= steps) {
            clearInterval(interval);

            updateOrderInfo({
                status: 'DELIVERED',
                description: 'Tu pedido ha sido entregado correctamente',
                order: {
                    progress: 100,
                    estimated_time: 0
                }
            });
            return;
        }

        currentLat += latIncrement + (Math.random() * 0.0002 - 0.0001);
        currentLng += lngIncrement + (Math.random() * 0.0002 - 0.0001);

        updateDriverLocation({
            latitude: currentLat,
            longitude: currentLng,
            updated_at: new Date()
        });

        if (step === Math.floor(steps / 2) - 1) {
            updateOrderInfo({
                status: 'IN_TRANSIT',
                description: 'Tu pedido está en camino',
                order: {
                    progress: 75,
                    estimated_time: 15
                }
            });
        }

        step++;
    }, 1000);
}

function addSimulationControl() {
    const simulateBtn = document.createElement('button');
    simulateBtn.textContent = 'Simular Entrega';
    simulateBtn.className = 'action-button primary';
    simulateBtn.style.position = 'absolute';
    simulateBtn.style.bottom = '10px';
    simulateBtn.style.right = '10px';
    simulateBtn.style.zIndex = '1';

    simulateBtn.addEventListener('click', () => {
        simulateDriverMovement();
        simulateBtn.disabled = true;
        simulateBtn.textContent = 'Simulación en progreso...';
        simulateBtn.classList.add('disabled');
    });
    document.querySelector('#map').parentNode.appendChild(simulateBtn);
}
