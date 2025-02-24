import Config from "./config.js";
import ApiClient from "./utils/apiClient.js";
import Utils from "./utils/miscellaneous.js";
import TokenService from "./auth/tokenService.js";

document.addEventListener("DOMContentLoaded", async function () {
  if (!TokenService.isAuthenticated()) {
    window.location.href = "/pages/login/index.html";
    return;
  }

  const errorMessage = document.createElement("div");
  errorMessage.className = "error-message";
  document.querySelector(".profile-section").appendChild(errorMessage);

  const profileElements = {
    name: document.getElementById("profile_name"),
    role: document.getElementById("profile_role"),
    email: document.getElementById("email"),
    phone: document.getElementById("phone"),
    dni: document.getElementById("dni"),
    birthdate: document.getElementById("birth_date"),
    emergencycontact: document.getElementById("emergencyContact"),
    emergencyphone: document.getElementById("emergencyphone"),
    registerDate: document.getElementById("register_date"),
    accstatus: document.getElementById("acc_status"),
  };


  try {
    const rawData = await GetUserInfoFromApi();
    SetValuesIntoDOM(rawData.data, profileElements);
    PrepareConfigurationForProfileImage();

    if (document.readyState === "complete") {
      setupNavigationButtons();
    } else {
      window.addEventListener("load", setupNavigationButtons);
    }

    window.setupNavigationButtons = setupNavigationButtons;
  } catch (error) {
    console.error("Error al cargar el perfil:", error);
    if (error.message && error.message.includes("401")) {
      TokenService.removeToken();
      window.location.href = "/login.html";
    } else {
      showError("Error al cargar los datos del perfil. Por favor, intente nuevamente.");
    }
  }
});

function setupNavigationButtons() {
  const prevButton = document.getElementById("prevSession");
  const nextButton = document.getElementById("nextSession");
  const panels = document.querySelectorAll("#sessionSlider .subtab-panel");
  const dots = document.querySelectorAll(".session-indicator .session-dot");
  let currentIndex = 0;

  if (!prevButton || !nextButton || panels.length === 0) {
    return;
  }

  prevButton.disabled = true;
  nextButton.disabled = panels.length <= 1;

  function showPanel(index) {
    if (index < 0 || index >= panels.length) {
      return;
    }

    panels.forEach((panel, i) => {
      if (i === index) {
        panel.classList.add("active");
      } else {
        panel.classList.remove("active");
      }
    });

    if (dots.length > 0) {
      dots.forEach((dot, i) => {
        if (i === index) {
          dot.classList.add("active");
        } else {
          dot.classList.remove("active");
        }
      });
    }

    prevButton.disabled = index === 0;
    nextButton.disabled = index === panels.length - 1;

    currentIndex = index;

  }

  prevButton.onclick = function () {
    if (currentIndex > 0) {
      showPanel(currentIndex - 1);
    }
  };

  nextButton.onclick = function () {
    if (currentIndex < panels.length - 1) {
      showPanel(currentIndex + 1);
    }
  };

  dots.forEach((dot, index) => {
    dot.onclick = function () {
      showPanel(index);
    };
  });

}

function safeUpdateText(element, text) {
  if (element) {
    element.textContent = text || "No disponible";
  }
}

function SetValuesIntoDOM(data, profileElements) {
  const profile = data.profile || {};
  const roles = data.roles || [];
  const sessions = data.sessions || [];


  safeUpdateText(profileElements.name, data.full_name);

  if (roles.length > 0 && roles[0].auth) {
    safeUpdateText(profileElements.role, roles[0].auth.description);
  } else {
    safeUpdateText(profileElements.role, "Usuario");
  }

  safeUpdateText(profileElements.email, data.email);
  safeUpdateText(profileElements.phone, data.phone);
  safeUpdateText(profileElements.dni, profile.document_number);
  safeUpdateText(
    profileElements.emergencyphone,
    profile.emergency_contact_phone
  );

  if (profile.birth_date) {
    safeUpdateText(
      profileElements.birthdate,
      Utils.formatTimestampWithoutHours(profile.birth_date)
    );
  }

  safeUpdateText(
    profileElements.emergencycontact,
    profile.emergency_contact_name
  );

  if (data.created_at) {
    safeUpdateText(
      profileElements.registerDate,
      Utils.formatTimestamp(data.created_at)
    );
  }

  safeUpdateText(
    profileElements.accstatus,
    data.is_active ? "Activo" : "Inactivo"
  );

  if (data.profilePhoto) {
    const profilePhoto = document.getElementById("profilePhoto");
    if (profilePhoto) {
      profilePhoto.src = data.profilePhoto;
    }
  }

  const headerName = document.querySelector("h1.text-4xl");
  if (headerName) {
    headerName.textContent = data.full_name || "Admin System";
  }

  displaySessions(sessions);
}

async function GetUserInfoFromApi() {
  try {
    const response = await ApiClient.request(Config.ENDPOINTS.PROFILE, {
      method: "GET",
    });

    return response;
  } catch (error) {
    if (error.message && (error.message.includes(401))) {
      TokenService.removeToken();
      window.location.href = "/login.html";
    }

    throw error;
  }
}

function PrepareConfigurationForProfileImage() {
  const changePhotoBtn = document.getElementById("changePhotoBtn");
  const photoInput = document.getElementById("photoInput");
  const profilePhoto = document.getElementById("profilePhoto");

  if (!changePhotoBtn || !photoInput || !profilePhoto) {
    return;
  }

  changePhotoBtn.addEventListener("click", () => {
    photoInput.click();
  });

  profilePhoto.addEventListener("click", () => {
    photoInput.click();
  });

  photoInput.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showError("Por favor, selecciona un archivo de imagen válido");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showError("La imagen debe ser menor a 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      profilePhoto.src = event.target.result;
    };
    reader.readAsDataURL(file);
  });
}

function showError(message) {
  const errorMessage = document.querySelector(".error-message");
  if (errorMessage) {
    errorMessage.textContent = message;
    errorMessage.style.display = "block";
    setTimeout(() => {
      errorMessage.style.display = "none";
    }, 3000);
  } else {
  }
}

function displaySessions(sessions) {
  const sessionSlider = document.getElementById("sessionSlider");
  const sessionIndicator = document.querySelector(".session-indicator");
  const prevButton = document.getElementById("prevSession");
  const nextButton = document.getElementById("nextSession");

  if (!sessionSlider || !sessionIndicator) {
    return;
  }

  sessionSlider.innerHTML = "";
  sessionIndicator.innerHTML = "";

  sessionSlider.style = "";

  if (!sessions || sessions.length === 0) {
    const noSessionPanel = document.createElement("div");
    noSessionPanel.className = "subtab-panel";
    noSessionPanel.innerHTML = `
      <div class="info-list">
        <div class="info-item">
          <div class="info-text">
            <div class="info-value">No hay sesiones activas</div>
          </div>
        </div>
      </div>
    `;
    sessionSlider.appendChild(noSessionPanel);
    return;
  }

  let currentSessionIndex = 0;

  function showSession(index) {
    const sessionSlider = document.getElementById("sessionSlider");
    const allPanels = sessionSlider.querySelectorAll(".subtab-panel");
    const sessionIndicator = document.querySelector(".session-indicator");
    const dots = sessionIndicator.querySelectorAll(".session-dot");

    if (index < 0 || index >= allPanels.length) {
      return;
    }

    const direction = index > currentSessionIndex ? "next" : "prev";

    allPanels.forEach((panel, i) => {
      panel.classList.remove("active", "previous", "next");

      if (i === index) {
        panel.classList.add("active");
      } else if (i === currentSessionIndex) {
        panel.classList.add(direction === "next" ? "previous" : "next");
      }
    });

    dots.forEach((dot, i) => {
      if (i === index) {
        dot.classList.add("active");
      } else {
        dot.classList.remove("active");
      }
    });

    const prevButton = document.getElementById("prevSession");
    const nextButton = document.getElementById("nextSession");

    if (prevButton) prevButton.disabled = index === 0;
    if (nextButton) nextButton.disabled = index >= allPanels.length - 1;

    currentSessionIndex = index;

  }

  sessions.forEach((session, index) => {
    let deviceInfo = { browser: "Desconocido", os: "Desconocido" };
    let buildedMessage = "Dispositivo desconocido";

    if (session.device_info) {
      try {
        const parsedInfo = JSON.parse(session.device_info);
        if (parsedInfo && typeof parsedInfo === "object") {
          deviceInfo = {
            browser: parsedInfo.browser || "Dispositivo",
            os: parsedInfo.os || "Desconocido",
          };
          buildedMessage = `${deviceInfo.os} | ${deviceInfo.browser}`;
        }
      } catch (e) {
      }
    }

    let deviceIcon = "fa-laptop";
    if (deviceInfo.os && deviceInfo.os !== "Desconocido") {
      const osLower = deviceInfo.os.toLowerCase();

      if (osLower.includes("android")) {
        deviceIcon = "fa-mobile-android";
      } else if (osLower.includes("ios") || osLower.includes("iphone")) {
        deviceIcon = "fa-mobile-iphone";
      } else if (osLower.includes("windows")) {
        deviceIcon = "fa-windows";
      } else if (osLower.includes("mac")) {
        deviceIcon = "fa-apple";
      } else if (osLower.includes("linux")) {
        deviceIcon = "fa-linux";
      }
    }

    const sessionPanel = document.createElement("div");
    sessionPanel.className = `subtab-panel ${index === 0 ? "active" : ""}`;

    sessionPanel.innerHTML = `
      <div class="info-list">
        <div class="info-item">
          <div class="info-icon">
            <i class="fa-solid fa-calendar-check"></i>
          </div>
          <div class="info-text">
            <div class="info-label">Fecha de Sesión</div>
            <div class="info-value">${Utils.formatTimestamp(
              session.created_at
            )}</div>
          </div>
        </div>
        <div class="info-item">
          <div class="info-icon">
            <i class="fa-solid fa-calendar-xmark"></i>
          </div>
          <div class="info-text">
            <div class="info-label">Fecha de Caducidad</div>
            <div class="info-value">${Utils.formatTimestamp(
              session.expires_at
            )}</div>
          </div>
        </div>
        <div class="info-item">
          <div class="info-icon">
            <i class="fa-solid fa-clock-rotate-left"></i>
          </div>
          <div class="info-text">
            <div class="info-label">Última Actividad</div>
            <div class="info-value">${Utils.formatTimestamp(
              session.last_activity
            )}</div>
          </div>
        </div>
        <div class="info-item">
          <div class="info-icon">
            <i class="fa-solid fa-network-wired"></i>
          </div>
          <div class="info-text">
            <div class="info-label">Dirección IP</div>
            <div class="info-value">${
              session.ip_address || "No disponible"
            }</div>
          </div>
        </div>
        <div class="info-item device-info">
          <div class="info-icon">
            <i class="fa-solid ${deviceIcon}"></i>
          </div>
          <div class="info-text">
            <div class="info-label">Información del Dispositivo</div>
            <div class="info-value">${buildedMessage}</div>
          </div>
        </div>
      </div>
    `;

    sessionSlider.appendChild(sessionPanel);

    const sessionDot = document.createElement("div");
    sessionDot.className = `session-dot ${index === 0 ? "active" : ""}`;
    sessionDot.addEventListener("click", () => {
      showSession(index);
    });
    sessionIndicator.appendChild(sessionDot);
  });

  if (prevButton && nextButton) {
    const newPrevButton = prevButton.cloneNode(true);
    const newNextButton = nextButton.cloneNode(true);
    prevButton.parentNode.replaceChild(newPrevButton, prevButton);
    nextButton.parentNode.replaceChild(newNextButton, nextButton);

    newPrevButton.addEventListener("click", () => {
      if (currentSessionIndex > 0) {
        showSession(currentSessionIndex - 1);
      }
    });

    newNextButton.addEventListener("click", () => {
      if (currentSessionIndex < sessions.length - 1) {
        showSession(currentSessionIndex + 1);
      }
    });

    newPrevButton.disabled = true;
    newNextButton.disabled = sessions.length <= 1;
  }
}
