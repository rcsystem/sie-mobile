import { create } from "zustand";
import { loginApi, meApi } from "../api/auth";
import { guardarItem, leerItem, borrarItem } from "../../utils/almacenSeguro";
import { registrarPushTokenEnApi } from "../push/registroPush";

type EstadoAuth = {
  token: string | null;
  refreshToken: string | null;
  usuario: any | null;
  cargando: boolean;
  error: string | null;

  cargarSesion: () => Promise<void>;
  iniciarSesion: (identificador: string, contrasena: string) => Promise<void>;
  cerrarSesion: () => Promise<void>;
};

export const useAuth = create<EstadoAuth>((set, get) => ({
  token: null,
  refreshToken: null,
  usuario: null,
  cargando: false,
  error: null,

  // ✅ Se llama al arrancar la app (AppNavigator)
  cargarSesion: async () => {
    try {
      set({ cargando: true, error: null });

      const token = await leerItem("access_token");
      const refreshToken = await leerItem("refresh_token");

      if (!token) {
        set({
          token: null,
          refreshToken: refreshToken ?? null,
          usuario: null,
          cargando: false,
        });
        return;
      }

      // Guardamos en estado (axios interceptor también lo tomará de SecureStore)
      set({ token, refreshToken: refreshToken ?? null });

      // Traer perfil
      const res = await meApi();
      const perfil = (res as any)?.usuario ?? (res as any)?.data ?? res;
      set({ usuario: perfil, cargando: false });

      // Push (opcional)
      registrarPushTokenEnApi().catch((e) => {
        console.log("Push token falló (ignorado):", e?.message || e);
      });
    } catch (e: any) {
      set({
        token: null,
        refreshToken: null,
        usuario: null,
        cargando: false,
        error:
          e?.response?.data?.message ||
          e?.message ||
          "No se pudo cargar sesión",
      });
    }
  },

  iniciarSesion: async (identificador, contrasena) => {
    try {
      set({ cargando: true, error: null });

      const data = await loginApi(identificador, contrasena);

      // El backend debe regresar access_token + refresh_token
      if (!data?.access_token) {
        throw new Error("El backend no regresó access_token");
      }

      set({
        token: data.access_token,
        refreshToken: data.refresh_token ?? null,
      });

      await guardarItem("access_token", data.access_token);
      if (data.refresh_token)
        await guardarItem("refresh_token", data.refresh_token);

      const res = await meApi();
      const perfil = (res as any)?.usuario ?? (res as any)?.data ?? res;
      set({ usuario: perfil, cargando: false });

      registrarPushTokenEnApi().catch((e) => {
        console.log("Push token falló (ignorado):", e?.message || e);
      });
    } catch (e: any) {
      // Importantísimo: deja el estado limpio
      set({
        token: null,
        refreshToken: null,
        usuario: null,
        cargando: false,
        error:
          e?.response?.data?.message ||
          e?.message ||
          "No se pudo iniciar sesión",
      });
    }
  },

  cerrarSesion: async () => {
    set({
      token: null,
      refreshToken: null,
      usuario: null,
      error: null,
      cargando: false,
    });
    await borrarItem("access_token");
    await borrarItem("refresh_token");
  },
}));
