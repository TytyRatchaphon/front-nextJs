import axios from "axios";
import { parseJwtToken } from "@/utils/jwtParser";
import { useAuthStore } from "@/stores/authStore";

const secureProxyClient = axios.create({
  baseURL: "/api/secure",
  timeout: 15000,
});

secureProxyClient.interceptors.request.use((config) => {
  if (typeof window === "undefined") {
    return config;
  }

  const token = parseJwtToken(useAuthStore.getState().token);
  if (!token) {
    return config;
  }

  config.headers = config.headers ?? {};
  if (!config.headers.Authorization) {
    config.headers.Authorization = token;
  }

  return config;
});

export default secureProxyClient;
