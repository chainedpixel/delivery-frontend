import Config from "./config.js";
import Dialog from "./utils/Dialog.js";
document.addEventListener('DOMContentLoaded', function () {
    const app = {
        elements: {
            sidebar: document.querySelector('.sidebar'),
            mainContent: document.getElementById('main-content'),
            appContainer: document.getElementById('app-container'),
            mobileBackBtn: document.getElementById('mobile-back'),
            tabButtons: document.querySelectorAll('.tab-button'),
            tabContents: document.querySelectorAll('.tab-content'),
            partnersList: document.getElementById('partners-list'),
            filterPanel: document.getElementById('filter-panel'),
            filterToggle: document.getElementById('filter-toggle'),
            filterIcon: document.getElementById('filter-icon'),
            applyFiltersBtn: document.getElementById('apply-filters'),
            clearFiltersBtn: document.getElementById('clear-filters'),
            statusFilter: document.getElementById('status-filter'),
            nameFilter: document.getElementById('name-filter'),
            noPartnerSelected: document.getElementById('no-partner-selected'),
            contentArea: document.getElementById('content-area'),
            refreshButton: document.getElementById('refresh-button'),
            refreshIcon: document.getElementById('refresh-icon'),
            deleteModal: document.getElementById('delete-modal'),
            confirmDeleteBtn: document.getElementById('confirm-delete'),
            cancelDeleteBtn: document.getElementById('cancel-delete'),
            closeDeleteModal: document.getElementById('close-delete-modal'),
            currentPartnerToDelete: null
        },
        data: {
            currentPartnerID:null
        },

        init: function () {
            this.setupEventListeners();
            this.showNoPartnerSelectedState();
            this.newAddressSetup();
            this.initMapModal();
            this.setupAssingModal();
        },




        handlePartnerClick: function (partnerItem) {
            // Remover selección previa
            document.querySelectorAll('.partner-item').forEach(item => {
                item.classList.remove('selected');
            });

            // Agregar selección actual
            partnerItem.classList.add('selected');

            // Obtener ID del partner
            const partnerId = partnerItem.dataset.id;
            app.data.selectedPartnerId = partnerId;
            // Cargar detalles del partner
            this.loadPartnerDetails(partnerId);

            // Ocultar mensaje de "ningún partner seleccionado"
            this.hideNoPartnerSelectedState();

            // Para móvil: mostrar vista de detalles
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

        loadPartnerDetails: function (partnerId) {

            app.data.currentPartnerID=partnerId;
            //PEDIR los datos a la api
            let partnerDetails = {};
            this.renderPartnerDetails(partnerDetails);



        },

        renderPartnerDetails: function (partner) {

            //evento click para la asignacion de sucursales
            document.getElementById('add-branch-btn').addEventListener('click', app.openAssignBranchModal);
            //agregar eventos de click a los botones
            Array.from(document.querySelectorAll('.branch-actions .delete-btn')).forEach(btn => {
                btn.addEventListener('click', function () {
                    Dialog("Desasignar Sucursal",
                        `<span>Quiere desasignar la Sucursal?</span>
                        <br><span>Id de sucursal: <b>${this.dataset.id}</b></span>`,
                        { cancelButton: true, confirmButton: true, confirmText: 'Desasignar Sucursal' },
                        () => {
                            //click en cancelar
                        },
                        async () => {
                            Dialog("Mensaje", `${true ? 'Se desasigno la sucursal' : 'no se desasigno la sucursal'}`)
                        })

                })
            })
            Array.from(document.querySelectorAll('.branch-actions .edit-btn')).forEach(btn => {
                btn.addEventListener('click', function () {
                    window.location.href='../branches/branchesFormEdit.html?Id='+this.dataset.id

                })
            })
            Array.from(document.querySelectorAll('.branch-actions .view-btn')).forEach(btn => {
                btn.addEventListener('click', function () {
                    window.location.href='../branches/branchesDetails.html?Id='+this.dataset.id

                })
            })
        },


        showNoPartnerSelectedState: function () {
            this.elements.noPartnerSelected.classList.remove('hidden');
            this.elements.contentArea.classList.add('hidden');
        },

        hideNoPartnerSelectedState: function () {
            this.elements.noPartnerSelected.classList.add('hidden');
            this.elements.contentArea.classList.remove('hidden');
        },

        showToast: function (message, type = 'success') {
            // Implementar toast de notificación
            const toast = document.createElement('div');
            toast.className = `fixed bottom-4 right-4 px-4 py-2 rounded-md text-white ${type === 'success' ? 'bg-green-500' : 'bg-red-500'
                }`;
            toast.textContent = message;

            document.body.appendChild(toast);

            setTimeout(() => {
                toast.remove();
            }, 3000);
        },

        setupEventListeners: function () {


            this.elements.mobileBackBtn.addEventListener('click', this.handleMobileBack.bind(this));

            // responsive check
            window.addEventListener('resize', this.checkResponsive.bind(this));



            //evento click de los tabs
            this.elements.tabButtons.forEach(button => {
                button.addEventListener('click', this.handleTabButtonClick.bind(this));
            });

            // Panel de filtros
            this.elements.filterToggle.addEventListener('click', () => {
                this.elements.filterPanel.classList.toggle('open');
                this.elements.filterIcon.classList.toggle('rotate-180');
            });

            // Aplicar filtros
            this.elements.applyFiltersBtn.addEventListener('click', () => {
                const filters = {
                    status: this.elements.statusFilter.value,
                    name: this.elements.nameFilter.value.trim()
                };

                this.applyFilters(filters);
            });

            // Limpiar filtros
            this.elements.clearFiltersBtn.addEventListener('click', () => {
                this.elements.statusFilter.value = '';
                this.elements.nameFilter.value = '';
                this.applyFilters({});
            });

            // Botón de actualizar
            this.elements.refreshButton.addEventListener('click', () => {
                this.refreshData();
            });

            //evento click de la lista de asociados
            Array.from(document.querySelectorAll('.partner-item')).forEach(p => {
                p.addEventListener('click', () => this.handlePartnerClick(p));
            });

            //evento click boton eliminar de la lista de asociados
            Array.from(document.querySelectorAll('.partner-item .delete-partner-btn')).forEach(p => {
                p.addEventListener('click', function (event) {
                    event.stopPropagation();
                    app.handlePartnerDeletion(this.closest('.partner-item'))
                });
            });
            //evento click boton editar de la lista de asociados
            Array.from(document.querySelectorAll('.partner-item .edit-partner-btn')).forEach(p => {
                p.addEventListener('click', function (event) {
                    event.stopPropagation();
                    let partnerID = this.closest('.partner-item').dataset.id;
                   window.location.href = './parnerFormEdit.html?Id='+partnerID
                });
            });
           document.querySelector('.edit-partner-btn-details').addEventListener('click', function (event) {
                    event.stopPropagation();
                  
                   window.location.href = './parnerFormEdit.html?Id='+app.data.currentPartnerID
                });
     


            //eventos para cerrar el modal de nueva direccion
            document.getElementById('close-address-modal').addEventListener('click', () => {
                document.getElementById('address-modal').classList.remove('active');
            });

            document.getElementById('cancel-address').addEventListener('click', () => {
                document.getElementById('address-modal').classList.remove('active');
            });

            // Eventos para botones de mapa
            document.addEventListener('click', function (e) {
                if (e.target.closest('.map-btn')) {
                    const btn = e.target.closest('.map-btn');
                    const lat = parseFloat(btn.getAttribute('data-lat'));
                    const lon = parseFloat(btn.getAttribute('data-lon'));
                    showLocationOnMap(lat, lon);
                }
            });
            // Eventos para botones de mapa

            document.querySelectorAll('.address-edit-btn').forEach(btn => {
                btn.addEventListener('click', function () {
                    const addressId = this.closest('.address-item').dataset.id;

                    const addressData = {
                        id: addressId,
                        address_line1: "Calle 100 #15-20",
                        address_line2: "Edificio Centro Empresarial",
                        city: "Bogotá",
                        state: "Cundinamarca",
                        postal_code: "110121",
                        latitude: 4.6833,
                        longitude: -74.0522,
                        is_main: true
                    };

                    openEditAddressModal(addressData);
                });
            });
            document.querySelectorAll('.address-delete-btn').forEach(btn => {
                btn.addEventListener('click', function () {
                    const addressId = this.closest('.address-item').dataset.id;

                    Dialog("Eliminar Asociado",
                        `<span>Quiere eliminar la direccion?</span>
                           <div>ID: <b>${addressId}</b> </div>
                           `,
                        { cancelButton: true, confirmButton: true, confirmText: 'Eliminar Asociado' },
                        () => { }, async () => {
                            Dialog("Mensaje", `${true ? 'Se elimino la direccion' : 'no se elimino la direccion'}`)
                        })
                });
            });

        },
        handlePartnerDeletion: function (element) {
            let partnerID = element.dataset.id;
            console.log(partnerID)
            Dialog("Eliminar Asociado",
                `<span>Quiere eliminar el asociado?</span>
                   <div> ${element.querySelector('.partner-name').outerHTML}</div>
                   <div> ${element.querySelector('.partner-id').outerHTML}</div>
                   <div> ${element.querySelector('.partner-branches').outerHTML}</div>`,
                { cancelButton: true, confirmButton: true, confirmText: 'Eliminar Asociado' },
                () => { }, async () => {
                    Dialog("Mensaje", `${true ? 'Se elimino el asociado' : 'no se elimino el asociado'}`)
                })

        },
        newAddressSetup: function () {
            const newAddressForm = document.getElementById('address-form');
            const addressModal = document.getElementById('address-modal');
            const modalTitle = document.getElementById('address-modal-title')

            // Mostrar/ocultar modal
            document.getElementById('add-address-btn')?.addEventListener('click', () => {
                modalTitle.textContent = 'Nueva Dirección';
                resetForm();
                addressModal.classList.add('active');
            });

            document.getElementById('close-address-modal')?.addEventListener('click', () => {
                addressModal.classList.remove('active');
                resetForm();
            });

            document.getElementById('cancel-address')?.addEventListener('click', () => {
                addressModal.classList.remove('active');
                resetForm();
            });

            // Validación en tiempo real
            document.getElementById('address_line1')?.addEventListener('blur', validateAddressLine1);
            document.getElementById('city')?.addEventListener('blur', validateCity);
            document.getElementById('state')?.addEventListener('blur', validateState);
            document.getElementById('postal_code')?.addEventListener('blur', validatePostalCode);
            document.getElementById('latitude')?.addEventListener('blur', validateLatitude);
            document.getElementById('longitude')?.addEventListener('blur', validateLongitude);

            // Validación al enviar el formulario
            newAddressForm?.addEventListener('submit', function (e) {
                e.preventDefault();

                if (validateForm()) {
                    const addressData = {
                        id: document.getElementById('address_id').value || null,
                        address_line1: document.getElementById('address_line1').value.trim(),
                        address_line2: document.getElementById('address_line2').value.trim(),
                        city: document.getElementById('city').value.trim(),
                        state: document.getElementById('state').value.trim(),
                        postal_code: document.getElementById('postal_code').value.trim(),
                        latitude: document.getElementById('latitude').value ?
                            parseFloat(document.getElementById('latitude').value) : null,
                        longitude: document.getElementById('longitude').value ?
                            parseFloat(document.getElementById('longitude').value) : null,
                        is_main: document.querySelector('input[name="is_main"]:checked').value === 'true',
                        company_id: app.data.selectedPartnerId
                    };

                    const isUpdate = addressData.id !== null;
                    const action = isUpdate ? 'actualizada' : 'registrada';

                    Dialog("Mensaje", `Dirección ${action} correctamente`, {
                        confirmButton: true,
                        confirmText: 'Cerrar'
                    }, () => { }, async () => {
                        if (isUpdate) {
                            // Lógica para actualizar dirección
                            console.log("Actualizando dirección:", addressData);
                        } else {
                            // Lógica para crear nueva dirección
                            console.log("Creando nueva dirección:", addressData);
                        }

                        addressModal.classList.remove('active');
                        resetForm();

                        // Opcional: Recargar o actualizar la lista de direcciones
                        // app.loadAddresses();
                    });
                }
            });

            // Función para obtener coordenadas automáticamente
            document.getElementById('get-coordinates')?.addEventListener('click', function () {

                app.pickLatLonFromMap(document.getElementById('latitude'), document.getElementById('longitude'))

            });

            // Función para abrir el modal en modo edición
            window.openEditAddressModal = function (addressData) {
                debugger
                // Cambiar título
                modalTitle.textContent = 'Editar Dirección';

                // Llenar formulario con datos existentes
                document.getElementById('address_id').value = addressData.id || '';
                document.getElementById('address_line1').value = addressData.address_line1 || '';
                document.getElementById('address_line2').value = addressData.address_line2 || '';
                document.getElementById('city').value = addressData.city || '';
                document.getElementById('state').value = addressData.state || '';
                document.getElementById('postal_code').value = addressData.postal_code || '';
                document.getElementById('latitude').value = addressData.latitude || '';
                document.getElementById('longitude').value = addressData.longitude || '';

                // Seleccionar radio button correcto
                const isMain = addressData.is_main !== undefined ? addressData.is_main : true;
                document.getElementById(`is_main_${isMain}`).checked = true;

                // Mostrar modal
                addressModal.classList.add('active');
            };
            // Funciones de validación individuales
            function validateAddressLine1() {
                const input = document.getElementById('address_line1');
                const error = document.getElementById('address_line1-error');

                if (!input.value.trim()) {
                    input.classList.add('border-red-500');
                    error.classList.remove('hidden');
                    return false;
                } else {
                    input.classList.remove('border-red-500');
                    error.classList.add('hidden');
                    return true;
                }
            }

            function validateCity() {
                const input = document.getElementById('city');
                const error = document.getElementById('city-error');

                if (!input.value.trim()) {
                    input.classList.add('border-red-500');
                    error.classList.remove('hidden');
                    return false;
                } else {
                    input.classList.remove('border-red-500');
                    error.classList.add('hidden');
                    return true;
                }
            }
            function validateForm() {
                const validations = [
                    validateAddressLine1(),
                    validateCity(),
                    validateState(),
                    validatePostalCode(),
                    validateLatitude(),
                    validateLongitude()
                ];

                return validations.every(valid => valid);
            }
            function validateState() {
                const input = document.getElementById('state');
                const error = document.getElementById('state-error');

                if (!input.value.trim()) {
                    input.classList.add('border-red-500');
                    error.classList.remove('hidden');
                    return false;
                } else {
                    input.classList.remove('border-red-500');
                    error.classList.add('hidden');
                    return true;
                }
            }

            function validatePostalCode() {
                const input = document.getElementById('postal_code');
                const error = document.getElementById('postal_code-error');

                if (!input.value.trim()) {
                    input.classList.add('border-red-500');
                    error.textContent = 'Por favor ingrese el código postal';
                    error.classList.remove('hidden');
                    return false;
                } else if (!/^\d{4,10}$/.test(input.value)) {
                    input.classList.add('border-red-500');
                    error.textContent = 'El código postal debe contener entre 4 y 10 dígitos';
                    error.classList.remove('hidden');
                    return false;
                } else {
                    input.classList.remove('border-red-500');
                    error.classList.add('hidden');
                    return true;
                }
            }

            function validateLatitude() {
                const input = document.getElementById('latitude');
                const error = document.getElementById('latitude-error');

                if (input.value.length === 0) {
                    input.classList.add('border-red-500');
                    error.classList.remove('hidden');
                    return false;
                } else {
                    input.classList.remove('border-red-500');
                    error.classList.add('hidden');
                    return true;
                }
            }

            function validateLongitude() {
                const input = document.getElementById('longitude');
                const error = document.getElementById('longitude-error');

                if (input.value.length === 0) {
                    input.classList.add('border-red-500');
                    error.classList.remove('hidden');
                    return false;
                } else {
                    input.classList.remove('border-red-500');
                    error.classList.add('hidden');
                    return true;
                }
            }

            // Función para resetear el formulario
            function resetForm() {
                newAddressForm.reset();
                document.querySelectorAll('.border-red-500').forEach(el => {
                    el.classList.remove('border-red-500');
                });
                document.querySelectorAll('[id$="-error"]').forEach(el => {
                    el.classList.add('hidden');
                });
            }
        },
        // Manejar pestañas
        handleTabButtonClick: function (event) {
            this.elements.tabButtons.forEach(btn => btn.classList.remove('active'));
            this.elements.tabContents.forEach(content => content.classList.remove('active'));

            event.currentTarget.classList.add('active');
            const tabId = event.currentTarget.getAttribute('data-tab');
            document.getElementById(`tab-${tabId}`).classList.add('active');

            // Si es la pestaña de zonas, ajustar el mapa
            if (tabId === 'zones' && this.data.zonesMap) {
                setTimeout(() => {
                    this.data.zonesMap.resize();
                }, 100);
            }
            // Si es la pestaña de detalles, ajustar el mapa
            if (tabId === 'details' && this.data.map) {
                setTimeout(() => {
                    this.data.map.resize();
                }, 100);
            }
        },
        applyFilters: function (filters) {
            const partnerItems = document.querySelectorAll('.partner-item');

            partnerItems.forEach(item => {
                const matchesStatus = !filters.status || item.dataset.status === filters.status;
                const matchesName = !filters.name ||
                    item.querySelector('.font-medium').textContent.toLowerCase().includes(filters.name.toLowerCase());

                if (matchesStatus && matchesName) {
                    item.style.display = 'block';
                } else {
                    item.style.display = 'none';
                }
            });
        },

        refreshData: function () {
            this.elements.refreshButton.disabled = true;
            this.elements.refreshIcon.classList.add('loading-spinner');

            // Simular recarga
            setTimeout(() => {

                this.elements.refreshIcon.classList.remove('loading-spinner');
                this.elements.refreshButton.disabled = false;

                this.showToast('Datos actualizados', 'success');
            }, 1000);
        },
        // Manejar volver en vista móvil
        handleMobileBack: function () {
            this.elements.appContainer.classList.remove('mobile-view-details');
            document.body.classList.remove('mobile-view-active');

            this.elements.sidebar.style.display = 'block';
            this.elements.mainContent.style.removeProperty('position');
            this.elements.mainContent.style.removeProperty('height');

            document.body.style.overflow = '';
        },

        // Verificar responsive
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
        pickLatLonFromMap: function (latInput, lngInput) {
            debugger
            // Crear elementos del modal
            const modal = document.createElement('div');
            modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-[1225] flex items-center justify-center p-4';

            const modalContent = document.createElement('div');
            modalContent.className = 'bg-white rounded-lg shadow-xl w-full max-w-4xl h-[80vh] flex flex-col';

            const modalHeader = document.createElement('div');
            modalHeader.className = 'p-4 border-b flex justify-between items-center';
            modalHeader.innerHTML = `
                <h3 class="text-lg font-semibold">Seleccionar ubicación</h3>
            `;

            const closeButton = document.createElement('button');
            closeButton.className = 'text-gray-500 hover:text-gray-700';
            closeButton.innerHTML = '&times;';
            closeButton.onclick = () => modal.remove();

            const mapContainer = document.createElement('div');
            mapContainer.id = 'modal-map-container';
            mapContainer.className = 'flex-1';

            const modalFooter = document.createElement('div');
            modalFooter.className = 'p-4 border-t flex justify-end space-x-2';

            const cancelButton = document.createElement('button');
            cancelButton.className = 'px-4 py-2 text-gray-600 hover:text-gray-800';
            cancelButton.textContent = 'Cancelar';
            cancelButton.onclick = () => modal.remove();

            const acceptButton = document.createElement('button');
            acceptButton.className = 'px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700';
            acceptButton.textContent = 'Aceptar';

            // Construir la estructura del modal
            modalHeader.appendChild(closeButton);
            modalFooter.appendChild(cancelButton);
            modalFooter.appendChild(acceptButton);

            modalContent.appendChild(modalHeader);
            modalContent.appendChild(mapContainer);
            modalContent.appendChild(modalFooter);

            modal.appendChild(modalContent);
            document.body.appendChild(modal);

            // Inicializar el mapa

            mapboxgl.accessToken = Config.MAPBOX.token;

            const map = new mapboxgl.Map({
                container: 'modal-map-container',
                style: 'mapbox://styles/mapbox/streets-v12',
                center: Config.MAPBOX.mapInitialCoords,
                zoom: Config.MAPBOX.mapZoom
            });
            // Añadir controles
            map.addControl(new mapboxgl.NavigationControl());

            // Crear marcador
            const marker = new mapboxgl.Marker({
                draggable: true
            })
                .setLngLat(map.getCenter())
                .addTo(map);

            // Manejar clics en el mapa para mover el marcador
            map.on('click', (e) => {
                marker.setLngLat(e.lngLat);
            });

            // Manejar el botón Aceptar
            acceptButton.onclick = () => {
                const lngLat = marker.getLngLat();
                latInput.value = lngLat.lat.toFixed(6);
                lngInput.value = lngLat.lng.toFixed(6);
                modal.remove();
            };

            // Si hay valores existentes en los inputs, centrar el mapa allí
            const currentLat = latInput.value;
            const currentLng = lngInput.value;

            if (currentLat && currentLng) {
                const initialCoords = [parseFloat(currentLng), parseFloat(currentLat)];
                map.setCenter(initialCoords);
                marker.setLngLat(initialCoords);
                map.flyTo({
                    center: initialCoords,
                    zoom: Config.MAPBOX.mapZoomCloser
                });
            }
            setTimeout(() => {
                map.resize();
            }, 100);
        },
        initMapModal: function () {


            window.showLocationOnMap = function (lat, lon) {
                let mapInstance = null;
                let marker = null;
                const modal = document.getElementById('map-modal');
                modal.classList.remove('hidden');
                mapboxgl.accessToken = Config.MAPBOX.token;



                if (!mapInstance) {
                    mapInstance = new mapboxgl.Map({
                        container: 'modal-map-container-dir',
                        style: 'mapbox://styles/mapbox/streets-v11',
                        center: [lon, lat],
                        zoom: Config.MAPBOX.mapZoom
                    });
                    mapInstance.addControl(new mapboxgl.NavigationControl());
                } else {
                    mapInstance.setCenter([lon, lat]);
                }

                if (marker) marker.remove();
                marker = new mapboxgl.Marker()
                    .setLngLat([lon, lat])
                    .addTo(mapInstance);

                mapInstance.flyTo({
                    center: [lon, lat],
                    zoom: Config.MAPBOX.mapZoomCloser
                });
                setTimeout(() => {
                    mapInstance.resize();
                }, 100);
            };

            // Eventos para cerrar modal
            document.querySelectorAll('.close-map-modal').forEach(btn => {
                btn.addEventListener('click', () => {
                    document.getElementById('map-modal').classList.add('hidden');
                });
            });


        },
        openAssignBranchModal: function () {
            const modal = document.getElementById('assign-branch-modal');
            modal.classList.remove('hidden');
        },

        setupAssingModal: function () {
            let selectedBranches = [];

            // Actualizar estado inicial
            updateSelectionUI();

            // Configurar eventos
            setupBranchSelection();
            setupSearch();

            // Actualizar la interfaz de selección
            function updateSelectionUI() {
                document.querySelectorAll('.branch-item-compact').forEach(item => {
                    const branchId = item.querySelector('.assign-btn').dataset.id;
                    const isSelected = selectedBranches.includes(branchId);
                    const isDisabled = item.querySelector('.assign-btn').disabled;

                    if (isSelected && !isDisabled) {
                        item.classList.add('border-blue-500', 'bg-blue-50');
                        item.querySelector('.assign-btn').innerHTML = '<i class="fas fa-check text-blue-600"></i>';
                        item.querySelector('.assign-btn').classList.remove('text-blue-500');
                        item.querySelector('.assign-btn').classList.add('text-blue-600');
                    } else if (!isDisabled) {
                        item.classList.remove('border-blue-500', 'bg-blue-50');
                        item.querySelector('.assign-btn').innerHTML = '<i class="fas fa-plus-circle"></i>';
                        item.querySelector('.assign-btn').classList.add('text-blue-500');
                        item.querySelector('.assign-btn').classList.remove('text-blue-600');
                    }
                });
            }

            // Configurar selección de sucursales
            function setupBranchSelection() {
                document.querySelectorAll('.assign-btn:not(:disabled)').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const branchId = btn.dataset.id;

                        if (selectedBranches.includes(branchId)) {
                            selectedBranches = selectedBranches.filter(id => id !== branchId);
                        } else {
                            selectedBranches.push(branchId);
                        }

                        updateSelectionUI();
                    });
                });

                // Click en toda la tarjeta
                document.querySelectorAll('.branch-item-compact').forEach(item => {
                    const btn = item.querySelector('.assign-btn');
                    if (!btn.disabled) {
                        item.addEventListener('click', () => {
                            const branchId = btn.dataset.id;

                            if (selectedBranches.includes(branchId)) {
                                selectedBranches = selectedBranches.filter(id => id !== branchId);
                            } else {
                                selectedBranches.push(branchId);
                            }

                            updateSelectionUI();
                        });
                    }
                });
            }

            // Configurar búsqueda
            function setupSearch() {
                document.getElementById('branch-search').addEventListener('input', (e) => {
                    const searchTerm = e.target.value.toLowerCase();
                    document.querySelectorAll('.branch-item-compact').forEach(item => {
                        const text = item.textContent.toLowerCase();
                        item.style.display = text.includes(searchTerm) ? 'flex' : 'none';
                    });
                });
            }

            // Cerrar modal
            document.querySelectorAll('.close-assign-modal').forEach(btn => {
                btn.addEventListener('click', () => {
                    document.getElementById('assign-branch-modal').classList.add('hidden');
                });
            });
            document.getElementById('confirm-assign').addEventListener('click', () => {
                console.log('Sucursales seleccionadas:', selectedBranches);
                document.getElementById('assign-branch-modal').classList.add('hidden');
                // Aquí iría tu lógica para procesar las sucursales seleccionadas
            });

        }
    };

    app.init();
});