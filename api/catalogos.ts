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

/// ✅ Normaliza lo que regresa el backend: { turn, name_turn } -> { id, nombre }


export async function listarTurnos(typeEmploye: number, signal?: AbortSignal) {
  if (!typeEmploye || Number(typeEmploye) <= 0) return [];

  const { data } = await clienteApi.get("/turnos", {
    params: { typeEmploye: Number(typeEmploye) },
    signal,
    timeout: 12000,
  });

  const lista = Array.isArray(data?.data) ? data.data : [];

  return lista.map((t: any) => ({
    id: Number(t.turn),
    nombre: String(t.name_turn ?? ""), // evita "undefined"
  })) as TurnoApi[];
}

