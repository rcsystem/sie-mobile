import { Platform } from "react-native";
import * as Device from "expo-device";
import Constants from "expo-constants";
import * as Notifications from "expo-notifications";

// Muestra notificaciones mientras la app está en primer plano
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function registrarParaNotificacionesPush() {
  // En simuladores (iOS/Android) casi siempre NO funciona.
  if (!Device.isDevice) return null;

  const permisosActuales = await Notifications.getPermissionsAsync();
  let estatusFinal = permisosActuales.status;

  if (estatusFinal !== "granted") {
    const solicitud = await Notifications.requestPermissionsAsync();
    estatusFinal = solicitud.status;
  }

  if (estatusFinal !== "granted") return null;

  // En builds EAS/standalone, muchas veces se requiere projectId.
  const projectId =
    (Constants as any)?.expoConfig?.extra?.eas?.projectId ??
    (Constants as any)?.easConfig?.projectId;

  const token = (
    await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    )
  ).data;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
    });
  }

  return token;
}
