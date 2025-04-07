import Config from "./config.js";
import ApiClient from "./utils/apiClient.js";

try {
    tailwind.config = {
        theme: {
          extend: {
            colors: {
              blaze: {
                light: '#2e4b6d',
                DEFAULT: '#1b2c40',
                dark: '#1c2733',
              }
            }
          }
        },
        variants: {
          extend: {
            backgroundColor: ['hover'],
          }
        }
      };
      
} catch (error) {
    console.error('Tailwind no se ha cargado')
}
(async ()=>{
    setUserInfoFromApi();
})();



// Llamar a la función para borrar las cookies


async function setUserInfoFromApi() {
    try {
      const response = await ApiClient.request(Config.ENDPOINTS.PROFILE, {
        method: "GET",
      });
      document.getElementById('user-name-nav-bar').textContent = response.data.full_name;
      document.getElementById('user-email-nav-bar').textContent = response.data.email;
      document.getElementById('cerrar-sesiion-btn-nav-bar').addEventListener('click',async function() {
   
      
       /* ApiClient.request(Config.ENDPOINTS.LOGUOT, {
            method: "POST",
          }).then(response=>{
            console.log(response)
          });
          */
      })
      document.getElementById('perfil-btn-nav-bar').addEventListener('click',async function() {
       window.location.href='../profile'
      })
    } catch (error) {
      if (error.message && (error.message.includes(401))) {
        TokenService.removeToken();
        window.location.href = "../login.html";
      }
  
      throw error;
    }
  }
  