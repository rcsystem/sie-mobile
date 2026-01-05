import { createNativeStackNavigator } from "@react-navigation/native-stack";
import PermisosMenuScreen from "../screens/permisos/PermisosMenuScreen";
import PermisoCrearScreen from "../screens/permisos/PermisoCrearScreen";
import PermisosListaScreen from "../screens/permisos/PermisosListaScreen";

export type PermisoStackParamList = {
  PermisosMenu: undefined;
  PermisoCrear: undefined;
  PermisosLista: undefined;
};

const Stack = createNativeStackNavigator<PermisoStackParamList>();

export default function PermisoTrabajoStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="PermisosMenu"
        component={PermisosMenuScreen}
        options={{ title: "Permiso de Trabajo" }}
      />
      <Stack.Screen
        name="PermisoCrear"
        component={PermisoCrearScreen}
        options={{ title: "Crear Permiso" }}
      />
      <Stack.Screen
        name="PermisosLista"
        component={PermisosListaScreen}
        options={{ title: "Permisos Generados" }}
      />
    </Stack.Navigator>
  );
}
