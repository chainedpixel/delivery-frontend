
import Config from "./config.js";
import ApiClient from "./utils/apiClient.js";
document.addEventListener('DOMContentLoaded', function () {
    const app = {
        elements: {
            appContainer: document.getElementById('app-container'),
            userItems: document.querySelectorAll('.user-item'),
            tabButtons: document.querySelectorAll('.tab-button'),
            tabContents: document.querySelectorAll('.tab-content'),
            usersTabButtons: document.querySelectorAll('.users-tab-button'),
            usersTabContents: document.querySelectorAll('.users-tab-content'),
            filterToggle: document.getElementById('filter-toggle'),
            filterPanel: document.getElementById('filter-panel'),
            filterIcon: document.getElementById('filter-icon'),
            mobileBackBtn: document.getElementById('mobile-back'),
            refreshButton: document.getElementById('refresh-button'),
            refreshIcon: document.getElementById('refresh-icon'),
            mainContent: document.getElementById('main-content'),
            contentArea: document.getElementById('content-area'),
            sidebar: document.querySelector('.sidebar'),
            userStatusToggle: document.getElementById('user-status-toggle'),
            statusLabel: document.getElementById('status-label'),
            noUserSelected: document.getElementById('no-user-selected'),
            createNewUserBtn: document.getElementById('create-new-user'),
            // Modal elements
            deleteModal: document.getElementById('delete-user-modal'),
            closeModalBtn: document.getElementById('close-modal'),
            cancelDeleteBtn: document.getElementById('cancel-delete'),
            confirmDeleteBtn: document.getElementById('confirm-delete'),
            deleteUserName: document.getElementById('delete-user-name'),
            deleteUserId: document.getElementById('delete-user-id'),
            deleteLoading: document.getElementById('delete-loading'),
            deleteUserBtns: document.querySelectorAll('.delete-user-btn'),
            changePasswordBtns: document.querySelectorAll('.password-change'),
            closeSessionsBtns: document.querySelector('.close-sessions-btn'),
            closeAllSessionsBtn: document.querySelector('#close-all-sessions-btn'),
            updateUserBtn: document.querySelector('#update-user-btn'),
        },
        data: {
            currentUserDetailsId: null,
            currentUsersListPage: null,
            currentDataIndex: 0,
            alternateData: [
                {
                    userId: 'USR-001',
                    role: 'admin',
                    roleLabel: 'Administrador',
                    firstName: 'John',
                    lastName: 'Smith',
                    fullName: 'John Smith',
                    email: 'john.smith@example.com',
                    phone: '+1 (555) 123-4567',
                    birthDate: '12-06-1985',
                    documentType: 'Licencia de Conducir',
                    documentNumber: 'DL-123456789',
                    emergencyContact: 'Emma Smith (+1 555-765-4321)',
                    registrationDate: '15 Enero, 2023',
                    lastLogin: 'Hoy, 09:45 AM',
                    isActive: true,
                    roles: [
                        {
                            role: 'admin',
                            roleLabel: 'Administrador',
                            isPrimary: true,
                            assignedDate: '15-01-2023',
                            description: 'Acceso completo al sistema, incluyendo gestión de usuarios, configuración de parámetros y reportes avanzados.'
                        },
                        {
                            role: 'almacen',
                            roleLabel: 'Personal del almacén',
                            isPrimary: false,
                            assignedDate: '20-02-2023',
                            description: 'Gestión de inventario, procesamiento de pedidos y preparación de envíos.'
                        }
                    ]
                },
                {
                    userId: 'USR-001',
                    role: 'repartidor',
                    roleLabel: 'Repartidor',
                    firstName: 'John',
                    lastName: 'Smith',
                    fullName: 'John Smith',
                    email: 'john.smith@example.com',
                    phone: '+1 (555) 987-6543',
                    birthDate: '12-06-1985',
                    documentType: 'Licencia de Conducir',
                    documentNumber: 'DL-123456789',
                    emergencyContact: 'Emma Smith (+1 555-765-4321)',
                    registrationDate: '15 Enero, 2023',
                    lastLogin: 'Hoy, 10:15 AM',
                    isActive: true,
                    roles: [
                        {
                            role: 'repartidor',
                            roleLabel: 'Repartidor',
                            isPrimary: true,
                            assignedDate: '15-01-2023',
                            description: 'Entrega de pedidos a domicilio y gestión de rutas de entrega.'
                        },
                        {
                            role: 'user',
                            roleLabel: 'Usuario Final',
                            isPrimary: false,
                            assignedDate: '18-01-2023',
                            description: 'Acceso básico al sistema para consulta de información personal.'
                        }
                    ]
                },
                {
                    userId: 'USR-001',
                    role: 'recolector',
                    roleLabel: 'Recolector',
                    firstName: 'John',
                    lastName: 'Smith',
                    fullName: 'John Smith',
                    email: 'john.support@example.com',
                    phone: '+1 (555) 234-5678',
                    birthDate: '12-06-1985',
                    documentType: 'Pasaporte',
                    documentNumber: 'P12345678',
                    emergencyContact: 'Emma Smith (+1 555-765-4321)',
                    registrationDate: '15 Enero, 2023',
                    lastLogin: 'Hoy, 11:30 AM',
                    isActive: false,
                    roles: [
                        {
                            role: 'recolector',
                            roleLabel: 'Recolector',
                            isPrimary: true,
                            assignedDate: '15-01-2023',
                            description: 'Recogida de mercancías en puntos de recolección y transporte a almacén central.'
                        },
                        {
                            role: 'almacen',
                            roleLabel: 'Personal del almacén',
                            isPrimary: false,
                            assignedDate: '05-02-2023',
                            description: 'Apoyo en labores de inventario y clasificación de productos.'
                        },
                        {
                            role: 'empresa',
                            roleLabel: 'Usuario de la empresa',
                            isPrimary: false,
                            assignedDate: '10-03-2023',
                            description: 'Acceso a plataforma corporativa y sistema de gestión interno.'
                        }
                    ]
                }
            ],
            currentUserToDelete: null
        },
        init: function () {

            // Mostrar estado de ningún usuario seleccionado inicialmente
            this.showNoUserSelectedState();

            // Resto de inicialización
            this.setupEventListeners();
            this.reorganizeItemsByRole();
            this.updateUsersCounts();
            this.setScrollContainerHeights();



            // Configurar el toggle de estado
            this.updateToggleStatus(true);

            // Configurar los botones de eliminar
            this.setupDeleteButtons();
            this.setupPasswordChangeButtons();
            this.setupCloseAllSessionsBtn();
            this.setupUpdateUserBtn();

            // Quitar la selección de cualquier usuario por defecto
            document.querySelectorAll('.user-item').forEach(item => {
                item.classList.remove('selected');
            });
            // Obtener la lista de usuarios
            this.fetchUserList(1);
            this.initializeFilterEvents();
        },

        fetchUserList: async function (page = 1) {
            try {
                const response = await ApiClient.request(`${Config.ENDPOINTS.USUARIO}?page=${page}&status=false`, {
                    method: "GET",
                });

                if (response.success) {
                    console.log(response.data.data)
                    this.displayUserList(response.data.data);
                    this.updatePaginationControls(response.data); // Actualizar controles de paginación
                } else {
                    console.error('Error fetching user list:', response);
                }
            } catch (error) {
                console.error('Error fetching user list:', error);
            }
        },

        displayUserList: function (users) {
            const userListContainer = document.getElementById('user-list-container-all');
            userListContainer.innerHTML = ''; // Limpiar la lista actual

            users.forEach(user => {
                const userItem = document.createElement('div');
                userItem.className = 'user-item';
                userItem.setAttribute('data-id', user.id);
                userItem.setAttribute('data-role', user.role.toLowerCase());

                userItem.innerHTML = `
    <div class="flex justify-between items-center">
        <span class="font-medium">${user.full_name}</span>
        <span class="role-tag role-${user.role.toLowerCase()}">${user.role}</span>
    </div>
    <p class="text-sm text-gray-600 mt-1">${user.email}</p>
    <p class="text-sm text-gray-600">${user.phone}</p>
    <div class="flex justify-between items-center mt-1">
        <p class="text-sm text-gray-600 user-date">Registro: ${new Date(user.created_at).toLocaleDateString()}</p>
        <button class="text-gray-400 hover:text-red-500 delete-user-btn">
            <i class="fas fa-trash-alt"></i>
        </button>
    </div>
`;

                userItem.addEventListener('click', () => this.handleUserItemClick(userItem));
                userListContainer.appendChild(userItem);
            });

            // Actualizar contadores y reorganizar por rol
            this.updateUsersCounts();
            this.reorganizeItemsByRole();
            this.setupDeleteButtons();

        },
        updatePaginationControls: function (paginationData) {
            const paginationContainer = document.getElementById('pagination-container');
            const paginationInfo = document.getElementById('pagination-info');
            const paginationButtonsContainer = document.getElementById('pagination-buttons');

            if (!paginationContainer || !paginationInfo || !paginationButtonsContainer) return;

            const { page, total_pages, total_items, page_size } = paginationData;

            // Ocultar paginación si no hay más de una página
            if (total_pages <= 1) {
                paginationContainer.style.display = 'none';
                return;
            } else {
                paginationContainer.style.display = 'block'; // Mostrar la paginación
            }

            // Actualizar el texto que muestra el rango de ítems
            const startItem = (page - 1) * page_size + 1;
            const endItem = Math.min(page * page_size, total_items);
            document.getElementById('pagination-start').textContent = startItem;
            document.getElementById('pagination-end').textContent = endItem;
            document.getElementById('pagination-total').textContent = total_items;

            // Limpiar los botones de paginación existentes
            paginationButtonsContainer.innerHTML = '';

            // Botón "Anterior"
            const prevButton = document.createElement('button');
            prevButton.id = 'pagination-prev';
            prevButton.className = `pagination-button py-1 px-2 border border-gray-300 bg-white text-sm text-gray-500 rounded-l-md hover:bg-gray-50 ${page === 1 ? 'disabled opacity-50' : ''}`;
            prevButton.innerHTML = '<i class="fas fa-chevron-left text-xs"></i>';
            prevButton.addEventListener('click', () => {
                if (page > 1) this.fetchUserList(page - 1);
            });
            paginationButtonsContainer.appendChild(prevButton);

            // Botones de páginas
            for (let i = 1; i <= total_pages; i++) {
                const pageButton = document.createElement('button');
                pageButton.className = `pagination-button py-1 px-3 border border-gray-300 text-sm font-medium ${i === page ? 'bg-[#ADADAD] text-white hover:bg-[#616161]' : 'bg-white text-gray-700 hover:bg-gray-50'}`;
                pageButton.textContent = i;
                pageButton.addEventListener('click', () => this.fetchUserList(i));
                paginationButtonsContainer.appendChild(pageButton);
            }

            // Botón "Siguiente"
            const nextButton = document.createElement('button');
            nextButton.id = 'pagination-next';
            nextButton.className = `pagination-button py-1 px-2 border border-gray-300 bg-white text-sm text-gray-500 rounded-r-md hover:bg-gray-50 ${page === total_pages ? 'disabled opacity-50' : ''}`;
            nextButton.innerHTML = '<i class="fas fa-chevron-right text-xs"></i>';
            nextButton.addEventListener('click', () => {
                if (page < total_pages) this.fetchUserList(page + 1);
            });
            paginationButtonsContainer.appendChild(nextButton);
        },
        setupEventListeners: function () {
            // Pestañas de contenido principal
            this.elements.tabButtons.forEach(button => {
                button.addEventListener('click', this.handleTabButtonClick.bind(this));
            });

            // Pestañas de usuarios
            this.elements.usersTabButtons.forEach(button => {
                button.addEventListener('click', this.handleUsersTabButtonClick.bind(this));
            });

            // Panel de filtros
            this.elements.filterToggle.addEventListener('click', this.toggleFilterPanel.bind(this));

            // Manejo de clics en usuarios
            this.elements.userItems.forEach(item => {
                item.addEventListener('click', () => this.handleUserItemClick(item));
            });

            // Botón volver en móvil
            this.elements.mobileBackBtn.addEventListener('click', this.handleMobileBack.bind(this));

            // Responsive check
            window.addEventListener('resize', this.checkResponsive.bind(this));

            // Botón de actualizar
            this.elements.refreshButton.addEventListener('click', this.refreshData.bind(this));
            this.elements.refreshButton.addEventListener('click', this.updateUserList.bind(this));



            // Toggle de estado
            this.elements.userStatusToggle.addEventListener('change', this.handleStatusToggle.bind(this));

            // Crear nuevo usuario
            this.elements.createNewUserBtn.addEventListener('click', this.handleCreateNewUser.bind(this));

            // Modal de eliminación - eventos
            this.elements.closeModalBtn.addEventListener('click', this.hideDeleteModal.bind(this));
            this.elements.cancelDeleteBtn.addEventListener('click', this.hideDeleteModal.bind(this));
            this.elements.confirmDeleteBtn.addEventListener('click', this.handleDeleteUser.bind(this));

            // Cálculo de alturas y layout
            window.addEventListener('load', this.setScrollContainerHeights.bind(this));
            window.addEventListener('resize', this.setScrollContainerHeights.bind(this));
        },
        setupUpdateUserBtn: function () {
            this.elements.updateUserBtn.addEventListener('click', () => {
                window.location.href = './userFormEdit.html?userId=' + app.data.currentUserDetailsId;
            });
        },
        setupDeleteButtons: function () {
            const deleteButtons = document.querySelectorAll('.delete-user-btn');

            deleteButtons.forEach(btn => {
                btn.addEventListener('click', (event) => {
                    event.stopPropagation();

                    const userItem = btn.closest('.user-item');

                    const userId = userItem.getAttribute('data-id');
                    const userName = userItem.querySelector('.font-medium').textContent;

                    this.showDeleteModal(userId, userName);
                });
            });
        },
        setupCloseAllSessionsBtn: function () {
            this.elements.closeAllSessionsBtn.addEventListener('click', this.handleCloseAllSessions)


        },
        setupPasswordChangeButtons: function (userId) {
            this.elements.changePasswordBtns.forEach(btn => {
                btn.addEventListener('click', (event) => {
                    this.handlePasswordChange(this.data.currentUserDetailsId);
                });
            });
        },
        handleCreateNewUser: function () {
            alert('Abrir formulario para crear nuevo usuario');
        },
        handlePasswordChange: async function (userId) {
            let pass1 = prompt('ingrese la contraseña nueva');
            let pass2 = prompt('confirme la contraseña');
            if (pass1.trim() == pass2.trim() && pass1.trim().length >= 6) {
                try {
                    const response = await ApiClient.request(`${Config.ENDPOINTS.USUARIO}/${this.data.currentUserDetailsId}`, {
                        method: "PUT",
                        headers: {
                            "Content-Type": "application/json",
                            Accept: "application/json",
                        },
                        body: JSON.stringify({
                            password: pass1
                        }),
                    });
                    ;
                    alert(`la contraseña ${response.success ? ' se actualizo' : ' no se actualizo'}`);


                } catch (error) {
                    event.target.checked = isActive = !event.target.checked
                }
            } else {
                alert('las contraseñas no coinciden o menor de 6 caracteres');
                return;
            }
            console.log(userId)
        },
        handleCloseAllSessions: async function (userId) {
            app.showDialog("Cerrar Sesiones",
                'Quiere cerrar todas las sessiones activas para ' + app.data.currentUserDetailsId + '?'
                ,{cancelButton:true,confirmButton:true,confirmText:'Cerrar sesiones'}, () => { }, async () => {
                    const response = await ApiClient.request(`${Config.ENDPOINTS.SESIONES}/${app.data.currentUserDetailsId}`, {
                        method: "DELETE",
                    });
                    app.showDialog("Mensaje", `${response.success ? ' se cerraron todas las sesiones' : ' no se cerraron las sesiones'}`)
                })



        },
        // Gestión de pestañas
        handleTabButtonClick: function (event) {
            this.elements.tabButtons.forEach(btn => btn.classList.remove('active'));
            this.elements.tabContents.forEach(content => content.classList.remove('active'));

            event.currentTarget.classList.add('active');
            const tabId = event.currentTarget.getAttribute('data-tab');
            document.getElementById(`tab-${tabId}`).classList.add('active');
        },

        handleUsersTabButtonClick: function (event) {
            this.elements.usersTabButtons.forEach(btn => btn.classList.remove('active'));
            this.elements.usersTabContents.forEach(content => content.classList.remove('active'));

            event.currentTarget.classList.add('active');
            const tabId = event.currentTarget.getAttribute('data-users-tab');
            document.getElementById(`users-tab-${tabId}`).classList.add('active');

            this.updatePaginationInfo();
        },

        // Panel de filtros
        toggleFilterPanel: function () {
            this.elements.filterPanel.classList.toggle('open');
            this.elements.filterIcon.classList.toggle('rotate-180');
        },

        // Toggle de estado activo/inactivo
        handleStatusToggle: async function (event) {
            let isActive = event.target.checked;
            try {
                debugger;
                const response = await ApiClient.request(`${Config.ENDPOINTS.USUARIO}/${this.data.currentUserDetailsId}`, {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                    },
                    body: JSON.stringify({
                        active: event.target.checked
                    }),
                });
                ;
                if (response.success == false)
                    event.target.checked = isActive = !event.target.checked

            } catch (error) {
                event.target.checked = isActive = !event.target.checked
            }
            this.updateToggleStatus(isActive);

            // Actualizar estado en detalles de cuenta
            document.getElementById('account-status').textContent = isActive ? 'Activo' : 'Inactivo';
            document.getElementById('account-status').className =
                isActive ? 'font-medium text-green-600' : 'font-medium text-red-600';

        },

        updateToggleStatus: function (isActive) {
            // Actualizar texto del estado
            this.elements.statusLabel.textContent = isActive ? 'Activo' : 'Inactivo';
            this.elements.statusLabel.className =
                isActive ? 'ml-2 text-sm font-medium text-green-600' : 'ml-2 text-sm font-medium text-red-600';
        },

        // Gestión de usuarios
        handleUserItemClick: function (item) {
            // Remover selección de todos los usuarios
            document.querySelectorAll('.user-item').forEach(user => user.classList.remove('selected'));

            // Marcar el usuario seleccionado
            item.classList.add('selected');

            // Obtener el ID del usuario
            const userId = item.getAttribute('data-id');

            // Obtener los detalles del usuario
            this.fetchUserDetails(userId);
        },
        fetchUserDetails: async function (userId) {
            try {
                const response = await ApiClient.request(`${Config.ENDPOINTS.USUARIO}/${userId}?status=false`, {
                    method: "GET",
                });

                if (response) {
                    console.log(response)
                    this.displayUserDetails(response.data);
                } else {
                    console.error('Error fetching user details:', response);
                }
            } catch (error) {
                app.showDialog('Desactivado', "El usuario esta desactivado desea intentar activarlo?", () => { },{cancelButton:true,confirmButton:true,confirmText:'Activar'}, async () => {
                    const response = await ApiClient.request(`${Config.ENDPOINTS.USUARIO}/${userId}`, {
                        method: "PATCH",
                        headers: {
                            "Content-Type": "application/json",
                            Accept: "application/json",
                        },
                        body: JSON.stringify({
                            active: true
                        }),
                    });

                    app.fetchUserDetails(userId)
                })
                console.error('Error fetching user details:', error);
            }
        },

        displayUserDetails: function (user) {
            // Actualizar la información del usuario en el panel de detalles

            document.getElementById('user-name').textContent = user.full_name;
            document.getElementById('user-email').textContent = user.email;
            document.getElementById('user-phone').textContent = user.phone;
            document.getElementById('user-id').textContent = user.id;
            this.data.currentUserDetailsId = user.id;
            document.getElementById('registration-date').textContent = new Date(user.created_at).toLocaleDateString();
            let last_activity = new Date('1900-02-01T00:00:00Z');
            if (user.sessions)
                user.sessions.forEach(a => {
                    let current_last_activity = new Date(a.last_activity);
                    if (current_last_activity > last_activity)
                        last_activity = current_last_activity
                })
            if (last_activity.getFullYear() == 1900)
                last_activity = null;
            console.log(last_activity)
            document.getElementById('last-login').textContent = last_activity ? last_activity.toLocaleString() : 'Nunca';

            // Actualizar información personal
            document.getElementById('full-name').textContent = user.full_name;
            document.getElementById('birth-date').textContent = new Date(user.profile?.birth_date).toLocaleDateString() || 'No disponible';
            document.getElementById('document-type').textContent = user.profile?.document_type || 'No disponible';
            document.getElementById('document-number').textContent = user.profile?.document_number || 'No disponible';
            document.getElementById('emergency-contact').textContent = user.profile?.emergency_contact_name || 'No disponible';

            // Actualizar detalles de la cuenta
            document.getElementById('email-address').textContent = user.email;
            document.getElementById('phone-number').textContent = user.phone;

            //actualiza la fecha del ultimo cambio de contraseña
            document.getElementById('last-password-change').textContent = 'No disponible';


            //TODO hay que definir el rol principal porque de momento solo se establece el primero
            debugger;
            document.getElementById('user-role-display').textContent = user.roles ? user.roles[0].auth.name : 'No disponible';
            document.getElementById('account-status').textContent = user.is_active ? 'Activo' : 'Inactivo';
            document.getElementById('account-status').className = user.is_active ? 'font-medium text-green-600' : 'font-medium text-red-600';



            let sessionsHistoryTable = document.getElementById('sessions-history-table');
            sessionsHistoryTable.innerHTML = '';
            if (user.sessions && user.sessions.length > 0) {
                user.sessions.forEach(s => {
                    let b_os = JSON.parse(s.device_info ?? "{\"browser\":\"No Disponible\",\"os\":\"No Disponible\"}")
                    sessionsHistoryTable.innerHTML += `   <tr class="border-b hover:bg-gray-50">
                                            <td class="py-2 px-4 text-sm">${s.created_at ? (new Date(s.created_at)).toDateString() : 'No disponible'}</td>
                                            <td class="py-2 px-4 text-sm">${s.ip_address ?? 'no disponible'}</td>
                                            <td class="py-2 px-4 text-sm">${b_os.browser} / ${b_os.os}</td>
                                            <td class="py-2 px-4 text-sm text-${s.status ? 'green' : 'red'}-600">${s.status ?? 'No disponible'}</td>
                                        </tr>`
                })
            } else {
                sessionsHistoryTable.innerHTML = `<tr class="text-center border-b hover:bg-gray-50">
                                            <td colspan="4" class="py-2 px-4 text-sm">No Disponible</td>
                                        </tr>`
            }


            // Actualizar roles del usuario
            this.updateRolesSection(user.roles);

            // Ocultar mensaje de ningún usuario seleccionado y mostrar detalles
            this.hideNoUserSelectedState();

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

        // Actualización de datos y UI
        updatePaginationInfo: function () {
            const activeTab = document.querySelector('.users-tab-content.active');
            const visibleItems = activeTab.querySelectorAll('.user-item').length;

            document.querySelector('.text-xs.text-gray-500.mb-2').innerHTML =
                `Mostrando <span class="font-medium">1</span> a <span class="font-medium">${visibleItems}</span> de <span class="font-medium">125</span>`;
        },

        updateUserDetails: function () {
            if (this.data.currentUserDetailsId)
                this.fetchUserDetails(this.data.currentUserDetailsId);
        },

        // Actualizar sección de roles
        updateRolesSection: function (roles) {
            const rolesContainer = document.getElementById('user-roles-container');
            rolesContainer.innerHTML = ''; // Limpiar contenedor
            if (!roles) {
                rolesContainer.innerHTML = 'No disponible'; // Limpiar contenedor
                return;
            }
            let mainRole = document.querySelector('.main-role-detail');
            mainRole.querySelector('.role-tag').className = 'role-tag mr-2 role-' + roles[0].auth.name.toLowerCase();
            mainRole.querySelector('.role-tag').textContent = roles[0].auth.name;
            mainRole.querySelector('.asigned').textContent = new Date(roles[0].assigned_at).toLocaleDateString();
            mainRole.querySelector('.descripcion').textContent = roles[0].auth.description;
            roles.forEach(role => {
                const roleHtml = `
                    <div class="role-entry bg-gray-50 p-3 rounded-lg border border-gray-100">
                        <div class="flex justify-between mb-2">
                            <div class="flex items-center">
                                <span class="role-tag role-${role.auth.name.toLowerCase()} mr-2">${role.auth.name}</span>
                                ${role.is_primary ? '<span class="text-xs text-gray-500">(Principal)</span>' : ''}
                            </div>
                            <div class="text-xs text-gray-500">
                                Asignado: ${new Date(role.assigned_at).toLocaleDateString()}
                            </div>
                        </div>
                        <p class="text-sm text-gray-600">
                            ${role.auth.description}
                        </p>
                    </div>
                `;

                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = roleHtml;
                rolesContainer.appendChild(tempDiv.firstElementChild);
            });

            // Añadir botón de nuevo rol
            const addRoleButton = document.createElement('button');
            addRoleButton.className = 'w-full border border-dashed border-gray-300 rounded-lg p-3 text-sm text-gray-500 hover:bg-gray-50 flex items-center justify-center';
            addRoleButton.innerHTML = '<i class="fas fa-plus mr-2"></i>Añadir rol';
            addRoleButton.addEventListener('click', this.handleAddRole.bind(this));
            rolesContainer.appendChild(addRoleButton);
        },
        // Manejar clic en añadir rol
        handleAddRole: async function () {


            let roles = {
                1: '991c53a8-f89b-11ef-a120-0242ac120003',
                2: '991e016f-f89b-11ef-a120-0242ac120003',
                3: '991e01ed-f89b-11ef-a120-0242ac120003',
                4: '991a01ed-f89b-11ef-a120-0242ac120003',
                5: '991e01c7-f89b-11ef-a120-0242ac120003',
                6: '991dfbd6-f89b-11ef-a120-0242ac120003',
            }
            let selecccionado = prompt('seleccione\n1: Administrador\n2: Repartidor\n3: Recolector\n4: Usuario Final\n5 :Personal del almacén\n6: Usuario de la empresa')

            if (!roles[selecccionado]) {
                alert('Por favor, selecciona un rol.');
                return;
            }


            const userId = app.data.currentUserDetailsId;
            try {
                // Hacer la solicitud a la API para añadir el rol
                const response = await ApiClient.request(`${Config.ENDPOINTS.ROLES_USUARIO}/${userId}`, {
                    method: "POST",
                    body: JSON.stringify({ role: roles[selecccionado] }),
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });




                if (response.success) {
                    alert('Rol añadido correctamente.');
                    // Actualizar la lista de roles del usuario
                    this.fetchUserDetails(userId); // Recargar los detalles del usuario
                } else {
                    alert('Error al añadir el rol: ' + response.message);
                }
            } catch (error) {
                console.error('Error al añadir el rol:', error);
                alert('Error al añadir el rol');
            }
        },

        handleRemoveRole: async function () {
            let roles = {
                1: '991c53a8-f89b-11ef-a120-0242ac120003',
                2: '991e016f-f89b-11ef-a120-0242ac120003',
                3: '991e01ed-f89b-11ef-a120-0242ac120003',
                4: '991a01ed-f89b-11ef-a120-0242ac120003',
                5: '991e01c7-f89b-11ef-a120-0242ac120003',
                6: '991dfbd6-f89b-11ef-a120-0242ac120003',
            }
            let selecccionado = prompt('seleccione\n1: Administrador\n2: Repartidor\n3: Recolector\n4: Usuario Final\n5 :Personal del almacén\n6: Usuario de la empresa')

            if (!roles[selecccionado]) {
                alert('Por favor, selecciona un rol.');
                return;
            }


            const userId = app.data.currentUserDetailsId;
            try {
                // Hacer la solicitud a la API para añadir el rol
                const response = await ApiClient.request(`${Config.ENDPOINTS.ROLES_USUARIO}/${userId}`, {
                    method: "DELETE",
                    body: JSON.stringify({ role: roles[selecccionado] }),
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });

                if (response.success) {
                    alert('Rol removido correctamente.');
                    // Actualizar la lista de roles del usuario
                    this.fetchUserDetails(userId); // Recargar los detalles del usuario
                } else {
                    alert('Error al remover el rol: ' + response.message);
                }
            } catch (error) {
                console.error('Error al remover el rol:', error);
                alert('Error al remover el rol');
            }
        },
        // Manejar eliminación de rol
        handleDeleteRole: function (event) {
            const roleToDelete = event.currentTarget.getAttribute('data-role');
            const roleEntry = event.currentTarget.closest('.role-entry');

            if (confirm(`¿Estás seguro de eliminar este rol: ${roleToDelete}?`)) {
                // Animación de eliminación
                roleEntry.style.opacity = '0.5';
                setTimeout(() => {
                    roleEntry.remove();
                }, 500);
            }
        },

        updateUsersCounts: function () {
            const tabTypes = ['all', 'admin', 'repartidor', 'usuario'];

            tabTypes.forEach(type => {
                const container = document.getElementById(`users-tab-${type}`);
                const count = container.querySelectorAll('.user-item').length;
                const badge = document.querySelector(`[data-users-tab="${type}"] .badge-count`);
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
            setTimeout(() => {
                this.updateUserDetails();
                this.elements.mainContent.removeChild(loadingOverlay);
                this.elements.refreshIcon.classList.remove('loading-spinner');
                this.elements.refreshButton.disabled = false;

                 // Simular recarga
      
                this.elements.refreshIcon.classList.remove('loading-spinner');
                this.elements.refreshButton.disabled = false;

                this.showToast('Datos actualizados', 'success');
          
            }, 500);
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
        updateUserList: function () {
            const userListContainer = document.getElementById('user-list-container-all');
            const currentSelectedId = document.querySelector('.user-item.selected')?.getAttribute('data-id');
            console.log(currentSelectedId)
            // Efecto de carga
            userListContainer.style.opacity = '0.6';

            setTimeout(async () => {
                // Actualizar roles y fechas aleatoriamente
                await this.fetchUserList(this.data.currentUsersListPage ?? 1);
                // Restaurar opacidad
                userListContainer.style.opacity = '1';

                // Mantener selección
                if (currentSelectedId) {
                    const newSelectedItem = userListContainer.querySelector(`[data-id="${currentSelectedId}"]`);
                    if (newSelectedItem) {
                        newSelectedItem.classList.add('selected');
                    }
                }
                // Reorganizar y actualizar contadores
                this.reorganizeItemsByRole();
                this.updateUsersCounts();
                // Configurar nuevos botones de eliminar
                this.setupDeleteButtons();
            }, 500);
        },

        updateItemInAllTabs: function (itemId, newRole, roleLabel) {
            document.querySelectorAll(`.user-item[data-id="${itemId}"]`).forEach(item => {
                item.setAttribute('data-role', newRole);
                const roleTag = item.querySelector('.role-tag');
                if (roleTag) {
                    roleTag.className = 'role-tag role-' + newRole;
                    roleTag.textContent = roleLabel;
                }
            });
        },

        reorganizeItemsByRole: function () {
            // Obtener todos los usuarios de la pestaña "Todos"
            const allItems = document.querySelectorAll('#users-tab-all .user-item');

            // Limpiar pestañas específicas
            document.querySelector('#users-tab-admin .scroll-container').innerHTML = '';
            document.querySelector('#users-tab-repartidor .scroll-container').innerHTML = '';
            document.querySelector('#users-tab-usuario .scroll-container').innerHTML = '';

            // Redistribuir según el rol
            allItems.forEach(item => {
                const role = item.getAttribute('data-role');
                const clone = item.cloneNode(true);

                // Asignar eventos a elementos clonados
                clone.addEventListener('click', () => this.handleUserItemClick(clone));

                // Colocar en la pestaña correcta
                if (role === 'admin') {
                    document.querySelector('#users-tab-admin .scroll-container').appendChild(clone);
                } else if (role === 'repartidor') {
                    document.querySelector('#users-tab-repartidor .scroll-container').appendChild(clone);
                } else {
                    document.querySelector('#users-tab-usuario .scroll-container').appendChild(clone);
                }
            });
        },

        setScrollContainerHeights: function () {
            // Alturas para listas de usuarios
            const userContainers = document.querySelectorAll('.users-tab-content .scroll-container');
            const headerHeight = document.querySelector('.sidebar > div:first-child').offsetHeight;
            const tabHeight = document.querySelector('.users-tab-header').offsetHeight;
            const filterHeight = document.querySelector('#filter-toggle').offsetHeight;
            const footerHeight = document.querySelector('.fixed-footer').offsetHeight;

            // Calcular altura disponible
            const availableHeight = window.innerHeight - headerHeight - tabHeight - filterHeight - footerHeight - 20;

            userContainers.forEach(container => {
                container.style.maxHeight = `${availableHeight}px`;
            });
            // Altura para contenido principal
            const contentArea = document.getElementById('content-area');
            const mainHeaderHeight = document.querySelector('.main-content > div:first-child').offsetHeight;
            const tabsHeaderHeight = document.querySelector('.tab-header').offsetHeight;
            const mainAvailableHeight = window.innerHeight - mainHeaderHeight - tabsHeaderHeight - 20;
            contentArea.style.maxHeight = `${mainAvailableHeight}px`;

            // Configurar altura para mensaje de ningún usuario seleccionado
            this.elements.noUserSelected.style.height = `${mainAvailableHeight}px`;
        },

        // Mostrar estado de ningún usuario seleccionado
        showNoUserSelectedState: function () {
            if (this.elements.noUserSelected && this.elements.contentArea) {
                this.elements.noUserSelected.classList.remove('hidden');
                this.elements.contentArea.classList.add('hidden');
            }
        },

        // Ocultar estado de ningún usuario seleccionado
        hideNoUserSelectedState: function () {
            if (this.elements.noUserSelected && this.elements.contentArea) {
                this.elements.noUserSelected.classList.add('hidden');
                this.elements.contentArea.classList.remove('hidden');
            }
        },
        showDialog: function (title, message, opts = { cancelButton: false, confirmButton: false, confirmText: 'Aceptar' }, onCancel, onConfirm) {
            // Obtener el modal y sus elementos
            const modal = document.getElementById('delete-user-modal-alt');
            const modalTitle = modal.querySelector('.modal-title-alt');
            const modalBody = modal.querySelector('.modal-content-alt');
            const btnconfirm = modal.querySelector('.btn-confirm-alt');
            const cancelButton = document.getElementById('cancel-delete-alt');
            const confirmButton = document.getElementById('confirm-delete-alt');
            const deleteLoading = document.getElementById('delete-loading-alt');

            // Configurar el título y el mensaje del modal
            modalTitle.innerHTML = title;
            modalBody.innerHTML = message;

            btnconfirm.textContent = opts.confirmText;

            // Mostrar el modal
            modal.classList.add('active');

            // Configurar el evento para el botón de cancelar
            cancelButton.onclick = function () {
                modal.classList.remove('active');
                if (typeof onCancel === 'function') {
                    onCancel();
                }
            };
            if (opts.cancelButton)
                cancelButton.classList.remove('hidden')
            else
                cancelButton.classList.add('hidden')
            if (opts.confirmButton)
                confirmButton.classList.remove('hidden')
            else
                confirmButton.classList.add('hidden')
            // Configurar el evento para el botón de eliminar
            confirmButton.onclick = function () {
                // Mostrar el spinner de carga
                deleteLoading.classList.remove('hidden');
                confirmButton.disabled = true;

                // Ejecutar el callback de confirmación
                if (typeof onConfirm === 'function') {
                    modal.classList.remove('active');
                    onConfirm(function () {
                        // Ocultar el spinner y habilitar el botón después de que la operación haya terminado
                        deleteLoading.classList.add('hidden');
                        confirmButton.disabled = false;
                        modal.classList.remove('active');
                    });
                }
            };

            // Configurar el evento para cerrar el modal al hacer clic en el botón de cerrar
            const closeModalButton = document.getElementById('close-modal-alt');
            closeModalButton.onclick = function () {
                modal.classList.remove('active');
                if (typeof onCancel === 'function') {
                    onCancel();
                }
            };

            // Configurar el evento para cerrar el modal al hacer clic fuera del modal
            window.onclick = function (event) {
                if (event.target === modal) {
                    modal.classList.remove('active');
                    if (typeof onCancel === 'function') {
                        onCancel();
                    }
                }
            };
        },
        // Mostrar modal de eliminación
        showDeleteModal: function (userId, userName) {
            this.data.currentUserToDelete = userId;
            this.elements.deleteUserName.textContent = `Usuario: ${userName}`;
            this.elements.deleteUserId.textContent = `ID: ${userId}`;
            this.elements.deleteModal.classList.add('active');
            document.body.style.overflow = 'hidden'; // Evitar scroll
        },

        // Ocultar modal de eliminación
        hideDeleteModal: function () {
            this.elements.deleteModal.classList.remove('active');
            document.body.style.overflow = '';
            this.data.currentUserToDelete = null;
            this.elements.deleteLoading.classList.add('hidden');
        },

        // Manejar eliminación de usuario
        handleDeleteUser: function () {
            if (!this.data.currentUserToDelete) return;

            // Mostrar estado de carga
            this.elements.deleteLoading.classList.remove('hidden');
            this.elements.confirmDeleteBtn.disabled = true;

            // Simular eliminación (esto se conectaría a una API real)
            setTimeout(async () => {
                try {
                    const response = await ApiClient.request(`${Config.ENDPOINTS.USUARIO}/${this.data.currentUserToDelete}`, {
                        method: "DELETE",
                    });
                    ;
                    if (app.data.currentUserToDelete == app.data.currentUserDetailsId) {
                        document.querySelector('#user-id-display').textContent = '';
                        document.querySelector('#no-user-selected').classList.remove('hidden');
                    }
                } catch (error) {
                    alert('un error ocurrio')
                }

                // Encontrar y eliminar el usuario de todas las pestañas
                document.querySelectorAll(`.user-item[data-id="${this.data.currentUserToDelete}"]`).forEach(item => {
                    item.remove();
                });

                // Actualizar contadores
                this.updateUsersCounts();

                // Mostrar mensaje de ningún usuario seleccionado si el usuario eliminado estaba seleccionado
                if (document.querySelector('.user-item.selected') === null) {
                    this.showNoUserSelectedState();
                }

                // Ocultar modal
                this.hideDeleteModal();

                // Restablecer botón
                this.elements.confirmDeleteBtn.disabled = false;
            }, 500);
        },
        initializeFilterEvents: function () {
            // Botón "Aplicar filtros"
            document.getElementById('apply-filters').addEventListener('click', function () {
                app.applyFilters();
            });

            // Botón "Limpiar filtros"
            document.getElementById('clear-filters').addEventListener('click', function () {
                app.clearFilters();
            });
        },

        applyFilters: function () {
            // Obtener los valores de los filtros
            const filters = {
                status: document.getElementById('status-filter').value,
                name: document.getElementById('name-filter').value.trim(),
                email: document.getElementById('email-filter').value.trim(),
                phone: document.getElementById('phone-filter').value.trim(),
                dateFrom: new Date(document.getElementById('date-from').value),
                dateTo: new Date(document.getElementById('date-to').value),
            };

            // Filtrar la lista de usuarios
            app.filterUserList(filters);
        },

        clearFilters: function () {
            // Restablecer los valores de los filtros
            document.getElementById('status-filter').value = '';
            document.getElementById('name-filter').value = '';
            document.getElementById('email-filter').value = '';
            document.getElementById('phone-filter').value = '';
            document.getElementById('date-from').value = '';
            document.getElementById('date-to').value = '';

            // Mostrar todos los usuarios
            app.filterUserList({});
        },

        filterUserList: function (filters) {
            const userItems = document.querySelectorAll('.user-item');

            userItems.forEach(userItem => {
                const userStatus = userItem.getAttribute('data-status');
                const userName = userItem.querySelector('.font-medium').textContent.toLowerCase();
                const userEmail = userItem.querySelector('p:nth-of-type(1)').textContent.toLowerCase();
                const userPhone = userItem.querySelector('p:nth-of-type(2)').textContent.toLowerCase();
                const userDate = new Date(userItem.querySelector('.user-date').textContent.replaceAll('/', '-').split(': ')[1]);

                // Aplicar filtros
                const matchesStatus = !filters.status || userStatus === filters.status;
                const matchesName = !filters.name || userName.includes(filters.name.toLowerCase());
                const matchesEmail = !filters.email || userEmail.includes(filters.email.toLowerCase());
                const matchesPhone = !filters.phone || userPhone.includes(filters.phone.toLowerCase());
                const matchesDate = (!filters.dateFrom || userDate >= filters.dateFrom) &&
                    (!filters.dateTo || userDate <= filters.dateTo);
                console.log(filters.dateTo, userDate, filters.dateFrom)

                // Mostrar u ocultar el usuario según los filtros
                if (matchesStatus && matchesName && matchesEmail && matchesPhone && matchesDate) {
                    userItem.style.display = 'block';
                } else {
                    userItem.style.display = 'none';
                }
            });
        },

    };

    // Inicializar la aplicación
    app.init();

});