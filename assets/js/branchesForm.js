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

        // Inicialización
        init: function() {
            this.checkEditMode();
            this.initMapbox();
            this.setupEventListeners();
            this.loadZones();
        },

        // Verificar si estamos en modo edición
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

                const response = await ApiClient.request(`${Config.ENDPOINTS.BRANCH}/${branchId}`, {
                    method: 'GET'
                });

                if (response && response.data) {
                    const data = response.data;

                    // Cargar datos básicos - Paso 1
                    this.elements.branchName.value = data.name || '';
                    this.elements.branchCode.value = data.code || '';
                    this.elements.contactName.value = data.contact_name || '';
                    this.elements.contactPhone.value = data.contact_phone || '';
                    this.elements.contactEmail.value = data.contact_email || '';
                    this.elements.isMainBranch.checked = data.is_main || false;

                    // Cargar dirección - Paso 2
                    this.elements.addressLine1.value = data.address_line1 || '';
                    this.elements.addressLine2.value = data.address_line2 || '';
                    this.elements.city.value = data.city || '';
                    this.elements.state.value = data.state || '';
                    this.elements.postalCode.value = data.postal_code || '';

                    // Zona asignada (se cargará en loadZones)
                    if (data.zone_id) {
                        this.elements.zoneSelector.value = data.zone_id;
                    }

                    // Coordenadas - Paso 2
                    if (data.latitude && data.longitude) {
                        this.elements.latitude.value = data.latitude;
                        this.elements.longitude.value = data.longitude;

                        // Actualizar mapa
                        const lngLat = [parseFloat(data.longitude), parseFloat(data.latitude)];
                        this.updateMapMarker(lngLat);
                    }

                    // Horarios - Paso 3
                    if (data.hours_weekdays) {
                        const [start, end] = data.hours_weekdays.split(' - ');
                        this.elements.weekdaysStart.value = this.convertTo24Hour(start);
                        this.elements.weekdaysEnd.value = this.convertTo24Hour(end);
                    }

                    if (data.hours_weekends) {
                        const [start, end] = data.hours_weekends.split(' - ');
                        this.elements.weekendsStart.value = this.convertTo24Hour(start);
                        this.elements.weekendsEnd.value = this.convertTo24Hour(end);
                    }
                }

                this.hideLoader();
            } catch (error) {
                console.error('Error al cargar datos de la sucursal:', error);
                this.hideLoader();
                Dialog('Error', 'No se pudieron cargar los datos de la sucursal. Por favor, intente nuevamente.', {
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

        // Cargar zonas disponibles
        loadZones: async function() {
            try {
                // Limpiar opciones actuales (excepto la opción predeterminada)
                const defaultOption = this.elements.zoneSelector.querySelector('option[value=""]');
                this.elements.zoneSelector.innerHTML = '';
                this.elements.zoneSelector.appendChild(defaultOption);

                // Si estamos en modo edición, cargar las zonas disponibles para esta sucursal
                if (this.data.isEditMode && this.elements.branchId.value) {
                    const response = await ApiClient.request(`${Config.ENDPOINTS.BRANCH}/available-zones/${this.elements.branchId.value}`, {
                        method: 'GET'
                    });

                    if (Array.isArray(response)) {
                        // Agregar zonas al selector
                        response.forEach(zone => {
                            const option = document.createElement('option');
                            option.value = zone.id;
                            option.textContent = zone.name;
                            this.elements.zoneSelector.appendChild(option);
                        });
                    }
                } else {
                    // En modo creación, cargar todas las zonas disponibles
                    const response = await ApiClient.request(`${Config.ENDPOINTS.ZONES}`, {
                        method: 'GET'
                    });

                    if (response && Array.isArray(response.data)) {
                        // Agregar zonas al selector
                        response.data.forEach(zone => {
                            const option = document.createElement('option');
                            option.value = zone.id;
                            option.textContent = zone.name;
                            this.elements.zoneSelector.appendChild(option);
                        });
                    }
                }
            } catch (error) {
                console.error('Error al cargar zonas:', error);
                Dialog('Error', 'No se pudieron cargar las zonas disponibles. Por favor, intente nuevamente.', {
                    confirmButton: true,
                    confirmText: 'Aceptar'
                });
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

                // Preparar datos del formulario
                const formData = {
                    name: this.elements.branchName.value,
                    code: this.elements.branchCode.value,
                    contact_name: this.elements.contactName.value,
                    contact_phone: this.elements.contactPhone.value,
                    contact_email: this.elements.contactEmail.value,
                    is_main: this.elements.isMainBranch.checked,

                    address_line1: this.elements.addressLine1.value,
                    address_line2: this.elements.addressLine2.value,
                    city: this.elements.city.value,
                    state: this.elements.state.value,
                    postal_code: this.elements.postalCode.value,

                    latitude: parseFloat(this.elements.latitude.value),
                    longitude: parseFloat(this.elements.longitude.value),

                    hours_weekdays: `${this.formatTimeForAPI(this.elements.weekdaysStart.value)} - ${this.formatTimeForAPI(this.elements.weekdaysEnd.value)}`,
                    hours_weekends: `${this.formatTimeForAPI(this.elements.weekendsStart.value)} - ${this.formatTimeForAPI(this.elements.weekendsEnd.value)}`,

                    is_active: true
                };

                let response;

                if (this.data.isEditMode) {
                    // Actualizar sucursal existente
                    response = await ApiClient.request(`${Config.ENDPOINTS.BRANCH}/${this.elements.branchId.value}`, {
                        method: 'PUT',
                        body: JSON.stringify(formData)
                    });
                } else {
                    // Crear nueva sucursal
                    response = await ApiClient.request(Config.ENDPOINTS.BRANCH, {
                        method: 'POST',
                        body: JSON.stringify(formData)
                    });
                }

                // Si se seleccionó una zona, asignarla a la sucursal
                if (this.elements.zoneSelector.value) {
                    const branchId = this.data.isEditMode ? this.elements.branchId.value : response.data.id;

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
                // Usar el endpoint exacto según la documentación de Swagger
                await ApiClient.request(`${Config.ENDPOINTS.BRANCH}/zones/${branchId}`, {
                    method: 'POST',
                    body: JSON.stringify({ zone_id: zoneId })
                });

                return true;
            } catch (error) {
                console.error('Error al asignar zona a la sucursal:', error);
                Dialog('Advertencia', 'La sucursal se creó correctamente, pero no se pudo asignar la zona seleccionada.', {
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
