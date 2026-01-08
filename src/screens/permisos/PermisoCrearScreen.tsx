import { useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Platform,
  ScrollView,
  KeyboardAvoidingView,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import { clienteApi } from "../../api/cliente";

type TipoPermiso = 1 | 2 | 4 | 6 | 7 | 8;

type Movimiento = "ENTRADA" | "SALIDA" | "ENTRADA_SALIDA" | "INASISTENCIA";

type Turno = { id: number; nombre: string };

// ---- helpers ----
function ymd(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function hi(d: Date) {
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${h}:${m}:00`;
}
function rangoFechasYmd(del: Date, al: Date) {
  const res: string[] = [];
  const cur = new Date(del);
  cur.setHours(0, 0, 0, 0);
  const end = new Date(al);
  end.setHours(0, 0, 0, 0);

  while (cur <= end) {
    res.push(ymd(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return res.join(", "); // <- igual que web (explode(', '))
}

export default function PermisoCrearScreen({ navigation }: any) {
  const scrollRef = useRef<ScrollView>(null);

  // Catálogo de tipos (igual que backend)
  const tipos = useMemo(
    () => [
      { id: 1 as TipoPermiso, nombre: "LABORAL" },
      { id: 2 as TipoPermiso, nombre: "PERSONAL" },
      { id: 4 as TipoPermiso, nombre: "DÍA ESPECIAL" }, // el backend real pone el motive del día
      { id: 6 as TipoPermiso, nombre: "POR TRAFICO" },
      { id: 7 as TipoPermiso, nombre: "DIA DE LA MUJER" },
      { id: 8 as TipoPermiso, nombre: "ATENCIÓN PSICOLÓGICA" },
    ],
    []
  );

  // Turnos (ideal: traerlos de API /api/turnos)
  const turnos: Turno[] = useMemo(
    () => [
      { id: 1, nombre: "Turno 1" },
      { id: 2, nombre: "Turno 2" },
      { id: 3, nombre: "Turno 3" },
    ],
    []
  );

  const [tipoPermiso, setTipoPermiso] = useState<TipoPermiso>(2);
  const [turnoId, setTurnoId] = useState<number>(0);

  const [movimiento, setMovimiento] = useState<Movimiento>("SALIDA");
  const [goceSueldo, setGoceSueldo] = useState<"SI" | "NO">("SI");
  const [observaciones, setObservaciones] = useState("");

  // Entrada/Salida
  const [fechaEntrada, setFechaEntrada] = useState(new Date());
  const [horaEntrada, setHoraEntrada] = useState(new Date());
  const [fechaSalida, setFechaSalida] = useState(new Date());
  const [horaSalida, setHoraSalida] = useState(new Date());

  // Inasistencia (Del/Al -> genera lista)
  const [inasDel, setInasDel] = useState(new Date());
  const [inasAl, setInasAl] = useState(new Date());

  // Picker
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
    if (!turnoId) return "Selecciona el turno.";

    const obs = observaciones.trim();
    if (!obs) return "Agrega observaciones (motivo).";

    // En web: laboral exige más detalle
    if (tipoPermiso === 1 && obs.length < 30) {
      return "En LABORAL, el motivo debe ser más descriptivo (mínimo 30 caracteres).";
    }

    // Movimiento
    if (movimiento === "INASISTENCIA") {
      if (!inasDel || !inasAl) return "Selecciona Del y Al.";
      if (inasAl < inasDel)
        return "La fecha 'Al' no puede ser menor que 'Del'.";
      return null;
    }

    if (movimiento === "ENTRADA") return null;
    if (movimiento === "SALIDA") return null;

    if (movimiento === "ENTRADA_SALIDA") {
      // opcional: validar que entrada/salida tengan coherencia de día/hora
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
      // Payload estilo "web" (lo que tu backend generateNew lee)
      const payload: any = {
        tipo_permiso: tipoPermiso,
        turno: turnoId,
        goce_sueldo: goceSueldo,
        permiso_observaciones: observaciones.trim(),
      };

      // Movimiento -> campos
      if (movimiento === "INASISTENCIA") {
        payload.permiso_inasistencia = rangoFechasYmd(inasDel, inasAl);
        payload.permiso_autoriza_entrada = "";
        payload.permiso_dia_entrada = "";
        payload.permiso_autoriza_salida = "";
        payload.permiso_dia_salida = "";
      }

      if (movimiento === "ENTRADA") {
        payload.permiso_autoriza_entrada = hi(horaEntrada);
        payload.permiso_dia_entrada = (() => {
          // backend espera d/m/Y en web. Si tu API ya lo cambió a Y-m-d, dime y lo ajusto.
          const d = fechaEntrada;
          const dd = String(d.getDate()).padStart(2, "0");
          const mm = String(d.getMonth() + 1).padStart(2, "0");
          const yy = d.getFullYear();
          return `${dd}/${mm}/${yy}`;
        })();
      }

      if (movimiento === "SALIDA") {
        payload.permiso_autoriza_salida = hi(horaSalida);
        payload.permiso_dia_salida = (() => {
          const d = fechaSalida;
          const dd = String(d.getDate()).padStart(2, "0");
          const mm = String(d.getMonth() + 1).padStart(2, "0");
          const yy = d.getFullYear();
          return `${dd}/${mm}/${yy}`;
        })();
      }

      if (movimiento === "ENTRADA_SALIDA") {
        payload.permiso_autoriza_entrada = hi(horaEntrada);
        payload.permiso_dia_entrada = (() => {
          const d = fechaEntrada;
          const dd = String(d.getDate()).padStart(2, "0");
          const mm = String(d.getMonth() + 1).padStart(2, "0");
          const yy = d.getFullYear();
          return `${dd}/${mm}/${yy}`;
        })();

        payload.permiso_autoriza_salida = hi(horaSalida);
        payload.permiso_dia_salida = (() => {
          const d = fechaSalida;
          const dd = String(d.getDate()).padStart(2, "0");
          const mm = String(d.getMonth() + 1).padStart(2, "0");
          const yy = d.getFullYear();
          return `${dd}/${mm}/${yy}`;
        })();
      }

      await clienteApi.post("/api/permisos", payload);

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

  const onChangePicker = (_event: any, selected?: Date) => {
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
        setInasDel(selected);
        break;
      case "inasAl":
        setInasAl(selected);
        break;
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <ScrollView
        ref={scrollRef}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
      >
        <Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 12 }}>
          Crear Permiso
        </Text>

        {/* Tipo permiso */}
        <Text style={{ fontWeight: "700", marginBottom: 6 }}>
          Tipo de permiso
        </Text>
        <View
          style={{
            borderWidth: 1,
            borderColor: "#ddd",
            borderRadius: 10,
            marginBottom: 12,
          }}
        >
          <Picker
            selectedValue={tipoPermiso}
            onValueChange={(v) => setTipoPermiso(Number(v) as TipoPermiso)}
          >
            {tipos.map((t) => (
              <Picker.Item key={t.id} label={t.nombre} value={t.id} />
            ))}
          </Picker>
        </View>

        {/* Turno */}
        <Text style={{ fontWeight: "700", marginBottom: 6 }}>Turno</Text>
        <View
          style={{
            borderWidth: 1,
            borderColor: "#ddd",
            borderRadius: 10,
            marginBottom: 12,
          }}
        >
          <Picker
            selectedValue={turnoId}
            onValueChange={(v) => setTurnoId(Number(v))}
          >
            <Picker.Item label="Selecciona..." value={0} />
            {turnos.map((t) => (
              <Picker.Item key={t.id} label={t.nombre} value={t.id} />
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

        {/* Goce sueldo */}
        <Text style={{ fontWeight: "700", marginBottom: 6 }}>
          Goce de sueldo
        </Text>
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
            <Picker.Item label="SI" value="SI" />
            <Picker.Item label="NO" value="NO" />
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
              <Text>Del: {ymd(inasDel)}</Text>
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
              <Text>Al: {ymd(inasAl)}</Text>
            </TouchableOpacity>

            <Text style={{ color: "#6B7280", fontSize: 12 }}>
              Se enviará como lista: {rangoFechasYmd(inasDel, inasAl)}
            </Text>
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
                  <Text>Fecha entrada: {ymd(fechaEntrada)}</Text>
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
                  <Text>Hora entrada: {hi(horaEntrada)}</Text>
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
                  <Text>Fecha salida: {ymd(fechaSalida)}</Text>
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
                  <Text>Hora salida: {hi(horaSalida)}</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}

        {/* Observaciones */}
        <Text style={{ fontWeight: "700", marginBottom: 6 }}>
          Motivo / Observaciones
        </Text>
        <TextInput
          value={observaciones}
          onChangeText={setObservaciones}
          multiline
          placeholder="Describe el motivo…"
          onFocus={() =>
            setTimeout(
              () => scrollRef.current?.scrollToEnd({ animated: true }),
              250
            )
          }
          style={{
            borderWidth: 1,
            borderColor: "#ddd",
            borderRadius: 10,
            padding: 12,
            minHeight: 120,
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
                ? inasDel
                : inasAl
            }
            mode={picker.mode}
            is24Hour
            display="default"
            onChange={onChangePicker}
          />
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
