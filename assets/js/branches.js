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
            filterToggle: document.getElementById('filter-toggle'),
            filterPanel: document.getElementById('filter-panel'),
            filterIcon: document.getElementById('filter-icon'),
            mobileBackBtn: document.getElementById('mobile-back'),
            refreshButton: document.getElementById('refresh-button'),
            refreshIcon: document.getElementById('refresh-icon'),
            mainContent: document.getElementById('main-content'),
            contentArea: document.getElementById('content-area'),
            sidebar: document.querySelector('.sidebar'),
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
            paginationInfo: document.getElementById('pagination-info'),
            paginationStart: document.getElementById('pagination-start'),
            paginationEnd: document.getElementById('pagination-end'),
            paginationTotal: document.getElementById('pagination-total'),
            paginationPrev: document.getElementById('pagination-prev'),
            paginationNext: document.getElementById('pagination-next'),
            paginationButtons: document.getElementById('pagination-buttons'),
            statusToggle: document.getElementById('user-status-toggle'),
            statusLabel: document.getElementById('status-label'),
            branchesListContainer: document.getElementById('branches-list'),

        },
        data: {
            isZoneSelected: false,
            currentBranchId: null,
            currentBranchDetails: null,
            currentBranchesListPage: 1,
            totalBranches: 0,
            map: null,
            zonesMap: null,
            currentMarker: null,
            currentBranchToDelete: null,
            totalPages: 1,
            pageSize: 10,
            currentFilters: {},
            lastLoadedBranches: [],
            isLoading: false,

        },
        init: function () {
            this.showNoBranchSelectedState();
            this.initMap();
            this.initZonesMap();
            this.setupEventListeners();
            this.loadBranchesList(1);

    // Configurar eventos de paginación
    if (this.elements.paginationPrev) {
        this.elements.paginationPrev.addEventListener('click', () => {
            if (this.data.currentBranchesListPage > 1) {
                this.loadBranchesList(this.data.currentBranchesListPage - 1, this.data.currentFilters);
            }
        });
    }

    if (this.elements.paginationNext) {
        this.elements.paginationNext.addEventListener('click', () => {
            if (this.data.currentBranchesListPage < this.data.totalPages) {
                this.loadBranchesList(this.data.currentBranchesListPage + 1, this.data.currentFilters);
            }
        });
    }

    // Configurar evento para el toggle de estado
    if (this.elements.statusToggle) {
        this.elements.statusToggle.addEventListener('change', this.handleStatusToggle.bind(this));
    }


            // Evento click de las sucursales
            const branchItems = document.querySelectorAll('.branch-item');
            if (branchItems && branchItems.length > 0) {
                Array.from(branchItems).forEach(b => {
                    b.addEventListener('click', () => this.handleBranchItemClick(b));
                });
            }

            this.setupEditButtons();
            this.setupDeleteButtons();
        },

        // Mapa principal
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
// Sección de carga de sucursales con paginación y filtros
loadBranchesList: async function(page = 1, filters = {}) {
    try {
        this.showLoadingSpinner();

        // Construir URL con parámetros de query para paginación y filtros
        let queryParams = new URLSearchParams({
            page: page,
            page_size: 10 // Número de sucursales por página
        });

        // Agregar filtros si existen
        if (filters.name) queryParams.append('name', filters.name);
        if (filters.code) queryParams.append('code', filters.code);
        if (filters.contact_name) queryParams.append('contact_name', filters.contact_name);
        if (filters.contact_email) queryParams.append('contact_email', filters.contact_email);
        if (filters.zone_id) queryParams.append('zone_id', filters.zone_id);
        if (filters.is_active !== undefined) queryParams.append('is_active', filters.is_active);
        if (filters.sort_by) queryParams.append('sort_by', filters.sort_by);
        if (filters.sort_direction) queryParams.append('sort_direction', filters.sort_direction);

        // Realizar la petición
        const response = await ApiClient.request(`${Config.ENDPOINTS.BRANCH.BASE}?${queryParams.toString()}`, {
            method: 'GET'
        });

        console.log("Respuesta completa de la API:", response);

        if (response && response.data) {
            // Actualizar datos de paginación
            this.data.currentBranchesListPage = response.page || 1;
            this.data.totalBranches = response.total_items || 0;
            this.data.totalPages = response.total_pages || 1;

            // IMPORTANTE: Verificamos la estructura de los datos
            let branchesData = response.data;

            // Si data no es un array, pero es un objeto, intentamos encontrar el array dentro
            if (!Array.isArray(branchesData) && typeof branchesData === 'object') {
                // Si branchesData es un objeto pero no un array, buscar la propiedad que contiene
                // el array de sucursales (puede ser "data", "items", "branches", etc.)
                console.log("branchesData no es un array, intentando encontrar el array en:", branchesData);

                if (Array.isArray(branchesData.data)) {
                    branchesData = branchesData.data; // Caso común: { data: [...] }
                } else if (Array.isArray(branchesData.items)) {
                    branchesData = branchesData.items; // Otro caso común
                } else if (Array.isArray(branchesData.branches)) {
                    branchesData = branchesData.branches; // Otro caso posible
                } else {
                    // Buscar cualquier propiedad que sea un array
                    const arrayProps = Object.keys(branchesData).filter(key =>
                        Array.isArray(branchesData[key]));

                    if (arrayProps.length > 0) {
                        console.log("Encontrado array en propiedad:", arrayProps[0]);
                        branchesData = branchesData[arrayProps[0]];
                    } else {
                        // Si todo falla, crear un array vacío
                        console.error("No se encontró ningún array en la respuesta:", branchesData);
                        branchesData = [];
                    }
                }
            }

            // Ahora branchesData debería ser un array
            console.log("Datos de sucursales que se envían a renderBranchesList:", branchesData);

            // Actualizar UI con los datos obtenidos
            this.renderBranchesList(branchesData);
        } else {
            console.error("Respuesta de API sin datos:", response);
            this.renderBranchesList([]);  // Pasar un array vacío
        }

        this.hideLoadingSpinner();
    } catch (error) {
        console.error('Error al cargar la lista de sucursales:', error);
        this.hideLoadingSpinner();
        this.showToast('No se pudo cargar la lista de sucursales', 'error');
    }
},

// Función para renderizar la lista de sucursales en la UI
renderBranchesList: function(branches) {
    const branchesListContainer = document.getElementById('branches-list');
    if (!branchesListContainer) return;

    // Limpiar el contenedor
    branchesListContainer.innerHTML = '';

    // VERIFICACIÓN CRUCIAL: Asegurar que branches es un array
    if (!branches || !Array.isArray(branches)) {
        console.error('Error: branches no es un array:', branches);
        branchesListContainer.innerHTML = `
            <div class="p-4 text-center text-gray-500">
                Error en el formato de datos. Por favor, intente nuevamente.
            </div>
        `;
        return;
    }

    if (branches.length === 0) {
        branchesListContainer.innerHTML = `
            <div class="p-4 text-center text-gray-500">
                No hay sucursales disponibles.
                <a href="branchesForm.html" class="block mt-2 text-blue-500 hover:underline">
                    <i class="fas fa-plus-circle mr-1"></i> Crear nueva sucursal
                </a>
            </div>
        `;
        return;
    }

    // Ahora que estamos seguros que branches es un array, podemos usar forEach
    branches.forEach(branch => {
        const branchItem = document.createElement('div');
        branchItem.className = 'branch-item';
        branchItem.setAttribute('data-id', branch.id);
        branchItem.setAttribute('data-status', branch.is_active ? 'active' : 'inactive');

        branchItem.innerHTML = `
            <div class="flex justify-between items-center">
                <span></span>
            </div>
            <div class="flex justify-between items-center">
                <span class="font-medium" id="branch-name">${branch.name}</span>
                <span class="status-tag status-active badge-status ${branch.is_active ? 'badge-green' : 'badge-red'}" id="branch_status">
                    ${branch.is_active ? 'Activa' : 'Inactiva'}
                </span>
            </div>
            <p class="text-sm text-gray-600 mt-1" id="company-name">${branch.company_name || 'Sin compañía'}</p>
            <p class="text-sm text-gray-600 branch-date">${branch.contact_name || 'Sin contacto'}</p>
            <div class="flex justify-between items-center mt-1">
                <p class="text-sm text-gray-600" id="zone-name">${branch.zone_name || 'Sin zona'}</p>
                <div class="flex gap-2">
                    <p class="text-sm text-gray-600 mt-1 badge-status badge-orange">${branch.code || 'Sin código'}</p>
                    <button class="text-gray-400 hover:text-blue-500 edit-branch-btn">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="text-gray-400 hover:text-red-500 delete-branch-btn">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </div>
        `;

        // Agregar el evento de clic
        branchItem.addEventListener('click', () => this.handleBranchItemClick(branchItem));

        // Agregar a la lista
        branchesListContainer.appendChild(branchItem);
    });

    // Configurar botones de edición y eliminación
    this.setupEditButtons();
    this.setupDeleteButtons();
},

// Manejo de activación/desactivación de sucursal
handleStatusToggle: async function(event) {
    if (!event || !event.target) return;

    const isActive = event.target.checked;
    const statusLabel = document.getElementById('status-label');

    if (!this.data.currentBranchId) {
        // Si no hay sucursal seleccionada, revertir cambio en toggle
        event.target.checked = !isActive;
        Dialog.show("Error", "No hay sucursal seleccionada", { confirmButton: true, confirmText: 'Aceptar' });
        return;
    }

    // Mostrar diálogo de confirmación
    Dialog.show(
        isActive ? "Reactivar Sucursal" : "Desactivar Sucursal",
        `¿Está seguro de ${isActive ? 'reactivar' : 'desactivar'} esta sucursal?`,
        { cancelButton: true, confirmButton: true, confirmText: isActive ? 'Reactivar' : 'Desactivar' },
        () => {
            // Si cancela, revertir cambio en toggle
            event.target.checked = !isActive;
        },
        async () => {
            try {
                // Determinar endpoint a usar - ACTUALIZADO con el endpoint correcto
                const endpoint = isActive
                    ? `${Config.ENDPOINTS.BRANCH.REACTIVATE}/${this.data.currentBranchId}`
                    : `${Config.ENDPOINTS.BRANCH.DEACTIVATE}/${this.data.currentBranchId}`;

                // Realizar petición a la API
                await ApiClient.request(endpoint, {
                    method: "POST"
                });

                // Actualizar UI
                if (statusLabel) {
                    statusLabel.textContent = isActive ? 'Activo' : 'Inactivo';
                    statusLabel.className = isActive
                        ? 'ml-2 text-sm font-medium text-green-600'
                        : 'ml-2 text-sm font-medium text-red-600';
                }

                // Actualizar el estado en la lista de sucursales
                const branchItem = document.querySelector(`.branch-item[data-id="${this.data.currentBranchId}"]`);
                if (branchItem) {
                    branchItem.setAttribute('data-status', isActive ? 'active' : 'inactive');

                    const statusTag = branchItem.querySelector('.status-tag');
                    if (statusTag) {
                        statusTag.textContent = isActive ? 'Activa' : 'Inactiva';
                        statusTag.className = isActive
                            ? 'status-tag status-active badge-status badge-green'
                            : 'status-tag status-active badge-status badge-red';
                    }
                }

                // Mostrar mensaje de éxito
                this.showToast(`Sucursal ${isActive ? 'reactivada' : 'desactivada'} exitosamente`, 'success');

            } catch (error) {
                console.error(`Error al ${isActive ? 'reactivar' : 'desactivar'} sucursal:`, error);

                // Revertir cambio en toggle
                event.target.checked = !isActive;

                // Mostrar mensaje de error
                Dialog.show("Error", `No se pudo ${isActive ? 'reactivar' : 'desactivar'} la sucursal. ${error.message || 'Intente nuevamente.'}`,
                    { confirmButton: true, confirmText: 'Aceptar' });
            }
        }
    );
},

        // Función para resaltar la zona asignada
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

        // Mapa de zonas
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

        // Clic en sucursal
        handleBranchItemClick: function (item) {
            if (!item) return;

            const branchItems = document.querySelectorAll('.branch-item');
            if (branchItems) {
                branchItems.forEach(branch => branch.classList.remove('selected'));
            }

            item.classList.add('selected');

            const branchId = item.getAttribute('data-id');
            if (!branchId) return;

            this.data.currentBranchId = branchId; // Guardar el ID de la sucursal seleccionada

            // Mostrar detalles de la sucursal
            this.displayBranchDetails(branchId);
        },

        // Detalles de sucursal
displayBranchDetails: async function (branchId) {
    if (!branchId) return;

    try {
        // Mostrar indicador de carga
        this.showLoadingSpinner();

        // Realizar petición a la API
        const branchDetails = await ApiClient.request(`${Config.ENDPOINTS.BRANCH.BASE}/${branchId}`, {
            method: "GET"
        });

        if (branchDetails && branchDetails.data) {
            const data = branchDetails.data;

            // Actualizar campos solo si existen en el DOM
            this.updateElementText('branch-name', data.name);
            this.updateElementText('branch-code', data.code);
            this.updateElementText('branch-address_line1', data.address_line1 || '');
            this.updateElementText('branch-address_line2', data.address_line2 || '');
            this.updateElementText('branch-city', data.city || '');
            this.updateElementText('branch-state', data.state || '');
            this.updateElementText('branch-postal_code', data.postal_code || '');
            this.updateElementText('branch-latitude', data.latitude || '');
            this.updateElementText('branch-longitude', data.longitude || '');

            // Actualizar estado del toggle
            const statusToggle = document.getElementById('user-status-toggle');
            const statusLabel = document.getElementById('status-label');
            const isActive = data.is_active;

            if (statusToggle) statusToggle.checked = isActive;
            if (statusLabel) {
                statusLabel.textContent = isActive ? 'Activo' : 'Inactivo';
                statusLabel.className = isActive
                    ? 'ml-2 text-sm font-medium text-green-600'
                    : 'ml-2 text-sm font-medium text-red-600';
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

            // Actualizar contacto
            this.updateElementText('branch-contact_name', data.contact_name || '');
            this.updateElementText('branch-contact_email', data.contact_email || '');
            this.updateElementText('branch-contact_phone', data.contact_phone || '');

            // Actualizar coordenadas en el mapa
            if (data.latitude && data.longitude) {
                this.updateMapLocation(data.longitude, data.latitude);
            } else {
                // Si no hay coordenadas, usar las predeterminadas
                this.updateMapLocation(...Config.MAPBOX.mapInitialCoords);
            }
        }

        // Ocultar indicador de carga
        this.hideLoadingSpinner();

    } catch (error) {
        console.error('Error al cargar detalles de la sucursal:', error);
        this.hideLoadingSpinner();
        this.showToast('Error al cargar detalles de la sucursal', 'error');
    }

    // Ocultar mensaje de ninguna sucursal seleccionada
    this.hideNoBranchSelectedState();

    // Para móvil: mostrar vista de detalles
    if (window.innerWidth < 768) {
        if (this.elements.mainContent) {
            this.elements.mainContent.style.display = 'block';
            this.elements.mainContent.style.position = 'fixed';
            this.elements.mainContent.style.height = 'calc(100vh - 54px)';
            this.elements.mainContent.style.overflowY = 'auto';
            this.elements.mainContent.style.top = '51px';
            this.elements.mainContent.scrollTop = 0;
        }

        document.body.style.overflow = 'hidden';
        document.body.classList.add('mobile-view-active');

        if (this.elements.appContainer) {
            this.elements.appContainer.classList.add('mobile-view-details');
        }
    }
},


        // Método de utilidad para actualizar texto de elementos
        updateElementText: function(elementId, text) {
            const element = document.getElementById(elementId);
            if (element) {
                element.textContent = text;
            }
        },

        showLoadingSpinner: function() {
            // Verificar si ya existe un spinner para evitar duplicados
            if (document.getElementById('loading-spinner')) return;

            const spinner = document.createElement('div');
            spinner.id = 'loading-spinner';
            spinner.className = 'fixed top-0 left-0 w-full h-full flex items-center justify-center bg-gray-900 bg-opacity-50 z-50';
            spinner.innerHTML = '<i class="fas fa-spinner fa-spin text-4xl text-white"></i>';
            document.body.appendChild(spinner);
        },

        hideLoadingSpinner: function() {
            const spinner = document.getElementById('loading-spinner');
            if (spinner) {
                spinner.remove();
            }
        },

        // Actualizar ubicación en el mapa
        updateMapLocation: function (lng, lat) {
            if (!this.data.map) return;

            // Para recargar el mapa una vez esté visible
           setTimeout(() => {
             this.data.map.resize();

           }, 100);
            const lngLat = [parseFloat(lng), parseFloat(lat)];
            if (isNaN(lngLat[0]) || isNaN(lngLat[1])) return;

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
        },

        // Configurar eventos
        setupEventListeners: function () {
            // Pestañas de contenido principal
            if (this.elements.tabButtons) {
                this.elements.tabButtons.forEach(button => {
                    button.addEventListener('click', this.handleTabButtonClick.bind(this));
                });
            }

            // Panel de filtros
            if (this.elements.filterToggle) {
                this.elements.filterToggle.addEventListener('click', this.toggleFilterPanel.bind(this));
            }

            // Botón volver en móvil
            if (this.elements.mobileBackBtn) {
                this.elements.mobileBackBtn.addEventListener('click', this.handleMobileBack.bind(this));
            }

            // Responsive check
            window.addEventListener('resize', this.checkResponsive.bind(this));

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

            // Eventos de los filtros
            const applyFiltersBtn = document.getElementById('apply-filters');
            if (applyFiltersBtn) {
                applyFiltersBtn.addEventListener('click', this.applyFilters.bind(this));
            }

            const statusToggle = document.getElementById('user-status-toggle');
            if (statusToggle) {
                statusToggle.addEventListener('change', this.handleStatusToggle.bind(this));
            }

            this.setZoneTableClickEvent();
        },

        setZoneTableClickEvent: function () {
            const zoneRows = document.querySelectorAll('#zones-table tr');
            if (!zoneRows || zoneRows.length === 0) return;

            zoneRows.forEach(tr => {
                const setBtn = tr.querySelector('.set');
                const editBtn = tr.querySelector('.edit');
                const deleteBtn = tr.querySelector('.delete');

                if (setBtn) {
                    setBtn.addEventListener('click', (event) => {
                        event.stopPropagation();
                        this.handleSetZone(tr);
                    });
                }

                if (editBtn) {
                    editBtn.addEventListener('click', (event) => {
                        event.stopPropagation();
                        this.handleEditZone(tr);
                    });
                }

                if (deleteBtn) {
                    deleteBtn.addEventListener('click', (event) => {
                        event.stopPropagation();
                        this.handleDeleteZone(tr);
                    });
                }

                tr.addEventListener('click', () => {
                    this.handleZoneRowClick(tr);
                });
            });
        },

 handleSetZone: function(tr) {
    let dataZone = tr.getAttribute('data-zone');
    if (!dataZone || dataZone.length === 0) return;

    try {
        dataZone = JSON.parse(dataZone);

        Dialog.show("Establecer Zona", `¿Quiere establecer la zona '${dataZone.name}' a la sucursal?`,
            { cancelButton: true, confirmButton: true, confirmText: 'Establecer' },
            () => { },
            async () => {
                try {
                    // Mostrar indicador de carga
                    Dialog.show("Procesando", "Asignando zona a la sucursal...", { confirmButton: false });

                    // Usar el endpoint exacto según Swagger
                    const response = await ApiClient.request(`${Config.ENDPOINTS.BRANCH.ZONES}/${this.data.currentBranchId}`, {
                        method: "POST",
                        body: JSON.stringify({ zone_id: dataZone.id })
                    });

                    // Actualizar la interfaz con un mensaje de éxito
                    Dialog.show("Zona Establecida", `Se estableció la zona "${dataZone.name}" a la sucursal`,
                        { confirmButton: true, confirmText: 'Aceptar' },
                        null,
                        () => {
                            // Recargar la zona asignada para actualizar la vista
                            this.getBranchAssignedZone(this.data.currentBranchId);
                        }
                    );
                } catch (error) {
                    console.error('Error al asignar zona:', error);

                    // Preparar mensaje de error detallado
                    let errorMessage = "No se pudo asignar la zona. ";

                    if (error.response && error.response.data && error.response.data.message) {
                        errorMessage += error.response.data.message;
                    } else if (error.message) {
                        errorMessage += error.message;
                    } else {
                        errorMessage += "Intente nuevamente.";
                    }

                    Dialog.show("Error", errorMessage, { confirmButton: true, confirmText: 'Aceptar' });
                }
            }
        );
    } catch (e) {
        console.error('Error al parsear datos de zona:', e);
    }
},

        handleEditZone: function(tr) {
            let dataZone = tr.getAttribute('data-zone');
            if (!dataZone || dataZone.length === 0) return;

            try {
                dataZone = JSON.parse(dataZone);
                Dialog.show("Editar Zona", "Aca se abriria el formulario que crea las zonas solo que con datos de la zona con id " + dataZone.id);
            } catch (e) {
                console.error('Error al parsear datos de zona:', e);
            }
        },

        handleDeleteZone: function(tr) {
            let dataZone = tr.getAttribute('data-zone');
            if (!dataZone || dataZone.length === 0) return;

            try {
                dataZone = JSON.parse(dataZone);
                Dialog.show("Eliminar Zona",
                    `<span>¿Quiere eliminar la zona?</span>
                    <br><span>Nombre: ${dataZone.name}</span>
                    <br><span>ID de zona: ${dataZone.id}</span>
                    <br><span>Tipo de zona: ${dataZone.boundaries ? 'Polígono' : 'Circular'}</span>
                    `,
                    { cancelButton: true, confirmButton: true, confirmText: 'Eliminar Zona' },
                    () => { },
                    async () => {
                        try {
                            // Mostrar indicador de carga
                            Dialog.show("Procesando", "Eliminando zona...", { confirmButton: false });

                            // Realizar la petición a la API
                            await ApiClient.request(`${Config.ENDPOINTS.ZONES}/${dataZone.id}`, {
                                method: "DELETE"
                            });

                            Dialog.show("Zona Eliminada", "La zona se ha eliminado correctamente",
                                { confirmButton: true, confirmText: 'Aceptar' });

                            // Recargar zonas
                            if (this.data.currentBranchId) {
                                this.loadAvailableZones(this.data.currentBranchId);
                            }
                        } catch (error) {
                            console.error('Error al eliminar zona:', error);
                            Dialog.show("Error", "No se pudo eliminar la zona. " + (error.message || "Intente nuevamente."),
                                { confirmButton: true, confirmText: 'Aceptar' });
                        }
                    }
                );
            } catch (e) {
                console.error('Error al parsear datos de zona:', e);
            }
        },

        handleZoneRowClick: function(tr) {
            const activeRow = document.querySelector('#zones-table tr.bg-blue-300');
            if (activeRow) {
                activeRow.classList.remove('bg-blue-300');
            }

            tr.classList.add('bg-blue-300');

            let dataZone = tr.getAttribute('data-zone');
            if (dataZone && dataZone.length > 0) {
                try {
                    dataZone = JSON.parse(dataZone);
                    if (this.data.zonesMap) {
                        this.drawZonesOnMap(this.data.zonesMap, [dataZone]);
                    }
                } catch (e) {
                    console.error('Error al parsear datos de zona:', e);
                }
            }
        },

        // Mostrar modal de zona
        showZoneModal: function () {
            if (!this.data.zoneSelectionMap) {
                this.initZoneSelectionMap();
            }

            if (this.data.zoneSelectionMap && this.data.zoneSelectionMap.getLayer) {
                if (this.data.zoneSelectionMap.getLayer('zone-layer')) {
                    this.data.zoneSelectionMap.removeLayer('zone-layer');
                    this.data.zoneSelectionMap.removeSource('zone');
                }
            }

            if (this.elements.zoneModal) {
                this.elements.zoneModal.classList.add('active');
                document.body.style.overflow = 'hidden';
            }
        },

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

            // Manejar dibujo de zonas
            this.setupZoneDrawing();
        },

        // Configurar dibujo de zonas en el mapa de selección
        setupZoneDrawing: function () {
            if (!this.data.zoneSelectionMap || !this.elements.zoneTypeSelect) return;

            let isDrawing = false;
            let coordinates = [];
            let polygon = null;

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

        toggleRadiusControl: function (show) {
            this.data.isZoneSelected = false;

            if (this.elements.radiusControl) {
                this.elements.radiusControl.style.display = show ? 'block' : 'none';
            }

            if (this.data.zoneSelectionMap && this.data.zoneSelectionMap.getLayer) {
                if (this.data.zoneSelectionMap.getLayer('zone-layer')) {
                    this.data.zoneSelectionMap.removeLayer('zone-layer');
                    this.data.zoneSelectionMap.removeSource('zone');
                }
            }
        },

        drawZonesOnMap: function (map, zones, options = {}) {
            if (!map || !map.isStyleLoaded() || !zones || !Array.isArray(zones)) {
                console.error('El mapa no está inicializado o zonas inválidas');
                return;
            }

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

                let geoJSON;
                let coordinates = [];

                try {
                    if (zone.type === 'circle' || (!zone.boundaries && zone.center_point)) {
                        const center = zone.center || zone.center_point;
                        if (!center || !Array.isArray(center) || center.length < 2) {
                            console.error('Datos de centro inválidos para zona', zoneId);
                            return;
                        }

                        geoJSON = this.createCircleGeoJSON(
                            center,
                            (zone.radius || 1) * config.radiusMultiplier
                        );

                        // Extraer coordenadas para el fitBounds
                        if (geoJSON && geoJSON.geometry && Array.isArray(geoJSON.geometry.coordinates[0])) {
                            coordinates = geoJSON.geometry.coordinates[0];
                        }
                    } else {
                        // Asegurar que el polígono esté cerrado
                        coordinates = [...(zone.coordinates || zone.boundaries || [])];
                        if (coordinates.length === 0) {
                            console.error('Coordenadas inválidas para zona', zoneId);
                            return;
                        }

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

                    // Ajustar el mapa a los límites de la zona
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

        hideZoneModal: function () {
            if (this.elements.zoneModal) {
                this.elements.zoneModal.classList.remove('active');
                document.body.style.overflow = '';
            }
        },

        // Manejar guardado de zona
 handleSaveZone: async function () {
    if (!this.elements.zoneTypeSelect) return;

    const zoneType = this.elements.zoneTypeSelect.value;
    const nameElement = document.getElementById('branch-zone-name');
    const codeElement = document.getElementById('branch-zone-code');
    const baseRateElement = document.getElementById('branch-zone-base-rate');
    const isActiveElement = document.getElementById('branch-zone-is-active');
    const maxDeliveryTimeElement = document.getElementById('branch-zone-max-delivery-time');
    const priorityLevelElement = document.getElementById('priority-level');

    // Verificar que existan todos los elementos necesarios
    if (!nameElement || !codeElement || !baseRateElement || !isActiveElement ||
        !maxDeliveryTimeElement || !priorityLevelElement) {
        console.error('Faltan elementos del formulario');
        return;
    }

    // Crear el objeto de datos según la estructura esperada por la API
    let zoneData = {
        base_rate: parseFloat(baseRateElement.value) || 0,
        boundaries: null,
        center_point: null,
        code: codeElement.value,
        is_active: isActiveElement.checked,
        max_delivery_time: parseInt(maxDeliveryTimeElement.value) || 0,
        name: nameElement.value,
        priority_level: parseInt(priorityLevelElement.value) || 0,
        branch_id: this.data.currentBranchId
    };

    // Validación de campos
    let todoBien = true;
    const nameError = document.getElementById('branch-zone-name-error');
    const codeError = document.getElementById('branch-zone-code-error');
    const coordsError = document.getElementById('branch-zone-coords-error');

    if (nameError) nameError.classList.add('hidden');
    if (codeError) codeError.classList.add('hidden');
    if (coordsError) coordsError.classList.add('hidden');

    if (!this.data.isZoneSelected) {
        todoBien = false;
        if (coordsError) coordsError.classList.remove('hidden');
    }

    if (!zoneData.name || zoneData.name.length === 0) {
        todoBien = false;
        if (nameError) nameError.classList.remove('hidden');
    }

    if (!zoneData.code || zoneData.code.length === 0) {
        todoBien = false;
        if (codeError) codeError.classList.remove('hidden');
    }

    if (zoneType === 'circle' && this.data.zoneSelectionMap) {
        const radius = parseFloat(this.elements.zoneRadiusInput.value);
        const center = this.data.zoneSelectionMap.getCenter();

        if (center) {
            zoneData.center_point = [center.lng, center.lat]; // Formato [longitud, latitud]
            zoneData.radius = radius;
        } else {
            todoBien = false;
            if (coordsError) coordsError.classList.remove('hidden');
        }
    } else if (this.data.zoneSelectionMap && this.data.zoneSelectionMap.getSource &&
              this.data.zoneSelectionMap.getSource('zone')) {
        // Para polígono, obtener coordenadas
        const sourceData = this.data.zoneSelectionMap.getSource('zone')._data;
        if (sourceData && sourceData.geometry && sourceData.geometry.coordinates) {
            zoneData.boundaries = sourceData.geometry.coordinates[0];
        } else {
            todoBien = false;
            if (coordsError) coordsError.classList.remove('hidden');
        }
    }

    if (!todoBien) return;

    try {
        // Mostrar spinner o indicador de carga
        if (this.elements.saveZoneBtn) {
            this.elements.saveZoneBtn.disabled = true;
            this.elements.saveZoneBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
        }

        // Realizar la petición a la API con el formato correcto
        const endpoint = `${Config.ENDPOINTS.ZONES}`;
        const response = await ApiClient.request(endpoint, {
            method: "POST",
            body: JSON.stringify(zoneData)
        });

        // Ocultar modal
        this.hideZoneModal();

        // Mostrar mensaje de éxito
        Dialog.show("Zona Guardada", "La zona se ha guardado exitosamente", {
            confirmButton: true,
            confirmText: 'Aceptar'
        });

        // Recargar zonas
        if (this.data.currentBranchId) {
            this.loadAvailableZones(this.data.currentBranchId);
            // Actualizar la zona asignada también por si se creó y asignó automáticamente
            this.getBranchAssignedZone(this.data.currentBranchId);
        }
    } catch (error) {
        console.error('Error al guardar zona:', error);

        // Preparar mensaje de error más detallado
        let errorMessage = "No se pudo guardar la zona. ";

        if (error.response && error.response.data && error.response.data.message) {
            errorMessage += error.response.data.message;
        } else if (error.message) {
            errorMessage += error.message;
        } else {
            errorMessage += "Intente nuevamente.";
        }

        Dialog.show("Error", errorMessage, {
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

        // Configurar botones de eliminar
        setupDeleteButtons: function () {
            const deleteButtons = document.querySelectorAll('.delete-branch-btn');
            if (!deleteButtons) return;

            deleteButtons.forEach(btn => {
                btn.addEventListener('click', (event) => {
                    event.stopPropagation();

                    const branchItem = btn.closest('.branch-item');
                    if (!branchItem) return;

                    const branchId = branchItem.getAttribute('data-id');
                    const nameElement = branchItem.querySelector('.font-medium');
                    const branchName = nameElement ? nameElement.textContent : 'esta sucursal';

                    Dialog.show("Eliminar Sucursal",
                        `Quiere eliminar la sucursal "${branchName}"?`,
                        { cancelButton: true, confirmButton: true, confirmText: 'Eliminar' },
                        () => { },
                        async () => {
                            Dialog.show("Mensaje", `${true ? 'Se elimino la sucursal' : ' no se elimino la sucursal'}`);
                        });
                });
            });
        },

        // Configurar botones de editar
        setupEditButtons: function () {
            const editButtons = document.querySelectorAll('.edit-branch-btn');
            if (!editButtons) return;

            editButtons.forEach(btn => {
                btn.addEventListener('click', (event) => {
                    event.stopPropagation();

                    const branchItem = btn.closest('.branch-item');
                    if (!branchItem) return;

                    const branchId = branchItem.getAttribute('data-id');
                    if (!branchId) return;

                    // Redirigir al formulario de edición
                    window.location.href = `./branchesFormEdit.html?Id=${branchId}`;
                });
            });
        },

        showToast: function (message, type = 'success') {
            // Verificar si ya existe un toast para evitar duplicados
            const existingToast = document.querySelector('.toast-message');
            if (existingToast) existingToast.remove();

            const toast = document.createElement('div');
            toast.className = `toast-message fixed bottom-4 right-4 px-4 py-2 rounded-md text-white ${type === 'success' ? 'bg-green-500' : 'bg-red-500'}`;
            toast.textContent = message;
            document.body.appendChild(toast);

            setTimeout(() => {
                toast.remove();
            }, 3000);
        },

handleTabButtonClick: function (event) {
    if (!event || !event.currentTarget) return;

    if (this.elements.tabButtons) {
        this.elements.tabButtons.forEach(btn => btn.classList.remove('active'));
    }

    if (this.elements.tabContents) {
        this.elements.tabContents.forEach(content => content.classList.remove('active'));
    }

    event.currentTarget.classList.add('active');
    const tabId = event.currentTarget.getAttribute('data-tab');
    const tabContent = document.getElementById(`tab-${tabId}`);

    if (tabContent) {
        tabContent.classList.add('active');
    }

    // Si es la pestaña de zonas, ejecutar la secuencia completa
    if (tabId === 'zones') {
        setTimeout(async () => {
            // Primero asegurar que el mapa esté correctamente dimensionado
            if (this.data.zonesMap) {
                this.data.zonesMap.resize();
            }

            // Si hay una sucursal seleccionada, cargar los datos de zonas
            if (this.data.currentBranchId) {
                try {
                    // 1. Primero obtener la zona actualmente asignada
                    await this.getBranchAssignedZone(this.data.currentBranchId);

                    // 2. Luego cargar todas las zonas disponibles
                    await this.loadAvailableZones(this.data.currentBranchId);
                } catch (error) {
                    console.error('Error al cargar datos de zonas:', error);
                }
            }
        }, 100);
    }
    // Si es la pestaña de métricas, cargar las métricas
    else if (tabId === 'metrics' && this.data.currentBranchId) {
        this.loadBranchMetrics(this.data.currentBranchId);
    }
    // Si es la pestaña de detalles, ajustar el mapa
    else if (tabId === 'details' && this.data.map) {
        setTimeout(() => {
            this.data.map.resize();
        }, 100);
    }
},

loadBranchMetrics: async function(branchId) {
    if (!branchId) return;

    try {
        // Mostrar indicador de carga en todas las métricas
        const metricElements = document.querySelectorAll('[id^="branch-metric-"]');
        metricElements.forEach(element => {
            element.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        });

        // Realizar petición al endpoint de métricas
        const response = await ApiClient.request(`${Config.ENDPOINTS.BRANCH.METRICS}/${branchId}`, {
            method: "GET"
        });

        if (response) {
            // Mapeo de nombres de métricas a IDs de elementos
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

            // Actualizar cada métrica en la interfaz
            Object.entries(metricsMap).forEach(([apiKey, elementId]) => {
                const element = document.getElementById(elementId);
                if (!element) return;

                // Obtener el valor de la métrica (manejar posibles formatos diferentes de respuesta)
                let value = response[apiKey] ?? (response.data ? response.data[apiKey] : null);

                // Si no se encuentra el valor, mostrar placeholder
                if (value === null || value === undefined) {
                    element.textContent = '—';
                    return;
                }

                // Formatear el valor según el tipo de métrica
                if (apiKey === 'total_revenue') {
                    // Formatear como moneda
                    element.textContent = `$${parseFloat(value).toLocaleString('es-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    })}`;
                } else if (apiKey === 'delivery_success_rate') {
                    // Formatear como porcentaje
                    element.textContent = `${parseFloat(value).toFixed(1)}%`;
                } else if (apiKey === 'average_delivery_time') {
                    // Formatear tiempo (suponiendo que está en minutos)
                    const hours = Math.floor(value / 60);
                    const minutes = Math.round(value % 60);

                    if (hours > 0) {
                        element.textContent = `${hours}h ${minutes}m`;
                    } else {
                        element.textContent = `${minutes} min`;
                    }
                } else {
                    // Otros valores numéricos, con formato según su magnitud
                    element.textContent = typeof value === 'number'
                        ? value.toLocaleString('es-US')
                        : value.toString();
                }
            });
        } else {
            throw new Error('No se recibieron datos de métricas');
        }
    } catch (error) {
        console.error('Error al cargar métricas de la sucursal:', error);

        // Mostrar mensaje de error en métricas
        const metricElements = document.querySelectorAll('[id^="branch-metric-"]');
        metricElements.forEach(element => {
            element.textContent = 'Error';
            element.classList.add('text-red-500');
        });

        // Mostrar notificación de error
        this.showToast('Error al cargar métricas. Intente nuevamente.', 'error');
    }
},

 loadAvailableZones: async function(branchId) {
    if (!branchId) return;

    const zonesTable = document.getElementById('zones-table');
    if (!zonesTable) return;

    try {
        // Mostrar indicador de carga
        zonesTable.innerHTML = '<tr><td colspan="4" class="py-4 text-center">Cargando zonas disponibles...</td></tr>';

        // Realizar petición al endpoint exacto según Swagger
        const response = await ApiClient.request(`${Config.ENDPOINTS.BRANCH.AVAILABLE_ZONES}/${branchId}`, {
            method: "GET"
        });

        // Limpiar tabla
        zonesTable.innerHTML = '';

        // Verificar el tipo de respuesta - podría ser array o { data: [] }
        let zonesData = [];

        if (Array.isArray(response)) {
            zonesData = response;
        } else if (response && response.data && Array.isArray(response.data)) {
            zonesData = response.data;
        } else if (response && typeof response === 'object') {
            // Intentar extraer los datos sin conocer la estructura exacta
            zonesData = Object.values(response).find(val => Array.isArray(val)) || [];
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
    }
},

        showNoBranchSelectedState: function () {
            if (this.elements.noBranchSelected && this.elements.contentArea) {
                this.elements.noBranchSelected.classList.remove('hidden');
                this.elements.contentArea.classList.add('hidden');
            }
        },

        hideNoBranchSelectedState: function () {
            if (this.elements.noBranchSelected && this.elements.contentArea) {
                this.elements.noBranchSelected.classList.add('hidden');
                this.elements.contentArea.classList.remove('hidden');
            }
        },

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

        refreshData: function () {
            if (!this.elements.refreshButton || !this.elements.refreshIcon) return;

            this.elements.refreshButton.disabled = true;
            this.elements.refreshIcon.classList.add('loading-spinner');

            setTimeout(() => {
                if (this.data.currentBranchId) {
                    this.displayBranchDetails(this.data.currentBranchId);
                }

                this.elements.refreshIcon.classList.remove('loading-spinner');
                this.elements.refreshButton.disabled = false;
                this.showToast('Datos actualizados', 'success');
            }, 1000);
        },

        applyFilters: function () {
            // Obtener los valores de los filtros
            const statusFilter = document.getElementById('status-filter');
            const nameFilter = document.getElementById('name-filter');
            const cityFilter = document.getElementById('city-filter');
            const dateFromFilter = document.getElementById('date-from');
            const dateToFilter = document.getElementById('date-to');

            if (!statusFilter || !nameFilter || !cityFilter || !dateFromFilter || !dateToFilter) {
                console.error('Faltan elementos de filtros');
                return;
            }

            const filters = {
                status: statusFilter.value,
                name: nameFilter.value.trim(),
                city: cityFilter.value.trim(),
                dateFrom: dateFromFilter.value,
                dateTo: dateToFilter.value
            };

            // Filtrar la lista de sucursales
            this.filterBranchList(filters);
        },

        clearFilters: function () {
            // Restablecer los valores de los filtros
            const statusFilter = document.getElementById('status-filter');
            const nameFilter = document.getElementById('name-filter');
            const cityFilter = document.getElementById('city-filter');
            const dateFromFilter = document.getElementById('date-from');
            const dateToFilter = document.getElementById('date-to');

            if (statusFilter) statusFilter.value = '';
            if (nameFilter) nameFilter.value = '';
            if (cityFilter) cityFilter.value = '';
            if (dateFromFilter) dateFromFilter.value = '';
            if (dateToFilter) dateToFilter.value = '';

            // Mostrar todas las sucursales
            this.filterBranchList({});
        },

 getBranchAssignedZone: async function(branchId) {
    if (!branchId) return null;

    const zoneDisplay = document.getElementById('branch-zone');
    if (!zoneDisplay) return null;

    try {
        // Limpiar visualización actual
        zoneDisplay.textContent = 'Cargando...';

        // Realizar petición a la API
const response = await ApiClient.request(`${Config.ENDPOINTS.BRANCH.ASSIGNED_ZONE}/${branchId}`, {
    method: "GET"
});

        // Determinar la estructura de respuesta
        let zoneData = null;

        if (response && response.data) {
            // Estructura típica: { data: {...} }
            zoneData = response.data;
        } else if (response && response.id) {
            // La respuesta podría ser el objeto de zona directamente
            zoneData = response;
        } else if (response && typeof response === 'object') {
            // Buscar un objeto que parezca una zona
            const possibleZone = Object.values(response).find(val =>
                val && typeof val === 'object' && (val.id || val.name || val.boundaries || val.center_point)
            );
            if (possibleZone) zoneData = possibleZone;
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


        filterBranchList: function (filters) {
            const branchItems = document.querySelectorAll('.branch-item');
            if (!branchItems || !filters) return;

            branchItems.forEach(branchItem => {
                const branchStatus = branchItem.getAttribute('data-status');
                const nameElement = branchItem.querySelector('.font-medium');
                const branchName = nameElement ? nameElement.textContent.toLowerCase() : '';

                const addressElement = branchItem.querySelector('p:nth-of-type(1)');
                const branchAddress = addressElement ? addressElement.textContent.toLowerCase() : '';

                const dateElement = branchItem.querySelector('.branch-date');
                const dateText = dateElement ? dateElement.textContent.replace('Registro: ', '') : '';
                const branchDate = dateText ? new Date(dateText) : null;

                // Aplicar filtros
                const matchesStatus = !filters.status || branchStatus === filters.status;
                const matchesName = !filters.name || branchName.includes(filters.name.toLowerCase());
                const matchesCity = !filters.city || branchAddress.includes(filters.city.toLowerCase());
                const matchesDate =
                    (!filters.dateFrom || !branchDate || branchDate >= new Date(filters.dateFrom)) &&
                    (!filters.dateTo || !branchDate || branchDate <= new Date(filters.dateTo));

                // Mostrar u ocultar la sucursal según los filtros
                if (matchesStatus && matchesName && matchesCity && matchesDate) {
                    branchItem.style.display = 'block';
                } else {
                    branchItem.style.display = 'none';
                }
            });
        },

        // Panel de filtros
        toggleFilterPanel: function () {
            if (this.elements.filterPanel && this.elements.filterIcon) {
                this.elements.filterPanel.classList.toggle('open');
                this.elements.filterIcon.classList.toggle('rotate-180');
            }
        }
    };

    // Inicializar la aplicación
    app.init();
});
