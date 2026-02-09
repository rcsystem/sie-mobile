import { useState } from "react";
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useAuth } from "../store/useAuth";

export default function LoginScreen() {
  const { iniciarSesion, cargando, error } = useAuth();
  const [identificador, setIdentificador] = useState("");
  const [contrasena, setContrasena] = useState("");

  const entrar = async () => {
    await iniciarSesion(identificador.trim(), contrasena);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#f4f6f9" }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ flex: 1, padding: 24, justifyContent: "center" }}>
          <Image
            source={require("../../assets/icon-inval.png")}
            style={{
              width: 120,
              height: 120,
              resizeMode: "contain",
              alignSelf: "center",
              marginBottom: 24,
            }}
          />
          <Text
            style={{
              fontSize: 26,
              fontWeight: "700",
              marginBottom: 24,
              color: "#a30404ff",
              textAlign: "center",
            }}
          >
            Walworth
          </Text>

          <Text style={{ marginBottom: 6, color: "#000" }}>
            Correo o Nómina
          </Text>
          <TextInput
            value={identificador}
            onChangeText={setIdentificador}
            autoCapitalize="none"
            style={{
              borderWidth: 1,
              borderRadius: 8,
              padding: 12,
              marginBottom: 14,
              backgroundColor: "white",
            }}
          />

          <Text style={{ marginBottom: 6 }}>Contraseña</Text>
          <TextInput
            value={contrasena}
            onChangeText={setContrasena}
            secureTextEntry
            style={{
              borderWidth: 1,
              borderRadius: 8,
              padding: 12,
              marginBottom: 14,
              backgroundColor: "white",
            }}
          />

          {error ? <Text style={{ marginBottom: 12 }}>{error}</Text> : null}

          <TouchableOpacity
            disabled={cargando}
            onPress={entrar}
            style={{
              padding: 14,
              borderRadius: 6,
              borderWidth: 0,
              alignItems: "center",
              backgroundColor: cargando ? "#a10606ff" : "#a10606ff",
            }}
          >
            <Text
              style={{
                fontWeight: "700",
                fontSize: 14,
                color: cargando ? "black" : "white",
              }}
            >
              {cargando ? "Entrando..." : "Iniciar Sesión"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
