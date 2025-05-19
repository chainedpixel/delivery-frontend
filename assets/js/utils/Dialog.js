export default function showDialog(title, message, opts = {icon:"success", cancelButton: false, confirmButton: false, confirmText: 'Aceptar' }, onCancel, onConfirm) {
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
    modalBody.innerHTML = message;
    btnconfirm.textContent = opts.confirmText;

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
