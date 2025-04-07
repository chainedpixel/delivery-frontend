import AuthService from "./auth/authService.js";

document.addEventListener("DOMContentLoaded", function () {
  const FORM_CONFIG = {
    login: {
      id: "loginForm",
      passwordRules: {},
    },
    register: {
      id: "registerForm",
      passwordRules: {
        minLength: 8,
        requireConfirmation: true,
      },
    },
  };

  class FormManager {
    constructor(config) {
      this.forms = {};
      this.activeForm = "login";
      this.init(config);
    }

    init(config) {
      Object.entries(config).forEach(([formType, settings]) => {
        this.forms[formType] = {
          element: document.getElementById(settings.id),
          settings,
        };
        this.setupFormValidation(formType);
        this.setupPasswordToggles(formType);
      });

      this.setupFormSwitching();

      // Check URL params for initial form
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get("register")) {
        this.toggleForm("register");
      }
    }

    setupFormValidation(formType) {
      const form = this.forms[formType].element;
      const inputs = form.querySelectorAll("input");

      inputs.forEach((input) => {
        input.addEventListener("blur", () =>
          this.validateInput(input, formType)
        );
        input.addEventListener("input", () => {
          input.parentElement.classList.remove("error");
        });
      });

      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (this.validateForm(formType)) {
          await this.handleFormSubmission(form, formType);
        }
      });
    }

    validateInput(input, formType) {
      const wrapper = input.parentElement;
      wrapper.classList.remove("error");

      if (input.required && !input.value) {
        wrapper.classList.add("error");
        return false;
      }

      if (input.type === "email" && input.value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(input.value)) {
          wrapper.classList.add("error");
          return false;
        }
      }

      if (input.type === "password") {
        const settings = this.forms[formType].settings;
        if (
          settings.passwordRules.minLength &&
          input.value.length < settings.passwordRules.minLength
        ) {
          wrapper.classList.add("error");
          return false;
        }
        if (
          settings.passwordRules.requireConfirmation &&
          input.id.includes("Confirm")
        ) {
          const password = document.getElementById(`${formType}Password`).value;
          if (input.value !== password) {
            wrapper.classList.add("error");
            return false;
          }
        }
      }

      return true;
    }

    validateForm(formType) {
      const form = this.forms[formType].element;
      const inputs = form.querySelectorAll("input");
      return Array.from(inputs).every((input) =>
        this.validateInput(input, formType)
      );
    }

    setupPasswordToggles(formType) {
      const form = this.forms[formType].element;
      const passwordInputs = form.querySelectorAll('input[type="password"]');

      passwordInputs.forEach((input) => {
        const wrapper = input.parentElement;
        const toggleIcon = document.createElement("i");
        toggleIcon.className = "fas fa-eye password-toggle";
        wrapper.appendChild(toggleIcon);

        toggleIcon.addEventListener("click", () => {
          const type = input.getAttribute("type");
          input.setAttribute("type", type === "password" ? "text" : "password");
          toggleIcon.className = `fas fa-eye${
            type === "password" ? "-slash" : ""
          } password-toggle`;
        });
      });
    }

    setupFormSwitching() {
      const showRegisterLink = document.getElementById("showRegister");
      const showLoginLink = document.getElementById("showLogin");

      if (showRegisterLink) {
        showRegisterLink.addEventListener("click", (e) => {
          e.preventDefault();
          this.toggleForm("register");
        });
      }

      if (showLoginLink) {
        showLoginLink.addEventListener("click", (e) => {
          e.preventDefault();
          this.toggleForm("login");
        });
      }
    }

    toggleForm(formType) {
      Object.entries(this.forms).forEach(([type, form]) => {
        form.element.style.display = type === formType ? "block" : "none";
        if (type === formType) {
          form.element.style.animation = "slideIn 0.3s ease-out";
        }
      });
      this.activeForm = formType;
    }

    async handleFormSubmission(form, formType) {
      const submitButton = form.querySelector(".auth-button");
      submitButton.classList.add("loading");
      submitButton.disabled = true;

      try {
        if (formType === "login") {
          const email = document.getElementById("loginEmail").value;
          const password = document.getElementById("loginPassword").value;

          const authPayload = {
            email: email,
            password: password,
            deviceInfo: GetDeviceInfo(),
          };

          console.log("Intentando login con:", { email });

          const success = await AuthService.login(authPayload);
          console.log("Resultado del login:", success);

          if (success) {
            window.location.href = "../details/index.html";
          } else {
            this.showError("Credenciales inválidas");
          }
        }
      } catch (error) {
        console.error("Error detallado:", error);
        this.showError("Error en el servidor. Intente más tarde.");
      } finally {
        submitButton.classList.remove("loading");
        submitButton.disabled = false;
      }
    }

    showError(message) {
      const errorContainer = document.getElementById("loginErrorContainer");
      if (errorContainer) {
        errorContainer.textContent = message;
        errorContainer.style.display = "block";

        setTimeout(() => {
          errorContainer.style.display = "none";
        }, 3000);
      }
    }
  }

  // Inicializar el FormManager
  const formManager = new FormManager(FORM_CONFIG);

  // Setup social button animations
  const socialButtons = document.querySelectorAll(".social-button");
  socialButtons.forEach((button) => {
    button.addEventListener("click", function () {
      this.style.transform = "scale(0.95)";
      setTimeout(() => (this.style.transform = "scale(1)"), 200);
    });
  });
});

function GetDeviceInfo() {
  const deviceInfo = {
    os: window.navigator.platform,
    browser:
      window.navigator.userAgent.match(
        /chrome|firefox|safari|edge|opera/i
      )?.[0] || "Unknown",
  };

  return deviceInfo;
}

async function testApiEndpoint() {
  try {
    const fullUrl = `${CONFIG.API_URL}${CONFIG.ENDPOINTS.LOGIN}`;
    console.log("URL completa:", fullUrl);

    // Hacer una petición de prueba
    const response = await fetch(fullUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        email: "admin@delivery.com",
        password: "123456",
        device_info: JSON.stringify(GetDeviceInfo()),
      }),
    });

    console.log("Response headers:", {
      cors: response.headers.get("Access-Control-Allow-Origin"),
      contentType: response.headers.get("Content-Type"),
    });

    const data = await response.json();
    console.log("Datos de respuesta:", data);
  } catch (error) {
    console.error("Error de conexión:", error);
  }
}
