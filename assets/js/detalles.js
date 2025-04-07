import Config from "./config.js";
import ApiClient from "./utils/apiClient.js";
document.addEventListener('DOMContentLoaded', function () {
    // Configuración inicial y variables globales
    const app = {
        elements: {
            appContainer: document.getElementById('app-container'),
            orderItems: document.querySelectorAll('.order-item'),
            tabButtons: document.querySelectorAll('.tab-button'),
            tabContents: document.querySelectorAll('.tab-content'),
            ordersTabButtons: document.querySelectorAll('.orders-tab-button'),
            ordersTabContents: document.querySelectorAll('.orders-tab-content'),
            filterToggle: document.getElementById('filter-toggle'),
            filterPanel: document.getElementById('filter-panel'),
            filterIcon: document.getElementById('filter-icon'),
            mobileBackBtn: document.getElementById('mobile-back'),
            refreshButton: document.getElementById('refresh-button'),
            refreshIcon: document.getElementById('refresh-icon'),
            mainContent: document.getElementById('main-content'),
            contentArea: document.getElementById('content-area'),
            noOrderSelected: document.getElementById('no-order-selected'),
            createNewOrderBtn: document.getElementById('create-new-order'),
            createNewOrderBtnSmall: document.getElementById('create-new-order-small'),
            sidebar: document.querySelector('.sidebar'),
            deleteModal: document.getElementById('delete-order-modal'),
            closeModalBtn: document.getElementById('close-modal'),
            cancelDeleteBtn: document.getElementById('cancel-delete'),
            confirmDeleteBtn: document.getElementById('confirm-delete'),
            deletePedido: document.getElementById('delete-order-name'),
            deleteOrderId: document.getElementById('delete-order-id'),
            deleteLoading: document.getElementById('delete-loading'),
            deleteOrderBtns: document.querySelectorAll('.delete-order-btn'),
        },
        data: {
            currentId: null,
            currentOrderToDelete:null,
            currentDataIndex: 0,
        },
        init: async function () {
            this.showNoOrderSelectedState();
            this.setupEventListeners();
            await this.loadOrders(); // Cargar la primera página de pedidos
            this.reorganizeItemsByStatus();
            this.updateOrdersCounts();
            this.setScrollContainerHeights();
        },
        loadOrders: async function (page = 1) {
            try {
                this.showLoadingSpinner();
        
                const orders = await ApiClient.request(`${Config.ENDPOINTS.PEDIDO}?page=${page}`, {
                    method: "GET",
                });
        
                this.renderOrders(orders.data);
                this.updatePaginationInfo(orders.total, orders.per_page, orders.current_page);
            } catch (error) {
                console.error('Error al cargar los pedidos:', error);
                this.showErrorMessage('Error al cargar los pedidos');
            } finally {
                this.hideLoadingSpinner();
            }
        },
        renderOrders: function (orders) {
            const orderListContainer = document.getElementById('order-list-container-todos');
            orderListContainer.innerHTML = ''; // Limpiar el contenedor antes de agregar los nuevos pedidos
        
            orders.data.forEach(order => {
                if (order.status.toLowerCase() == 'active')
                    order.status = 'Activo'
                if (order.status.toLowerCase() == 'pending')
                    order.status = 'Pendiente'
                if (order.status.toLowerCase() == 'in-transit')
                    order.status = 'Transito'
                if (order.status.toLowerCase() == 'delayed')
                    order.status = 'Demorado'
                const orderItem = document.createElement('div');
                orderItem.className = 'order-item';
                orderItem.setAttribute('data-id', order.id);
                orderItem.setAttribute('data-status', order.status.toLowerCase());
        
                orderItem.innerHTML = `
                    <div class="flex justify-between items-center">
                        <span class="font-medium">${order.tracking_number}</span>
                        <span class="status-tag status-${order.status.toLowerCase()}">${order.status}</span>
                    </div>
                    <p class="text-sm text-gray-600 mt-1 delivery-address">${order.delivery_address}</p>
                    <p class="text-sm text-gray-600">${order.client_name}</p>
                    <div class="flex justify-between items-center mt-1">
                        <p class="text-sm text-gray-600 order-date">Entrega: ${new Date(order.delivery_deadline).toLocaleDateString()}</p>
                        <button data-id="${order.id}" class="text-gray-400 hover:text-red-500">
                            <i class="pointer-events-none fas fa-trash-alt"></i>
                        </button>
                    </div>
                `;
                orderItem.querySelector('button').addEventListener('click', this.eliminarOrden);
                orderItem.addEventListener('click', () => this.handleOrderItemClick(orderItem));
                orderListContainer.appendChild(orderItem);
            });
        },
        eliminarOrden: async function (evt) {
            evt.stopPropagation();
            console.log(evt.target)
            let orderID = evt.target.getAttribute('data-id');
            //acas se elimina la ordern hay que preguntar 
            app.data.currentOrderToDelete=orderID;

            const orderItem = evt.target.closest('.order-item');
            const orderId = orderItem.getAttribute('data-id');
            const orderTracking = orderItem.querySelector('.font-medium').textContent;

            app.showDeleteModal(orderId, orderTracking);

        },
        setupEventListeners: function () {
            // Pestañas de contenido principal
            this.elements.tabButtons.forEach(button => {
                button.addEventListener('click', this.handleTabButtonClick.bind(this));
            });

            // Pestañas de pedidos
            this.elements.ordersTabButtons.forEach(button => {
                button.addEventListener('click', this.handleOrdersTabButtonClick.bind(this));
            });

            // Panel de filtros
            this.elements.filterToggle.addEventListener('click', this.toggleFilterPanel.bind(this));

            // Manejo de clics en pedidos
            this.elements.orderItems.forEach(item => {
                item.addEventListener('click', () => this.handleOrderItemClick(item));
            });

            // Botón volver en móvil
            this.elements.mobileBackBtn.addEventListener('click', this.handleMobileBack.bind(this));

            // Responsive check
            window.addEventListener('resize', this.checkResponsive.bind(this));

            // Botón de actualizar
            this.elements.refreshButton.addEventListener('click', this.refreshData.bind(this));
            this.elements.refreshButton.addEventListener('click', () => {
                this.loadOrders();
            });


            // Crear nuevo pedido
            if (this.elements.createNewOrderBtn) {
                this.elements.createNewOrderBtn.addEventListener('click', this.handleCreateNewOrder.bind(this));
            }
            if (this.elements.createNewOrderBtnSmall) {
                this.elements.createNewOrderBtnSmall.addEventListener('click', this.handleCreateNewOrder.bind(this));
            }
            // Cálculo de alturas y layout
            window.addEventListener('load', this.setScrollContainerHeights.bind(this));
            window.addEventListener('resize', this.setScrollContainerHeights.bind(this));

            // Paginación
            document.querySelectorAll('.pagination-button').forEach(button => {
                button.addEventListener('click', () => {
                    const page = parseInt(button.textContent);
                    if (!isNaN(page)) {
                        this.loadOrders(page);
                    }
                });
            });


            //eliminacion
            
            // Modal de eliminación - eventos
            this.elements.closeModalBtn.addEventListener('click', this.hideDeleteModal.bind(this));
            this.elements.cancelDeleteBtn.addEventListener('click', this.hideDeleteModal.bind(this));
            this.elements.confirmDeleteBtn.addEventListener('click', this.handleDeleteOrder.bind(this));



            // Filtros
            document.getElementById('apply-filters').addEventListener('click', this.applyFilters.bind(this));
            document.getElementById('clear-filters').addEventListener('click', this.clearFilters.bind(this));
        },

        // Mostrar modal de eliminación
        showDeleteModal: function (orderId, trackingId) {
            app.data.currentOrderToDelete = orderId;
            this.elements.deletePedido.textContent = `Tracking ID: ${trackingId}`;
            this.elements.deleteOrderId.textContent = `ID: ${orderId}`;
            this.elements.deleteModal.classList.add('active');
            document.body.style.overflow = 'hidden'; // Evitar scroll
        },

        // Ocultar modal de eliminación
        hideDeleteModal: function () {
            this.elements.deleteModal.classList.remove('active');
            document.body.style.overflow = '';
            this.data.currentOrderToDelete = null;
            this.elements.deleteLoading.classList.add('hidden');
        },
        handleDeleteOrder: function () {
            if (!this.data.currentOrderToDelete) return;

            // Mostrar estado de carga
            this.elements.deleteLoading.classList.remove('hidden');
            this.elements.confirmDeleteBtn.disabled = true;

            // Simular eliminación (esto se conectaría a una API real)
            setTimeout(async () => {
                try {
                   let response = await ApiClient.request(`${Config.ENDPOINTS.PEDIDO}/${app.data.currentOrderToDelete}`, {
                        method: "DELETE",
                    });
                } catch (error) {
                    alert('un error ocurrio')
                }
                if(app.data.currentId==app.data.currentOrderToDelete){
                    document.querySelector('#no-order-selected').classList.remove('hidden')
                    document.querySelector('#order-id-display').textContent='';
                }
                // Encontrar y eliminar el usuario de todas las pestañas
                document.querySelectorAll(`.user-item[data-id="${app.data.currentOrderToDelete}"]`).forEach(item => {
                    item.remove();
                });

                document.getElementById('refresh-button').click();

                // Ocultar modal
                this.hideDeleteModal();

                // Restablecer botón
                this.elements.confirmDeleteBtn.disabled = false;
            }, 500);
        },
        applyFilters: function () {
            const searchFilter = document.getElementById('search-filter').value.toLowerCase();
            const dateFrom = new Date(document.getElementById('date-from').value);
            const dateTo =new Date(document.getElementById('date-to').value);
            const locationFilter = document.getElementById('location-filter').value.toLowerCase();

            const orderItems = document.querySelectorAll('.order-item');

            orderItems.forEach(item => {
                const orderId = item.getAttribute('data-id').toLowerCase();
                const clientName = item.querySelector('.text-sm.text-gray-600').textContent.toLowerCase();
                const deliveryAddress = item.querySelector('.delivery-address').textContent.toLowerCase();
                const deliveryDate = new Date(item.querySelector('.order-date').textContent.split(' ')[1]);

                const matchesSearch = orderId.includes(searchFilter) || clientName.includes(searchFilter) || deliveryAddress.includes(searchFilter);
                const matchesDate = (!dateFrom || deliveryDate >= dateFrom) && (!dateTo || deliveryDate <= dateTo);
                const matchesLocation = deliveryAddress.includes(locationFilter);

                if (matchesSearch && matchesDate && matchesLocation) {
                    item.style.display = 'block';
                } else {
                    item.style.display = 'none';
                }
            });

            this.updateOrdersCounts();
        },

        clearFilters: function () {
            document.getElementById('search-filter').value = '';
            document.getElementById('date-from').value = '';
            document.getElementById('date-to').value = '';
            document.getElementById('location-filter').value = '';

            const orderItems = document.querySelectorAll('.order-item');
            orderItems.forEach(item => {
                item.style.display = 'block';
            });

            this.updateOrdersCounts();
        },

        updateOrdersCounts: function () {
            const tabTypes = ['todos', 'activos', 'transito', 'pendientes'];

            tabTypes.forEach(type => {
                const container = document.getElementById(`orders-tab-${type}`);
                const count = container.querySelectorAll('.order-item:not([style*="display: none"])').length;
                const badge = document.querySelector(`[data-orders-tab="${type}"] .badge-count`);
                badge.textContent = count;
            });

            this.updatePaginationInfo();
        },
        // Gestión de pestañas
        handleTabButtonClick: function (event) {
            this.elements.tabButtons.forEach(btn => btn.classList.remove('active'));
            this.elements.tabContents.forEach(content => content.classList.remove('active'));

            event.currentTarget.classList.add('active');
            const tabId = event.currentTarget.getAttribute('data-tab');
            document.getElementById(`tab-${tabId}`).classList.add('active');
        },

        handleOrdersTabButtonClick: function (event) {
            this.elements.ordersTabButtons.forEach(btn => btn.classList.remove('active'));
            this.elements.ordersTabContents.forEach(content => content.classList.remove('active'));

            event.currentTarget.classList.add('active');
            const tabId = event.currentTarget.getAttribute('data-orders-tab');
            document.getElementById(`orders-tab-${tabId}`).classList.add('active');

            this.updatePaginationInfo();
        },
        // Manejar clic en crear nuevo pedido
        handleCreateNewOrder: function () {
           window.location.href = '../orderForm'
        },
        // Panel de filtros
        toggleFilterPanel: function () {
            this.elements.filterPanel.classList.toggle('open');
            this.elements.filterIcon.classList.toggle('rotate-180');
        },

        // Gestión de pedidos
        handleOrderItemClick: async function (item) {
            // Remover selección de todos los pedidos
            document.querySelectorAll('.order-item').forEach(order => order.classList.remove('selected'));

            // Marcar el pedido seleccionado
            item.classList.add('selected');

            // Obtener datos del pedido
            const orderId = item.getAttribute('data-id');
            this.data.currentId = orderId;
            try {
                const orderDetails = await ApiClient.request(`${Config.ENDPOINTS.PEDIDO}/${orderId}`, {
                    method: "GET",
                });

                this.updateOrderDetails(orderDetails);
            } catch (error) {
                console.error('Error al cargar los detalles del pedido:', error);
                this.showErrorMessage('Error al cargar los detalles del pedido');
            }

            // Ocultar mensaje de ningún pedido seleccionado y mostrar detalles
            this.hideNoOrderSelectedState();

            // Para móvil: mostrar vista de detalles con cambio de contenido
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
        // Mostrar estado de ningún pedido seleccionado
        showNoOrderSelectedState: function () {
            if (this.elements.noOrderSelected && this.elements.contentArea) {
                this.elements.noOrderSelected.classList.remove('hidden');
                this.elements.contentArea.classList.add('hidden');
            }
        },

        // Ocultar estado de ningún pedido seleccionado
        hideNoOrderSelectedState: function () {
            if (this.elements.noOrderSelected && this.elements.contentArea) {
                this.elements.noOrderSelected.classList.add('hidden');
                this.elements.contentArea.classList.remove('hidden');
            }
        },
        // Gestión de vistas responsivas
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

        updatePaginationInfo: function (totalItems=0, itemsPerPage=0, currentPage=0) {
            const paginationContainer = document.getElementById('pagination-container');
            const paginationInfo = document.getElementById('pagination-info');
            const paginationButtonsContainer = document.getElementById('pagination-buttons');
        
            if (!paginationContainer || !paginationInfo || !paginationButtonsContainer) return;
        
            const totalPages = +(Math.ceil(totalItems / itemsPerPage));
        
            // Ocultar paginación si no hay más de una página
            if (totalPages <= 1 || isNaN(totalPages)) {
                paginationContainer.style.display = 'none';
                return;
            } else {
                paginationContainer.style.display = 'block'; // Mostrar la paginación
            }
        
            // Actualizar el texto que muestra el rango de ítems
            const startItem = (currentPage - 1) * itemsPerPage + 1;
            const endItem = Math.min(currentPage * itemsPerPage, totalItems);
            document.getElementById('pagination-start').textContent = startItem;
            document.getElementById('pagination-end').textContent = endItem;
            document.getElementById('pagination-total').textContent = totalItems;
        
            // Limpiar los botones de paginación existentes
            paginationButtonsContainer.innerHTML = '';
        
            // Botón "Anterior"
            const prevButton = document.createElement('button');
            prevButton.id = 'pagination-prev';
            prevButton.className = `pagination-button py-1 px-2 border border-gray-300 bg-white text-sm text-gray-500 rounded-l-md hover:bg-gray-50 ${currentPage === 1 ? 'disabled opacity-50' : ''}`;
            prevButton.innerHTML = '<i class="fas fa-chevron-left text-xs"></i>';
            prevButton.addEventListener('click', () => {
                if (currentPage > 1) this.loadOrders(currentPage - 1);
            });
            paginationButtonsContainer.appendChild(prevButton);
        
            // Botones de páginas
            for (let i = 1; i <= totalPages; i++) {
                const pageButton = document.createElement('button');
                pageButton.className = `pagination-button py-1 px-3 border border-gray-300 text-sm font-medium ${i === currentPage ? 'bg-[#ADADAD] text-white hover:bg-[#616161]' : 'bg-white text-gray-700 hover:bg-gray-50'}`;
                pageButton.textContent = i;
                pageButton.addEventListener('click', () => this.loadOrders(i));
                paginationButtonsContainer.appendChild(pageButton);
            }
        
            // Botón "Siguiente"
            const nextButton = document.createElement('button');
            nextButton.id = 'pagination-next';
            nextButton.className = `pagination-button py-1 px-2 border border-gray-300 bg-white text-sm text-gray-500 rounded-r-md hover:bg-gray-50 ${currentPage === totalPages ? 'disabled opacity-50' : ''}`;
            nextButton.innerHTML = '<i class="fas fa-chevron-right text-xs"></i>';
            nextButton.addEventListener('click', () => {
                if (currentPage < totalPages) this.loadOrders(currentPage + 1);
            });
            paginationButtonsContainer.appendChild(nextButton);
        },
        updateOrderDetails: function (orderDetails) {
            console.log(orderDetails)
            orderDetails = orderDetails.data;
            if (orderDetails.current_status.toLowerCase() == 'active')
                orderDetails.current_status = 'Activo'
            if (orderDetails.current_status.toLowerCase() == 'pending')
                orderDetails.current_status = 'Pendiente'
            if (orderDetails.current_status.toLowerCase() == 'in-transit')
                orderDetails.current_status = 'Transito'
            if (orderDetails.current_status.toLowerCase() == 'delayed')
                orderDetails.current_status = 'Demorado'
            // Actualizar el estado
            document.getElementById('order-id-display').textContent = orderDetails.id;
            document.getElementById('status-display').textContent = orderDetails.current_status;
            document.getElementById('status-display').className = 'status-tag status-' + orderDetails.current_status.toLowerCase();

            // Actualizar la información del cliente
            document.getElementById('customer-name').textContent = orderDetails.client_name;
            document.getElementById('customer-address-1').textContent = orderDetails.delivery_address.address_line1;
            document.getElementById('customer-address-2').textContent = `${orderDetails.delivery_address.city}, ${orderDetails.delivery_address.state} ${orderDetails.delivery_address.postal_code}`;

            // Actualizar información de seguimiento
            document.getElementById('tracking-number').textContent = orderDetails.tracking_number;
            document.getElementById('estimated-delivery').textContent = new Date(orderDetails.detail.delivery_deadline).toLocaleString();

            // Actualizar información de entrega
            document.getElementById('recipient-name').textContent = orderDetails.delivery_address.recipient_name;
            document.getElementById('phone-number').textContent = orderDetails.delivery_address.recipient_phone;
            document.getElementById('full-address').textContent = `${orderDetails.delivery_address.address_line1}, ${orderDetails.delivery_address.address_line2}, ${orderDetails.delivery_address.city}, ${orderDetails.delivery_address.state} ${orderDetails.delivery_address.postal_code}`;
            document.getElementById('delivery-notes').textContent = orderDetails.detail.delivery_notes;

            // Actualizar detalles del paquete
            document.getElementById('fragile').textContent = orderDetails.package_detail.is_fragile ? 'Sí' : 'No';
            document.getElementById('dimensions').textContent = JSON.parse(orderDetails.package_detail.dimensions).width + 'cm x ' + JSON.parse(orderDetails.package_detail.dimensions).height + 'cm x ' + JSON.parse(orderDetails.package_detail.dimensions).length + 'cm';
            document.getElementById('weight').textContent = orderDetails.package_detail.weight + ' kg';
            document.getElementById('price').textContent = '$' + orderDetails.detail.price;

            // Actualizar historial de seguimiento en la pestaña de Detalles
            const timelineContainer = document.querySelector('#tab-details .timeline-container');
            timelineContainer.innerHTML = '<div class="timeline-line"></div>';

            orderDetails.status_history.forEach(status => {
                const timelineItem = document.createElement('div');
                timelineItem.className = 'timeline-item';

                timelineItem.innerHTML = `
                    <div class="timeline-dot ${status.status.toLowerCase()}">
                        <i class="fas fa-check"></i>
                    </div>
                    <div class="ml-4">
                        <p class="text-sm font-medium">${status.status}</p>
                        <p class="text-xs text-gray-500">${new Date(status.updated_at).toLocaleString()}</p>
                        <p class="text-xs text-gray-600 mt-1">${status.description ?? ''}</p>
                    </div>
                `;

                timelineContainer.appendChild(timelineItem);
            });

            // Actualizar historial de seguimiento en la pestaña de Historial
            const historyTimelineContainer = document.querySelector('#tab-history .timeline-container');
            historyTimelineContainer.innerHTML = '<div class="timeline-line"></div>';

            orderDetails.status_history.forEach(status => {
                const timelineItem = document.createElement('div');
                timelineItem.className = 'timeline-item';

                timelineItem.innerHTML = `
                    <div class="timeline-dot ${status.status.toLowerCase()}">
                        <i class="fas fa-check"></i>
                    </div>
                    <div class="ml-4">
                        <div class="bg-gray-50 p-3 rounded-lg border border-gray-100">
                            <div class="flex justify-between">
                                <p class="text-sm font-medium">${status.status}</p>
                                <p class="text-xs text-gray-500">${new Date(status.updated_at).toLocaleString()}</p>
                            </div>
                            <p class="text-sm text-gray-600 mt-2">${status.description ?? ''}</p>
                        </div>
                    </div>
                `;

                historyTimelineContainer.appendChild(timelineItem);
            });
        },
        updateOrdersCounts: function () {
            const tabTypes = ['todos', 'activos', 'transito', 'pendientes'];

            tabTypes.forEach(type => {
                const container = document.getElementById(`orders-tab-${type}`);
                const count = container.querySelectorAll('.order-item').length;
                const badge = document.querySelector(`[data-orders-tab="${type}"] .badge-count`);
                badge.textContent = count;
            });

            this.updatePaginationInfo();
        },

        refreshData: function () {
            // Deshabilitar botón y mostrar animación
            this.elements.refreshButton.disabled = true;
            this.elements.refreshIcon.classList.add('loading-spinner');

            // Crear overlay con efecto de carga
            const loadingOverlay = document.createElement('div');
            loadingOverlay.className = 'refresh-effect';
            loadingOverlay.innerHTML = `
                <div class="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center">
                    <i class="fas fa-sync-alt text-3xl text-gray-700 loading-spinner mb-4"></i>
                    <p class="text-gray-700">Actualizando información...</p>
                </div>
            `;
            this.elements.mainContent.appendChild(loadingOverlay);

            // Simular tiempo de carga
            setTimeout(async () => {

                try {
                    if(this.data.currentId){

                        const orderDetails = await ApiClient.request(`${Config.ENDPOINTS.PEDIDO}/${this.data.currentId}`, {
                            method: "GET",
                        });
                        this.updateOrderDetails(orderDetails);
                    }
                    this.elements.mainContent.removeChild(loadingOverlay);
                    this.elements.refreshIcon.classList.remove('loading-spinner');
                    this.elements.refreshButton.disabled = false;
                } catch (error) {
                    this.elements.mainContent.removeChild(loadingOverlay);
                    this.elements.refreshIcon.classList.remove('loading-spinner');
                    this.elements.refreshButton.disabled = false;
                }
            }, 1500);
        },

        updateOrderList: function () {
            const orderListContainer = document.getElementById('order-list-container-todos');
            const currentSelectedId = document.querySelector('.order-item.selected')?.getAttribute('data-id');

            // Efecto de carga
            orderListContainer.style.opacity = '0.6';

            setTimeout(() => {
                // Actualizar estados y fechas aleatoriamente
                const statusElements = orderListContainer.querySelectorAll('.status-tag');
                const dateElements = orderListContainer.querySelectorAll('.order-date');

                statusElements.forEach(status => {
                    const randomNum = Math.random();
                    if (randomNum < 0.3) {
                        const statusOptions = ['status-activo', 'status-pendiente', 'status-transito', 'status-demorado'];
                        const labelOptions = ['Activo', 'Pendiente', 'En tránsito', 'Demorado'];
                        const randomIndex = Math.floor(Math.random() * statusOptions.length);

                        status.className = 'status-tag ' + statusOptions[randomIndex];
                        status.textContent = labelOptions[randomIndex];

                        // Actualizar atributo de estado
                        const parentItem = status.closest('.order-item');
                        const newStatus = statusOptions[randomIndex].replace('status-', '');
                        parentItem.setAttribute('data-status', newStatus);

                        // Actualizar en otras pestañas
                        this.updateItemInAllTabs(parentItem.getAttribute('data-id'), newStatus, labelOptions[randomIndex]);
                    }
                });

                dateElements.forEach(date => {
                    const randomNum = Math.random();
                    if (randomNum < 0.3) {
                        const day = Math.floor(Math.random() * 5) + 15;
                        date.textContent = `Entrega: 2023-05-${day}`;
                    }
                });

                // Restaurar opacidad
                orderListContainer.style.opacity = '1';

                // Mantener selección
                if (currentSelectedId) {
                    const newSelectedItem = orderListContainer.querySelector(`[data-id="${currentSelectedId}"]`);
                    if (newSelectedItem) {
                        newSelectedItem.classList.add('selected');
                    }
                }

                // Reorganizar y actualizar contadores
                this.reorganizeItemsByStatus();
                this.updateOrdersCounts();
            }, 1200);
        },

        updateItemInAllTabs: function (itemId, newStatus, statusLabel) {
            document.querySelectorAll(`.order-item[data-id="${itemId}"]`).forEach(item => {
                item.setAttribute('data-status', newStatus);
                const statusTag = item.querySelector('.status-tag');
                if (statusTag) {
                    statusTag.className = 'status-tag status-' + newStatus;
                    statusTag.textContent = statusLabel;
                }
            });
        },

        reorganizeItemsByStatus: function () {
            // Obtener todos los pedidos de la pestaña "Todos"
            const allItems = document.querySelectorAll('#orders-tab-todos .order-item');

            // Limpiar pestañas específicas
            document.querySelector('#orders-tab-activos .scroll-container').innerHTML = '';
            document.querySelector('#orders-tab-transito .scroll-container').innerHTML = '';
            document.querySelector('#orders-tab-pendientes .scroll-container').innerHTML = '';

            // Redistribuir según el estado
            allItems.forEach(item => {
                const status = item.getAttribute('data-status');
                const clone = item.cloneNode(true);

                // Asignar eventos a elementos clonados
                clone.addEventListener('click', () => this.handleOrderItemClick(clone));

                // Colocar en la pestaña correcta
                if (status === 'activo') {
                    document.querySelector('#orders-tab-activos .scroll-container').appendChild(clone);
                } else if (status === 'transito') {
                    document.querySelector('#orders-tab-transito .scroll-container').appendChild(clone);
                } else if (status === 'pendiente' || status === 'demorado') {
                    document.querySelector('#orders-tab-pendientes .scroll-container').appendChild(clone);
                }
            });
        },

        setScrollContainerHeights: function () {
            // Alturas para listas de pedidos
            const orderContainers = document.querySelectorAll('.orders-tab-content .scroll-container');
            const headerHeight = document.querySelector('.sidebar > div:first-child').offsetHeight;
            const tabHeight = document.querySelector('.orders-tab-header').offsetHeight;
            const filterHeight = document.querySelector('#filter-toggle').offsetHeight;
            const footerHeight = document.querySelector('.fixed-footer').offsetHeight;

            // Calcular altura disponible
            const availableHeight = window.innerHeight - headerHeight - tabHeight - filterHeight - footerHeight - 20;

            orderContainers.forEach(container => {
                container.style.maxHeight = `${availableHeight}px`;
            });

            // Altura para contenido principal
            const contentArea = document.getElementById('content-area');
            const mainHeaderHeight = document.querySelector('.main-content > div:first-child').offsetHeight;
            const tabsHeaderHeight = document.querySelector('.tab-header').offsetHeight;

            const mainAvailableHeight = window.innerHeight - mainHeaderHeight - tabsHeaderHeight - 20;
            contentArea.style.maxHeight = `${mainAvailableHeight}px`;
        },
        showLoadingSpinner: function () {
            const spinner = document.createElement('div');
            spinner.id = 'loading-spinner';
            spinner.className = 'fixed top-0 left-0 w-full h-full flex items-center justify-center bg-gray-900 bg-opacity-50';
            spinner.innerHTML = '<i class="fas fa-spinner fa-spin text-4xl text-white"></i>';
            document.body.appendChild(spinner);
        },

        hideLoadingSpinner: function () {
            const spinner = document.getElementById('loading-spinner');
            if (spinner) {
                spinner.remove();
            }
        },

        showErrorMessage: function (message) {
            const errorMessage = document.createElement('div');
            errorMessage.className = 'fixed top-4 right-4 bg-red-500 text-white p-4 rounded-lg shadow-lg';
            errorMessage.textContent = message;
            document.body.appendChild(errorMessage);

            setTimeout(() => {
                errorMessage.remove();
            }, 5000);
        },
    };

    // Inicializar la aplicación
    app.init();
});