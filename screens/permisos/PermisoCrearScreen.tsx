import { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Platform,
  ScrollView,
  KeyboardAvoidingView,
  ActivityIndicator,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import { clienteApi } from "../../api/cliente";
import { useAuth } from "../../store/useAuth";
import { meApi } from "../../api/auth";
import { listarTiposPermiso, listarTurnos } from "../../api/catalogos";

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
  return res.join(", ");
}
function dmy(d: Date) {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = d.getFullYear();
  return `${dd}/${mm}/${yy}`;
}

export default function PermisoCrearScreen({ navigation }: any) {
  const { usuario } = useAuth();

  function extraerTypeEmploye(origen: any): number {
    const n = Number(
      origen?.typeEmploye ??
        origen?.type_employe ??
        origen?.type_employee ??
        origen?.type_of_employee ??
        0,
    );
    return Number.isFinite(n) && n > 0 ? n : 0;
  }

  const scrollRef = useRef<ScrollView>(null);

  // =========================
  // 1) TIPOS (API)
  // =========================
  type TipoPermiso = number;
  const [tipos, setTipos] = useState<{ id: TipoPermiso; nombre: string }[]>([]);
  const [cargandoTipos, setCargandoTipos] = useState(true);
  const [errorTipos, setErrorTipos] = useState<string | null>(null);
  const [tipoPermiso, setTipoPermiso] = useState<TipoPermiso>(0);

  useEffect(() => {
    const controller = new AbortController();

    (async () => {
      try {
        setCargandoTipos(true);
        setErrorTipos(null);

       const lista = await listarTurnos(typeEmploye, controller.signal);

        const normalizada = lista.map((t) => ({
          id: t.id as TipoPermiso,
          nombre: t.nombre,
        }));

        setTipos(normalizada);

        if (normalizada.length > 0) {
          setTipoPermiso((prev) => (prev ? prev : normalizada[0].id));
        }
      } catch (_e: any) {
        setErrorTipos("No se pudo cargar el catálogo de tipos");
        setTipos([]);
      } finally {
        setCargandoTipos(false);
      }
    })();

    return () => controller.abort();
  }, []);

  // =========================
  // 2) PERFIL (/me) -> typeEmploye
  // =========================
  const [typeEmploye, setTypeEmploye] = useState<number>(
    extraerTypeEmploye(usuario),
  );
  const [cargandoMe, setCargandoMe] = useState<boolean>(false);
  const [errorMe, setErrorMe] = useState<string | null>(null);

  useEffect(() => {
    // Si ya viene del store, úsalo
    const desdeStore = extraerTypeEmploye(usuario);
    if (desdeStore) {
      setTypeEmploye(desdeStore);
      setErrorMe(null);
      return;
    }

    const controller = new AbortController();

    (async () => {
      try {
        setCargandoMe(true);
        setErrorMe(null);

        const res = await meApi();
        // backend puede responder {usuario: {...}} o {data: {...}}
        const perfil = (res as any)?.usuario ?? (res as any)?.data ?? res;
        const desdeMe = extraerTypeEmploye(perfil);

        if (!desdeMe) {
          setTypeEmploye(0);
          setErrorMe("No se pudo determinar el tipo de empleado desde /me.");
          return;
        }

        setTypeEmploye(desdeMe);
      } catch (e: any) {
        setTypeEmploye(0);
        setErrorMe(e?.response?.data?.message || "No se pudo cargar /me");
      } finally {
        setCargandoMe(false);
      }
    })();

    return () => controller.abort();
  }, [usuario]);

  // =========================
  // 3) TURNOS (API)
  // =========================

  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [cargandoTurnos, setCargandoTurnos] = useState(false);
  const [errorTurnos, setErrorTurnos] = useState<string | null>(null);

  const [turnoId, setTurnoId] = useState<number>(0);

  useEffect(() => {
    if (!typeEmploye) {
      setTurnos([]);
      setTurnoId(0);
      setCargandoTurnos(false);
      setErrorTurnos("No se pudo determinar el tipo de empleado.");
      return;
    }

    const controller = new AbortController();

    (async () => {
      try {
        setCargandoTurnos(true);
        setErrorTurnos(null);

        const lista = await listarTurnos(typeEmploye, controller.signal);

        setTurnos(lista as Turno[]);
        console.log("typeEmploye =>", typeEmploye);

        setTurnoId(0);
      } catch (_e: any) {
        setErrorTurnos("No se pudo cargar el catálogo de turnos");
        setTurnos([]);
      } finally {
        setCargandoTurnos(false);
      }
    })();

    return () => controller.abort();
  }, [typeEmploye]);

  // =========================
  // FORM
  // =========================
  const [movimiento, setMovimiento] = useState<Movimiento>("SALIDA");
  const [goceSueldo, setGoceSueldo] = useState<"SI" | "NO">("SI");
  const [observaciones, setObservaciones] = useState("");

  const [fechaEntrada, setFechaEntrada] = useState(new Date());
  const [horaEntrada, setHoraEntrada] = useState(new Date());
  const [fechaSalida, setFechaSalida] = useState(new Date());
  const [horaSalida, setHoraSalida] = useState(new Date());

  const [inasDel, setInasDel] = useState(new Date());
  const [inasAl, setInasAl] = useState(new Date());

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
    if (!tipoPermiso) return "Selecciona el tipo de permiso.";
    if (!turnoId) return "Selecciona el turno.";

    const obs = observaciones.trim();
    if (!obs) return "Agrega observaciones (motivo).";

    if (tipoPermiso === 1 && obs.length < 30) {
      return "En LABORAL, el motivo debe ser más descriptivo (mínimo 30 caracteres).";
    }

    if (movimiento === "INASISTENCIA") {
      if (!inasDel || !inasAl) return "Selecciona Del y Al.";
      if (inasAl < inasDel)
        return "La fecha 'Al' no puede ser menor que 'Del'.";
      return null;
    }

    return null;
  }

  const enviar = useCallback(async () => {
    const msg = validar();
    if (msg) {
      setError(msg);
      return;
    }

    setCargando(true);
    setError(null);

    try {
      const payload: any = {
        tipo_permiso: tipoPermiso,
        turno: turnoId,
        goce_sueldo: goceSueldo,
        permiso_observaciones: observaciones.trim(),
      };

      if (movimiento === "INASISTENCIA") {
        payload.permiso_inasistencia = rangoFechasYmd(inasDel, inasAl);
        payload.permiso_autoriza_entrada = "";
        payload.permiso_dia_entrada = "";
        payload.permiso_autoriza_salida = "";
        payload.permiso_dia_salida = "";
      }

      if (movimiento === "ENTRADA") {
        payload.permiso_autoriza_entrada = hi(horaEntrada);
        payload.permiso_dia_entrada = dmy(fechaEntrada);
      }

      if (movimiento === "SALIDA") {
        payload.permiso_autoriza_salida = hi(horaSalida);
        payload.permiso_dia_salida = dmy(fechaSalida);
      }

      if (movimiento === "ENTRADA_SALIDA") {
        payload.permiso_autoriza_entrada = hi(horaEntrada);
        payload.permiso_dia_entrada = dmy(fechaEntrada);
        payload.permiso_autoriza_salida = hi(horaSalida);
        payload.permiso_dia_salida = dmy(fechaSalida);
      }

      await clienteApi.post("/permisos", payload);

      navigation.goBack();
    } catch (e: any) {
      setError(e?.response?.data?.message || "No se pudo crear el permiso");
    } finally {
      setCargando(false);
    }
  }, [
    tipoPermiso,
    turnoId,
    goceSueldo,
    observaciones,
    movimiento,
    inasDel,
    inasAl,
    horaEntrada,
    fechaEntrada,
    horaSalida,
    fechaSalida,
    navigation,
  ]);

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

  const puedeCrear =
    !cargando &&
    !cargandoMe &&
    !cargandoTipos &&
    tipos.length > 0 &&
    !cargandoTurnos &&
    turnos.length > 0;

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

        {cargandoTipos ? (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              marginBottom: 12,
            }}
          >
            <ActivityIndicator />
            <Text style={{ color: "#6B7280" }}>Cargando tipos de permiso…</Text>
          </View>
        ) : errorTipos ? (
          <Text style={{ color: "#a10606", marginBottom: 12 }}>
            {errorTipos}
          </Text>
        ) : null}

        <View
          style={{
            borderWidth: 1,
            borderRadius: 10,
            marginBottom: 12,
            opacity: cargandoTipos || tipos.length === 0 ? 0.6 : 1,
          }}
        >
          <Picker
            enabled={!cargandoTipos && tipos.length > 0}
            selectedValue={tipoPermiso}
            onValueChange={(v) => setTipoPermiso(Number(v) as TipoPermiso)}
          >
            <Picker.Item label="Selecciona..." value={0} />
            {tipos.map((t) => (
              <Picker.Item key={t.id} label={t.nombre} value={t.id} />
            ))}
          </Picker>
        </View>

        {/* Turno */}
        <Text style={{ fontWeight: "700", marginBottom: 6 }}>Turno</Text>

        {cargandoMe ? (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              marginBottom: 12,
            }}
          >
            <ActivityIndicator />
            <Text style={{ color: "#6B7280" }}>Cargando perfil…</Text>
          </View>
        ) : errorMe ? (
          <Text style={{ color: "#a10606", marginBottom: 12 }}>{errorMe}</Text>
        ) : null}

        {cargandoTurnos ? (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              marginBottom: 12,
            }}
          >
            <ActivityIndicator />
            <Text style={{ color: "#6B7280" }}>Cargando turnos…</Text>
          </View>
        ) : errorTurnos ? (
          <Text style={{ color: "#a10606", marginBottom: 12 }}>
            {errorTurnos}
          </Text>
        ) : null}

        <View
          style={{
            borderWidth: 1,
            borderColor: "#ddd",
            borderRadius: 10,
            marginBottom: 12,
            opacity: cargandoTurnos || turnos.length === 0 ? 0.6 : 1,
          }}
        >
          <Picker
            enabled={!cargandoTurnos && turnos.length > 0}
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
              250,
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
          disabled={!puedeCrear}
          onPress={enviar}
          style={{
            marginTop: 16,
            padding: 14,
            borderRadius: 10,
            alignItems: "center",
            backgroundColor: "#a10606",
            opacity: !puedeCrear ? 0.6 : 1,
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
