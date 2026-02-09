import { clienteApi } from "./cliente";

export type TipoPermisoApi = {
  id: number;
  nombre: string;
};

export type TurnoApi = {
  id: number;
  nombre: string;
};

export async function listarTiposPermiso(signal?: AbortSignal) {
  const { data } = await clienteApi.get("/catalogos/tipos-permiso", {
    signal,
    timeout: 12000,
  });

  // esperado: { data: [...] }
  return Array.isArray(data?.data) ? (data.data as TipoPermisoApi[]) : [];
}

// Turnos por tipo de empleado
// Backend actual: GET /api/turnos?typeEmploye=1
// Respuesta: { data: [{ turn, name_turn }, ...] }
export async function listarTurnos(typeEmploye: number, signal?: AbortSignal) {
  if (!typeEmploye || Number(typeEmploye) <= 0) return [];

  const { data } = await clienteApi.get("/turnos", {
    params: { typeEmploye: Number(typeEmploye) },
    signal,
    timeout: 12000,
  });

  return Array.isArray(data?.data) ? data.data : [];
}
