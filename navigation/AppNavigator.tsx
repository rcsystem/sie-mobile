import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";

import LoginScreen from "../screens/LoginScreen";
import MainTabs from "./MainTabs";
import PermisoCrearScreen from "../screens/permisos/PermisoCrearScreen";

import { useAuth } from "../store/useAuth";
import { useEffect } from "react";
import { ActivityIndicator, View, Text } from "react-native";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { usuario, cargarSesion, cargando } = useAuth();

  useEffect(() => {
    void cargarSesion();
  }, []);

  if (cargando) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" />
        <Text>Cargando sesión...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style="light" backgroundColor="#a10606" />

      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: "#a10606" },
          headerTintColor: "#fff",
          headerTitleStyle: { fontWeight: "700" },
          headerShadowVisible: false,
        }}
      >
        {!usuario ? (
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
        ) : (
          <>
            {/* Aquí normalmente va tu app principal */}
            <Stack.Screen
              name="Main"
              component={MainTabs}
              options={{ headerShown: false }} // tabs suelen manejar su propio header
            />

            {/* Pantallas extra encima de tabs */}
            <Stack.Screen
              name="PermisoCrear"
              component={PermisoCrearScreen}
              options={{ title: "Nuevo Permiso" }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
