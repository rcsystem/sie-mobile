import { createNativeStackNavigator } from "@react-navigation/native-stack";
import PermisosListaScreen from "../screens/permisos/PermisosListaScreen";
import PermisoCrearScreen from "../screens/permisos/PermisoCrearScreen";

export type PermisoStackParamList = {
  PermisosLista: undefined;
  PermisoCrear: undefined;
};

const Stack = createNativeStackNavigator<PermisoStackParamList>();

export default function PermisoTrabajoStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="PermisosLista"
        component={PermisosListaScreen}
        options={{ title: "Permisos de Trabajo" }}
      />
      <Stack.Screen
        name="PermisoCrear"
        component={PermisoCrearScreen}
        options={{ title: "Crear Permiso" }}
      />
    </Stack.Navigator>
  );
}
