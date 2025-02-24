import ApiClient from "../utils/apiClient.js";
import CONFIG from "../config.js";

export default class UserService {
  static async getProfile() {
    return ApiClient.request(CONFIG.ENDPOINTS.PROFILE, {
      method: "GET",
    });
  }
}
