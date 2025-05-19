import Config from "./config.js";
import Dialog from "./utils/Dialog.js";
import ApiClient from "../../assets/js/utils/apiClient.js";

document.addEventListener('DOMContentLoaded', function () {
    const app = {
        elements: {
            appContainer: document.getElementById('app-container'),
            branchItems: document.querySelectorAll('.branch-item'),
            tabButtons: document.querySelectorAll('.tab-button'),
            tabContents: document.querySelectorAll('.tab-content'),
            refreshButton: document.getElementById('refresh-button'),
            refreshIcon: document.getElementById('refresh-icon'),
            mainContent: document.getElementById('main-content'),
            contentArea: document.getElementById('content-area'),
            statusLabel: document.getElementById('status-label'),
            statusToggle: document.getElementById('user-status-toggle'),
            noBranchSelected: document.getElementById('no-branch-selected'),
            addZoneBtn: document.getElementById('add-zone-btn'),
            mapContainer: document.getElementById('map'),
            zonesMapContainer: document.getElementById('zones-map'),
            zoneModal: document.getElementById('zone-modal'),
            closeZoneModal: document.getElementById('close-zone-modal'),
            cancelZoneBtn: document.getElementById('cancel-zone'),
            saveZoneBtn: document.getElementById('save-zone'),
            zoneTypeSelect: document.getElementById('zone-type'),
            zoneRadiusInput: document.getElementById('zone-radius'),
            radiusControl: document.getElementById('radius-control'),
            zoneSelectionMap: document.getElementById('zone-selection-map'),
            sidebar: document.querySelector('.sidebar'), // Añadido para handleMobileBack
        },
        data: {
            isZoneSelected: false,
            branchId: null, // Para almacenar el ID de la sucursal actual
            currentBranchDetails: null,
            currentBranchesListPage: 1,
            totalBranches: 0,
            map: null,
            zonesMap: null,
            currentMarker: null,
            currentBranchToDelete: null,
            zoneSelectionMap: null, // Para el mapa de selección de zonas
        },
        init: function () {
            this.initMap();
            this.initZonesMap();
            this.setupEventListeners();
            this.setupEditButtons();
            this.setupDeleteButtons();

            // Obtener el ID de la sucursal de la URL
            const urlParams = new URLSearchParams(window.location.search);
            const branchId = urlParams.get('Id');
            if (branchId) {
                this.data.branchId = branchId;
                this.displayBranchDetails(branchId);
                console.log("Cargando sucursal:", branchId);
            } else {
                console.error("No se proporcionó un ID de sucursal");
                this.showErrorMessage("No se encontró el ID de la sucursal");
            }
        },

        // Inicializar mapa principal
        initMap: function () {
            if (!this.elements.mapContainer) return;

            mapboxgl.accessToken = Config.MAPBOX.token;
            this.data.map = new mapboxgl.Map({
                container: this.elements.mapContainer,
                style: 'mapbox://styles/mapbox/streets-v12',
                center: Config.MAPBOX.mapInitialCoords,
                zoom: Config.MAPBOX.mapZoom
            });

            this.data.map.addControl(new mapboxgl.NavigationControl());
        },

        // Inicializar mapa de zonas
        initZonesMap: function () {
            if (!this.elements.zonesMapContainer) return;

            this.data.zonesMap = new mapboxgl.Map({
                container: this.elements.zonesMapContainer,
                style: 'mapbox://styles/mapbox/streets-v12',
                center: Config.MAPBOX.mapInitialCoords,
                zoom: Config.MAPBOX.mapZoom
            });

            this.data.zonesMap.addControl(new mapboxgl.NavigationControl());
        },

        // Mostrar detalles de la sucursal
        displayBranchDetails: async function (branchId) {
            try {
                // Mostrar spinner de carga
                this.showLoadingSpinner();

                // Realizar la petición a la API usando el endpoint BASE
                console.log(Config.ENDPOINTS.BRANCH.BASE + "aaaaaaaaaaaaaaaa")
                const response = await ApiClient.request(`${Config.ENDPOINTS.BRANCH.BASE}/${branchId}`, {
                    method: "GET"
                });

                // Verificar si se obtuvo respuesta
                if (!response) {
                    throw new Error('No se recibieron datos de la sucursal');
                }

                // Extraer los datos de la respuesta (puede estar en response o response.data)
                const branchData = response.data || response;

                // Guardar los detalles para uso futuro
                this.data.currentBranchDetails = branchData;

                // Actualizar la interfaz con los datos recibidos
                this.updateBranchUI(branchData);

                // Si la respuesta incluye coordenadas, actualizar el mapa
                if (branchData.address) {
                    const { longitude, latitude } = branchData.address;
                    this.updateMapLocation(longitude, latitude);
                } else if (branchData.longitude && branchData.latitude) {
                    this.updateMapLocation(branchData.longitude, branchData.latitude);
                }

                // Verificar qué pestaña está activa
                const activeTab = document.querySelector('.tab-button.active');
                if (activeTab) {
                    const activeTabId = activeTab.getAttribute('data-tab');
                    if (activeTabId === 'zones') {
                        await this.getBranchAssignedZone(branchId);
                        await this.loadAvailableZones(branchId);
                    } else if (activeTabId === 'metrics') {
                        await this.loadBranchMetrics(branchId);
                    }
                }

                // Ocultar el spinner de carga
                this.hideLoadingSpinner();

                // Ocultar mensaje de ninguna sucursal seleccionada (si existe)
                if (this.elements.noBranchSelected) {
                    this.hideNoBranchSelectedState();
                }

                // Para móvil: mostrar vista de detalles
                if (window.innerWidth < 768) {
                    this.showMobileView();
                }
            } catch (error) {
                console.error('Error al cargar los detalles de la sucursal:', error);
                this.hideLoadingSpinner();
                this.showErrorMessage(`Error al cargar los detalles de la sucursal: ${error.message || 'Desconocido'}`);
            }
        },

        // Mostrar vista móvil
        showMobileView: function() {
            if (!this.elements.mainContent) return;

            this.elements.mainContent.style.display = 'block';
            this.elements.mainContent.style.position = 'fixed';
            this.elements.mainContent.style.height = 'calc(100vh - 54px)';
            this.elements.mainContent.style.overflowY = 'auto';
            this.elements.mainContent.style.top = '51px';
            this.elements.mainContent.scrollTop = 0;

            document.body.style.overflow = 'hidden';
            document.body.classList.add('mobile-view-active');

            if (this.elements.appContainer) {
                this.elements.appContainer.classList.add('mobile-view-details');
            }
        },

        // Mostrar spinner de carga
        showLoadingSpinner: function () {
            // Verificar si ya existe un spinner
            if (document.getElementById('loading-spinner')) return;

            const spinner = document.createElement('div');
            spinner.id = 'loading-spinner';
            spinner.className = 'fixed top-0 left-0 w-full h-full flex items-center justify-center bg-gray-900 bg-opacity-50 z-50';
            spinner.innerHTML = '<i class="fas fa-spinner fa-spin text-4xl text-white"></i>';
            document.body.appendChild(spinner);
        },

        // Ocultar spinner de carga
        hideLoadingSpinner: function () {
            const spinner = document.getElementById('loading-spinner');
            if (spinner) {
                spinner.remove();
            }
        },

        // Mostrar mensaje de error
        showErrorMessage: function (message) {
            const errorMessage = document.createElement('div');
            errorMessage.className = 'fixed top-4 right-4 bg-red-500 text-white p-4 rounded-lg shadow-lg z-50';
            errorMessage.textContent = message;
            document.body.appendChild(errorMessage);

            setTimeout(() => {
                errorMessage.remove();
            }, 5000);
        },

        // Mostrar mensaje de éxito
        showSuccessMessage: function (message) {
            const successMessage = document.createElement('div');
            successMessage.className = 'fixed top-4 right-4 bg-green-500 text-white p-4 rounded-lg shadow-lg z-50';
            successMessage.textContent = message;
            document.body.appendChild(successMessage);

            setTimeout(() => {
                successMessage.remove();
            }, 3000);
        },

        // Actualizar interfaz con datos de la sucursal
        updateBranchUI: function(branchData) {
            if (!branchData) return;

            // Información básica
            this.updateElementText('branch-name', branchData.name);
            this.updateElementText('branch-code', branchData.code);

            // Dirección - manejar dos estructuras posibles de datos
            if (branchData.address) {
                // Si la dirección viene como objeto anidado
                this.updateElementText('branch-address_line1', branchData.address.address_line1);
                this.updateElementText('branch-address_line2', branchData.address.address_line2);
                this.updateElementText('branch-city', branchData.address.city);
                this.updateElementText('branch-state', branchData.address.state);
                this.updateElementText('branch-postal_code', branchData.address.postal_code);
                this.updateElementText('branch-latitude', branchData.address.latitude);
                this.updateElementText('branch-longitude', branchData.address.longitude);
                this.updateElementText('branch-is-main', branchData.address.is_main ? 'Si' : 'No');
            } else {
                // Si la dirección viene como propiedades directas
                this.updateElementText('branch-address_line1', branchData.address_line1);
                this.updateElementText('branch-address_line2', branchData.address_line2);
                this.updateElementText('branch-city', branchData.city);
                this.updateElementText('branch-state', branchData.state);
                this.updateElementText('branch-postal_code', branchData.postal_code);
                this.updateElementText('branch-latitude', branchData.latitude);
                this.updateElementText('branch-longitude', branchData.longitude);
                this.updateElementText('branch-is-main', branchData.is_main ? 'Si' : 'No');
            }

            // Contacto
            this.updateElementText('branch-contact_name', branchData.contact_name);
            this.updateElementText('branch-contact_email', branchData.contact_email);
            this.updateElementText('branch-contact_phone', branchData.contact_phone);

            // Horarios - manejar diferentes estructuras
            if (typeof branchData.operating_hours === 'string') {
                try {
                    // Si viene como string JSON
                    const hoursObj = JSON.parse(branchData.operating_hours);
                    this.updateElementText('branch-weekdays',
                        `${hoursObj.weekdays.start} - ${hoursObj.weekdays.end}`);
                    this.updateElementText('branch-weekends',
                        `${hoursObj.weekends.start} - ${hoursObj.weekends.end}`);
                } catch (e) {
                    console.error('Error al parsear horarios:', e);
                }
            } else if (branchData.operating_hours) {
                // Si viene como objeto
                this.updateElementText('branch-weekdays',
                    `${branchData.operating_hours.weekdays.start} - ${branchData.operating_hours.weekdays.end}`);
                this.updateElementText('branch-weekends',
                    `${branchData.operating_hours.weekends.start} - ${branchData.operating_hours.weekends.end}`);
            }

            // Estado de activación
            if (this.elements.statusToggle) {
                this.elements.statusToggle.checked = branchData.is_active;
            }

            if (this.elements.statusLabel) {
                this.elements.statusLabel.textContent = branchData.is_active ? 'Activo' : 'Inactivo';
                this.elements.statusLabel.className = branchData.is_active
                    ? 'ml-2 text-sm font-medium text-green-600'
                    : 'ml-2 text-sm font-medium text-red-600';
            }

            // Si hay métricas incluidas, actualizar la sección de métricas
            if (branchData.metrics) {
                this.updateMetricsUI(branchData.metrics);
            }
        },

        // Actualizar texto de un elemento
        updateElementText: function(elementId, text) {
            const element = document.getElementById(elementId);
            if (element) {
                element.textContent = text || '—';
            }
        },

        // Actualizar sección de métricas
        updateMetricsUI: function(metrics) {
            if (!metrics) return;

            // Mapeo de claves de API a IDs de elementos
            const metricsMap = {
                active_drivers: 'branch-metric-active_drivers',
                total_orders: 'branch-metric-total_orders',
                completed_orders: 'branch-metric-completed_orders',
                cancelled_orders: 'branch-metric-cancelled_orders',
                total_revenue: 'branch-metric-total_revenue',
                unique_customers: 'branch-metric-unique_customers',
                delivery_success_rate: 'branch-metric-delivery_success_rate',
                average_delivery_time: 'branch-metric-average_delivery_time',
                peak_hour_order_rate: 'branch-metric-peak_hour_order_rate'
            };

            // Actualizar cada métrica
            Object.entries(metricsMap).forEach(([apiKey, elementId]) => {
                const element = document.getElementById(elementId);
                if (!element) return;

                const value = metrics[apiKey];
                if (value === undefined || value === null) {
                    element.textContent = '—';
                    return;
                }

                // Formatear según el tipo de métrica
                if (apiKey === 'total_revenue') {
                    element.textContent = `$${parseFloat(value).toLocaleString('es-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    })}`;
                } else if (apiKey === 'delivery_success_rate') {
                    element.textContent = `${parseFloat(value).toFixed(1)}%`;
                } else if (apiKey === 'average_delivery_time') {
                    const hours = Math.floor(value / 60);
                    const minutes = Math.round(value % 60);

                    if (hours > 0) {
                        element.textContent = `${hours}h ${minutes}m`;
                    } else {
                        element.textContent = `${minutes} min`;
                    }
                } else {
                    element.textContent = typeof value === 'number'
                        ? value.toLocaleString('es-US')
                        : value.toString();
                }
            });
        },

        // Cargar métricas de una sucursal
        loadBranchMetrics: async function(branchId) {
            if (!branchId) return;

            try {
                // Mostrar indicador de carga
                const metricElements = document.querySelectorAll('[id^="branch-metric-"]');
                metricElements.forEach(element => {
                    element.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
                });

                // Realizar petición al endpoint de métricas
                const response = await ApiClient.request(`${Config.ENDPOINTS.BRANCH.METRICS}/${branchId}`, {
                    method: "GET"
                });

                // Actualizar la interfaz con las métricas
                if (response) {
                    this.updateMetricsUI(response);
                } else {
                    throw new Error('No se recibieron datos de métricas');
                }
            } catch (error) {
                console.error('Error al cargar métricas:', error);

                // Mostrar indicador de error en las métricas
                const metricElements = document.querySelectorAll('[id^="branch-metric-"]');
                metricElements.forEach(element => {
                    element.textContent = 'Error';
                    element.classList.add('text-red-500');
                });

                this.showErrorMessage(`Error al cargar métricas: ${error.message || 'Desconocido'}`);
            }
        },

        // Cargar zonas disponibles para una sucursal
        loadAvailableZones: async function(branchId) {
            if (!branchId) return;

            const zonesTable = document.getElementById('zones-table');
            if (!zonesTable) return;

            try {
                // Mostrar indicador de carga
                zonesTable.innerHTML = '<tr><td colspan="4" class="py-4 text-center">Cargando zonas disponibles...</td></tr>';

                // Realizar petición al endpoint de zonas disponibles
                const response = await ApiClient.request(`${Config.ENDPOINTS.BRANCH.AVAILABLE_ZONES}/${branchId}`, {
                    method: "GET"
                });

                // Limpiar tabla
                zonesTable.innerHTML = '';

                // Extraer datos de zonas (manejar diferentes estructuras de respuesta)
                let zonesData = [];
                if (Array.isArray(response)) {
                    zonesData = response;
                } else if (response && response.data && Array.isArray(response.data)) {
                    zonesData = response.data;
                }

                // Si no hay zonas, mostrar mensaje
                if (zonesData.length === 0) {
                    zonesTable.innerHTML = '<tr><td colspan="4" class="py-4 text-center">No hay zonas disponibles</td></tr>';
                    return;
                }

                // Renderizar cada zona en la tabla
                zonesData.forEach(zone => {
                    if (!zone) return;

                    const tr = document.createElement('tr');
                    tr.className = 'border-b hover:bg-gray-300 hover:cursor-pointer';

                    // Almacenar datos completos de la zona para uso posterior
                    tr.setAttribute('data-zone', JSON.stringify(zone));

                    // Determinar el tipo de zona basado en sus propiedades
                    const zoneType = zone.boundaries ? 'Polígono' : 'Circular';

                    // Formatear el radio si existe
                    const radius = zone.radius ? zone.radius.toFixed(1) : '-';

                    tr.innerHTML = `
                        <td class="py-2 px-4 text-sm">${zone.name || 'Sin nombre'}</td>
                        <td class="py-2 px-4 text-sm">${zoneType}</td>
                        <td class="py-2 px-4 text-sm">${radius}</td>
                        <td class="py-2 px-4 text-sm">
                            <button class="text-blue-500 hover:text-blue-700 mr-2 edit">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="text-red-500 hover:text-red-700 delete">
                                <i class="fas fa-trash-alt"></i>
                            </button>
                            <button class="text-green-500 hover:text-green-700 set ml-3">
                                <i class="fa-solid fa-circle-check"></i>
                            </button>
                        </td>
                    `;

                    zonesTable.appendChild(tr);
                });

                // Configurar eventos para los botones de cada zona
                this.setZoneTableClickEvent();

                // Dibujar la primera zona en el mapa para visualización inicial
                if (zonesData.length > 0 && this.data.zonesMap) {
                    this.drawZonesOnMap(this.data.zonesMap, [zonesData[0]]);
                }
            } catch (error) {
                console.error('Error al cargar zonas disponibles:', error);
                zonesTable.innerHTML =
                    '<tr><td colspan="4" class="py-4 text-center text-red-500">Error al cargar zonas</td></tr>';

                this.showErrorMessage(`Error al cargar zonas disponibles: ${error.message || 'Desconocido'}`);
            }
        },

        // Obtener la zona asignada a una sucursal
        getBranchAssignedZone: async function(branchId) {
            if (!branchId) return null;

            const zoneDisplay = document.getElementById('branch-zone');
            if (!zoneDisplay) return null;

            try {
                // Limpiar visualización actual
                zoneDisplay.textContent = 'Cargando...';

                // Realizar petición para obtener los detalles completos de la sucursal
                const response = await ApiClient.request(`${Config.ENDPOINTS.BRANCH.BASE}/${branchId}`, {
                    method: "GET"
                });

                // Extraer la información de la zona
                let zoneData = null;

                if (response && response.data && response.data.zone_id) {
                    // Si tenemos el ID de zona, obtener los detalles de la zona
                    try {
                        const zoneResponse = await ApiClient.request(`${Config.ENDPOINTS.BRANCH.ZONES}/${response.data.zone_id}`, {
                            method: "GET"
                        });

                        if (zoneResponse && (zoneResponse.data || zoneResponse.id)) {
                            zoneData = zoneResponse.data || zoneResponse;
                        }
                    } catch (zoneError) {
                        console.error('Error al obtener detalles de zona:', zoneError);
                    }
                } else if (response && response.zone_id) {
                    // Estructura alternativa
                    try {
                        const zoneResponse = await ApiClient.request(`${Config.ENDPOINTS.BRANCH.ZONES}/${response.zone_id}`, {
                            method: "GET"
                        });

                        if (zoneResponse && (zoneResponse.data || zoneResponse.id)) {
                            zoneData = zoneResponse.data || zoneResponse;
                        }
                    } catch (zoneError) {
                        console.error('Error al obtener detalles de zona:', zoneError);
                    }
                }

                if (zoneData) {
                    // Actualizar la zona en la interfaz
                    const zoneType = zoneData.boundaries ? 'polígono' : 'circular';
                    const zoneRadius = zoneData.radius ? `${zoneData.radius} km` : '';

                    zoneDisplay.innerHTML = `
                        <span class="font-medium">${zoneData.name || 'Sin nombre'}</span>
                        <span class="badge-status badge-blue ml-2">${zoneType}</span>
                        ${zoneRadius ? `<span class="text-sm text-gray-500 ml-2">(Radio: ${zoneRadius})</span>` : ''}
                    `;

                    // Dibujar la zona en el mapa
                    if (this.data.zonesMap && this.data.zonesMap.isStyleLoaded()) {
                        this.drawZonesOnMap(this.data.zonesMap, [zoneData]);
                    }

                    // Resaltar la zona asignada en la tabla
                    this.highlightAssignedZone(zoneData.id);

                    return zoneData;
                } else {
                    zoneDisplay.innerHTML = '<span class="text-gray-500">Sin zona asignada</span>';
                    return null;
                }
            } catch (error) {
                console.error('Error al obtener la zona asignada:', error);
                zoneDisplay.innerHTML = '<span class="text-red-500">Error al cargar zona</span>';
                return null;
            }
        },

        // Resaltar zona asignada en la tabla
        highlightAssignedZone: function(assignedZoneId) {
            if (!assignedZoneId) return;

            // Buscar todas las filas de zonas
            const zoneRows = document.querySelectorAll('#zones-table tr');
            if (!zoneRows || zoneRows.length === 0) return;

            zoneRows.forEach(row => {
                // Remover cualquier highlight previo
                row.classList.remove('bg-green-100');

                // Obtener datos de la zona
                const zoneDataString = row.getAttribute('data-zone');
                if (zoneDataString) {
                    try {
                        const zoneData = JSON.parse(zoneDataString);
                        // Si es la zona asignada, resaltarla
                        if (zoneData.id === assignedZoneId) {
                            row.classList.add('bg-green-100');

                            // Añadir un indicador visual si no existe ya
                            const tdWithButtons = row.querySelector('td:last-child');
                            if (tdWithButtons && !tdWithButtons.querySelector('.badge-green')) {
                                const assignedBadge = document.createElement('span');
                                assignedBadge.className = 'badge-status badge-green ml-2';
                                assignedBadge.textContent = 'Asignada';
                                tdWithButtons.prepend(assignedBadge);
                            }
                        }
                    } catch (e) {
                        console.error('Error al parsear datos de zona:', e);
                    }
                }
            });
        },

        // Actualizar ubicación en el mapa
        updateMapLocation: function (lng, lat) {
            if (!this.data.map) return;

            // Asegurarse de que el mapa esté visible primero
            setTimeout(() => {
                this.data.map.resize();

                const lngLat = [parseFloat(lng), parseFloat(lat)];
                if (isNaN(lngLat[0]) || isNaN(lngLat[1])) {
                    console.error('Coordenadas inválidas:', lng, lat);
                    return;
                }

                // Eliminar marcador existente
                if (this.data.currentMarker) {
                    this.data.currentMarker.remove();
                }

                // Crear nuevo marcador
                this.data.currentMarker = new mapboxgl.Marker()
                    .setLngLat(lngLat)
                    .addTo(this.data.map);

                // Centrar mapa en la nueva ubicación
                this.data.map.flyTo({
                    center: lngLat,
                    zoom: Config.MAPBOX.mapZoomCloser
                });
            }, 100);
        },

        // Configurar eventos en la tabla de zonas
        setZoneTableClickEvent: function () {
            const rows = document.querySelectorAll('#zones-table tr');
            if (!rows || rows.length === 0) return;

            rows.forEach(tr => {
                // Botón para establecer zona
                const setBtn = tr.querySelector('.set');
                if (setBtn) {
                    setBtn.addEventListener('click', (event) => {
                        event.stopPropagation();
                        this.handleSetZone(tr);
                    });
                }

                // Botón para editar zona
                const editBtn = tr.querySelector('.edit');
                if (editBtn) {
                    editBtn.addEventListener('click', (event) => {
                        event.stopPropagation();
                        this.handleEditZone(tr);
                    });
                }

                // Botón para eliminar zona
                const deleteBtn = tr.querySelector('.delete');
                if (deleteBtn) {
                    deleteBtn.addEventListener('click', (event) => {
                        event.stopPropagation();
                        this.handleDeleteZone(tr);
                    });
                }

                // Clic en la fila para visualizar la zona
                tr.addEventListener('click', () => {
                    this.handleZoneRowClick(tr);
                });
            });
        },

        // Manejar asignación de zona
        handleSetZone: function(tr) {
            if (!tr) return;

            let dataZone = tr.getAttribute('data-zone');
            if (!dataZone || dataZone.length === 0) return;

            try {
                dataZone = JSON.parse(dataZone);

                Dialog("Establecer Zona", `¿Quiere establecer la zona '${dataZone.name}' a la sucursal?`,
                    { cancelButton: true, confirmButton: true, confirmText: 'Establecer' },
                    () => { },
                    async () => {
                        try {
                            // Mostrar indicador de carga
                            this.showLoadingSpinner();

                            // Usar el endpoint correcto para asignar zona
                            const response = await ApiClient.request(`${Config.ENDPOINTS.BRANCH.ASSIGN_ZONE}/${this.data.branchId}`, {
                                method: "POST",
                                body: JSON.stringify({ zone_id: dataZone.id })
                            });

                            this.hideLoadingSpinner();

                            // Mostrar mensaje de éxito
                            Dialog("Zona Establecida", `Se estableció la zona "${dataZone.name}" a la sucursal`,
                                { confirmButton: true, confirmText: 'Aceptar' },
                                null,
                                () => {
                                    // Actualizar la UI para reflejar la asignación
                                    const zoneElement = document.getElementById('branch-zone');
                                    if (zoneElement) {
                                        const zoneType = dataZone.boundaries ? 'polígono' : 'circular';
                                        const zoneRadius = dataZone.radius ? `${dataZone.radius} km` : '';

                                        zoneElement.innerHTML = `
                                            <span class="font-medium">${dataZone.name}</span>
                                            <span class="badge-status badge-blue ml-2">${zoneType}</span>
                                            ${zoneRadius ? `<span class="text-sm text-gray-500 ml-2">(Radio: ${zoneRadius})</span>` : ''}
                                        `;
                                    }

                                    // Resaltar la zona en la tabla
                                    this.highlightAssignedZone(dataZone.id);

                                    // Dibujar la zona en el mapa
                                    if (this.data.zonesMap) {
                                        this.drawZonesOnMap(this.data.zonesMap, [dataZone]);
                                    }
                                }
                            );
                        } catch (error) {
                            console.error('Error al asignar zona:', error);
                            this.hideLoadingSpinner();

                            Dialog("Error", `No se pudo asignar la zona: ${error.message || "Error desconocido"}`,
                                { confirmButton: true, confirmText: 'Aceptar' });
                        }
                    }
                );
            } catch (e) {
                console.error('Error al parsear datos de zona:', e);
                this.showErrorMessage('Error al procesar datos de la zona');
            }
        },

        // Manejar edición de zona
        handleEditZone: function(tr) {
            let dataZone = tr.getAttribute('data-zone');
            if (!dataZone || dataZone.length === 0) return;

            try {
                dataZone = JSON.parse(dataZone);
                Dialog("Editar Zona", `Formulario de edición para la zona: ${dataZone.name} (ID: ${dataZone.id})`,
                    { confirmButton: true, confirmText: 'Aceptar' });

                // Aquí implementarías la lógica para abrir un formulario de edición
            } catch (e) {
                console.error('Error al parsear datos de zona:', e);
                this.showErrorMessage('Error al procesar datos de la zona');
            }
        },

        // Manejar eliminación de zona
        handleDeleteZone: function(tr) {
            let dataZone = tr.getAttribute('data-zone');
            if (!dataZone || dataZone.length === 0) return;

            try {
                dataZone = JSON.parse(dataZone);

                Dialog("Eliminar Zona",
                    `<span>¿Quiere eliminar la zona?</span>
                    <br><span>Nombre: ${dataZone.name}</span>
                    <br><span>Id de zona: ${dataZone.id}</span>
                    <br><span>Tipo de zona: ${dataZone.boundaries ? 'Polígono' : 'Circular'}</span>`,
                    { cancelButton: true, confirmButton: true, confirmText: 'Eliminar Zona' },
                    () => { },
                    async () => {
                        try {
                            // Mostrar indicador de carga
                            this.showLoadingSpinner();

                            // Realizar la petición a la API
                            await ApiClient.request(`${Config.ENDPOINTS.BRANCH.ZONES}/${dataZone.id}`, {
                                method: "DELETE"
                            });

                            this.hideLoadingSpinner();

                            // Mostrar mensaje de éxito
                            Dialog("Zona Eliminada", "La zona se ha eliminado correctamente",
                                { confirmButton: true, confirmText: 'Aceptar' },
                                null,
                                () => {
                                    // Recargar zonas disponibles
                                    if (this.data.branchId) {
                                        this.loadAvailableZones(this.data.branchId);

                                        // También actualizar la zona asignada ya que podría haber cambiado
                                        this.getBranchAssignedZone(this.data.branchId);
                                    }
                                }
                            );
                        } catch (error) {
                            console.error('Error al eliminar zona:', error);
                            this.hideLoadingSpinner();

                            Dialog("Error", `No se pudo eliminar la zona: ${error.message || "Error desconocido"}`,
                                { confirmButton: true, confirmText: 'Aceptar' });
                        }
                    }
                );
            } catch (e) {
                console.error('Error al parsear datos de zona:', e);
                this.showErrorMessage('Error al procesar datos de la zona');
            }
        },

        // Manejar clic en fila de zona
        handleZoneRowClick: function(tr) {
            // Remover resaltado de otras filas
            const activeRow = document.querySelector('#zones-table tr.bg-blue-300');
            if (activeRow) {
                activeRow.classList.remove('bg-blue-300');
            }

            // Resaltar la fila actual
            tr.classList.add('bg-blue-300');

            // Obtener datos de la zona
            let dataZone = tr.getAttribute('data-zone');
            if (dataZone && dataZone.length > 0) {
                try {
                    dataZone = JSON.parse(dataZone);

                    // Dibujar la zona en el mapa
                    if (this.data.zonesMap) {
                        this.drawZonesOnMap(this.data.zonesMap, [dataZone]);
                    }
                } catch (e) {
                    console.error('Error al parsear datos de zona:', e);
                }
            }
        },

        // Dibujar zonas en el mapa
        drawZonesOnMap: function (map, zones, options = {}) {
            if (!map || !map.isStyleLoaded()) {
                console.error('El mapa no está inicializado o no ha terminado de cargar');
                return;
            }

            // Configuración por defecto
            const config = {
                radiusMultiplier: options.radiusMultiplier || Config.MAPBOX.mapRadiusMultiplier || 1000,
                addLabels: options.addLabels !== false
            };

            // Dibujar cada zona
            zones.forEach(zone => {
                if (!zone) return;

                const zoneId = zone.id || `zone-${Math.random().toString(36).substr(2, 9)}`;
                const sourceId = `zone-source-${zoneId}`;
                const layerId = `zone-layer-${zoneId}`;
                const labelId = `zone-label-${zoneId}`;

                // Limpiar capas existentes si ya existen
                if (map.getLayer(layerId)) map.removeLayer(layerId);
                if (map.getLayer(labelId)) map.removeLayer(labelId);
                if (map.getSource(sourceId)) map.removeSource(sourceId);

                // Crear geojson según el tipo de zona
                let geoJSON;
                let coordinates = [];

                try {
                    if (zone.type === 'circle' || (!zone.boundaries && (zone.center_point || zone.center))) {
                        const center = zone.center || zone.center_point;
                        if (!center || !Array.isArray(center) || center.length < 2) {
                            console.error('Datos de centro inválidos para zona:', zoneId);
                            return;
                        }

                        geoJSON = this.createCircleGeoJSON(
                            center,
                            (zone.radius || 1) * config.radiusMultiplier
                        );

                        // Extraer coordenadas para el fitBounds
                        coordinates = geoJSON.geometry.coordinates[0];
                    } else {
                        // Asegurar que el polígono esté cerrado
                        coordinates = [...(zone.coordinates || zone.boundaries || [])];

                        if (coordinates.length === 0) {
                            console.error('Coordenadas inválidas para zona:', zoneId);
                            return;
                        }

                        // Cerrar el polígono si no está cerrado
                        const first = coordinates[0];
                        const last = coordinates[coordinates.length - 1];
                        if (first[0] !== last[0] || first[1] !== last[1]) {
                            coordinates.push(first);
                        }

                        geoJSON = {
                            type: 'Feature',
                            geometry: {
                                type: 'Polygon',
                                coordinates: [coordinates]
                            }
                        };
                    }

                    // Añadir la zona al mapa
                    map.addSource(sourceId, {
                        type: 'geojson',
                        data: geoJSON
                    });

                    map.addLayer({
                        id: layerId,
                        type: 'fill',
                        source: sourceId,
                        paint: {
                            'fill-color': zone.color || '#3b82f6',
                            'fill-opacity': zone.opacity || 0.3,
                            'fill-outline-color': zone.outlineColor || zone.color || '#1d4ed8'
                        }
                    });

                    // Añadir etiqueta si está habilitado
                    if (config.addLabels && zone.name) {
                        map.addLayer({
                            id: labelId,
                            type: 'symbol',
                            source: sourceId,
                            layout: {
                                'text-field': zone.name,
                                'text-size': zone.labelSize || 12,
                                'text-offset': zone.labelOffset || [0, 0.6]
                            },
                            paint: {
                                'text-color': zone.labelColor || '#1e293b',
                                'text-halo-color': zone.labelHaloColor || '#ffffff',
                                'text-halo-width': zone.labelHaloWidth || 2
                            }
                        });
                    }

                    // Ajustar el mapa para mostrar la zona completa
                    if (coordinates && coordinates.length > 0) {
                        const bounds = coordinates.reduce((acc, coord) => {
                            if (!Array.isArray(coord) || coord.length < 2) return acc;

                            return [
                                [Math.min(acc[0][0], coord[0]), Math.min(acc[0][1], coord[1])],
                                [Math.max(acc[1][0], coord[0]), Math.max(acc[1][1], coord[1])]
                            ];
                        }, [[coordinates[0][0], coordinates[0][1]], [coordinates[0][0], coordinates[0][1]]]);

                        map.fitBounds(bounds, { padding: 50 });
                    }
                } catch (error) {
                    console.error(`Error al dibujar la zona ${zoneId}:`, error);
                }
            });
        },

        // Crear GeoJSON para círculo
        createCircleGeoJSON: function (center, radius) {
            if (!center || !radius) return null;

            const steps = 64;
            const coords = [];

            for (let i = 0; i < steps; i++) {
                const angle = (i / steps) * (2 * Math.PI);
                const x = center[0] + (radius * Math.cos(angle) / (111320 * Math.cos(center[1] * Math.PI / 180)));
                const y = center[1] + (radius * Math.sin(angle) / 110574);
                coords.push([x, y]);
            }

            // Cerrar el círculo
            coords.push(coords[0]);

            return {
                type: 'Feature',
                geometry: {
                    type: 'Polygon',
                    coordinates: [coords]
                }
            };
        },

        // Mostrar modal de zona
        showZoneModal: function () {
            // Inicializar mapa de selección si no existe
            if (!this.data.zoneSelectionMap) {
                this.initZoneSelectionMap();
            } else {
                // Limpiar capa existente si hay alguna
                if (this.data.zoneSelectionMap.getLayer && this.data.zoneSelectionMap.getLayer('zone-layer')) {
                    this.data.zoneSelectionMap.removeLayer('zone-layer');
                    this.data.zoneSelectionMap.removeSource('zone');
                }
            }

            // Mostrar el modal
            if (this.elements.zoneModal) {
                this.elements.zoneModal.classList.add('active');
                document.body.style.overflow = 'hidden';
            }
        },

        // Inicializar mapa para selección de zona
        initZoneSelectionMap: function () {
            if (!this.elements.zoneSelectionMap) return;

            this.data.zoneSelectionMap = new mapboxgl.Map({
                container: this.elements.zoneSelectionMap,
                style: 'mapbox://styles/mapbox/streets-v12',
                center: Config.MAPBOX.mapInitialCoords,
                zoom: Config.MAPBOX.mapZoom
            });

            // Añadir controles de navegación
            this.data.zoneSelectionMap.addControl(new mapboxgl.NavigationControl());

            // Esperar a que el mapa se cargue completamente
            this.data.zoneSelectionMap.on('load', () => {
                // Configurar dibujo de zonas
                this.setupZoneDrawing();
            });
        },

        // Configurar dibujo de zonas
        setupZoneDrawing: function () {
            if (!this.data.zoneSelectionMap || !this.elements.zoneTypeSelect) return;

            let isDrawing = false;
            let coordinates = [];

            // Escuchar cambios en el tipo de zona
            this.elements.zoneTypeSelect.addEventListener('change', (e) => {
                this.toggleRadiusControl(e.target.value === 'circle');

                // Limpiar dibujo existente
                if (this.data.zoneSelectionMap.getSource && this.data.zoneSelectionMap.getSource('zone')) {
                    this.data.zoneSelectionMap.getSource('zone').setData({
                        type: 'Feature',
                        geometry: {
                            type: 'Polygon',
                            coordinates: []
                        }
                    });
                    coordinates = [];
                    this.data.isZoneSelected = false;
                }
            });

            // Escuchar clics en el mapa para dibujar
            this.data.zoneSelectionMap.on('click', (e) => {
                const zoneType = this.elements.zoneTypeSelect.value;

                if (zoneType === 'circle') {
                    // Para zona circular, solo necesitamos un punto central
                    coordinates = [e.lngLat.lng, e.lngLat.lat];
                    this.drawZoneOnSelectionMap(coordinates);
                    this.data.isZoneSelected = true;
                } else {
                    // Para polígono, recolectamos múltiples puntos
                    if (!isDrawing) {
                        isDrawing = true;
                        coordinates = [];
                    }

                    coordinates.push([e.lngLat.lng, e.lngLat.lat]);

                    if (coordinates.length > 2) {
                        this.drawZoneOnSelectionMap(coordinates);
                    }
                }
            });

            // Doble clic para finalizar polígono
            this.data.zoneSelectionMap.on('dblclick', () => {
                if (isDrawing && this.elements.zoneTypeSelect.value === 'polygon') {
                    isDrawing = false;

                    // Cerrar el polígono
                    if (coordinates.length > 2) {
                        coordinates.push(coordinates[0]);
                        this.drawZoneOnSelectionMap(coordinates);
                        this.data.isZoneSelected = true;
                    }
                }
            });
        },

        // Dibujar zona en el mapa de selección
        drawZoneOnSelectionMap: function (coords) {
            if (!this.data.zoneSelectionMap || !this.elements.zoneTypeSelect || !coords) return;

            const zoneType = this.elements.zoneTypeSelect.value;

            // Limpiar capa existente
            if (this.data.zoneSelectionMap.getLayer && this.data.zoneSelectionMap.getLayer('zone-layer')) {
                this.data.zoneSelectionMap.removeLayer('zone-layer');
                this.data.zoneSelectionMap.removeSource('zone');
            }

            let geoJSON;

            if (zoneType === 'circle') {
                // Crear un círculo alrededor del punto
                const center = coords;
                const radius = parseFloat(this.elements.zoneRadiusInput.value) * Config.MAPBOX.mapRadiusMultiplier;

                geoJSON = this.createCircleGeoJSON(center, radius);
            } else {
                // Crear un polígono con las coordenadas
                geoJSON = {
                    type: 'Feature',
                    geometry: {
                        type: 'Polygon',
                        coordinates: [coords]
                    }
                };
            }

            // Añadir la nueva capa
            this.data.zoneSelectionMap.addSource('zone', {
                type: 'geojson',
                data: geoJSON
            });

            this.data.zoneSelectionMap.addLayer({
                id: 'zone-layer',
                type: 'fill',
                source: 'zone',
                paint: {
                    'fill-color': '#3b82f6',
                    'fill-opacity': 0.3,
                    'fill-outline-color': '#1d4ed8'
                }
            });
        },

        // Mostrar/ocultar control de radio
        toggleRadiusControl: function (show) {
            this.data.isZoneSelected = false;

            if (this.elements.radiusControl) {
                this.elements.radiusControl.style.display = show ? 'block' : 'none';
            }

            // Limpiar capa existente
            if (this.data.zoneSelectionMap && this.data.zoneSelectionMap.getLayer) {
                if (this.data.zoneSelectionMap.getLayer('zone-layer')) {
                    this.data.zoneSelectionMap.removeLayer('zone-layer');
                    this.data.zoneSelectionMap.removeSource('zone');
                }
            }
        },

        // Ocultar modal de zona
        hideZoneModal: function () {
            if (this.elements.zoneModal) {
                this.elements.zoneModal.classList.remove('active');
                document.body.style.overflow = '';
            }
        },

        // Manejar guardado de zona
        handleSaveZone: async function () {
            // Validar datos
            const nameElement = document.getElementById('branch-zone-name');
            const codeElement = document.getElementById('branch-zone-code');
            const baseRateElement = document.getElementById('branch-zone-base-rate');
            const isActiveElement = document.getElementById('branch-zone-is-active');
            const maxDeliveryTimeElement = document.getElementById('branch-zone-max-delivery-time');
            const priorityLevelElement = document.getElementById('priority-level');

            // Verificar campos obligatorios
            if (!nameElement || !codeElement) {
                this.showErrorMessage('Faltan campos obligatorios en el formulario');
                return;
            }

            // Validar que se haya seleccionado una zona en el mapa
            if (!this.data.isZoneSelected) {
                const coordsError = document.getElementById('branch-zone-coords-error');
                if (coordsError) coordsError.classList.remove('hidden');
                return;
            }

            // Validar nombre y código
            if (!nameElement.value) {
                const nameError = document.getElementById('branch-zone-name-error');
                if (nameError) nameError.classList.remove('hidden');
                return;
            }

            if (!codeElement.value) {
                const codeError = document.getElementById('branch-zone-code-error');
                if (codeError) codeError.classList.remove('hidden');
                return;
            }

            try {
                // Mostrar indicador de carga
                if (this.elements.saveZoneBtn) {
                    this.elements.saveZoneBtn.disabled = true;
                    this.elements.saveZoneBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
                }

                // Crear objeto con datos de la zona
                const zoneData = {
                    name: nameElement.value,
                    code: codeElement.value,
                    base_rate: parseFloat(baseRateElement?.value || 0),
                    is_active: isActiveElement?.checked || true,
                    max_delivery_time: parseInt(maxDeliveryTimeElement?.value || 0),
                    priority_level: parseInt(priorityLevelElement?.value || 0),
                    branch_id: this.data.branchId
                };

                // Agregar datos según el tipo de zona
                if (this.elements.zoneTypeSelect.value === 'circle') {
                    const center = this.data.zoneSelectionMap.getCenter();
                    zoneData.center_point = [center.lng, center.lat];
                    zoneData.radius = parseFloat(this.elements.zoneRadiusInput.value);
                } else {
                    // Para polígono, obtener coordenadas
                    if (this.data.zoneSelectionMap.getSource && this.data.zoneSelectionMap.getSource('zone')) {
                        const sourceData = this.data.zoneSelectionMap.getSource('zone')._data;
                        if (sourceData && sourceData.geometry && sourceData.geometry.coordinates) {
                            zoneData.boundaries = sourceData.geometry.coordinates[0];
                        }
                    }
                }

                // Enviar petición a la API
                const response = await ApiClient.request(Config.ENDPOINTS.BRANCH.ZONES, {
                    method: "POST",
                    body: JSON.stringify(zoneData)
                });

                // Ocultar modal
                this.hideZoneModal();

                // Mostrar mensaje de éxito
                Dialog("Zona Guardada", "La zona se ha guardado exitosamente", {
                    confirmButton: true,
                    confirmText: 'Aceptar'
                }, null, () => {
                    // Recargar zonas
                    if (this.data.branchId) {
                        this.loadAvailableZones(this.data.branchId);
                        this.getBranchAssignedZone(this.data.branchId);
                    }
                });
            } catch (error) {
                console.error('Error al guardar zona:', error);

                Dialog("Error", `No se pudo guardar la zona: ${error.message || "Error desconocido"}`, {
                    confirmButton: true,
                    confirmText: 'Aceptar'
                });
            } finally {
                // Restaurar botón
                if (this.elements.saveZoneBtn) {
                    this.elements.saveZoneBtn.disabled = false;
                    this.elements.saveZoneBtn.innerHTML = 'Guardar Zona';
                }
            }
        },

        // Configurar botones de editar
        setupEditButtons: function () {
            const editButton = document.querySelector('.edit-branch-btn');
            if (!editButton) return;

            editButton.addEventListener('click', (event) => {
                event.stopPropagation();

                if (this.data.branchId) {
                    // Redirigir al formulario de edición
                    window.location.href = `./branchesFormEdit.html?Id=${this.data.branchId}`;
                } else {
                    this.showErrorMessage('No se ha seleccionado ninguna sucursal para editar');
                }
            });
        },

        // Configurar botones de eliminar
        setupDeleteButtons: function () {
            const deleteButton = document.querySelector('.delete-branch-btn');
            if (!deleteButton) return;

            deleteButton.addEventListener('click', (event) => {
                event.stopPropagation();

                if (!this.data.branchId) {
                    this.showErrorMessage('No se ha seleccionado ninguna sucursal para eliminar');
                    return;
                }

                const branchName = document.getElementById('branch-name')?.textContent || 'esta sucursal';

                Dialog("Eliminar Sucursal",
                    `¿Quiere eliminar la sucursal "${branchName}"?`,
                    { cancelButton: true, confirmButton: true, confirmText: 'Eliminar' },
                    () => { },
                    async () => {
                        try {
                            this.showLoadingSpinner();

                            // En este punto implementarías la llamada a la API para eliminar
                            // await ApiClient.request(`${Config.ENDPOINTS.BRANCH.BASE}/${this.data.branchId}`, {
                            //     method: "DELETE"
                            // });

                            this.hideLoadingSpinner();

                            Dialog("Sucursal Eliminada", "La sucursal ha sido eliminada correctamente",
                                { confirmButton: true, confirmText: 'Aceptar' },
                                null,
                                () => {
                                    // Redirigir a la lista de sucursales
                                    window.location.href = './branches.html';
                                }
                            );
                        } catch (error) {
                            this.hideLoadingSpinner();
                            Dialog("Error", `No se pudo eliminar la sucursal: ${error.message || "Error desconocido"}`,
                                { confirmButton: true, confirmText: 'Aceptar' });
                        }
                    }
                );
            });
        },

        // Manejar cambio de pestañas
        handleTabButtonClick: function (event) {
            // Actualizar estado de las pestañas
            this.elements.tabButtons.forEach(btn => btn.classList.remove('active'));
            this.elements.tabContents.forEach(content => content.classList.remove('active'));

            event.currentTarget.classList.add('active');
            const tabId = event.currentTarget.getAttribute('data-tab');
            document.getElementById(`tab-${tabId}`)?.classList.add('active');

            // Acciones específicas según la pestaña
            if (tabId === 'zones' && this.data.zonesMap) {
                setTimeout(() => {
                    this.data.zonesMap.resize();

                    // Cargar zonas si tenemos ID de sucursal
                    if (this.data.branchId) {
                        this.getBranchAssignedZone(this.data.branchId);
                        this.loadAvailableZones(this.data.branchId);
                    }
                }, 100);
            } else if (tabId === 'metrics' && this.data.branchId) {
                // Cargar métricas
                this.loadBranchMetrics(this.data.branchId);
            } else if (tabId === 'details' && this.data.map) {
                // Ajustar mapa
                setTimeout(() => {
                    this.data.map.resize();
                }, 100);
            }
        },

        // Configurar eventos
        setupEventListeners: function () {
            // Pestañas
            this.elements.tabButtons.forEach(button => {
                button.addEventListener('click', this.handleTabButtonClick.bind(this));
            });

            // Botón de actualizar
            if (this.elements.refreshButton) {
                this.elements.refreshButton.addEventListener('click', this.refreshData.bind(this));
            }

            // Botón para añadir zona
            if (this.elements.addZoneBtn) {
                this.elements.addZoneBtn.addEventListener('click', this.showZoneModal.bind(this));
            }

            // Modal de zona
            if (this.elements.closeZoneModal) {
                this.elements.closeZoneModal.addEventListener('click', this.hideZoneModal.bind(this));
            }

            if (this.elements.cancelZoneBtn) {
                this.elements.cancelZoneBtn.addEventListener('click', this.hideZoneModal.bind(this));
            }

            if (this.elements.saveZoneBtn) {
                this.elements.saveZoneBtn.addEventListener('click', this.handleSaveZone.bind(this));
            }

            // Eventos de redimensionamiento
            window.addEventListener('resize', this.checkResponsive.bind(this));
        },

        // Mostrar estado de ninguna sucursal seleccionada
        showNoBranchSelectedState: function () {
            if (this.elements.noBranchSelected && this.elements.contentArea) {
                this.elements.noBranchSelected.classList.remove('hidden');
                this.elements.contentArea.classList.add('hidden');
            }
        },

        // Ocultar estado de ninguna sucursal seleccionada
        hideNoBranchSelectedState: function () {
            if (this.elements.noBranchSelected && this.elements.contentArea) {
                this.elements.noBranchSelected.classList.add('hidden');
                this.elements.contentArea.classList.remove('hidden');
            }
        },

        // Manejar vista móvil
        handleMobileBack: function () {
            if (this.elements.appContainer) {
                this.elements.appContainer.classList.remove('mobile-view-details');
            }

            document.body.classList.remove('mobile-view-active');

            if (this.elements.sidebar) {
                this.elements.sidebar.style.display = 'block';
            }

            if (this.elements.mainContent) {
                this.elements.mainContent.style.removeProperty('position');
                this.elements.mainContent.style.removeProperty('height');
            }

            document.body.style.overflow = '';
        },

        // Verificar tamaño de pantalla
        checkResponsive: function () {
            if (window.innerWidth >= 768) {
                if (this.elements.appContainer) {
                    this.elements.appContainer.classList.remove('mobile-view-details');
                }

                document.body.classList.remove('mobile-view-active');

                if (this.elements.sidebar) {
                    this.elements.sidebar.style = '';
                }

                if (this.elements.mainContent) {
                    this.elements.mainContent.style = '';
                }

                document.body.style.overflow = '';
            } else {
                if (this.elements.appContainer && this.elements.appContainer.classList.contains('mobile-view-details')) {
                    document.body.classList.add('mobile-view-active');
                }
            }
        },

        // Actualizar datos
        refreshData: function () {
            if (!this.elements.refreshButton || !this.elements.refreshIcon) return;

            // Deshabilitar botón y mostrar animación
            this.elements.refreshButton.disabled = true;
            this.elements.refreshIcon.classList.add('loading-spinner');

            // Recargar datos
            if (this.data.branchId) {
                this.displayBranchDetails(this.data.branchId);
            }

            // Restaurar botón después de un tiempo
            setTimeout(() => {
                this.elements.refreshIcon.classList.remove('loading-spinner');
                this.elements.refreshButton.disabled = false;
                this.showSuccessMessage('Datos actualizados correctamente');
            }, 1000);
        }
    };

    // Inicializar la aplicación
    app.init();
});
