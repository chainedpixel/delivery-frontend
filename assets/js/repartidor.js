










//js que rodrigo puso en la vista HTML lo movi a un archivio js

import Config from "./config.js";
import ApiClient from "./utils/apiClient.js";
import TokenService from "./auth/tokenService.js";
let driverMarker;
    let pickupMarker;
    let deliveryMarker;
    let routeSource;
    let tracker;

var orderData;
var mockUbicaciones ={
    '7936d430-f976-4b42-8769-e7987f2dae11':{a:[-89.203204,13.709037],b:[-88.863230,13.814779]},
    'fcc02812-4cbe-4ad5-ba57-ce55641a3dc2':{a:[-88.850701,13.842508],b:[-88.936570,13.714425]},


}
var timeoutPedido;
var pedidosvehiculo = document.getElementById('pedidos-vehiculo');
var coordenadas_al_destino_interval;
var arrancar = document.getElementById('arrancar');
var detenerse = document.getElementById('detenerse');
var  coordenadas_al_destino_indice = 0;

mapboxgl.accessToken = Config.MAPBOX.token;

document.addEventListener('DOMContentLoaded', async function () {
    detenerse.addEventListener('click', function () {
        clearTimeout(timeoutPedido);
        clearInterval(coordenadas_al_destino_interval);
       
    })
    arrancar.addEventListener('click', function () {
        initTracker();
    })
pedidosvehiculo.addEventListener('change', async function () {
coordenadas_al_destino_indice=0
    const pedidoId = pedidosvehiculo.value;

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
  
        orderData.estimated_time = Math.floor(Math.random() * (60 - 10 + 1)) + 10;
        console.log(orderData)
    } 
  
})


    const pedidoId = pedidosvehiculo.value;


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
   
        orderData.estimated_time = Math.floor(Math.random() * (60 - 10 + 1)) + 10;
        console.log(orderData)
    } 
 
});




function initTracker() {
    const token = TokenService.getToken();


    //mock data INICO
       orderData.pickup_address.longitude =  mockUbicaciones[orderData.id].a[0]
       orderData.pickup_address.latitude = mockUbicaciones[orderData.id].a[1];
    
        orderData.delivery_address.longitude =mockUbicaciones[orderData.id].b[0]
        orderData.delivery_address.latitude = mockUbicaciones[orderData.id].b[1]
      //mock data FIN
      
      
 


        const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${[orderData.pickup_address.longitude, orderData.pickup_address.latitude].join(',')};${[orderData.delivery_address.longitude, orderData.delivery_address.latitude].join(',')}?geometries=geojson&access_token=${Config.MAPBOX.token}`;
    
 

        fetch(url)
            .then(response => response.json())
            .then(data => {
                const coordenadas_al_destino = data.routes[0].geometry.coordinates;
                console.log(coordenadas_al_destino)
                if(coordenadas_al_destino_indice >= coordenadas_al_destino.length){
                    coordenadas_al_destino_indice=0
                }
                coordenadas_al_destino_interval = setInterval(() => {
                    timeoutPedido = setTimeout( () => {
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
                         ApiClient.request(`${Config.ENDPOINTS.LOCATION.UPDATE}${orderData.id}`, {
                            method: "POST",
                            body: JSON.stringify(datos),
                        })

                        console.log(coordenadas_al_destino_indice);

                    }, Math.floor(Math.random() * (5000 - 1500 + 1) + 1500));
                }, 1000);
            })
            .catch(error => console.error('Error al obtener la ruta:', error));
           
  



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