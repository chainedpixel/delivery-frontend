import Config from "./config.js";
import ApiClient from "./utils/apiClient.js";
import Utils from "./utils/miscellaneous.js";
import Dialog from "./utils/Dialog.js";
import TokenService from "./auth/tokenService.js";

window.clientesList = [];
// Pedido mockeado para modo edición 

document.addEventListener('DOMContentLoaded', async function () {
    // Verificar si estamos en modo edición
    
    
    window.clientesList = await ApiClient.request(`${Config.ENDPOINTS.USUARIO}`, {method: "GET"});
        try {
            window.clientesList=window.clientesList.data.data
        } catch (error) {
            window.clientesList=[];
        }    
    
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('id');

    if (orderId) {
        // Modo edición
        document.getElementById('form-title').textContent = 'Editar Pedido';
        document.getElementById('formMode').value = 'edit';
        document.getElementById('orderIdField').value = orderId;

        // Cargar datos del pedido para edición
        loadOrderData(mockOrder);
    } else {
        // Modo creación
        // Precargar la fecha actual y una fecha estimada (ej: 5 días después)
        const today = new Date();
        const estimatedDate = new Date();
        estimatedDate.setDate(today.getDate() + 5);

        document.getElementById('pickupDate').value = formatDate(today);
        document.getElementById('estimatedDeliveryDate').value = formatDate(estimatedDate);
    }

    // Inicializar eventos
    initializeFormEvents();
    initializeWizardEvents();
});

function formatDate(date) {
    return date.toISOString().split('T')[0];
}

function loadOrderData(order) {
    // Cargar cliente
    selectClient(order.client);

    // Cargar datos del formulario
    document.getElementById('recipientName').value = order.recipientName;
    document.getElementById('recipientPhone').value = order.recipientPhone;
    document.getElementById('zoneSelector').value = order.zone;
    document.getElementById('city').value = order.city;
    document.getElementById('postalCode').value = order.postalCode;
    document.getElementById('streetAddress').value = order.streetAddress;
    document.getElementById('unit').value = order.unit;
    document.getElementById('pickupDate').value = order.pickupDate;
    document.getElementById('estimatedDeliveryDate').value = order.estimatedDeliveryDate;
    document.getElementById('timeWindow').value = order.timeWindow;
    document.getElementById('deliveryInstructions').value = order.deliveryInstructions;

    document.getElementById('packageLength').value = order.packageLength;
    document.getElementById('packageWidth').value = order.packageWidth;
    document.getElementById('packageHeight').value = order.packageHeight;
    document.getElementById('packageWeight').value = order.packageWeight;
    document.getElementById('packageValue').value = order.packageValue;
    document.getElementById('packageType').value = order.packageType;
    document.getElementById('isFragile').checked = order.isFragile;
    document.getElementById('requiresRefrigeration').checked = order.requiresRefrigeration;
    document.getElementById('hasInsurance').checked = order.hasInsurance;
    document.getElementById('packageContents').value = order.packageContents;

    // Si el cliente es el destinatario, marcar el checkbox
    if (order.recipientName === order.client.name) {
        document.getElementById('useClientAsRecipient').checked = true;
    }

    // Actualizar resumen
    updateSummary();
}

function initializeFormEvents() {
    // Evento para buscar clientes
    const clientSelector = document.getElementById('clientSelector');
    const clientResults = document.getElementById('clientResults');

    clientSelector.addEventListener('input', function () {
        const searchTerm = this.value.toLowerCase();
        if (searchTerm.length < 2) {
            clientResults.classList.add('hidden');
            return;
        }

        // Filtrar clientes
        const filteredClients = window.clientesList.filter(client =>
            client.full_name.toLowerCase().includes(searchTerm) ||
            client.id.toLowerCase().includes(searchTerm)
        );

        // Mostrar resultados
        clientResults.innerHTML = '';
        if (filteredClients.length === 0) {
            clientResults.innerHTML = '<div class="dropdown-item">No se encontraron resultados</div>';
        } else {
            filteredClients.forEach(client => {
                const item = document.createElement('div');
                item.className = 'dropdown-item';
                item.innerHTML = `<strong>${client.full_name}</strong> <span class="text-gray-500 text-xs">${client.id}</span>`;
                item.addEventListener('click', function () {
                    selectClient(client);
                });
                clientResults.appendChild(item);
            });
        }

        clientResults.classList.remove('hidden');
    });

    // Ocultar resultados al hacer clic fuera
    document.addEventListener('click', function (event) {
        if (!event.target.closest('.custom-dropdown')) {
            clientResults.classList.add('hidden');
        }
    });

    // Cambiar cliente seleccionado
    document.getElementById('changeClientBtn').addEventListener('click', function () {
        document.getElementById('clientInfoContainer').classList.add('hidden');
        document.getElementById('clientSelector').value = '';
        document.getElementById('clientSelector').disabled = false;
    });

    // Abrir modal para crear nuevo cliente
    document.getElementById('newClientBtn').addEventListener('click', function () {
        document.getElementById('newClientModal').classList.remove('hidden');
    });

    // Crear nuevo cliente
    document.getElementById('createClientBtn').addEventListener('click', function () {
        if (validateForm('newClientForm')) {
            // Simular creación de cliente
            const newClient = {
                id: 'CL-' + (100000 + mockClients.length + 1),
                name: document.getElementById('newClientName').value,
                email: document.getElementById('newClientEmail').value,
                phone: document.getElementById('newClientPhone').value,
                address: document.getElementById('newClientAddress').value || 'Sin dirección'
            };

            // Agregar a la lista de clientes
            mockClients.push(newClient);

            // Seleccionar el nuevo cliente
            selectClient(newClient);

            // Cerrar modal
            closeModal('newClientModal');

            // Limpiar formulario
            document.getElementById('newClientForm').reset();
        }
    });

    // Checkbox para usar cliente como destinatario
    document.getElementById('useClientAsRecipient').addEventListener('change', function () {
        const clientInfoContainer = document.getElementById('clientInfoContainer');

        if (this.checked && !clientInfoContainer.classList.contains('hidden')) {
            // Obtener los datos del cliente seleccionado
            const name = document.getElementById('clientName').textContent;
            const phone = document.getElementById('clientPhone').textContent;

            // Llenar los campos de destinatario
            document.getElementById('recipientName').value = name;
            document.getElementById('recipientPhone').value = phone;
        }
    });

    // Validación en tiempo real
    const formInputs = document.querySelectorAll('.form-input[data-required="true"]');
    formInputs.forEach(input => {
        input.addEventListener('blur', function () {
            validateField(this);
        });

        input.addEventListener('input', function () {
            // Ocultar mensaje de error al escribir
            const errorElement = document.getElementById(`${this.id}-error`);
            if (errorElement) {
                errorElement.classList.add('hidden');
            }
            this.classList.remove('error');
        });
    });

    // Envío del formulario
    document.getElementById('orderForm').addEventListener('submit', function (event) {
        event.preventDefault();

        if (validateForm('orderForm')) {
            // Simular envío exitoso
            saveOrder();
        }
    });

    // Botón de guardar como borrador
    document.getElementById('saveAsDraftBtn').addEventListener('click', function () {
        // Guardar sin validación completa
        saveOrder(true);
    });
}

function initializeWizardEvents() {
    // Eventos para botones Siguiente
    document.querySelectorAll('.next-step').forEach(button => {
        button.addEventListener('click', function () {
            nextStep();
        });
    });

    // Eventos para botones Anterior
    document.querySelectorAll('.prev-step').forEach(button => {
        button.addEventListener('click', function () {
            prevStep();
        });
    });

    // Permitir clic en los pasos del wizard (navegación directa)
    document.querySelectorAll('.step-item').forEach(item => {
        item.addEventListener('click', function () {
            const targetStep = parseInt(this.getAttribute('data-step'));
            const currentStep = parseInt(document.getElementById('currentStep').value);

            // Solo permitir ir a pasos anteriores o al siguiente paso
            if (targetStep <= currentStep || targetStep === currentStep + 1) {
                goToStep(targetStep);
            }
        });
    });
}

function selectClient(client) {
    // Actualizar campos de cliente
    document.getElementById('clientName').textContent = client.full_name;
    document.getElementById('clientId').textContent = 'ID: ' + client.id;
    document.getElementById('clientId').setAttribute('data-id',client.id);
    document.getElementById('clientEmail').textContent = client.email;
    document.getElementById('clientPhone').textContent = client.phone;
    document.getElementById('clientAddress').textContent = client.address;

    // Mostrar información y deshabilitar selector
    document.getElementById('clientInfoContainer').classList.remove('hidden');
    document.getElementById('clientSelector').value = client.full_name;
    document.getElementById('clientSelector').disabled = true;
    document.getElementById('clientResults').classList.add('hidden');

    // Si está marcada la opción de usar cliente como destinatario
    if (document.getElementById('useClientAsRecipient').checked) {
        document.getElementById('recipientName').value = client.full_name;
        document.getElementById('recipientPhone').value = client.phone;
    }

    // Actualizar resumen
    updateSummary();
}

function updateSummary() {
    // Cliente y destinatario
    const clientName = document.getElementById('clientName')?.textContent || '';
    const clientId = document.getElementById('clientId')?.textContent?.replace('ID: ', '') || '';
    const recipientName = document.getElementById('recipientName')?.value || '';
    const recipientPhone = document.getElementById('recipientPhone')?.value || '';

    // Dirección
    const street = document.getElementById('streetAddress')?.value || '';
    const unit = document.getElementById('unit')?.value || '';
    const city = document.getElementById('city')?.value || '';
    const postalCode = document.getElementById('postalCode')?.value || '';
    const zone = document.getElementById('zoneSelector')?.value || '';

    // Fechas
    const pickupDate = document.getElementById('pickupDate')?.value
        ? new Date(document.getElementById('pickupDate').value)
        : null;
    const deliveryDate = document.getElementById('estimatedDeliveryDate')?.value
        ? new Date(document.getElementById('estimatedDeliveryDate').value)
        : null;
    const timeWindow = document.getElementById('timeWindow')?.value || '';

    // Paquete
    const length = document.getElementById('packageLength')?.value || '';
    const width = document.getElementById('packageWidth')?.value || '';
    const height = document.getElementById('packageHeight')?.value || '';
    const weight = document.getElementById('packageWeight')?.value || '';
    const value = document.getElementById('packageValue')?.value || '';
    const type = document.getElementById('packageType')?.value || '';
    const contents = document.getElementById('packageContents')?.value || '';

    // Formatear fechas
    const formatDateOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    const formattedPickupDate = pickupDate ? pickupDate.toLocaleDateString('es-ES', formatDateOptions) : '';
    const formattedDeliveryDate = deliveryDate ? deliveryDate.toLocaleDateString('es-ES', formatDateOptions) : '';

    // Formatear ventana horaria
    let timeWindowText = '';
    switch (timeWindow) {
        case 'morning': timeWindowText = 'Mañana (8:00 - 12:00)'; break;
        case 'afternoon': timeWindowText = 'Tarde (12:00 - 18:00)'; break;
        case 'evening': timeWindowText = 'Noche (18:00 - 22:00)'; break;
        default: timeWindowText = '';
    }

    // Características especiales
    const features = [];
    if (document.getElementById('isFragile')?.checked) features.push('Frágil');
    if (document.getElementById('requiresRefrigeration')?.checked) features.push('Refrigeración');
    if (document.getElementById('hasInsurance')?.checked) features.push('Urgente');

    // Actualizar el resumen
    document.getElementById('summary-client').textContent = `${clientName} (${clientId})`;
    document.getElementById('summary-recipient').textContent = recipientName;
    document.getElementById('summary-phone').textContent = recipientPhone;

    let addressText = '';
    if (street) addressText += street;
    if (unit) addressText += unit ? `, ${unit}` : '';
    if (city) addressText += city ? `, ${city}` : '';
    if (zone) {
        const zoneText = zone.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        addressText += zone ? `, ${zoneText}` : '';
    }
    if (postalCode) addressText += postalCode ? `, ${postalCode}` : '';

    document.getElementById('summary-address').textContent = addressText || 'No especificada';
    document.getElementById('summary-pickup').textContent = formattedPickupDate || 'No especificada';
    document.getElementById('summary-delivery').textContent =
        (formattedDeliveryDate ? formattedDeliveryDate : 'No especificada') +
        (timeWindowText ? ` (${timeWindowText})` : '');

    // Paquete
    let dimensionsText = '';
    if (length && width && height) {
        dimensionsText = `${length}cm x ${width}cm x ${height}cm`;
    } else {
        dimensionsText = 'No especificadas';
    }

    document.getElementById('summary-dimensions').textContent = dimensionsText;
    document.getElementById('summary-weight').textContent = weight ? `${weight} kg` : 'No especificado';
    document.getElementById('summary-value').textContent = value ? `$${value}` : 'No declarado';

    // Tipo y características
    let typeText = '';
    switch (type) {
        case 'regular': typeText = 'Regular'; break;
        case 'fragile': typeText = 'Frágil'; break;
        case 'perishable': typeText = 'Perecedero'; break;
        case 'dangerous': typeText = 'Material Peligroso'; break;
        default: typeText = 'No especificado';
    }

    document.getElementById('summary-type').textContent = typeText;
    document.getElementById('summary-features').textContent = features.length > 0 ? features.join(', ') : 'Ninguna';
    document.getElementById('summary-contents').textContent = contents || 'No especificado';
}

function validateField(field) {
    const errorElement = document.getElementById(`${field.id}-error`);
    if (!errorElement) return true;

    let isValid = true;
    const value = field.value.trim();

    // Comprobar si es requerido
    if (field.hasAttribute('data-required') && value === '') {
        errorElement.textContent = 'Este campo es obligatorio';
        errorElement.classList.remove('hidden');
        field.classList.add('error');
        isValid = false;
    } else {
        // Validaciones específicas según el tipo de campo
        switch (field.id) {
            case 'recipientPhone':
            case 'newClientPhone':
                if (!/^[\d\s\+\-\(\)]{7,20}$/.test(value)) {
                    errorElement.textContent = 'Ingrese un número telefónico válido';
                    errorElement.classList.remove('hidden');
                    field.classList.add('error');
                    isValid = false;
                }
                break;

            case 'newClientEmail':
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                    errorElement.textContent = 'Ingrese un correo electrónico válido';
                    errorElement.classList.remove('hidden');
                    field.classList.add('error');
                    isValid = false;
                }
                break;

            case 'postalCode':
                if (!/^\d{5}(-\d{4})?$/.test(value)) {
                    errorElement.textContent = 'Ingrese un código postal válido (5 dígitos)';
                    errorElement.classList.remove('hidden');
                    field.classList.add('error');
                    isValid = false;
                }
                break;

            case 'packageLength':
            case 'packageWidth':
            case 'packageHeight':
            case 'packageWeight':
                if (parseFloat(value) <= 0) {
                    errorElement.textContent = 'Ingrese un valor mayor a cero';
                    errorElement.classList.remove('hidden');
                    field.classList.add('error');
                    isValid = false;
                }
                break;

            case 'pickupDate':
            case 'estimatedDeliveryDate':
                const dateValue = new Date(value);
                if (isNaN(dateValue.getTime())) {
                    errorElement.textContent = 'Ingrese una fecha válida';
                    errorElement.classList.remove('hidden');
                    field.classList.add('error');
                    isValid = false;
                }
                break;
        }
    }

    if (isValid) {
        errorElement.classList.add('hidden');
        field.classList.remove('error');
    }

    return isValid;
}

function validateStep(stepNumber) {
    const stepContent = document.querySelector(`.step-content[data-step="${stepNumber}"]`);
    if (!stepContent) return true;

    const requiredFields = stepContent.querySelectorAll('[data-required="true"]');
    let isValid = true;

    requiredFields.forEach(field => {
        if (!validateField(field)) {
            isValid = false;
        }
    });

    // Validaciones específicas para cada paso
    if (stepNumber === 1) {
        // Validar que hay un cliente seleccionado
        const clientInfoContainer = document.getElementById('clientInfoContainer');
        if (clientInfoContainer.classList.contains('hidden')) {
            const clientSelector = document.getElementById('clientSelector');
            const errorElement = document.getElementById('clientSelector-error');
            errorElement.classList.remove('hidden');
            clientSelector.classList.add('error');
            isValid = false;
        }
    } else if (stepNumber === 2) {
        // Validar fechas
        const pickupDate = new Date(document.getElementById('pickupDate').value);
        const deliveryDate = new Date(document.getElementById('estimatedDeliveryDate').value);

        if (!isNaN(pickupDate.getTime()) && !isNaN(deliveryDate.getTime())) {
            if (deliveryDate < pickupDate) {
                const errorElement = document.getElementById('estimatedDeliveryDate-error');
                errorElement.textContent = 'La fecha de entrega no puede ser anterior a la fecha de recogida';
                errorElement.classList.remove('hidden');
                document.getElementById('estimatedDeliveryDate').classList.add('error');
                isValid = false;
            }
        }
    } else if (stepNumber === 4) {
        // En el paso de confirmación, validar términos y condiciones
        const termsAgreed = document.getElementById('termsAgreed');
        if (!termsAgreed.checked) {
            const errorElement = document.getElementById('termsAgreed-error');
            errorElement.classList.remove('hidden');
            isValid = false;
        }
    }

    if (!isValid) {
        // Scroll al primer error
        const firstError = stepContent.querySelector('.error');
        if (firstError) {
            firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
            firstError.focus();
        }
    }

    return isValid;
}
window.validateForm = function (formId) {
    const form = document.getElementById(formId);
    const requiredFields = form.querySelectorAll('[data-required="true"]');
    let isValid = true;

    requiredFields.forEach(field => {
        if (!validateField(field)) {
            isValid = false;
        }
    });

    // Validación específica: cliente seleccionado
    if (formId === 'orderForm') {
        const clientInfoContainer = document.getElementById('clientInfoContainer');
        if (clientInfoContainer.classList.contains('hidden')) {
            const clientSelector = document.getElementById('clientSelector');
            const errorElement = document.getElementById('clientSelector-error');
            errorElement.classList.remove('hidden');
            clientSelector.classList.add('error');
            isValid = false;
        }

        // Validar fechas
        const pickupDate = new Date(document.getElementById('pickupDate').value);
        const deliveryDate = new Date(document.getElementById('estimatedDeliveryDate').value);

        if (!isNaN(pickupDate.getTime()) && !isNaN(deliveryDate.getTime())) {
            if (deliveryDate < pickupDate) {
                const errorElement = document.getElementById('estimatedDeliveryDate-error');
                errorElement.textContent = 'La fecha de entrega no puede ser anterior a la fecha de recogida';
                errorElement.classList.remove('hidden');
                document.getElementById('estimatedDeliveryDate').classList.add('error');
                isValid = false;
            }
        }
    }

    if (!isValid && formId === 'orderForm') {
        // Scroll al primer error
        const firstError = form.querySelector('.error');
        if (firstError) {
            firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
            firstError.focus();
        }
    }

    return isValid;
}
function nextStep() {
    const currentStep = parseInt(document.getElementById('currentStep').value);

    // Validar el paso actual antes de continuar
    if (validateStep(currentStep)) {
        // Marcar el paso actual como completado
        document.querySelector(`.step-item[data-step="${currentStep}"]`).classList.add('completed');

        // Avanzar al siguiente paso
        goToStep(currentStep + 1);

        // Si vamos al paso de resumen, actualizar la información
        if (currentStep + 1 === 4) {
            updateSummary();
        }
    }
}

function prevStep() {
    const currentStep = parseInt(document.getElementById('currentStep').value);

    // Retroceder al paso anterior
    if (currentStep > 1) {
        goToStep(currentStep - 1);
    }
}

function goToStep(stepNumber) {
    const maxStep = 4; // Número total de pasos

    // Validar que el paso sea válido
    if (stepNumber < 1 || stepNumber > maxStep) return;

    // Ocultar todos los pasos y mostrar el seleccionado
    document.querySelectorAll('.step-content').forEach(content => {
        content.classList.remove('active');
    });

    document.querySelector(`.step-content[data-step="${stepNumber}"]`).classList.add('active');

    // Actualizar los indicadores de pasos
    document.querySelectorAll('.step-item').forEach(item => {
        const itemStep = parseInt(item.getAttribute('data-step'));

        item.classList.remove('active');

        if (itemStep < stepNumber) {
            item.classList.add('completed');
        } else if (itemStep === stepNumber) {
            item.classList.add('active');
        } else {
            item.classList.remove('completed');
        }
    });

    // Actualizar el paso actual
    document.getElementById('currentStep').value = stepNumber;

    // Scroll al inicio del contenido
    window.scrollTo({
        top: document.querySelector('.step-wizard').offsetTop - 20,
        behavior: 'smooth'
    });
}

window.saveOrder = async function (isDraft = false) {
    const orderForm = document.getElementById('orderForm');
    let client_id = document.getElementById('clientId').getAttribute('data-id');
    let data_send = {
        "client_id": client_id,
        "company_pickup_id": "b1ffc99-8d0a-4be8-aa6c-7aa8ce481a22", //falta select
        "delivery_address": { //en el formulario debe ser un campo input o textarea no un select
            "address_line1": orderForm["streetAddress"].value.trim(),
            "address_line2": orderForm["unit"].value.trim(),
            "address_notes": "Ring doorbell twice", //falta campo
            "city": orderForm["city"].value.trim(),
            "postal_code": orderForm["postalCode"].value.trim(),
            "recipient_name": orderForm["recipientName"].value.trim(),
            "recipient_phone": orderForm["recipientPhone"].value.trim(),
            "state": "NY" //falta campo
        },
        "delivery_deadline": orderForm["estimatedDeliveryDate"].valueAsDate.toISOString(),
        "delivery_notes": "Please call recipient 5 minutes before arrival", //falta campo
        "distance": 7.2, //falta campo
        "package_details": {
            "height": parseFloat(orderForm['packageHeight'].value),
            "is_fragile": orderForm['isFragile'].checked,
            "is_urgent": false, //falta campo
            "length": parseFloat(orderForm['packageLength'].value),
            "special_instructions": orderForm["deliveryInstructions"].value,
            "weight": parseFloat(orderForm['packageWeight'].value),
            "width": parseFloat(orderForm['packageWidth'].value)
        },
        "pickup_contact_name": "juan alpaca", //falta campo
        "pickup_contact_phone": "+50378787878", //falta campo
        "pickup_notes": "asdasd asa a", //falta campo
        "pickup_time": orderForm["pickupDate"].valueAsDate.toISOString(),
        "price": parseFloat(orderForm['packageValue'].value), //precio del paquete o costos de envio????
        "requires_signature": false
    }

    try {
        const response = await ApiClient.request(Config.ENDPOINTS.PEDIDO, {
            method: "POST",
            body: JSON.stringify(data_send),
        });
        let data = response.data.data;
        console.log(response);

        // Mostrar mensaje de éxito
        let message = isDraft
            ? 'El borrador se ha guardado correctamente.'
            : `El pedido se ha ${formMode === 'edit' ? 'actualizado' : 'creado'} correctamente.`;

        Dialog(message);

        // Redireccionar a la lista de pedidos
        window.location.href = '../details';
    } catch (error) {
        if (error.message && (error.message.includes(401))) {
            TokenService.removeToken();
            window.location.href = "/login.html";
        }
   window.location.href = '../details';
        throw error;
    }
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.add('hidden');
}