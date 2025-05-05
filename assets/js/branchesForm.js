import Config from "./config.js";
import ApiClient from "../../assets/js/utils/apiClient.js";
import Dialog from "./utils/Dialog.js";

document.addEventListener('DOMContentLoaded', function() {
    const branchesForm = {
        // Elementos del DOM
        elements: {
            form: document.getElementById('branchForm'),
            formTitle: document.getElementById('formTitle'),
            branchId: document.getElementById('branchId'),

            // Pasos del wizard
            stepsItems: document.querySelectorAll('.step-item'),
            stepsContents: document.querySelectorAll('.step-content'),

            // Navegación
            nextButtons: document.querySelectorAll('.next-step'),
            prevButtons: document.querySelectorAll('.prev-step'),
            submitButton: document.getElementById('submitBranchBtn'),

            // Campos del formulario - Paso 1
            branchName: document.getElementById('branchName'),
            branchCode: document.getElementById('branchCode'),
            contactName: document.getElementById('contactName'),
            contactPhone: document.getElementById('contactPhone'),
            contactEmail: document.getElementById('contactEmail'),
            isMainBranch: document.getElementById('isMainBranch'),

            // Campos del formulario - Paso 2
            addressLine1: document.getElementById('addressLine1'),
            addressLine2: document.getElementById('addressLine2'),
            city: document.getElementById('city'),
            state: document.getElementById('state'),
            postalCode: document.getElementById('postalCode'),
            zoneSelector: document.getElementById('zoneSelector'),
            latitude: document.getElementById('latitude'),
            longitude: document.getElementById('longitude'),
            locationMap: document.getElementById('locationMap'),

            // Campos del formulario - Paso 3
            weekdaysStart: document.getElementById('weekdaysStart'),
            weekdaysEnd: document.getElementById('weekdaysEnd'),
            weekendsStart: document.getElementById('weekendsStart'),
            weekendsEnd: document.getElementById('weekendsEnd'),
        },

        // Datos
        data: {
            currentStep: 1,
            totalSteps: 3,
            isEditMode: false,
            map: null,
            marker: null,
            originLatLng: [-89.2, 13.7], // Coordenadas por defecto (San Salvador, El Salvador)
            mapZoom: 13
        },
        config: {
            DEBUG: true,  // Habilitar para ver mensajes de depuración
        },

        init: function() {
            this.checkEditMode();
            this.initMapbox();
            this.setupEventListeners();
            this.getCompanyInfo(); // Obtener información de la compañía
            this.loadZones();
        },
        getCompanyInfo: async function() {
            try {
                // Almacenar el ID de compañía por defecto
                this.data.companyId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

                // Si luego decides implementar una llamada API para obtener este dato,
                // puedes actualizar esta función
                console.log("Usando ID de compañía por defecto:", this.data.companyId);
            } catch (error) {
                console.error("Error al obtener información de la compañía:", error);
            }
        },


        checkEditMode: function() {
            const urlParams = new URLSearchParams(window.location.search);
            const branchId = urlParams.get('Id');

            if (branchId) {
                this.data.isEditMode = true;
                this.elements.formTitle.textContent = 'Editar Sucursal';
                this.elements.branchId.value = branchId;
                this.loadBranchData(branchId);
            }
        },

        // Cargar datos de la sucursal si estamos en modo edición
        loadBranchData: async function(branchId) {
            try {
                this.showLoader('Cargando datos de la sucursal...');

                const response = await ApiClient.request(`${Config.ENDPOINTS.BRANCH.BASE}/${branchId}`, {
                    method: 'GET'
                });

                // Determinar y validar la estructura de la respuesta
                let branchData = null;

                if (response && response.data && typeof response.data === 'object') {
                    // Estructura común: { data: {...} }
                    branchData = response.data;
                } else if (response && response.success === true && response.data) {
                    // Estructura observada en la captura: { success: true, data: {...} }
                    branchData = response.data;
                } else if (response && (response.name || response.id)) {
                    // La respuesta podría ser el objeto directamente
                    branchData = response;
                } else {
                    console.error("Estructura de respuesta inesperada:", response);
                    throw new Error("Formato de respuesta no reconocido");
                }

                // Verificar que branchData sea un objeto válido
                if (!branchData || typeof branchData !== 'object') {
                    throw new Error("Los datos de la sucursal no tienen el formato esperado");
                }

                console.log("Datos de sucursal procesados:", branchData);

                // Cargar datos básicos - Paso 1
                this.elements.branchName.value = branchData.name || '';
                this.elements.branchCode.value = branchData.code || '';
                this.elements.contactName.value = branchData.contact_name || '';
                this.elements.contactPhone.value = branchData.contact_phone || '';
                this.elements.contactEmail.value = branchData.contact_email || '';
                this.elements.isMainBranch.checked = branchData.is_main || false;

                // Cargar dirección - Paso 2
                this.elements.addressLine1.value = branchData.address_line1 || '';
                this.elements.addressLine2.value = branchData.address_line2 || '';
                this.elements.city.value = branchData.city || '';
                this.elements.state.value = branchData.state || '';
                this.elements.postalCode.value = branchData.postal_code || '';

                // Zona asignada (se cargará en loadZones)
                if (branchData.zone_id) {
                    this.elements.zoneSelector.value = branchData.zone_id;
                }

                // Coordenadas - Paso 2
                if (branchData.latitude && branchData.longitude) {
                    this.elements.latitude.value = branchData.latitude;
                    this.elements.longitude.value = branchData.longitude;

                    // Actualizar mapa
                    const lngLat = [parseFloat(branchData.longitude), parseFloat(branchData.latitude)];
                    this.updateMapMarker(lngLat);
                }

                // Horarios - Paso 3
                if (branchData.hours_weekdays) {
                    const [start, end] = branchData.hours_weekdays.split(' - ');
                    this.elements.weekdaysStart.value = this.convertTo24Hour(start);
                    this.elements.weekdaysEnd.value = this.convertTo24Hour(end);
                }

                if (branchData.hours_weekends) {
                    const [start, end] = branchData.hours_weekends.split(' - ');
                    this.elements.weekendsStart.value = this.convertTo24Hour(start);
                    this.elements.weekendsEnd.value = this.convertTo24Hour(end);
                }

                this.hideLoader();
            } catch (error) {
                console.error('Error al cargar datos de la sucursal:', error);
                this.hideLoader();

                // Mensaje de error más específico
                let errorMessage = 'No se pudieron cargar los datos de la sucursal. ';
                if (error.response && error.response.data && error.response.data.message) {
                    errorMessage += error.response.data.message;
                } else if (error.message) {
                    errorMessage += error.message;
                } else {
                    errorMessage += "Por favor, intente nuevamente.";
                }

                Dialog('Error', errorMessage, {
                    confirmButton: true,
                    confirmText: 'Aceptar'
                });
            }
        },

        // Convertir formato de hora AM/PM a 24 horas
        convertTo24Hour: function(timeStr) {
            if (!timeStr) return '';

            const [time, period] = timeStr.split(' ');
            let [hours, minutes] = time.split(':');

            hours = parseInt(hours);

            if (period === 'PM' && hours < 12) {
                hours += 12;
            } else if (period === 'AM' && hours === 12) {
                hours = 0;
            }

            return `${hours.toString().padStart(2, '0')}:${minutes}`;
        },
// Esta función rellena el selector de zonas con los datos proporcionados
        populateZoneSelector: function(zones) {
            if (!this.elements.zoneSelector || !Array.isArray(zones)) {
                console.error('No se puede poblar el selector de zonas', {
                    selectorExists: !!this.elements.zoneSelector,
                    zonesIsArray: Array.isArray(zones),
                    zones: zones
                });
                return;
            }

            // Asegurar que el selector tiene la opción por defecto
            const defaultOption = this.elements.zoneSelector.querySelector('option[value=""]') ||
                document.createElement('option');

            if (!defaultOption.value) {
                defaultOption.value = '';
                defaultOption.textContent = 'Seleccionar zona...';
                this.elements.zoneSelector.appendChild(defaultOption);
            }

            // Agregar cada zona como una opción
            zones.forEach(zone => {
                if (!zone || !zone.id) return;

                const option = document.createElement('option');
                option.value = zone.id;
                option.textContent = zone.name || `Zona ${zone.id.substr(0, 6)}`;

                this.elements.zoneSelector.appendChild(option);
            });

            console.log(`Se poblaron ${zones.length} zonas en el selector`);
        },
        // Cargar zonas disponibles
        loadZones: async function() {
            try {
                // Limpiar opciones actuales
                const defaultOption = this.elements.zoneSelector.querySelector('option[value=""]');
                this.elements.zoneSelector.innerHTML = '';
                this.elements.zoneSelector.appendChild(defaultOption);

                console.log("Usando datos hardcodeados como alternativa temporal");

                // Datos de respaldo
                const hardcodedZones = [
                    { id: "f8c3e8d7-b6a5-4d3c-9f1e-0a2b4c6d8e0f", name: 'Zona Norte' },
                    { id: "e7d6c5b4-a3f2-4e1d-8c9b-7a6b5c4d3e2f", name: 'Zona Centro' },
                    { id: "d6e5f4c3-b2a1-4d0e-9f8c-7b6a5d4c3e2f", name: 'Zona Sur' },
                    { id: "c6f9d4e2-3f6a-5d7c-b9f0-f6f4d3c2b1a6", name: 'Zona Central' }
                ];

                this.populateZoneSelector(hardcodedZones);

                // Mostrar advertencia de que son datos temporales
                console.warn('Usando zonas hardcodeadas debido a un error en el servidor');

                const zoneLabel = document.querySelector('label[for="zoneSelector"]');
                if (zoneLabel) {
                    zoneLabel.innerHTML += ' <span class="text-blue-600 text-sm">(Datos temporales - Error en servidor)</span>';
                }

            } catch (error) {
                console.error('Error en loadZones:', error);
                Dialog('Error', 'No se pudieron cargar las zonas. ' + (error.message || ''), {
                    confirmButton: true,
                    confirmText: 'Aceptar'
                });
            }
        },
        // Función auxiliar para obtener datos de respuestas de manera segura
        getResponseData: function(response) {
            if (!response) return null;

            if (response.data) return response.data;
            if (response.success && response.data) return response.data;
            if (response.id || response.name) return response;

            // Buscar cualquier objeto que parezca contener datos
            if (typeof response === 'object') {
                for (const key in response) {
                    if (response[key] && typeof response[key] === 'object') {
                        return response[key];
                    }
                }
            }

            return null;
        },

// Función para mostrar mensajes detallados en consola para depuración
        debugLog: function(message, data) {
            if (Config.DEBUG) {
                console.log(`[BranchesForm] ${message}`, data);
            }
        },
        // Inicializar Mapbox
        initMapbox: function() {
            if (!this.elements.locationMap) return;

            mapboxgl.accessToken = Config.MAPBOX.token;

            this.data.map = new mapboxgl.Map({
                container: this.elements.locationMap,
                style: 'mapbox://styles/mapbox/streets-v12',
                center: this.data.originLatLng,
                zoom: this.data.mapZoom
            });

            this.data.map.addControl(new mapboxgl.NavigationControl());

            // Evento de clic en el mapa
            this.data.map.on('click', (e) => {
                const lngLat = [e.lngLat.lng, e.lngLat.lat];
                this.updateMapMarker(lngLat);
            });
        },

        // Actualizar marcador en el mapa
        updateMapMarker: function(lngLat) {
            if (!this.data.map) return;

            // Actualizar campos de latitud y longitud
            this.elements.latitude.value = lngLat[1].toFixed(6);
            this.elements.longitude.value = lngLat[0].toFixed(6);

            // Eliminar marcador existente
            if (this.data.marker) {
                this.data.marker.remove();
            }

            // Crear nuevo marcador
            this.data.marker = new mapboxgl.Marker()
                .setLngLat(lngLat)
                .addTo(this.data.map);

            // Centrar mapa en el marcador
            this.data.map.flyTo({
                center: lngLat,
                zoom: 15
            });
        },

        // Configurar event listeners
        setupEventListeners: function() {
            // Navegación entre pasos
            this.elements.nextButtons.forEach(button => {
                button.addEventListener('click', () => this.nextStep());
            });

            this.elements.prevButtons.forEach(button => {
                button.addEventListener('click', () => this.prevStep());
            });

            // Envío del formulario
            this.elements.form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.submitForm();
            });

            // Resize del mapa cuando se muestra el paso 2
            const stepItems = document.querySelectorAll('.step-item');
            stepItems.forEach(item => {
                item.addEventListener('click', (e) => {
                    const step = parseInt(e.currentTarget.getAttribute('data-step'));
                    if (step === 2 && this.data.map) {
                        setTimeout(() => {
                            this.data.map.resize();
                        }, 100);
                    }
                });
            });
        },

        // Ir al siguiente paso
        nextStep: function() {
            // Validar el paso actual
            if (!this.validateStep(this.data.currentStep)) {
                return;
            }

            // Si estamos en el último paso, enviar el formulario
            if (this.data.currentStep === this.data.totalSteps) {
                this.elements.form.dispatchEvent(new Event('submit'));
                return;
            }

            // Ocultar paso actual y mostrar siguiente
            this.goToStep(this.data.currentStep + 1);

            // Si ahora estamos en el último paso, cambiar el botón de siguiente por enviar
            if (this.data.currentStep === this.data.totalSteps) {
                this.elements.nextButtons.forEach(button => button.classList.add('hidden'));
                this.elements.submitButton.classList.remove('hidden');
            }

            // Mostrar botón de anterior
            this.elements.prevButtons.forEach(button => button.classList.remove('hidden'));

            // Si es el paso 2, asegurarse de que el mapa se renderice correctamente
            if (this.data.currentStep === 2 && this.data.map) {
                setTimeout(() => {
                    this.data.map.resize();
                }, 100);
            }
        },

        // Ir al paso anterior
        prevStep: function() {
            if (this.data.currentStep === 1) return;

            // Ocultar paso actual y mostrar anterior
            this.goToStep(this.data.currentStep - 1);

            // Si ahora estamos en el primer paso, ocultar botón de anterior
            if (this.data.currentStep === 1) {
                this.elements.prevButtons.forEach(button => button.classList.add('hidden'));
            }

            // Mostrar botón de siguiente y ocultar botón de enviar
            this.elements.nextButtons.forEach(button => button.classList.remove('hidden'));
            this.elements.submitButton.classList.add('hidden');
        },

        // Ir a un paso específico
        goToStep: function(stepNumber) {
            // Actualizar paso actual
            this.data.currentStep = stepNumber;

            // Actualizar clases de los pasos
            this.elements.stepsItems.forEach(item => {
                const itemStep = parseInt(item.getAttribute('data-step'));

                if (itemStep < stepNumber) {
                    item.classList.add('completed');
                    item.classList.remove('active');
                } else if (itemStep === stepNumber) {
                    item.classList.add('active');
                    item.classList.remove('completed');
                } else {
                    item.classList.remove('active', 'completed');
                }
            });

            // Mostrar contenido del paso actual
            this.elements.stepsContents.forEach(content => {
                const contentStep = parseInt(content.getAttribute('data-step'));

                if (contentStep === stepNumber) {
                    content.classList.add('active');
                } else {
                    content.classList.remove('active');
                }
            });
        },

        // Validar paso actual
        validateStep: function(step) {
            let isValid = true;

            // Obtener todos los campos requeridos en el paso actual
            const stepContent = document.querySelector(`.step-content[data-step="${step}"]`);
            if (!stepContent) return true;

            const requiredFields = stepContent.querySelectorAll('[data-required="true"]');

            requiredFields.forEach(field => {
                const errorElement = document.getElementById(`${field.id}-error`);

                // Ocultar mensaje de error
                if (errorElement) {
                    errorElement.classList.add('hidden');
                }

                let fieldValue = field.value.trim();
                let fieldValid = fieldValue !== '';

                // Validaciones específicas según el tipo de campo
                if (field.type === 'email' && fieldValue) {
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    fieldValid = emailRegex.test(fieldValue);

                    if (!fieldValid && errorElement) {
                        errorElement.textContent = 'Ingrese un email válido';
                    }
                } else if (field.type === 'tel' && fieldValue) {
                    const phoneRegex = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
                    fieldValid = phoneRegex.test(fieldValue);

                    if (!fieldValid && errorElement) {
                        errorElement.textContent = 'Ingrese un número válido';
                    }
                }

                // Si el campo no es válido, mostrar mensaje de error
                if (!fieldValid) {
                    isValid = false;

                    if (errorElement) {
                        errorElement.classList.remove('hidden');
                    }

                    field.classList.add('border-red-500');
                } else {
                    field.classList.remove('border-red-500');
                }
            });

            // Validaciones específicas para cada paso
            if (step === 2) {
                // Verificar que se haya seleccionado ubicación en el mapa
                if (!this.elements.latitude.value || !this.elements.longitude.value) {
                    isValid = false;
                    Dialog('Ubicación requerida', 'Por favor, seleccione la ubicación en el mapa haciendo clic en él.', {
                        confirmButton: true,
                        confirmText: 'Aceptar'
                    });
                }
            }

            return isValid;
        },

        // Enviar formulario
        submitForm: async function() {
            // Validar todos los pasos
            for (let i = 1; i <= this.data.totalSteps; i++) {
                if (!this.validateStep(i)) {
                    this.goToStep(i);
                    return;
                }
            }

            try {
                this.showLoader('Guardando sucursal...');

                // Asegurar que los horarios tengan valores predeterminados
                const weekdaysStart = this.elements.weekdaysStart.value || "09:00";
                const weekdaysEnd = this.elements.weekdaysEnd.value || "18:00";
                const weekendsStart = this.elements.weekendsStart.value || "10:00";
                const weekendsEnd = this.elements.weekendsEnd.value || "16:00";

                // Preparar datos del formulario
                const formData = {
                    name: this.elements.branchName.value,
                    code: this.elements.branchCode.value,
                    contact_name: this.elements.contactName.value,
                    contact_phone: this.elements.contactPhone.value,
                    contact_email: this.elements.contactEmail.value,
                    is_main: this.elements.isMainBranch.checked,

                    // Incluir company_id
                    company_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',

                    address_line1: this.elements.addressLine1.value,
                    address_line2: this.elements.addressLine2.value || '',
                    city: this.elements.city.value,
                    state: this.elements.state.value,
                    postal_code: this.elements.postalCode.value,

                    latitude: parseFloat(this.elements.latitude.value),
                    longitude: parseFloat(this.elements.longitude.value),

                    // Formato JSON para operating_hours
                    operating_hours: {
                        weekdays: {
                            start: this.formatTimeForAPI(weekdaysStart),
                            end: this.formatTimeForAPI(weekdaysEnd)
                        },
                        weekends: {
                            start: this.formatTimeForAPI(weekendsStart),
                            end: this.formatTimeForAPI(weekendsEnd)
                        }
                    },

                    is_active: true

                };
                console.log("Datos completos a enviar:", JSON.stringify(formData, null, 2));

                let response;
                let endpoint;


                if (this.data.isEditMode) {
                    endpoint = `${Config.ENDPOINTS.BRANCH.BASE}/${this.elements.branchId.value}`;
                    response = await ApiClient.request(endpoint, {
                        method: 'PUT',
                        body: JSON.stringify(formData)
                    });
                } else {
                    endpoint = `${Config.ENDPOINTS.BRANCH.BASE}`;
                    response = await ApiClient.request(endpoint, {
                        method: 'POST',
                        body: JSON.stringify(formData)
                    });
                }
                console.log("Respuesta de la API:", response);

                // Extraer el ID de la sucursal de la respuesta (manejando diferentes estructuras)
                let branchId;
                if (this.data.isEditMode) {
                    branchId = this.elements.branchId.value;
                } else {
                    if (response && response.data && response.data.id) {
                        branchId = response.data.id;
                    } else if (response && response.id) {
                        branchId = response.id;
                    } else if (response && response.success && response.data && response.data.id) {
                        branchId = response.data.id;
                    } else {
                        console.warn("No se pudo extraer el ID de la sucursal de la respuesta:", response);
                        // Continuar de todas formas, pero loguear advertencia
                    }
                }

                // Si se seleccionó una zona, asignarla a la sucursal
                if (this.elements.zoneSelector.value && branchId) {
                    await this.assignZoneToBranch(branchId, this.elements.zoneSelector.value);
                }

                this.hideLoader();

                // Mostrar mensaje de éxito
                Dialog(
                    'Sucursal guardada',
                    `La sucursal ha sido ${this.data.isEditMode ? 'actualizada' : 'creada'} exitosamente.`,
                    {
                        confirmButton: true,
                        confirmText: 'Aceptar'
                    },
                    null,
                    () => {
                        // Redireccionar a la lista de sucursales
                        window.location.href = '../../pages/branches/branches.html';
                    }
                );
            } catch (error) {
                console.error('Error al guardar sucursal:', error);
                this.hideLoader();

                let errorMessage = `No se pudo ${this.data.isEditMode ? 'actualizar' : 'crear'} la sucursal. `;

                if (error.response && error.response.data && error.response.data.message) {
                    errorMessage += error.response.data.message;
                } else if (error.response && error.response.status) {
                    errorMessage += `Error de servidor (${error.response.status}). `;
                } else if (error.message) {
                    errorMessage += error.message;
                } else {
                    errorMessage += "Intente nuevamente.";
                }

                Dialog('Error', errorMessage, {
                    confirmButton: true,
                    confirmText: 'Aceptar'
                });
            }
        },

        // Asignar una zona a una sucursal
        assignZoneToBranch: async function(branchId, zoneId) {
            try {
                console.log(`Asignando zona ${zoneId} a sucursal ${branchId}`);

                const response = await ApiClient.request(`${Config.ENDPOINTS.BRANCH.ASSIGN_ZONE}/${branchId}`, {
                    method: 'POST',
                    body: JSON.stringify({ zone_id: zoneId })
                });

                console.log("Respuesta asignación de zona:", response);

                // Verificar si la respuesta indica éxito
                let success = false;

                if (response && response.success === true) {
                    success = true;
                } else if (response && response.status === 'success') {
                    success = true;
                } else if (response && response.data && (response.data.success === true || response.data.status === 'success')) {
                    success = true;
                } else if (response && !response.error) {
                    // Si no hay un indicador de error, asumimos éxito
                    success = true;
                }

                if (!success) {
                    console.warn("La respuesta no indica éxito claro:", response);
                    // Continuar de todas formas pero con advertencia
                }

                return true;
            } catch (error) {
                console.error('Error al asignar zona a la sucursal:', error);

                let errorMessage = "La sucursal se creó correctamente, pero no se pudo asignar la zona seleccionada. ";

                if (error.response && error.response.data && error.response.data.message) {
                    errorMessage += error.response.data.message;
                } else if (error.message) {
                    errorMessage += error.message;
                }

                Dialog('Advertencia', errorMessage, {
                    confirmButton: true,
                    confirmText: 'Aceptar'
                });

                return false;
            }
        },

        // Formatear hora para la API (convertir de 24h a formato AM/PM para la API)
        formatTimeForAPI: function(timeStr) {
            if (!timeStr) return '';

            const [hours, minutes] = timeStr.split(':');
            const hour = parseInt(hours);

            let period = 'AM';
            let hour12 = hour;

            if (hour >= 12) {
                period = 'PM';
                hour12 = hour === 12 ? 12 : hour - 12;
            } else if (hour === 0) {
                hour12 = 12;
            }

            return `${hour12}:${minutes} ${period}`;
        },

        // Mostrar loader
        showLoader: function(message = 'Cargando...') {
            // Verificar si ya existe un loader
            if (document.getElementById('global-loader')) return;

            const loader = document.createElement('div');
            loader.id = 'global-loader';
            loader.className = 'fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50';
            loader.innerHTML = `
                <div class="bg-white p-6 rounded-lg shadow-xl text-center">
                    <div class="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-orange-500 mx-auto mb-4"></div>
                    <p class="text-gray-700">${message}</p>
                </div>
            `;

            document.body.appendChild(loader);
        },

        // Ocultar loader
        hideLoader: function() {
            const loader = document.getElementById('global-loader');
            if (loader) {
                loader.remove();
            }
        }
    };

    // Inicializar el formulario
    branchesForm.init();
});