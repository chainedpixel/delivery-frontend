
import Config from "../../assets/js/config.js";
import ApiClient from "../../assets/js/utils/apiClient.js";
import Utils from "../../assets/js/utils/miscellaneous.js";
import TokenService from "../../assets/js/auth/tokenService.js";
document.addEventListener('DOMContentLoaded', function () {
    // Inicializar eventos

    initializeFormEvents();
    initializeWizardEvents();
    setRolesSelect();
});

function initializeFormEvents() {
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

    // Validación especial para confirmar contraseña
    document.getElementById('confirmPassword').addEventListener('blur', function () {
        const password = document.getElementById('password').value;
        const confirmPassword = this.value;

        if (password !== confirmPassword) {
            const errorElement = document.getElementById('confirmPassword-error');
            errorElement.textContent = 'Las contraseñas no coinciden';
            errorElement.classList.remove('hidden');
            this.classList.add('error');
        }
    });

    // Eventos para actualizar el resumen
    const formElements = document.querySelectorAll('input, select, textarea');
    formElements.forEach(element => {
        element.addEventListener('change', updateSummary);
    });

    // Envío del formulario
    document.getElementById('userForm').addEventListener('submit', function (event) {
        event.preventDefault();

        if (validateForm('userForm')) {
            saveUser();
        }
    });


}
async function setRolesSelect() {
    let rol_select = document.getElementById('user-role-select');
    rol_select.innerHTML = '';
    let roles = await ApiClient.request(`${Config.ENDPOINTS.ROLES}`, { method: "GET", });
    roles.data.forEach(r => {
        rol_select.innerHTML += `<option value="${r.name}">${r.name}</option>`;
    })

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

            // Si intenta ir a un paso anterior, permitir sin validación
            if (targetStep < currentStep) {
                goToStep(targetStep);
            }
            // Si intenta ir al siguiente paso, validar primero
            else if (targetStep === currentStep + 1) {
                if (validateStep(currentStep)) {
                    // Marcar el paso actual como completado
                    document.querySelector(`.step-item[data-step="${currentStep}"]`).classList.add('completed');
                    goToStep(targetStep);

                    // Si vamos al paso de resumen, actualizar la información
                    if (targetStep === 4) {
                        updateSummary();
                    }
                }
            }
            // Si intenta ir al paso actual, no hacer nada
        });
    });
}

function updateSummary() {
    // Información básica
    const firstName = document.getElementById('firstName')?.value || '';
    const email = document.getElementById('email')?.value || '';
    const phone = document.getElementById('phone')?.value || '';
    const roleSelect = document.getElementById('user-role-select');
    const roleText = roleSelect.options[roleSelect.selectedIndex]?.text || '';

    // Documentación
    const documentType = document.getElementById('documentType');
    const documentTypeText = documentType.options[documentType.selectedIndex]?.text || '';
    const documentNumber = document.getElementById('documentNumber')?.value || '';
    const birthDate = document.getElementById('birthDate')?.value
        ? new Date(document.getElementById('birthDate').value)
        : null;

    // Contacto de emergencia
    const emergencyName = document.getElementById('emergencyContactName')?.value || '';
    const emergencyPhone = document.getElementById('emergencyContactPhone')?.value || '';

    // Estado de la cuenta
    const isActive = document.getElementById('activeStatus')?.checked || false;

    // Formatear fecha
    const formatDateOptions = { year: 'numeric', month: '2-digit', day: '2-digit' };
    const formattedBirthDate = birthDate ? birthDate.toLocaleDateString('es-ES', formatDateOptions) : '';

    // Actualizar el resumen
    document.getElementById('summary-name').textContent = `${firstName}`;
    document.getElementById('summary-email').textContent = email;
    document.getElementById('summary-phone').textContent = phone;
    document.getElementById('summary-role').textContent = roleText;

    document.getElementById('summary-docType').textContent = documentTypeText;
    document.getElementById('summary-docNumber').textContent = documentNumber;
    document.getElementById('summary-birthDate').textContent = formattedBirthDate;

    document.getElementById('summary-emergencyName').textContent = emergencyName;
    document.getElementById('summary-emergencyPhone').textContent = emergencyPhone;

    document.getElementById('summary-status').textContent = isActive ? 'Activa' : 'Inactiva';
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
            case 'email':
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                    errorElement.textContent = 'Ingrese un correo electrónico válido';
                    errorElement.classList.remove('hidden');
                    field.classList.add('error');
                    isValid = false;
                }
                break;

            case 'phone':
            case 'emergencyContactPhone':
                if (!/^[\d\s\+\-\(\)]{7,20}$/.test(value)) {
                    errorElement.textContent = 'Ingrese un número telefónico válido';
                    errorElement.classList.remove('hidden');
                    field.classList.add('error');
                    isValid = false;
                }
                break;

            case 'password':
                if (value.length < 8) {
                    errorElement.textContent = 'La contraseña debe tener al menos 8 caracteres';
                    errorElement.classList.remove('hidden');
                    field.classList.add('error');
                    isValid = false;
                }
                break;

            case 'confirmPassword':
                const password = document.getElementById('password').value;
                if (value !== password) {
                    errorElement.textContent = 'Las contraseñas no coinciden';
                    errorElement.classList.remove('hidden');
                    field.classList.add('error');
                    isValid = false;
                }
                break;

            case 'birthDate':
                const dateValue = new Date(value);
                if (isNaN(dateValue.getTime())) {
                    errorElement.textContent = 'Ingrese una fecha válida';
                    errorElement.classList.remove('hidden');
                    field.classList.add('error');
                    isValid = false;
                } else {
                    // Verificar que sea mayor de edad (18 años)
                    const today = new Date();
                    const minDate = new Date();
                    minDate.setFullYear(today.getFullYear() - 18);

                    if (dateValue > minDate) {
                        errorElement.textContent = 'Debe ser mayor de 18 años';
                        errorElement.classList.remove('hidden');
                        field.classList.add('error');
                        isValid = false;
                    }
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
        // Validación adicional para confirmar contraseña
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (password !== confirmPassword) {
            const errorElement = document.getElementById('confirmPassword-error');
            errorElement.textContent = 'Las contraseñas no coinciden';
            errorElement.classList.remove('hidden');
            document.getElementById('confirmPassword').classList.add('error');
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

function validateForm(formId) {
    if (formId === 'userForm') {
        // Validar todos los pasos
        const currentStep = parseInt(document.getElementById('currentStep').value);
        let isValid = true;

        for (let i = 1; i <= currentStep; i++) {
            if (!validateStep(i)) {
                goToStep(i);
                isValid = false;
                break;
            }
        }

        return isValid;
    }

    return true;
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
function formatDate(dateString) {
    if (!dateString) return '';

    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Los meses van de 0 a 11
    const year = date.getFullYear();

    return `${day}/${month}/${year}`; // Formato DD-MM-YYYY
}
async function saveUser() {
    // Recopilar datos del formulario
    const userData = {
        email: document.getElementById('email').value.trim(),
        full_name: document.getElementById('firstName').value.trim(),
        password: document.getElementById('password').value.trim(),
        phone: document.getElementById('phone').value.trim(),
        profile: {
            additional_info: "Información adicional", // Puedes dejarlo vacío o agregar un campo en el formulario
            birth_date: formatDate(document.getElementById('birthDate').value), // Formatear la fecha
            document_number: document.getElementById('documentNumber').value.trim(),
            document_type: document.getElementById('documentType').value.trim(),
            emergency_contact_name: document.getElementById('emergencyContactName').value.trim(),
            emergency_contact_phone: document.getElementById('emergencyContactPhone').value.trim(),
        },
        roles: [document.getElementById('user-role-select').value], // Formatear el rol
    };

    try {
        console.log(userData)
        // Enviar la solicitud a la API
        const response = await ApiClient.request(`${Config.ENDPOINTS.USUARIO}`, {
            method: "POST",
            body: JSON.stringify(userData),
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (response.success) {
            alert('El usuario se ha registrado');
            // Redireccionar a la lista de usuarios
            window.location.href = '../../pages/userDetails/index.html';
        } else {
            // Mostrar mensaje de error
            alert('Error al registrar el usuario: ' + (response.message));
        }
    } catch (error) {
        console.error('Error al registrar el usuario:', error);
        alert('Error al registrar el usuario');
    }
}