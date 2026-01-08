import { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import EstadoBadge from "../../components/EstadoBadge";
import MovimientoBadge from "../../components/MovimientoBadge";
import { listarPermisos, Permiso } from "../../api/permisos";

type Movimiento =
  | "ENTRADA"
  | "SALIDA"
  | "ENTRADA_SALIDA"
  | "INASISTENCIA"
  | "OTRO";

function esFechaValida(valor: any): boolean {
  if (valor === null || valor === undefined) return false;

  const s = String(valor).trim();
  if (!s) return false;

  // Evita "fechas vacías" comunes
  if (s === "0000-00-00" || s === "0000-00-00 00:00:00") return false;

  return true;
}

function inferirMovimiento(item: any): Movimiento {
  // ✅ Inasistencia (del/al)
  const del = item?.inasistencia_del ?? item?.del ?? item?.fecha_del ?? null;
  const al = item?.inasistencia_al ?? item?.al ?? item?.fecha_al ?? null;

  if (esFechaValida(del) && esFechaValida(al)) return "INASISTENCIA";

  // ✅ Entrada/Salida por fechas reales
  const tieneEntrada = esFechaValida(item?.fecha_entrada);
  const tieneSalida = esFechaValida(item?.fecha_salida);

  if (tieneEntrada && tieneSalida) return "ENTRADA_SALIDA";
  if (tieneEntrada) return "ENTRADA";
  if (tieneSalida) return "SALIDA";

  return "OTRO";
}

function textoFechas(item: any): string {
  const mov = inferirMovimiento(item);

  if (mov === "INASISTENCIA") {
    const del = item?.inasistencia_del ?? "-";
    const al = item?.inasistencia_al ?? "-";
    return `Del: ${del}  Al: ${al}`;
  }

  if (mov === "ENTRADA") {
    return `${item?.fecha_entrada ?? "-"} → ${item?.hora_entrada ?? "-"}`;
  }

  if (mov === "SALIDA") {
    return `${item?.fecha_salida ?? "-"} → ${item?.hora_salida ?? "-"}`;
  }

  if (mov === "ENTRADA_SALIDA") {
    return `${item?.fecha_salida ?? "-"} ${item?.hora_salida ?? "-"} → ${
      item?.fecha_entrada ?? "-"
    } ${item?.hora_entrada ?? "-"}`;
  }

  const e = item?.fecha_entrada ?? "-";
  const s = item?.fecha_salida ?? "-";
  return `${e} → ${s}`;
}

function tituloCategoria(item: any): string {
  // Aquí la “categoría” (Personal/Laboral/Servicio Médico/Atención Psicológica)
  // normalmente vive en tipo_permiso.
  const t = (item?.tipo_permiso || "").trim();
  return t ? t : "Permiso";
}

export default function PermisosListaScreen({ navigation }: any) {
  const [permisos, setPermisos] = useState<Permiso[]>([]);
  const [page, setPage] = useState(1);
  const [cargando, setCargando] = useState(false);
  const [hayMas, setHayMas] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    cargarPermisos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function cargarPermisos() {
    if (cargando || !hayMas) return;

    setCargando(true);
    setError(null);

    try {
      const res = await listarPermisos(page);

      const nuevos = res?.data ?? [];
      const hasMore = !!res?.meta?.has_more;

      // Deduplicar por id_es por si llega repetido
      setPermisos((prev) => {
        const mapa = new Map<any, any>();
        [...prev, ...nuevos].forEach((p: any) => mapa.set(p.id_es, p));
        return Array.from(mapa.values());
      });

      setHayMas(hasMore);
      setPage((p) => p + 1);
    } catch (e: any) {
      setError(e?.response?.data?.message || "No se pudieron cargar permisos");
      setHayMas(false);
    } finally {
      setCargando(false);
    }
  }

  return (
    <View style={{ flex: 1 }}>
      {error ? (
        <Text
          style={{ color: "#a10606", paddingHorizontal: 16, paddingTop: 10 }}
        >
          {error}
        </Text>
      ) : null}

      <FlatList
        data={permisos}
        keyExtractor={(item: any) => String(item.id_es)}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        onEndReached={cargarPermisos}
        onEndReachedThreshold={0.4}
        ListFooterComponent={
          cargando ? <ActivityIndicator style={{ marginVertical: 16 }} /> : null
        }
        renderItem={({ item }: any) => {
          const movimiento = inferirMovimiento(item);
          const fechas = textoFechas(item);
          const categoria = tituloCategoria(item);

          return (
            <View
              style={{
                padding: 14,
                borderRadius: 12,
                backgroundColor: "white",
                marginBottom: 10,
                borderWidth: 1,
                borderColor: "#eee",
              }}
            >
              {/* Header: categoría + estatus */}
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    fontWeight: "700",
                    fontSize: 16,
                    flex: 1,
                    paddingRight: 10,
                  }}
                >
                  {categoria}
                </Text>

                <EstadoBadge estado={item.estatus} />
              </View>

              {/* Sub: movimiento */}
              <View style={{ marginTop: 8 }}>
                <MovimientoBadge movimiento={movimiento} />
              </View>

              {/* Observaciones */}
              {!!item?.observaciones && (
                <Text style={{ color: "#555", marginTop: 8 }}>
                  {item.observaciones}
                </Text>
              )}

              {/* Fechas correctas según movimiento */}
              <Text style={{ fontSize: 12, color: "#0e0e0eff", marginTop: 8 }}>
                {fechas}
              </Text>

              <Text style={{ fontSize: 12, color: "#999", marginTop: 6 }}>
                ID: {item.id_es}
              </Text>
            </View>
          );
        }}
      />

      {/* Botón flotante */}
      <TouchableOpacity
        onPress={() => navigation.navigate("PermisoCrear")}
        style={{
          position: "absolute",
          bottom: 20,
          right: 20,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: "#a10606",
          alignItems: "center",
          justifyContent: "center",
          elevation: 6,
        }}
      >
        <Ionicons name="add" size={28} color="white" />
      </TouchableOpacity>
    </View>
  );
}
