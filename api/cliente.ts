import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import * as SecureStore from "expo-secure-store";

export const clienteApi = axios.create({
  baseURL: "https://sie.grupowalworth.com/api",
  timeout: 15000,
  headers: { Accept: "application/json", "Content-Type": "application/json" },
});

// Cliente solo para refresh (sin interceptores)
const clienteRefresh = axios.create({
  baseURL: "https://sie.grupowalworth.com/api",
  timeout: 15000,
  headers: { Accept: "application/json", "Content-Type": "application/json" },
});

async function obtenerAccessToken() {
  return SecureStore.getItemAsync("access_token");
}

async function obtenerRefreshToken() {
  return SecureStore.getItemAsync("refresh_token");
}

async function guardarAccessToken(token: string, expiresIn: number) {
  await SecureStore.setItemAsync("access_token", token);
  await SecureStore.setItemAsync(
    "expires_at",
    String(Date.now() + expiresIn * 1000)
  );
}

let refrescando = false;
let cola: Array<(token: string | null) => void> = [];

function resolverCola(token: string | null) {
  cola.forEach((cb) => cb(token));
  cola = [];
}

clienteApi.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await obtenerAccessToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  }
);

clienteApi.interceptors.response.use(
  (resp) => resp,
  async (error: AxiosError<any>) => {
    const original = error.config as any;

    if (error.response?.status !== 401 || original?._reintento) {
      return Promise.reject(error);
    }

    original._reintento = true;

    if (refrescando) {
      return new Promise((resolve, reject) => {
        cola.push((token) => {
          if (!token) return reject(error);
          original.headers.Authorization = `Bearer ${token}`;
          resolve(clienteApi(original));
        });
      });
    }

    refrescando = true;

    try {
      const refreshToken = await obtenerRefreshToken();
      if (!refreshToken) throw new Error("Sin refresh token");

      const { data } = await clienteRefresh.post("/refresh", {
        refresh_token: refreshToken,
      });

      await guardarAccessToken(data.access_token, data.expires_in);

      resolverCola(data.access_token);
      original.headers.Authorization = `Bearer ${data.access_token}`;
      return clienteApi(original);
    } catch (e) {
      resolverCola(null);
      await SecureStore.deleteItemAsync("access_token");
      await SecureStore.deleteItemAsync("refresh_token");
      await SecureStore.deleteItemAsync("expires_at");
      return Promise.reject(error);
    } finally {
      refrescando = false;
    }
  }
);
