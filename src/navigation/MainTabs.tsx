import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

import HomeScreen from "../screens/HomeScreen";
import PermisoTrabajoStack from "./PermisoTrabajoStack";

const Tab = createBottomTabNavigator();

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerTitleAlign: "left",
        tabBarIcon: ({ focused, size, color }) => {
          let iconName: any = "home-outline";

          if (route.name === "Inicio")
            iconName = focused ? "home" : "home-outline";
          if (route.name === "Permisos")
            iconName = focused ? "document-text" : "document-text-outline";

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Inicio" component={HomeScreen} />
      <Tab.Screen
        name="Permisos"
        component={PermisoTrabajoStack}
        options={{ headerShown: false }}
      />
    </Tab.Navigator>
  );
}
