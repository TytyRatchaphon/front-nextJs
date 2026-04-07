import axios from "axios";
import Cookies from "js-cookie";

const normalizeToken = (value: string | undefined): string | undefined => {
  if (!value) return undefined;
  const trimmed = value.trim();
  const withoutBearer = trimmed.replace(/^Bearer\s+/i, "");
  const withoutQuotes = withoutBearer.replace(/^['"]+|['"]+$/g, "");
  return withoutQuotes || undefined;
};

const secureProxyClient = axios.create({
  baseURL: "/api/secure",
  timeout: 15000,
});

secureProxyClient.interceptors.request.use((config) => {
  if (typeof window === "undefined") {
    return config;
  }

  const token = normalizeToken(Cookies.get("token"));
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
