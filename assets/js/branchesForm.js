import Config from "./config.js";
//import Apiclient from "./utils/apiclient.js";


// mapa para selección de ubicación
let locationMap;

// inicializar el mapa de selección de ubicación
function initLocationMap(initialCoords = null) {
    mapboxgl.accessToken = Config.MAPBOX.token;
    locationMap = new mapboxgl.Map({
        container: 'locationMap',
        style: 'mapbox://styles/mapbox/streets-v12',
        center: initialCoords || Config.MAPBOX.mapInitialCoords,
        zoom: Config.MAPBOX.mapZoom
    });

    // añadir control de navegación
    locationMap.addControl(new mapboxgl.NavigationControl());

    // manejar clics en el mapa para seleccionar ubicación
    locationMap.on('click', (e) => {
        document.getElementById('latitude').value = e.lngLat.lat.toFixed(6);
        document.getElementById('longitude').value = e.lngLat.lng.toFixed(6);
        
        // mover el marcador o crear uno nuevo
        if (window.locationMarker) {
            window.locationMarker.setLngLat(e.lngLat);
        } else {
            window.locationMarker = new mapboxgl.Marker({ draggable: true })
                .setLngLat(e.lngLat)
                .addTo(locationMap);
            
            window.locationMarker.on('dragend', () => {
                const lngLat = window.locationMarker.getLngLat();
                document.getElementById('latitude').value = lngLat.lat.toFixed(6);
                document.getElementById('longitude').value = lngLat.lng.toFixed(6);
            });
        }
    });

    // si hay coordenadas iniciales, colocar marcador
    if (initialCoords) {
        window.locationMarker = new mapboxgl.Marker({ draggable: true })
            .setLngLat(initialCoords)
            .addTo(locationMap);
        
        window.locationMarker.on('dragend', () => {
            const lngLat = window.locationMarker.getLngLat();
            document.getElementById('latitude').value = lngLat.lat.toFixed(6);
            document.getElementById('longitude').value = lngLat.lng.toFixed(6);
        });
    }
}

// funciones para manejar el wizard del formulario
function showStep(step) {
    document.querySelectorAll('.step-content').forEach(content => {
        content.classList.remove('active');
    });
    document.querySelector(`.step-content[data-step="${step}"]`).classList.add('active');
    
    document.querySelectorAll('.step-item').forEach(item => {
        item.classList.remove('active');
        if (parseInt(item.getAttribute('data-step')) < step) {
            item.classList.add('completed');
        } else if (parseInt(item.getAttribute('data-step')) === step) {
            item.classList.add('active');
        } else {
            item.classList.remove('completed');
        }
    });

    // mostrar/ocultar botones según el paso
    const prevBtn = document.querySelector('.prev-step');
    const nextBtn = document.querySelector('.next-step');
    const submitBtn = document.getElementById('submitBranchBtn');

    if (step === 1) {
        prevBtn.classList.add('hidden');
        nextBtn.classList.remove('hidden');
        submitBtn.classList.add('hidden');
    } else if (step === 3) {
        prevBtn.classList.remove('hidden');
        nextBtn.classList.add('hidden');
        submitBtn.classList.remove('hidden');
    } else {
        //para recargar el mapa una vez este visible
        setTimeout(() => {
            locationMap.resize();
        }, 100);
        prevBtn.classList.remove('hidden');
        nextBtn.classList.remove('hidden');
        submitBtn.classList.add('hidden');
    }
}

// función para validar el paso actual del formulario
function validateCurrentStep() {
    const currentStep = parseInt(document.querySelector('.step-content.active').getAttribute('data-step'));
    let isValid = true;

    if (currentStep === 1) {
        if (!document.getElementById('branchName').value.trim()) {
            document.getElementById('branchName-error').classList.remove('hidden');
            isValid = false;
        } else {
            document.getElementById('branchName-error').classList.add('hidden');
        }
        
        if (!document.getElementById('branchCode').value.trim()) {
            document.getElementById('branchCode-error').classList.remove('hidden');
            isValid = false;
        } else {
            document.getElementById('branchCode-error').classList.add('hidden');
        }
        
        if (!document.getElementById('contactName').value.trim()) {
            document.getElementById('contactName-error').classList.remove('hidden');
            isValid = false;
        } else {
            document.getElementById('contactName-error').classList.add('hidden');
        }
        
        if (!document.getElementById('contactPhone').value.trim()) {
            document.getElementById('contactPhone-error').classList.remove('hidden');
            isValid = false;
        } else {
            document.getElementById('contactPhone-error').classList.add('hidden');
        }
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(document.getElementById('contactEmail').value)) {
            document.getElementById('contactEmail-error').classList.remove('hidden');
            isValid = false;
        } else {
            document.getElementById('contactEmail-error').classList.add('hidden');
        }
    } else if (currentStep === 2) {
        if (!document.getElementById('addressLine1').value.trim()) {
            document.getElementById('addressLine1-error').classList.remove('hidden');
            isValid = false;
        } else {
            document.getElementById('addressLine1-error').classList.add('hidden');
        }
        
        if (!document.getElementById('city').value.trim()) {
            document.getElementById('city-error').classList.remove('hidden');
            isValid = false;
        } else {
            document.getElementById('city-error').classList.add('hidden');
        }
        
        if (!document.getElementById('state').value.trim()) {
            document.getElementById('state-error').classList.remove('hidden');
            isValid = false;
        } else {
            document.getElementById('state-error').classList.add('hidden');
        }
        
        if (!document.getElementById('postalCode').value.trim()) {
            document.getElementById('postalCode-error').classList.remove('hidden');
            isValid = false;
        } else {
            document.getElementById('postalCode-error').classList.add('hidden');
        }
        
        if (!document.getElementById('zoneSelector').value) {
            document.getElementById('zoneSelector-error').classList.remove('hidden');
            isValid = false;
        } else {
            document.getElementById('zoneSelector-error').classList.add('hidden');
        }
        
        if (!document.getElementById('latitude').value || !document.getElementById('longitude').value) {
            alert('Por favor seleccione una ubicación en el mapa');
            isValid = false;
        }
    } else if (currentStep === 3) {
        if (!document.getElementById('weekdaysStart').value) {
            document.getElementById('weekdaysStart-error').classList.remove('hidden');
            isValid = false;
        } else {
            document.getElementById('weekdaysStart-error').classList.add('hidden');
        }
        
        if (!document.getElementById('weekdaysEnd').value) {
            document.getElementById('weekdaysEnd-error').classList.remove('hidden');
            isValid = false;
        } else {
            document.getElementById('weekdaysEnd-error').classList.add('hidden');
        }
        
        if (!document.getElementById('weekendsStart').value) {
            document.getElementById('weekendsStart-error').classList.remove('hidden');
            isValid = false;
        } else {
            document.getElementById('weekendsStart-error').classList.add('hidden');
        }
        
        if (!document.getElementById('weekendsEnd').value) {
            document.getElementById('weekendsEnd-error').classList.remove('hidden');
            isValid = false;
        } else {
            document.getElementById('weekendsEnd-error').classList.add('hidden');
        }
    }
    
    return isValid;
}

// event listeners
document.addEventListener('DOMContentLoaded', () => {
    // verificar si estamos editando una sucursal
   
    
        initLocationMap();
 
    
    // manejar navegación entre pasos
    document.querySelector('.next-step').addEventListener('click', () => {
        if (validateCurrentStep()) {
            const currentStep = parseInt(document.querySelector('.step-content.active').getAttribute('data-step'));
            showStep(currentStep + 1);
        }
    });
    
    document.querySelector('.prev-step').addEventListener('click', () => {
        const currentStep = parseInt(document.querySelector('.step-content.active').getAttribute('data-step'));
        showStep(currentStep - 1);
    });
    
    // manejar envío del formulario
    document.getElementById('branchForm').addEventListener('submit', (e) => {
        e.preventDefault();
        
        if (validateCurrentStep()) {
            const formData = {
                name: document.getElementById('branchName').value,
                code: document.getElementById('branchCode').value,
                contact_name: document.getElementById('contactName').value,
                contact_phone: document.getElementById('contactPhone').value,
                contact_email: document.getElementById('contactEmail').value,
                address: {
                    address_line1: document.getElementById('addressLine1').value,
                    address_line2: document.getElementById('addressLine2').value,
                    city: document.getElementById('city').value,
                    state: document.getElementById('state').value,
                    postal_code: document.getElementById('postalCode').value,
                    latitude: parseFloat(document.getElementById('latitude').value),
                    longitude: parseFloat(document.getElementById('longitude').value),
                    is_main: document.getElementById('isMainBranch').checked
                },
                operating_hours: {
                    weekdays: {
                        start: document.getElementById('weekdaysStart').value,
                        end: document.getElementById('weekdaysEnd').value
                    },
                    weekends: {
                        start: document.getElementById('weekendsStart').value,
                        end: document.getElementById('weekendsEnd').value
                    }
                },
                zone_id: document.getElementById('zoneSelector').value
            };
            
            // aquí iría la llamada a la api para guardar los datos
            console.log('Datos a enviar:', formData);
            alert('Sucursal guardada exitosamente');
            window.location.href = 'index.html';
        }
    });
});