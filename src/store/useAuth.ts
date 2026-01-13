import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import { loginApi, meApi } from "../api/auth";
import { registrarPushTokenEnApi } from "../push/registroPush";

type EstadoAuth = {
  usuario: any | null;
  permisos: any | null;
  cargando: boolean;
  error: string | null;

  iniciarSesion: (
    identificador: string,
    contrasena: string
  ) => Promise<boolean>;
  cargarSesion: () => Promise<boolean>;
  cerrarSesion: () => Promise<void>;
};

export const useAuth = create<EstadoAuth>((set) => ({
  usuario: null,
  permisos: null,
  cargando: false,
  error: null,

  iniciarSesion: async (identificador, contrasena) => {
    set({ cargando: true, error: null });

    try {
      // ✅ tu API regresa access_token, refresh_token, expires_in
      const data = await loginApi(identificador, contrasena);

      await SecureStore.setItemAsync("access_token", data.access_token);
      await SecureStore.setItemAsync("refresh_token", data.refresh_token);
      await SecureStore.setItemAsync(
        "expires_at",
        String(Date.now() + data.expires_in * 1000)
      );

      // ✅ ahora /me sí llevará Authorization porque el interceptor ya encontrará access_token
      const me = await meApi();

      set({
        usuario: me.usuario,
        permisos: me.permisos ?? null,
        cargando: false,
      });

      await registrarPushTokenEnApi();

      return true;
    } catch (e: any) {
      const msg = e?.response?.data?.message || "No se pudo iniciar sesión";
      set({ error: msg, cargando: false });
      return false;
    }
  },

  cargarSesion: async () => {
    set({ cargando: true, error: null });

    const access = await SecureStore.getItemAsync("access_token");
    const refresh = await SecureStore.getItemAsync("refresh_token");

    // si no hay refresh, la sesión no existe
    if (!refresh) {
      set({ cargando: false });
      return false;
    }

    try {
      // si access está expirado, el interceptor hará refresh automáticamente
      const me = await meApi();

      set({
        usuario: me.usuario,
        permisos: me.permisos ?? null,
        cargando: false,
      });

      return true;
    } catch {
      // limpia todo si ya no sirve
      await SecureStore.deleteItemAsync("access_token");
      await SecureStore.deleteItemAsync("refresh_token");
      await SecureStore.deleteItemAsync("expires_at");
      set({ usuario: null, permisos: null, cargando: false });
      return false;
    }
  },

  cerrarSesion: async () => {
    // (opcional) también llamar /logout con refresh_token para revocar en server
    await SecureStore.deleteItemAsync("access_token");
    await SecureStore.deleteItemAsync("refresh_token");
    await SecureStore.deleteItemAsync("expires_at");
    set({ usuario: null, permisos: null, error: null });
  },
}));
