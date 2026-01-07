import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LoginScreen from "../screens/LoginScreen";
import HomeScreen from "../screens/HomeScreen";
import { useAuth } from "../store/useAuth";
import MainTabs from "./MainTabs";
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
      <Stack.Navigator>
        {!usuario ? (
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
        ) : (
          <Stack.Screen
            name="Main"
            component={MainTabs}
            options={{ headerShown: false }}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
