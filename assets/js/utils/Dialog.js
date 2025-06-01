// Función original para diálogos simples
function showDialog(title, message, opts = {icon:"success", cancelButton: false, confirmButton: false, confirmText: 'Aceptar' }, onCancel, onConfirm) {
    // Obtener el modal y sus elementos
    if (document.getElementById('modal-dialog') != undefined) {
        document.getElementById('modal-dialog').remove();
    }
        let div = document.createElement('Div');
        div.className = 'modal-overlay';
        div.id = 'modal-dialog';
        div.innerHTML =  `<div class="modal-container">
        <div class="modal-header">
            <h3 class="dialog-title">-</h3>
            <button type="button" class="text-gray-500 hover:text-gray-700" id="dialog-btn-close">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div class="modal-body">
            <div class="flex items-start">
                <div class="modal-warning-icon ${opts.icon} ">
                    ${opts.icon=="success"?'<i class="fa-solid fa-check"></i>':''}
                    ${opts.icon==null?' <i class="fas fa-exclamation-triangle"></i>':''}
                   
                </div>
                <div class="dialog-content">
                </div>
            </div>
        </div>
        <div class="modal-footer">
            <button type="button" class="action-button secondary" id="dialog-btn-cancel">
                Cancelar
            </button>
            <button type="button" class="action-button !bg-red-600 !text-white hover:!bg-red-700"
                id="dialog-btn-ok">
                <span id="dialog-loading" class="hidden">
                    <span class="spinner"></span>
                </span>
                <span class="dialog-btn-ok-text">Eliminar</span>
            </button>
        </div>
    </div>`;
    document.body.appendChild(div);
    const modal = document.getElementById('modal-dialog');
    const modalTitle = modal.querySelector('.dialog-title');
    const modalBody = modal.querySelector('.dialog-content');
    const btnconfirm = modal.querySelector('.dialog-btn-ok-text');
    const cancelButton = document.getElementById('dialog-btn-cancel');
    const confirmButton = document.getElementById('dialog-btn-ok');
    const deleteLoading = document.getElementById('dialog-loading');

    // Configurar el título y el mensaje del modal
    modalTitle.innerHTML = title;
    modalBody.innerHTML = message || title;
    btnconfirm.textContent = opts.confirmText || 'Aceptar';

    // Mostrar el modal
  setTimeout(() => {
    modal.classList.add('active');

  }, 100);
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
    const closeModalButton = document.getElementById('dialog-btn-close');
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
}

// Nueva función para diálogos con inputs
function inputDialog(title, message, opts = {
    icon: "success", 
    cancelButton: true, 
    confirmButton: true, 
    confirmText: 'Aceptar',
    inputs: []
}, onCancel, onConfirm) {
    // Remover modal existente si existe
    if (document.getElementById('modal-dialog') != undefined) {
        document.getElementById('modal-dialog').remove();
    }

    // Generar HTML para los inputs
    const generateInputsHTML = (inputs) => {
        if (!inputs || inputs.length === 0) return '';
        
        return inputs.map(input => {
            const inputId = `input-${input.name}`;
            const inputClass = 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent';
            
            switch(input.type) {
                case 'text':
                case 'email':
                case 'password':
                    return `
                        <div class="mb-4">
                            <label for="${inputId}" class="block text-sm font-medium text-gray-700 mb-2">
                                ${input.label || input.name}
                            </label>
                            <input 
                                type="${input.type}" 
                                id="${inputId}" 
                                name="${input.name}"
                                class="${inputClass}"
                                placeholder="${input.placeholder || ''}"
                                ${input.required ? 'required' : ''}
                                ${input.value ? `value="${input.value}"` : ''}
                            />
                        </div>
                    `;
                case 'textarea':
                    return `
                        <div class="mb-4">
                            <label for="${inputId}" class="block text-sm font-medium text-gray-700 mb-2">
                                ${input.label || input.name}
                            </label>
                            <textarea 
                                id="${inputId}" 
                                name="${input.name}"
                                class="${inputClass}"
                                placeholder="${input.placeholder || ''}"
                                rows="${input.rows || 3}"
                                ${input.required ? 'required' : ''}
                            >${input.value || ''}</textarea>
                        </div>
                    `;
                case 'select':
                    const options = input.options ? input.options.map(opt => 
                        `<option value="${opt.value}" ${opt.selected ? 'selected' : ''}>${opt.label}</option>`
                    ).join('') : '';
                    return `
                        <div class="mb-4">
                            <label for="${inputId}" class="block text-sm font-medium text-gray-700 mb-2">
                                ${input.label || input.name}
                            </label>
                            <select 
                                id="${inputId}" 
                                name="${input.name}"
                                class="${inputClass}"
                                ${input.required ? 'required' : ''}
                            >
                                ${options}
                            </select>
                        </div>
                    `;
                case 'checkbox':
                    return `
                        <div class="mb-4">
                            <div class="flex items-center">
                                <input 
                                    type="checkbox" 
                                    id="${inputId}" 
                                    name="${input.name}"
                                    class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    ${input.checked ? 'checked' : ''}
                                />
                                <label for="${inputId}" class="ml-2 block text-sm text-gray-900">
                                    ${input.label || input.name}
                                </label>
                            </div>
                        </div>
                    `;
                default:
                    return '';
            }
        }).join('');
    };

    let div = document.createElement('Div');
    div.className = 'modal-overlay';
    div.id = 'modal-dialog';
    div.innerHTML = `<div class="modal-container">
        <div class="modal-header">
            <h3 class="dialog-title">-</h3>
            <button type="button" class="text-gray-500 hover:text-gray-700" id="dialog-btn-close">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div class="modal-body">
            <div class="flex items-start">
                <div class="modal-warning-icon ${opts.icon}">
                    ${opts.icon=="success"?'<i class="fa-solid fa-check"></i>':''}
                    ${opts.icon=="info"?'<i class="fa-solid fa-exclamation"></i>':''}
                    ${opts.icon==null?' <i class="fas fa-exclamation-triangle"></i>':''}
                </div>
                <div class="dialog-content">
                    <div class="dialog-message mb-4"></div>
                    <div class="dialog-inputs">
                        ${generateInputsHTML(opts.inputs)}
                    </div>
                </div>
            </div>
        </div>
        <div class="modal-footer">
            <button type="button" class="action-button secondary" id="dialog-btn-cancel">
                Cancelar
            </button>
            <button type="button" class="action-button primary !bg-blue-600 !text-white hover:!bg-blue-700"
                id="dialog-btn-ok">
                <span id="dialog-loading" class="hidden">
                    <span class="spinner"></span>
                </span>
                <span class="dialog-btn-ok-text">Aceptar</span>
            </button>
        </div>
    </div>`;

    document.body.appendChild(div);
    
    const modal = document.getElementById('modal-dialog');
    const modalTitle = modal.querySelector('.dialog-title');
    const modalMessage = modal.querySelector('.dialog-message');
    const btnconfirm = modal.querySelector('.dialog-btn-ok-text');
    const cancelButton = document.getElementById('dialog-btn-cancel');
    const confirmButton = document.getElementById('dialog-btn-ok');
    const deleteLoading = document.getElementById('dialog-loading');

    // Configurar el título y el mensaje del modal
    modalTitle.innerHTML = title;
    modalMessage.innerHTML = message;
    btnconfirm.textContent = opts.confirmText || "Aceptar";

    // Función para recopilar datos de los inputs
    const collectInputData = () => {
        const data = {};
        if (opts.inputs) {
            opts.inputs.forEach(input => {
                const element = document.getElementById(`input-${input.name}`);
                if (element) {
                    if (input.type === 'checkbox') {
                        data[input.name] = element.checked;
                    } else {
                        data[input.name] = element.value;
                    }
                }
            });
        }
        return data;
    };

    // Mostrar el modal
    setTimeout(() => {
        modal.classList.add('active');
        // Hacer focus en el primer input si existe
        const firstInput = modal.querySelector('input, textarea, select');
        if (firstInput) {
            firstInput.focus();
        }
    }, 100);

    // Configurar visibilidad de botones
    if (opts.cancelButton) {
        cancelButton.classList.remove('hidden');
    } else {
        cancelButton.classList.add('hidden');
    }
    
    if (opts.confirmButton) {
        confirmButton.classList.remove('hidden');
    } else {
        confirmButton.classList.add('hidden');
    }

    // Función para cerrar modal
    const closeModal = () => {
        modal.classList.remove('active');
        setTimeout(() => {
            modal.remove();
        }, 300);
    };

    // Configurar el evento para el botón de cancelar
    cancelButton.onclick = function () {
        closeModal();
        if (typeof onCancel === 'function') {
            onCancel();
        }
    };

    // Configurar el evento para el botón de confirmar
    confirmButton.onclick = function () {
        // Validar inputs requeridos
        if (opts.inputs) {
            const requiredInputs = opts.inputs.filter(input => input.required);
            for (const input of requiredInputs) {
                const element = document.getElementById(`input-${input.name}`);
                if (!element.value.trim()) {
                    element.focus();
                    element.classList.add('border-red-500');
                    return;
                }
            }
        }

        // Mostrar el spinner de carga
        deleteLoading.classList.remove('hidden');
        confirmButton.disabled = true;

        // Recopilar datos y ejecutar callback
        const formData = collectInputData();
        
        if (typeof onConfirm === 'function') {
            onConfirm(formData, function () {
                // Callback para cuando la operación termine
                deleteLoading.classList.add('hidden');
                confirmButton.disabled = false;
                closeModal();
            });
        } else {
            // Si no hay callback, cerrar inmediatamente
            deleteLoading.classList.add('hidden');
            confirmButton.disabled = false;
            closeModal();
        }
    };

    // Configurar el evento para cerrar el modal al hacer clic en el botón de cerrar
    const closeModalButton = document.getElementById('dialog-btn-close');
    closeModalButton.onclick = function () {
        closeModal();
        if (typeof onCancel === 'function') {
            onCancel();
        }
    };

    // Configurar el evento para cerrar el modal al hacer clic fuera del modal
    window.onclick = function (event) {
        if (event.target === modal) {
            closeModal();
            if (typeof onCancel === 'function') {
                onCancel();
            }
        }
    };

    // Configurar Enter para confirmar
    modal.addEventListener('keydown', function(event) {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            confirmButton.click();
        }
    });
}

// Objeto Dialog para usar con sintaxis Dialog.input()
const Dialog = {
    show: showDialog,
    input: inputDialog
};

// Exportaciones
export default Dialog;
export { Dialog, showDialog, inputDialog };