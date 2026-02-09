import { clienteApi } from "./cliente";

export type RespuestaLogin = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
};

export type RespuestaMe = {
  usuario: any;
  permisos?: any;
};

export async function loginApi(identificador: string, contrasena: string) {
  const { data } = await clienteApi.post<RespuestaLogin>("/login", {
    identificador,
    contrasena,
  });
  return data;
}

export async function meApi() {
  const { data } = await clienteApi.get<RespuestaMe>("/me");
  return data;
}
