import Config from './config.js';
import ApiClient from './utils/apiClient.js';
import Dialog from './utils/Dialog.js';

document.addEventListener('DOMContentLoaded', function() {
    let map;
    let marker;

    // Inicializa el mapa con las coordenadas predeterminadas
    // Usamos las coordenadas de San Salvador por defecto
    initMap(Config.MAPBOX.mapInitialCoords[1], Config.MAPBOX.mapInitialCoords[0]);

    // inicialización del mapa
    function initMap(lat, lng) {
        mapboxgl.accessToken = Config.MAPBOX.token;
        map = new mapboxgl.Map({
            container: 'locationMap',
            style: 'mapbox://styles/mapbox/streets-v12',
            center: [lng, lat],
            zoom: Config.MAPBOX.mapZoom
        });

        // Añadir controles de navegación
        map.addControl(new mapboxgl.NavigationControl());

        // agregar marcador si hay coordenadas
        map.on('load', function(e) {
            if (lat && lng) {
                marker = new mapboxgl.Marker()
                    .setLngLat([lng, lat])
                    .addTo(map);
            }
        });

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

    // Función para convertir fechas al formato ISO 8601 completo
    function convertToISOFormat(dateString) {
        if (!dateString) return null;
        // Para input type="date", que devuelve YYYY-MM-DD
        const date = new Date(dateString);
        return date.toISOString(); // Retorna en formato YYYY-MM-DDTHH:MM:SS.sssZ
    }

    // Función para convertir datetime-local a ISO
    function convertDatetimeLocalToISO(datetimeLocalString) {
        if (!datetimeLocalString) return new Date().toISOString();
        // Para input type="datetime-local", que devuelve YYYY-MM-DDTHH:MM
        // Necesitamos agregar los segundos y zona horaria
        return new Date(datetimeLocalString).toISOString();
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
            if (input.id === 'contact_email' && input.value && !/^\S+@\S+\.\S+$/.test(input.value)) {
                input.classList.add('border-red-500');
                errorElement.textContent = 'Por favor ingrese un correo electrónico válido';
                errorElement.classList.remove('hidden');
                isValid = false;
            }

            if (input.id === 'website' && input.value && !/^https?:\/\/.+\..+/.test(input.value)) {
                input.classList.add('border-red-500');
                errorElement.textContent = 'Por favor ingrese una URL válida (debe comenzar con http:// o https://)';
                errorElement.classList.remove('hidden');
                isValid = false;
            }

            if (input.id === 'delivery_rate' && input.value) {
                const rate = parseFloat(input.value);
                if (isNaN(rate) || rate <= 0) {
                    input.classList.add('border-red-500');
                    errorElement.textContent = 'Por favor ingrese una tarifa de entrega válida';
                    errorElement.classList.remove('hidden');
                    isValid = false;
                }
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
                if(map) {
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

                // cambiar a "guardar" en el último paso
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

    // envío del formulario para crear un nuevo partner
    document.getElementById('partnerForm').addEventListener('submit', async function(e) {
        e.preventDefault();

        if (validateStep(1) && validateStep(2) && validateStep(3)) {
            // Mostrar indicador de carga
            showLoadingIndicator();

            // Procesar las cláusulas especiales (separar por líneas)
            const specialClauses = document.getElementById('special_clauses').value
                ? document.getElementById('special_clauses').value.split('\n').filter(clause => clause.trim())
                : [];

            // Convertir fechas al formato ISO 8601 completo
            const contractStartDate = convertToISOFormat(document.getElementById('contract_start_date').value);
            const contractEndDate = document.getElementById('contract_end_date').value ?
                convertToISOFormat(document.getElementById('contract_end_date').value) : null;

            // Convertir fecha de firma (datetime-local) a ISO
            const signedAt = document.getElementById('signed_at').value ?
                convertDatetimeLocalToISO(document.getElementById('signed_at').value) :
                new Date().toISOString();

            // Construir objeto de datos según el formato esperado por la API
            const formData = {
                name: document.getElementById('name').value,
                legal_name: document.getElementById('legal_name').value,
                tax_id: document.getElementById('tax_id').value,
                website: document.getElementById('website').value || null,
                contact_email: document.getElementById('contact_email').value,
                contact_phone: document.getElementById('contact_phone').value,
                delivery_rate: parseFloat(document.getElementById('delivery_rate').value),
                is_active: document.getElementById('is_active').checked,
                logo_url: document.getElementById('logo_preview').src || null,

                // Dirección principal
                main_address: {
                    address_line1: document.getElementById('address_line1').value,
                    address_line2: document.getElementById('address_line2').value || null,
                    city: document.getElementById('city').value,
                    state: document.getElementById('state').value,
                    postal_code: document.getElementById('postal_code').value,
                    latitude: parseFloat(document.getElementById('latitude').value),
                    longitude: parseFloat(document.getElementById('longitude').value),
                    is_main: document.getElementById('is_main').checked
                },

                // Información del contrato con fechas en formato ISO
                contract_start_date: contractStartDate,
                contract_end_date: contractEndDate,
                contract_details: {
                    contract_type: document.getElementById('contract_type').value,
                    payment_terms: document.getElementById('payment_terms').value,
                    notice_period: document.getElementById('notice_period').value
                        ? parseInt(document.getElementById('notice_period').value)
                        : 30,
                    renewal_type: document.getElementById('renewal_type').value || "Automatic",
                    signed_by: document.getElementById('signed_by').value,
                    signed_at: signedAt,
                    special_clauses: specialClauses
                }
            };

            console.log('Datos a enviar:', formData);

            try {
                // Enviar los datos a la API
                const response = await ApiClient.request(Config.ENDPOINTS.PARTNERS.BASE, {
                    method: 'POST',
                    body: JSON.stringify(formData)
                });

                // Ocultar indicador de carga
                hideLoadingIndicator();

                if (response && response.data) {
                    // Mostrar mensaje de éxito
                    Dialog.show(
                        "Éxito",
                        "El asociado ha sido creado correctamente",
                        { confirmButton: true, confirmText: 'Ir a detalles' },
                        () => {},
                        () => {
                            // Redirigir a la página de detalles del partner
                            window.location.href = `./parnerts.html?id=${response.data.id}`;
                        }
                    );
                } else {
                    // Respuesta inesperada
                    throw new Error('Respuesta inesperada del servidor');
                }
            } catch (error) {
                // Ocultar indicador de carga
                hideLoadingIndicator();

                // Mostrar mensaje de error
                Dialog.show(
                    "Error",
                    `No se pudo crear el asociado: ${error.message || 'Error desconocido'}`,
                    { confirmButton: true, confirmText: 'Aceptar' }
                );

                console.error('Error al crear asociado:', error);
            }
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

    // Establecer fechas por defecto
    function setDefaultDates() {
        // Fecha actual para la fecha de inicio del contrato
        const today = new Date();
        const formattedDate = today.toISOString().substring(0, 10); // formato YYYY-MM-DD

        // Establecer la fecha de inicio por defecto (hoy)
        if (document.getElementById('contract_start_date')) {
            document.getElementById('contract_start_date').value = formattedDate;
        }

        // Establecer la fecha y hora de firma por defecto (ahora)
        if (document.getElementById('signed_at')) {
            const now = new Date();
            // Formato requerido para datetime-local: YYYY-MM-DDTHH:MM
            const formattedDateTime = now.toISOString().substring(0, 16);
            document.getElementById('signed_at').value = formattedDateTime;
        }
    }

    // Llamar a la función para establecer fechas por defecto
    setDefaultDates();

    // Función para mostrar indicador de carga
    function showLoadingIndicator() {
        // Crear y mostrar un indicador de carga
        const loadingOverlay = document.createElement('div');
        loadingOverlay.id = 'loading-overlay';
        loadingOverlay.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        loadingOverlay.innerHTML = `
            <div class="bg-white p-4 rounded-lg shadow-lg flex flex-col items-center">
                <div class="loader mb-2"></div>
                <p class="text-gray-700">Creando asociado...</p>
            </div>
        `;
        document.body.appendChild(loadingOverlay);

        // Desactivar el botón de envío para evitar múltiples envíos
        document.getElementById('submitPartnerBtn').disabled = true;
    }

    // Función para ocultar indicador de carga
    function hideLoadingIndicator() {
        // Eliminar indicador de carga
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.remove();
        }

        // Reactivar el botón de envío
        document.getElementById('submitPartnerBtn').disabled = false;
    }
});