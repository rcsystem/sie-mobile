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
import { listarPermisos, Permiso } from "../../api/permisos";

export default function PermisosListaScreen({ navigation }: any) {
  const [permisos, setPermisos] = useState<Permiso[]>([]);
  const [page, setPage] = useState(1);
  const [cargando, setCargando] = useState(false);
  const [hayMas, setHayMas] = useState(true);

  useEffect(() => {
    cargarPermisos();
  }, []);

  async function cargarPermisos() {
    if (cargando || !hayMas) return;

    setCargando(true);

    try {
      const res = await listarPermisos(page);

      setPermisos((prev) => [...prev, ...res.data]);
      setHayMas(res.meta.has_more);
      setPage((p) => p + 1);
    } finally {
      setCargando(false);
    }
  }

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={permisos}
        keyExtractor={(item) => String(item.id_es)}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        onEndReached={cargarPermisos}
        onEndReachedThreshold={0.4}
        ListFooterComponent={
          cargando ? <ActivityIndicator style={{ marginVertical: 16 }} /> : null
        }
        renderItem={({ item }) => (
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
            <Text style={{ fontWeight: "700" }}>{item.id_es}</Text>
            <Text>Permiso: {item.tipo_permiso}</Text>
            <EstadoBadge estado={item.estatus} />
            <Text>
              {item.fecha_entrada} → {item.fecha_salida}
            </Text>
          </View>
        )}
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
