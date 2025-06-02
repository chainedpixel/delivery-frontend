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

// función para llenar el formulario con datos existentes
function populateForm(data) {
    document.getElementById('branchId').value = data.id || '';
    document.getElementById('branchName').value = data.name || '';
    document.getElementById('branchCode').value = data.code || '';
    document.getElementById('contactName').value = data.contact_name || '';
    document.getElementById('contactPhone').value = data.contact_phone || '';
    document.getElementById('contactEmail').value = data.contact_email || '';
    document.getElementById('isMainBranch').checked = data.address?.is_main || false;
    
    // dirección
    document.getElementById('addressLine1').value = data.address?.address_line1 || '';
    document.getElementById('addressLine2').value = data.address?.address_line2 || '';
    document.getElementById('city').value = data.address?.city || '';
    document.getElementById('state').value = data.address?.state || '';
    document.getElementById('postalCode').value = data.address?.postal_code || '';
    document.getElementById('latitude').value = data.address?.latitude || '';
    document.getElementById('longitude').value = data.address?.longitude || '';
    document.getElementById('zoneSelector').value = data.zone_id || '';
    
    // horarios
    document.getElementById('weekdaysStart').value = data.operating_hours?.weekdays?.start || '08:00';
    document.getElementById('weekdaysEnd').value = data.operating_hours?.weekdays?.end || '20:00';
    document.getElementById('weekendsStart').value = data.operating_hours?.weekends?.start || '08:00';
    document.getElementById('weekendsEnd').value = data.operating_hours?.weekends?.end || '20:00';
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
              Dialog.show('Por favor seleccione una ubicación en el mapa');
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
    const urlParams = new URLSearchParams(window.location.search);
    const branchId = urlParams.get('Id');
    console.log(branchId)

    if (branchId) {
        document.getElementById('formTitle').textContent = 'Editar Sucursal';
        
        // datos mockeados
        const branchData = {
            id: branchId,
            name: 'Sucursal Norte',
            code: 'SUC-NORTE-001',
            contact_name: 'Gerente Norte',
            contact_phone: '+573001112233',
            contact_email: 'norte@expressdelivery.com',
            address: {
                address_line1: 'Calle 100 #15-20',
                address_line2: 'Edificio Centro Empresarial',
                city: 'Bogotá',
                state: 'Cundinamarca',
                postal_code: '110121',
                latitude: 4.68,
                longitude: -74.05,
                is_main: true
            },
            operating_hours: {
                weekdays: { start: '08:00', end: '20:00' },
                weekends: { start: '08:00', end: '20:00' }
            },
            zone_id: 'f8c3e8d7-b6a5-4d3c-9f1e-0a2b4c6d8e0f'
        };
        
        populateForm(branchData);
        
        // inicializar mapa con las coordenadas existentes
        if (branchData.address?.latitude && branchData.address?.longitude) {
            initLocationMap([branchData.address.longitude, branchData.address.latitude]);
        } else {
            initLocationMap();
        }
    } else {
        window.location.href = '../../pages/branches/branches.html';
    }
    
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
            
         
            console.log('Datos:', formData);
              Dialog.show('Sucursal guardada exitosamente');
           
        }
    });
});