import { View, Text, TouchableOpacity } from "react-native";
import { useAuth } from "../store/useAuth";

export default function HomeScreen() {
  const { usuario, cerrarSesion } = useAuth();

  return (
    <View style={{ flex: 1, padding: 24 }}>
      <Text style={{ fontSize: 18, fontWeight: "700" }}>Bienvenido</Text>
      <Text style={{ marginTop: 8 }}>
        {usuario?.nombre ?? usuario?.email ?? "Usuario"}
      </Text>

      <TouchableOpacity
        onPress={() => void cerrarSesion()}
        style={{
          marginTop: 24,
          padding: 14,
          borderRadius: 10,
          borderWidth: 1,
          alignItems: "center",
        }}
      >
        <Text style={{ fontWeight: "700" }}>Cerrar sesión</Text>
      </TouchableOpacity>
    </View>
  );
}
