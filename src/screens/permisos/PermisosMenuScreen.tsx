import { View, Text, TouchableOpacity } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { PermisoStackParamList } from "../../navigation/PermisoTrabajoStack";

type Props = NativeStackScreenProps<PermisoStackParamList, "PermisosMenu">;

export default function PermisosMenuScreen({ navigation }: Props) {
  return (
    <View style={{ flex: 1, padding: 24, gap: 12 }}>
      <Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 8 }}>
        ¿Qué deseas hacer?
      </Text>

      <TouchableOpacity
        onPress={() => navigation.navigate("PermisoCrear")}
        style={{
          padding: 16,
          borderRadius: 10,
          backgroundColor: "#a10606",
          alignItems: "center",
        }}
      >
        <Text style={{ color: "white", fontWeight: "700" }}>Crear Permiso</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => navigation.navigate("PermisosLista")}
        style={{
          padding: 16,
          borderRadius: 10,
          borderWidth: 1,
          alignItems: "center",
        }}
      >
        <Text style={{ fontWeight: "700" }}>Ver Permisos Generados</Text>
      </TouchableOpacity>
    </View>
  );
}
