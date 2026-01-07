import { useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Platform,
  ScrollView,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import { clienteApi } from "../../api/cliente";

type Movimiento = "ENTRADA" | "SALIDA" | "ENTRADA_SALIDA" | "INASISTENCIA";

type CategoriaPermiso = {
  id: number;
  nombre: string;
};

function formatearFechaYmd(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatearHoraHi(d: Date) {
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${h}:${m}:00`;
}

export default function PermisoCrearScreen({ navigation }: any) {
  // ✅ Catálogo (idealmente vendrá de API, por ahora ejemplo)
  const categorias: CategoriaPermiso[] = useMemo(
    () => [
      { id: 2, nombre: "PERSONAL" },
      { id: 1, nombre: "LABORAL" },
    ],
    []
  );

  const [categoriaId, setCategoriaId] = useState<number>(
    categorias[0]?.id ?? 1
  );
  const categoriaNombre = useMemo(
    () => categorias.find((c) => c.id === categoriaId)?.nombre ?? "PERSONAL",
    [categorias, categoriaId]
  );

  const [movimiento, setMovimiento] = useState<Movimiento>("SALIDA");
  const [goceSueldo, setGoceSueldo] = useState<"SI" | "NO">("NO");
  const [observaciones, setObservaciones] = useState("");

  // Campos para Entrada/Salida
  const [fechaEntrada, setFechaEntrada] = useState<Date>(new Date());
  const [horaEntrada, setHoraEntrada] = useState<Date>(new Date());
  const [fechaSalida, setFechaSalida] = useState<Date>(new Date());
  const [horaSalida, setHoraSalida] = useState<Date>(new Date());

  // Campos para Inasistencia
  const [inasistenciaDel, setInasistenciaDel] = useState<Date>(new Date());
  const [inasistenciaAl, setInasistenciaAl] = useState<Date>(new Date());

  // Pickers visibles
  const [picker, setPicker] = useState<{
    tipo:
      | "fechaEntrada"
      | "horaEntrada"
      | "fechaSalida"
      | "horaSalida"
      | "inasDel"
      | "inasAl"
      | null;
    mode?: "date" | "time";
  }>({ tipo: null });

  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function validar(): string | null {
    if (!observaciones.trim()) return "Agrega observaciones (motivo).";

    if (movimiento === "INASISTENCIA") {
      if (!inasistenciaDel || !inasistenciaAl) return "Selecciona Del y Al.";
      if (inasistenciaAl < inasistenciaDel)
        return "La fecha 'Al' no puede ser menor que 'Del'.";
      return null;
    }

    if (movimiento === "ENTRADA") {
      if (!fechaEntrada || !horaEntrada)
        return "Selecciona fecha y hora de entrada.";
      return null;
    }

    if (movimiento === "SALIDA") {
      if (!fechaSalida || !horaSalida)
        return "Selecciona fecha y hora de salida.";
      return null;
    }

    if (movimiento === "ENTRADA_SALIDA") {
      if (!fechaEntrada || !horaEntrada || !fechaSalida || !horaSalida)
        return "Selecciona fecha/hora de entrada y salida.";
      return null;
    }

    return null;
  }

  async function enviar() {
    const msg = validar();
    if (msg) {
      setError(msg);
      return;
    }

    setCargando(true);
    setError(null);

    try {
      // ✅ Payload alineado a tu tabla SQL
      const payload: any = {
        id_tipo_permiso: categoriaId,
        tipo_permiso: categoriaNombre,
        goce_sueldo: goceSueldo,
        observaciones: observaciones.trim(),
      };

      if (movimiento === "INASISTENCIA") {
        payload.inasistencia_del = formatearFechaYmd(inasistenciaDel);
        payload.inasistencia_al = formatearFechaYmd(inasistenciaAl);
      }

      if (movimiento === "ENTRADA") {
        payload.fecha_entrada = formatearFechaYmd(fechaEntrada);
        payload.hora_entrada = formatearHoraHi(horaEntrada);
      }

      if (movimiento === "SALIDA") {
        payload.fecha_salida = formatearFechaYmd(fechaSalida);
        payload.hora_salida = formatearHoraHi(horaSalida);
      }

      if (movimiento === "ENTRADA_SALIDA") {
        payload.fecha_entrada = formatearFechaYmd(fechaEntrada);
        payload.hora_entrada = formatearHoraHi(horaEntrada);
        payload.fecha_salida = formatearFechaYmd(fechaSalida);
        payload.hora_salida = formatearHoraHi(horaSalida);
      }

      // POST a tu endpoint protegido
      await clienteApi.post("/permisos", payload);

      // ✅ regresa al listado y refresca (si manejas refresh al volver)
      navigation.goBack();
    } catch (e: any) {
      setError(e?.response?.data?.message || "No se pudo crear el permiso");
    } finally {
      setCargando(false);
    }
  }

  const mostrarPicker = (tipo: any, mode: "date" | "time") =>
    setPicker({ tipo, mode });
  const cerrarPicker = () => setPicker({ tipo: null });

  const onChangePicker = (event: any, selected?: Date) => {
    if (Platform.OS !== "ios") cerrarPicker();
    if (!selected) return;

    switch (picker.tipo) {
      case "fechaEntrada":
        setFechaEntrada(selected);
        break;
      case "horaEntrada":
        setHoraEntrada(selected);
        break;
      case "fechaSalida":
        setFechaSalida(selected);
        break;
      case "horaSalida":
        setHoraSalida(selected);
        break;
      case "inasDel":
        setInasistenciaDel(selected);
        break;
      case "inasAl":
        setInasistenciaAl(selected);
        break;
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 12 }}>
        Crear Permiso
      </Text>

      {/* Categoría */}
      <Text style={{ fontWeight: "700", marginBottom: 6 }}>Categoría</Text>
      <View
        style={{
          borderWidth: 1,
          borderColor: "#ddd",
          borderRadius: 10,
          marginBottom: 12,
        }}
      >
        <Picker
          selectedValue={categoriaId}
          onValueChange={(v) => setCategoriaId(Number(v))}
        >
          {categorias.map((c) => (
            <Picker.Item key={c.id} label={c.nombre} value={c.id} />
          ))}
        </Picker>
      </View>

      {/* Movimiento */}
      <Text style={{ fontWeight: "700", marginBottom: 6 }}>Movimiento</Text>
      <View
        style={{
          borderWidth: 1,
          borderColor: "#ddd",
          borderRadius: 10,
          marginBottom: 12,
        }}
      >
        <Picker
          selectedValue={movimiento}
          onValueChange={(v) => setMovimiento(v)}
        >
          <Picker.Item label="Entrada" value="ENTRADA" />
          <Picker.Item label="Salida" value="SALIDA" />
          <Picker.Item label="Entrada → Salida" value="ENTRADA_SALIDA" />
          <Picker.Item label="Inasistencia (Del → Al)" value="INASISTENCIA" />
        </Picker>
      </View>

      {/* Goce de sueldo */}
      <Text style={{ fontWeight: "700", marginBottom: 6 }}>Goce de sueldo</Text>
      <View
        style={{
          borderWidth: 1,
          borderColor: "#ddd",
          borderRadius: 10,
          marginBottom: 12,
        }}
      >
        <Picker
          selectedValue={goceSueldo}
          onValueChange={(v) => setGoceSueldo(v)}
        >
          <Picker.Item label="NO" value="NO" />
          <Picker.Item label="SI" value="SI" />
        </Picker>
      </View>

      {/* Campos dinámicos */}
      {movimiento === "INASISTENCIA" ? (
        <View style={{ gap: 10, marginBottom: 12 }}>
          <Text style={{ fontWeight: "700" }}>Rango de inasistencia</Text>

          <TouchableOpacity
            onPress={() => mostrarPicker("inasDel", "date")}
            style={{
              padding: 14,
              borderWidth: 1,
              borderColor: "#ddd",
              borderRadius: 10,
            }}
          >
            <Text>Del: {formatearFechaYmd(inasistenciaDel)}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => mostrarPicker("inasAl", "date")}
            style={{
              padding: 14,
              borderWidth: 1,
              borderColor: "#ddd",
              borderRadius: 10,
            }}
          >
            <Text>Al: {formatearFechaYmd(inasistenciaAl)}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={{ gap: 10, marginBottom: 12 }}>
          {(movimiento === "ENTRADA" || movimiento === "ENTRADA_SALIDA") && (
            <>
              <Text style={{ fontWeight: "700" }}>Entrada</Text>
              <TouchableOpacity
                onPress={() => mostrarPicker("fechaEntrada", "date")}
                style={{
                  padding: 14,
                  borderWidth: 1,
                  borderColor: "#ddd",
                  borderRadius: 10,
                }}
              >
                <Text>Fecha entrada: {formatearFechaYmd(fechaEntrada)}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => mostrarPicker("horaEntrada", "time")}
                style={{
                  padding: 14,
                  borderWidth: 1,
                  borderColor: "#ddd",
                  borderRadius: 10,
                }}
              >
                <Text>Hora entrada: {formatearHoraHi(horaEntrada)}</Text>
              </TouchableOpacity>
            </>
          )}

          {(movimiento === "SALIDA" || movimiento === "ENTRADA_SALIDA") && (
            <>
              <Text style={{ fontWeight: "700" }}>Salida</Text>
              <TouchableOpacity
                onPress={() => mostrarPicker("fechaSalida", "date")}
                style={{
                  padding: 14,
                  borderWidth: 1,
                  borderColor: "#ddd",
                  borderRadius: 10,
                }}
              >
                <Text>Fecha salida: {formatearFechaYmd(fechaSalida)}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => mostrarPicker("horaSalida", "time")}
                style={{
                  padding: 14,
                  borderWidth: 1,
                  borderColor: "#ddd",
                  borderRadius: 10,
                }}
              >
                <Text>Hora salida: {formatearHoraHi(horaSalida)}</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}

      {/* Observaciones */}
      <Text style={{ fontWeight: "700", marginBottom: 6 }}>Observaciones</Text>
      <TextInput
        value={observaciones}
        onChangeText={setObservaciones}
        multiline
        placeholder="Describe el motivo…"
        style={{
          borderWidth: 1,
          borderColor: "#ddd",
          borderRadius: 10,
          padding: 12,
          minHeight: 90,
          textAlignVertical: "top",
        }}
      />

      {error ? (
        <Text style={{ color: "#a10606", marginTop: 10 }}>{error}</Text>
      ) : null}

      <TouchableOpacity
        disabled={cargando}
        onPress={enviar}
        style={{
          marginTop: 16,
          padding: 14,
          borderRadius: 10,
          alignItems: "center",
          backgroundColor: "#a10606",
          opacity: cargando ? 0.7 : 1,
        }}
      >
        <Text style={{ color: "white", fontWeight: "700" }}>
          {cargando ? "Guardando..." : "Crear Permiso"}
        </Text>
      </TouchableOpacity>

      {/* DateTimePicker */}
      {picker.tipo && (
        <DateTimePicker
          value={
            picker.tipo === "fechaEntrada"
              ? fechaEntrada
              : picker.tipo === "horaEntrada"
              ? horaEntrada
              : picker.tipo === "fechaSalida"
              ? fechaSalida
              : picker.tipo === "horaSalida"
              ? horaSalida
              : picker.tipo === "inasDel"
              ? inasistenciaDel
              : inasistenciaAl
          }
          mode={picker.mode}
          is24Hour
          display="default"
          onChange={onChangePicker}
        />
      )}
    </ScrollView>
  );
}
