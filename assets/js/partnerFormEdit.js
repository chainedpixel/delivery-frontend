
import Config from './config.js';

document.addEventListener('DOMContentLoaded', function() {
    let map;
    let marker;
    
    // obtener id del partner de la url
    const urlParams = new URLSearchParams(window.location.search);
    const partnerId = urlParams.get('Id');
    
    if (partnerId) {
        document.getElementById('partnerId').value = partnerId;
        loadPartnerData(partnerId);
    } else {
        alert('No se ha especificado un partner para editar');
        window.location.href = './parnerts.html';
    }

    // inicialización del mapa
 
    function initMap(lat, lng) {
   
        mapboxgl.accessToken = Config.MAPBOX.token;
        map = new mapboxgl.Map({
            container: 'locationMap',
            style: 'mapbox://styles/mapbox/streets-v12',
            center: [lng,lat],
            zoom: Config.MAPBOX.mapZoom
        });
        // agregar marcador si hay coordenadas
        map.on('load',function(e){
            if (lat && lng) {
                marker = new mapboxgl.Marker()
                    .setLngLat([lng, lat])
                    .addTo(map);
            }
        })
        
        map.on('click', function(e) {
            const lngLat = e.lngLat;
            
            // actualizar marcador
            if (marker) {
                marker.remove();
            }
            marker = new mapboxgl.Marker()
                .setLngLat(lngLat)
                .addTo(map);
            
            // actualizar campos de coordenadas
            document.getElementById('latitude').value = lngLat.lat.toFixed(6);
            document.getElementById('longitude').value = lngLat.lng.toFixed(6);
            
            // ocultar error de ubicación si existe
            document.getElementById('location-error').classList.add('hidden');
        });
    }

    // cargar datos del partner
    function loadPartnerData(id) {
        // simulación de datos - en producción harías una llamada a tu api
        const partnerData = {
            id: id,
            name: "Express Delivery Co.",
            legal_name: "Express Delivery S.A.S",
            tax_id: "900123456-7",
            website: "https://www.expressdelivery.com",
            contact_email: "contacto@expressdelivery.com",
            contact_phone: "+573001234567",
            delivery_rate: 20.5,
            is_active: true,
            logo_url: "https://www.example.com/logo.png",
            main_address: {
                address_line1: "Calle 100 #15-20",
                address_line2: "Edificio Centro Empresarial",
                city: "Bogotá",
                state: "Cundinamarca",
                postal_code: "110121",
                latitude: 4.68,
                longitude: -74.05,
                is_main: true
            },
            contract_start_date: "2025-04-03",
            contract_end_date: "2026-04-03",
            contract_details: {
                contract_type: "Standard",
                payment_terms: "Net 30",
                notice_period: 30,
                signed_by: "John Doe",
                special_clauses: [
                    "Cláusula de confidencialidad",
                    "Renovación automática por 1 año"
                ]
            }
        };

        // llenar el formulario con los datos
        document.getElementById('name').value = partnerData.name;
        document.getElementById('legal_name').value = partnerData.legal_name;
        document.getElementById('tax_id').value = partnerData.tax_id;
        document.getElementById('website').value = partnerData.website;
        document.getElementById('contact_email').value = partnerData.contact_email;
        document.getElementById('contact_phone').value = partnerData.contact_phone;
        document.getElementById('delivery_rate').value = partnerData.delivery_rate;
        document.getElementById('is_active').checked = partnerData.is_active;
        
        // mostrar logo si existe
        if (partnerData.logo_url) {
            document.getElementById('logo_preview').src = partnerData.logo_url;
            document.getElementById('logo_preview').classList.remove('hidden');
        }
        
        // dirección
        document.getElementById('address_line1').value = partnerData.main_address.address_line1;
        document.getElementById('address_line2').value = partnerData.main_address.address_line2;
        document.getElementById('city').value = partnerData.main_address.city;
        document.getElementById('state').value = partnerData.main_address.state;
        document.getElementById('postal_code').value = partnerData.main_address.postal_code;
        document.getElementById('latitude').value = partnerData.main_address.latitude;
        document.getElementById('longitude').value = partnerData.main_address.longitude;
        document.getElementById('is_main').checked = partnerData.main_address.is_main;
        
        // contrato
        document.getElementById('contract_start_date').value = partnerData.contract_start_date;
        document.getElementById('contract_end_date').value = partnerData.contract_end_date;
        document.getElementById('contract_type').value = partnerData.contract_details.contract_type;
        document.getElementById('payment_terms').value = partnerData.contract_details.payment_terms;
        document.getElementById('notice_period').value = partnerData.contract_details.notice_period;
        document.getElementById('signed_by').value = partnerData.contract_details.signed_by;
        document.getElementById('special_clauses').value = partnerData.contract_details.special_clauses.join('\n');
        
        // inicializar mapa con las coordenadas existentes
        initMap(partnerData.main_address.latitude, partnerData.main_address.longitude);
    }

    // validación del formulario
    function validateStep(step) {
        let isValid = true;
        const stepElement = document.querySelector(`.step-content[data-step="${step}"]`);
        
        // validar campos requeridos
        stepElement.querySelectorAll('[data-required="true"]').forEach(input => {
            const errorElement = document.getElementById(`${input.id}-error`);
            
            if (!input.value.trim()) {
                input.classList.add('border-red-500');
                errorElement.classList.remove('hidden');
                isValid = false;
            } else {
                input.classList.remove('border-red-500');
                errorElement.classList.add('hidden');
            }
            
            // validaciones específicas
            if (input.type === 'email' && !/^\S+@\S+\.\S+$/.test(input.value)) {
                input.classList.add('border-red-500');
                errorElement.classList.remove('hidden');
                isValid = false;
            }
            
            if (input.id === 'website' && input.value && !/^https?:\/\/.+\..+/.test(input.value)) {
                input.classList.add('border-red-500');
                errorElement.classList.remove('hidden');
                isValid = false;
            }
        });
        
        // validación especial para el mapa en el paso 2
        if (step === 2 && !document.getElementById('latitude').value) {
            document.getElementById('location-error').classList.remove('hidden');
            isValid = false;
        }
        
        return isValid;
    }
    
    // navegación entre pasos
    document.querySelectorAll('.next-step').forEach(button => {
        button.addEventListener('click', function() {
            const currentStep = document.querySelector('.step-content.active').dataset.step;
            const nextStep = parseInt(currentStep) + 1;
            
            if (validateStep(currentStep)) {
                if(map)
                {
                    setTimeout(() => {
                        map.resize();
                    }, 100);
                }
                // ocultar paso actual
                document.querySelector(`.step-content[data-step="${currentStep}"]`).classList.remove('active');
                document.querySelector(`.step-item[data-step="${currentStep}"]`).classList.remove('active');
                
                // mostrar siguiente paso
                document.querySelector(`.step-content[data-step="${nextStep}"]`).classList.add('active');
                document.querySelector(`.step-item[data-step="${nextStep}"]`).classList.add('active');
                
                // mostrar botón "anterior"
                document.querySelector('.prev-step').classList.remove('hidden');
                
                // cambiar a "actualizar" en el último paso
                if (nextStep === 3) {
                    document.querySelector('.next-step').classList.add('hidden');
                    document.getElementById('submitPartnerBtn').classList.remove('hidden');
                }
            }
        });
    });
    
    document.querySelector('.prev-step').addEventListener('click', function() {
        const currentStep = document.querySelector('.step-content.active').dataset.step;
        const prevStep = parseInt(currentStep) - 1;
        
        // ocultar paso actual
        document.querySelector(`.step-content[data-step="${currentStep}"]`).classList.remove('active');
        document.querySelector(`.step-item[data-step="${currentStep}"]`).classList.remove('active');
        
        // mostrar paso anterior
        document.querySelector(`.step-content[data-step="${prevStep}"]`).classList.add('active');
        document.querySelector(`.step-item[data-step="${prevStep}"]`).classList.add('active');
        
        // ocultar botón "anterior" si es el primer paso
        if (prevStep === 1) {
            document.querySelector('.prev-step').classList.add('hidden');
        }
        
        // mostrar botón "siguiente" si estaba oculto
        document.querySelector('.next-step').classList.remove('hidden');
        document.getElementById('submitPartnerBtn').classList.add('hidden');
    });
    
    // envío del formulario (actualización)
    document.getElementById('partnerForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        if (validateStep(1) && validateStep(2) && validateStep(3)) {
            const formData = {
                id: document.getElementById('partnerId').value,
                name: document.getElementById('name').value,
                legal_name: document.getElementById('legal_name').value,
                tax_id: document.getElementById('tax_id').value,
                website: document.getElementById('website').value,
                contact_email: document.getElementById('contact_email').value,
                contact_phone: document.getElementById('contact_phone').value,
                delivery_rate: parseFloat(document.getElementById('delivery_rate').value),
                is_active: document.getElementById('is_active').checked,
                logo_url: document.getElementById('logo_preview').src || '',
                main_address: {
                    address_line1: document.getElementById('address_line1').value,
                    address_line2: document.getElementById('address_line2').value,
                    city: document.getElementById('city').value,
                    state: document.getElementById('state').value,
                    postal_code: document.getElementById('postal_code').value,
                    latitude: parseFloat(document.getElementById('latitude').value),
                    longitude: parseFloat(document.getElementById('longitude').value),
                    is_main: document.getElementById('is_main').checked
                },
                contract_start_date: document.getElementById('contract_start_date').value,
                contract_end_date: document.getElementById('contract_end_date').value,
                contract_details: {
                    contract_type: document.getElementById('contract_type').value,
                    payment_terms: document.getElementById('payment_terms').value,
                    notice_period: document.getElementById('notice_period').value ? 
                        parseInt(document.getElementById('notice_period').value) : null,
                    signed_by: document.getElementById('signed_by').value,
                    special_clauses: document.getElementById('special_clauses').value ?
                        document.getElementById('special_clauses').value.split('\n') : []
                }
            };
            
            // aquí iría la lógica para actualizar los datos en el servidor
            console.log('Datos a actualizar:', formData);
            
            alert('datos enviados')
        }
    });
    
    // preview del logo al seleccionar archivo
    document.getElementById('logo_upload').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                document.getElementById('logo_preview').src = event.target.result;
                document.getElementById('logo_preview').classList.remove('hidden');
            };
            reader.readAsDataURL(file);
        }
    });
     
});