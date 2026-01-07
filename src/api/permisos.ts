import { clienteApi } from "./cliente";

export type Permiso = {
  id: number;
  folio: string;
  type: string;
  reason: string;
  start_date: string;
  end_date: string;
  status: string;
};

export type RespuestaPermisos = {
  data: Permiso[];
  meta: {
    page: number;
    limit: number;
    total: number;
    has_more: boolean;
  };
};

export async function listarPermisos(page: number) {
  const { data } = await clienteApi.get(`/permisos?page=${page}`);

  // Si backend regresa {data, meta}, úsalo
  if (data?.data && data?.meta) return data;

  // Si backend regresa array, lo adaptamos
  return {
    data: Array.isArray(data) ? data : [],
    meta: { has_more: false, page, limit: 10, total: Array.isArray(data) ? data.length : 0 },
  };
}
