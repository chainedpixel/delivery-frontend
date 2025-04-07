import Config from "./config.js";
import Dialog from "./utils/Dialog.js";
//descomentar cuando ya funcione la api
//import apiclient from "./utils/apiclient.js";

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
            statusLabel: document.getElementById('status-label'),
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
            currentBranchToDelete: null
        },
        init: function () {
            this.showNoBranchSelectedState();
            this.initMap();
            this.initZonesMap();
            this.setupEventListeners();

            //evento click de las sucursales
            Array.from(document.querySelectorAll('.branch-item')).forEach(b => {
                b.addEventListener('click', function () {
                    app.handleBranchItemClick(this)
                })
            })
            app.setupEditButtons();
            app.setupDeleteButtons();
        },

        //  mapa principal
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

        //  mapa de zonas
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



        // clic en sucursal
        handleBranchItemClick: function (item) {
            document.querySelectorAll('.branch-item').forEach(branch => branch.classList.remove('selected'));
            item.classList.add('selected');

            const branchId = item.getAttribute('data-id');
            app.displayBranchDetails(branchId);
            //aca se pedirian los detalles
        },


        // detalles de sucursal
        displayBranchDetails: function (branch) {

            //aca se pasarian las coordenadas de la sucursal
            app.updateMapLocation(...Config.MAPBOX.mapInitialCoords)
            // ocultar mensaje de ninguna sucursal seleccionada
            this.hideNoBranchSelectedState();

            // para móvil: mostrar vista de detalles
            if (window.innerWidth < 768) {
                this.elements.mainContent.style.display = 'block';
                this.elements.mainContent.style.position = 'fixed';
                this.elements.mainContent.style.height = 'calc(100vh - 54px)';
                this.elements.mainContent.style.overflowY = 'auto';
                this.elements.mainContent.style.top = '51px';
                this.elements.mainContent.scrollTop = 0;

                document.body.style.overflow = 'hidden';
                document.body.classList.add('mobile-view-active');

                this.elements.appContainer.classList.add('mobile-view-details');
            }
        },

        // actualizar ubicación en el mapa
        updateMapLocation: function (lng, lat) {
            //para recargar el mapa una vez este visible
            setTimeout(() => {
                this.data.map.resize();
                if (!this.data.map) return;

                const lngLat = [parseFloat(lng), parseFloat(lat)];

                // eliminar marcador existente
                if (this.data.currentMarker) {
                    this.data.currentMarker.remove();
                }

                // rear nuevo marcador
                this.data.currentMarker = new mapboxgl.Marker()
                    .setLngLat(lngLat)
                    .addTo(this.data.map);

                // centrar mapa en la nueva ubicación
                this.data.map.flyTo({
                    center: lngLat,
                    zoom: Config.MAPBOX.mapZoomCloser
                });
            }, 100);


        },


        // configurar eventos
        setupEventListeners: function () {
            // pestañas de contenido principal
            this.elements.tabButtons.forEach(button => {
                button.addEventListener('click', this.handleTabButtonClick.bind(this));
            });

            // panel de filtros
            this.elements.filterToggle.addEventListener('click', this.toggleFilterPanel.bind(this));

            // boton volver en móvil
            this.elements.mobileBackBtn.addEventListener('click', this.handleMobileBack.bind(this));

            // responsive check
            window.addEventListener('resize', this.checkResponsive.bind(this));

            // boton de actualizar
            this.elements.refreshButton.addEventListener('click', this.refreshData.bind(this));


            // boton para añadir zona
            this.elements.addZoneBtn.addEventListener('click', this.showZoneModal.bind(this));

            // modal de zona
            this.elements.closeZoneModal.addEventListener('click', this.hideZoneModal.bind(this));
            this.elements.cancelZoneBtn.addEventListener('click', this.hideZoneModal.bind(this));
            this.elements.saveZoneBtn.addEventListener('click', this.handleSaveZone.bind(this));

            //eventos de los filtros
            document.getElementById('apply-filters').addEventListener('click', app.applyFilters);
            app.setZoneTableClickEvent();
        },
        setZoneTableClickEvent: function () {
            Array.from(document.querySelectorAll('#zones-table tr')).forEach(tr => {
                console.log(tr.querySelector('.edit'))


                tr.querySelector('.set').addEventListener('click', function (event) {
                    event.stopPropagation();
                    let dataZone = tr.getAttribute('data-zone');
                    if (dataZone != null && dataZone.length > 0) {
                        dataZone = JSON.parse(dataZone);

                        Dialog("Establecer Zona", "Quiere establecer la zona '" + dataZone.name + "' a la sucursal?", { cancelButton: true, confirmButton: true, confirmText: 'Establecer' }, () => { }, async () => {

                            Dialog("Establecer Zona", "se establecio la zona " + dataZone.name + " a la sucursal", { confirmButton: true, confirmText: 'Aceptar' }, () => { }, () => { })
                        })

                    }
                })

                tr.querySelector('.edit').addEventListener('click', function (event) {
                    event.stopPropagation();
                    let dataZone = tr.getAttribute('data-zone');
                    if (dataZone != null && dataZone.length > 0) {
                        dataZone = JSON.parse(dataZone);

                        Dialog("Editar Zona", "Aca se abriria el formulario que crea las zonas solo que con datos de la zona con id " + dataZone.id)
                    }
                })



                tr.querySelector('.delete').addEventListener('click', function (event) {
                    event.stopPropagation();
                    let dataZone = tr.getAttribute('data-zone');
                    if (dataZone != null && dataZone.length > 0) {
                        dataZone = JSON.parse(dataZone);
                        Dialog("Eliminar Zona",
                            `<span>Quiere eliminar la zona?</span>
                            <br><span>Nombre: ${dataZone.name}</span>
                            <br><span>Id de zna:${dataZone.id}</span>
                            <br><span>Tipo de zona:${dataZone.type}</span>
                            `,
                            { cancelButton: true, confirmButton: true, confirmText: 'Eliminar Zona' },
                            () => { }, async () => {
                                Dialog("Mensaje", `${true ? 'Se elimino la zona' : 'no se elimino la zona'}`)
                            })



                    }
                })
                tr.addEventListener('click', function () {
                    let active = document.querySelector('#zones-table tr.bg-blue-300');

                    active?.classList.remove('bg-blue-300')
                    this.classList.add('bg-blue-300')
                    let dataZone = this.getAttribute('data-zone');
                    if (dataZone != null && dataZone.length > 0) {
                        dataZone = JSON.parse(dataZone);
                        app.drawZonesOnMap(app.data.zonesMap, [dataZone]);
                    }
                    console.log()//bg-blue-300
                })
            })
        },

        // mostrar modal de zona
        showZoneModal: function () {
            debugger
            if (!this.data.zoneSelectionMap) {
                this.initZoneSelectionMap();
            }
            if (this.data.zoneSelectionMap.getLayer('zone-layer')) {
                this.data.zoneSelectionMap.removeLayer('zone-layer');
                this.data.zoneSelectionMap.removeSource('zone');
            }
            this.elements.zoneModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        },
        initZoneSelectionMap: function () {
            if (!this.elements.zoneSelectionMap) return;

            this.data.zoneSelectionMap = new mapboxgl.Map({
                container: this.elements.zoneSelectionMap,
                style: 'mapbox://styles/mapbox/streets-v12',
                center: Config.MAPBOX.mapInitialCoords,
                zoom: Config.MAPBOX.mapZoom
            });

            // añadir controles de navegación
            this.data.zoneSelectionMap.addControl(new mapboxgl.NavigationControl());

            // manejar dibujo de zonas
            this.setupZoneDrawing();
        },
        // configurar dibujo de zonas en el mapa de selección
        setupZoneDrawing: function () {
            let isDrawing = false;
            let coordinates = [];
            let polygon = null;

            // escuchar cambios en el tipo de zona
            this.elements.zoneTypeSelect.addEventListener('change', (e) => {
                this.toggleRadiusControl(e.target.value === 'circle');

                // limpiar dibujo existente
                if (polygon) {
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

            // escuchar clics en el mapa para dibujar
            this.data.zoneSelectionMap.on('click', (e) => {
                const zoneType = this.elements.zoneTypeSelect.value;

                if (zoneType === 'circle') {
                    // para zona circular, solo necesitamos un punto central
                    coordinates = [e.lngLat.lng, e.lngLat.lat];
                    this.drawZoneOnSelectionMap(coordinates);
                    app.data.isZoneSelected = true;
                } else {
                    // para polígono, recolectamos múltiples puntos
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

            // doble clic para finalizar polígono
            this.data.zoneSelectionMap.on('dblclick', () => {
                if (isDrawing && this.elements.zoneTypeSelect.value === 'polygon') {
                    isDrawing = false;
                    // cerrar el polígono
                    if (coordinates.length > 2) {
                        coordinates.push(coordinates[0]);
                        this.drawZoneOnSelectionMap(coordinates);
                        app.data.isZoneSelected = true;
                    }
                }
            });
        },

        // dibujar zona en el mapa de selección
        drawZoneOnSelectionMap: function (coords) {
            const zoneType = this.elements.zoneTypeSelect.value;

            // limpiar capa existente
            if (this.data.zoneSelectionMap.getLayer('zone-layer')) {
                this.data.zoneSelectionMap.removeLayer('zone-layer');
                this.data.zoneSelectionMap.removeSource('zone');
            }

            let geoJSON;

            if (zoneType === 'circle') {
                // crear un círculo alrededor del punto
                const center = coords;
                const radius = parseFloat(this.elements.zoneRadiusInput.value) * Config.MAPBOX.mapRadiusMultiplier;

                geoJSON = this.createCircleGeoJSON(center, radius);
            } else {
                // crear un polígono con las coordenadas
                geoJSON = {
                    type: 'Feature',
                    geometry: {
                        type: 'Polygon',
                        coordinates: [coords]
                    }
                };
            }

            // añadir la nueva capa
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
            const steps = 64;
            const coords = [];

            for (let i = 0; i < steps; i++) {
                const angle = (i / steps) * (2 * Math.PI);
                const x = center[0] + (radius * Math.cos(angle) / (111320 * Math.cos(center[1] * Math.PI / 180)));
                const y = center[1] + (radius * Math.sin(angle) / 110574);
                coords.push([x, y]);
            }

            // cerrar el círculo
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
            app.data.isZoneSelected = false;
            this.elements.radiusControl.style.display = show ? 'block' : 'none';
            if (app.data.zonesMap) {
                if (this.data.zoneSelectionMap.getLayer('zone-layer')) {
                    this.data.zoneSelectionMap.removeLayer('zone-layer');
                    this.data.zoneSelectionMap.removeSource('zone');
                }

            }
        },
        drawZonesOnMap: function (map, zones, options = {}) {
            if (!map || !map.isStyleLoaded()) {
                console.error('El mapa no está inicializado o no ha terminado de cargar');
                return;
            }

            const config = {
                radiusMultiplier: options.radiusMultiplier || Config.MAPBOX.mapRadiusMultiplier || 1000,
                addLabels: options.addLabels !== false
            };


            // dibujar cada zona
            zones.forEach(zone => {
                const zoneId = zone.id || `zone-${Math.random().toString(36).substr(2, 9)}`;
                const sourceId = `zone-source-${zoneId}`;
                const layerId = `zone-layer-${zoneId}`;
                const labelId = `zone-label-${zoneId}`;

                // limpiar capas existentes si ya existen
                if (map.getLayer(layerId)) map.removeLayer(layerId);
                if (map.getLayer(labelId)) map.removeLayer(labelId);
                if (map.getSource(sourceId)) map.removeSource(sourceId);

                let geoJSON;
                if (zone.type === 'circle') {
                    geoJSON = this.createCircleGeoJSON(
                        zone.center || zone.center_point,
                        (zone.radius || 1) * config.radiusMultiplier
                    );
                } else {
                    // asegurar que el polígono esté cerrado
                    let coordinates = [...(zone.coordinates || zone.boundaries || [])];
                    if (coordinates.length > 0) {
                        const first = coordinates[0];
                        const last = coordinates[coordinates.length - 1];
                        if (first[0] !== last[0] || first[1] !== last[1]) {
                            coordinates.push(first);
                        }
                    }

                    geoJSON = {
                        type: 'Feature',
                        geometry: {
                            type: 'Polygon',
                            coordinates: [coordinates]
                        }
                    };
                }

                try {
                    // añadir la zona al mapa
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

                    // añadir etiqueta si está habilitado
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
                    const coordinates = zone.type === 'circle' ?
                        geoJSON.geometry.coordinates[0] :
                        zone.coordinates;

                    const bounds = coordinates.reduce((acc, coord) => {
                        return [
                            [Math.min(acc[0][0], coord[0]), Math.min(acc[0][1], coord[1])],
                            [Math.max(acc[1][0], coord[0]), Math.max(acc[1][1], coord[1])]
                        ];
                    }, [[coordinates[0][0], coordinates[0][1]], [coordinates[0][0], coordinates[0][1]]]);

                    map.fitBounds(bounds, { padding: 50 });
                } catch (error) {
                    console.error(`Error al dibujar la zona ${zoneId}:`, error);
                }
            });
        },
        hideZoneModal: function () {
            this.elements.zoneModal.classList.remove('active');
            document.body.style.overflow = '';
        },
        //todo api
        // manejar guardado de zona
        handleSaveZone: function () {

            const zoneType = this.elements.zoneTypeSelect.value;
            let zoneData = {

                base_rate: document.getElementById('branch-zone-base-rate').value,
                boundaries: null,
                center_point: null,
                code: document.getElementById('branch-zone-code').value,
                is_active: document.getElementById('branch-zone-is-active').checked,
                max_delivery_time: document.getElementById('branch-zone-max-delivery-time').value,
                name: document.getElementById('branch-zone-name').value,
                priority_level: document.getElementById('priority-level').value,

            };
            let todoBien = true;
            document.getElementById('branch-zone-name-error').classList.add('hidden')
            document.getElementById('branch-zone-code-error').classList.add('hidden')
            document.getElementById('branch-zone-coords-error').classList.add('hidden')
            if (!app.data.isZoneSelected) {
                todoBien = false;
                document.getElementById('branch-zone-coords-error').classList.remove('hidden')
            }

            if (zoneData.name.length === 0) {
                todoBien = false;
                document.getElementById('branch-zone-name-error').classList.remove('hidden')
            }
            if (zoneData.code.length === 0) {
                todoBien = false;
                document.getElementById('branch-zone-code-error').classList.remove('hidden')
            }

            if (zoneType === 'circle') {
                const radius = parseFloat(this.elements.zoneRadiusInput.value);

                zoneData.center_point = this.data.zoneSelectionMap.getCenter()
                zoneData.radius = radius

            } else {
                // para polígono, necesitaríamos obtener las coordenadas del geojson

                zoneData.boundaries = this.data.zoneSelectionMap.getSource('zone')._data.geometry.coordinates[0];


            }
            if (!todoBien)
                return
            // aquí iría la llamada a la api para guardar la zona

            Dialog("Zona Guardada", "La zona de tipos " + zoneData.type + " se ha guardado exitosamente", { confirmButton: true, confirmText: 'Aceptar' })
            console.log('Guardando zona:', zoneData);

            // ocultar modal
            this.hideZoneModal();

            // mostrar mensaje de éxito
        },
        // configurar botones de eliminar
        setupDeleteButtons: function () {
            const deleteButtons = document.querySelectorAll('.delete-branch-btn');

            deleteButtons.forEach(btn => {
                btn.addEventListener('click', (event) => {
                    event.stopPropagation();

                    const branchItem = btn.closest('.branch-item');
                    const branchId = branchItem.getAttribute('data-id');
                    const branchName = branchItem.querySelector('.font-medium').textContent;

                    Dialog("Eliminar Sucursal",
                        `Quiere eliminar la sucursal "${'aca nombre'}"?`,
                        { cancelButton: true, confirmButton: true, confirmText: 'Eliminar' },
                        () => { }, async () => {
                            Dialog("Mensaje", `${true ? 'Se elimino la sucursal' : ' no se elimino la sucursal'}`)
                        })
                });
            });
        },

        // configurar botones de editar
        setupEditButtons: function () {
            const editButtons = document.querySelectorAll('.edit-branch-btn');

            editButtons.forEach(btn => {
                btn.addEventListener('click', (event) => {
                    event.stopPropagation();

                    const branchItem = btn.closest('.branch-item');
                    const branchId = branchItem.getAttribute('data-id');

                    // redirigir al formulario de edición
                    window.location.href = `./branchesFormEdit.html?Id=${branchId}`;
                });
            });
        },

        showToast: function (message, type = 'success') {
            const toast = document.createElement('div');
            toast.className = `fixed bottom-4 right-4 px-4 py-2 rounded-md text-white ${type === 'success' ? 'bg-green-500' : 'bg-red-500'
                }`;
            toast.textContent = message;
            document.body.appendChild(toast);
            setTimeout(() => {
                toast.remove();
            }, 3000);
        },

        handleTabButtonClick: function (event) {
            this.elements.tabButtons.forEach(btn => btn.classList.remove('active'));
            this.elements.tabContents.forEach(content => content.classList.remove('active'));

            event.currentTarget.classList.add('active');
            const tabId = event.currentTarget.getAttribute('data-tab');
            document.getElementById(`tab-${tabId}`).classList.add('active');

            // si es la pestaña de zonas, ajustar el mapa
            if (tabId === 'zones' && this.data.zonesMap) {
                setTimeout(() => {
                    this.data.zonesMap.resize();
                }, 100);
            }
            // si es la pestaña de detalles, ajustar el mapa
            if (tabId === 'details' && this.data.map) {
                setTimeout(() => {
                    this.data.map.resize();
                }, 100);
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
            this.elements.appContainer.classList.remove('mobile-view-details');
            document.body.classList.remove('mobile-view-active');

            this.elements.sidebar.style.display = 'block';
            this.elements.mainContent.style.removeProperty('position');
            this.elements.mainContent.style.removeProperty('height');

            document.body.style.overflow = '';
        },
        checkResponsive: function () {
            if (window.innerWidth >= 768) {
                this.elements.appContainer.classList.remove('mobile-view-details');
                document.body.classList.remove('mobile-view-active');

                this.elements.sidebar.style = '';
                this.elements.mainContent.style = '';
                document.body.style.overflow = '';
            } else {
                if (this.elements.appContainer.classList.contains('mobile-view-details')) {
                    document.body.classList.add('mobile-view-active');
                }
            }
        },

        refreshData: function () {
            this.elements.refreshButton.disabled = true;
            this.elements.refreshIcon.classList.add('loading-spinner');
            setTimeout(() => {
                if (this.data.currentBranchId) {
                    this.fetchBranchDetails(this.data.currentBranchId);
                }
                this.elements.refreshIcon.classList.remove('loading-spinner');
                this.elements.refreshButton.disabled = false;
                this.showToast('Datos actualizados', 'success');
            }, 1000);
        },
        applyFilters: function () {
            // obtener los valores de los filtros
            const filters = {
                status: document.getElementById('status-filter').value,
                name: document.getElementById('name-filter').value.trim(),
                city: document.getElementById('city-filter').value.trim(),
                dateFrom: document.getElementById('date-from').value,
                dateTo: document.getElementById('date-to').value
            };

            // filtrar la lista de sucursales
            this.filterBranchList(filters);
        },
        clearFilters: function () {
            // restablecer los valores de los filtros
            document.getElementById('status-filter').value = '';
            document.getElementById('name-filter').value = '';
            document.getElementById('city-filter').value = '';
            document.getElementById('date-from').value = '';
            document.getElementById('date-to').value = '';

            // mostrar todas las sucursales
            this.filterBranchList({});
        },

        filterBranchList: function (filters) {
            const branchItems = document.querySelectorAll('.branch-item');

            branchItems.forEach(branchItem => {
                const branchStatus = branchItem.getAttribute('data-status');
                const branchName = branchItem.querySelector('.font-medium').textContent.toLowerCase();
                const branchAddress = branchItem.querySelector('p:nth-of-type(1)').textContent.toLowerCase();
                const branchDate = new Date(branchItem.querySelector('.branch-date').textContent.replace('Registro: ', ''));

                // aplicar filtros
                const matchesStatus = !filters.status || branchStatus === filters.status;
                const matchesName = !filters.name || branchName.includes(filters.name.toLowerCase());
                const matchesCity = !filters.city || branchAddress.includes(filters.city.toLowerCase());
                const matchesDate = (!filters.dateFrom || branchDate >= new Date(filters.dateFrom)) &&
                    (!filters.dateTo || branchDate <= new Date(filters.dateTo));

                // mostrar u ocultar la sucursal según los filtros
                if (matchesStatus && matchesName && matchesCity && matchesDate) {
                    branchItem.style.display = 'block';
                } else {
                    branchItem.style.display = 'none';
                }
            });
        },

        // panel de filtros
        toggleFilterPanel: function () {
            this.elements.filterPanel.classList.toggle('open');
            this.elements.filterIcon.classList.toggle('rotate-180');
        }
    };

    // inicializar la aplicación
    app.init();
});