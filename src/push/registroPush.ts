import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import { clienteApi } from "../api/cliente";

export async function registrarPushTokenEnApi() {
  if (!Device.isDevice) return; // push real = dispositivo físico

  const { status: existing } = await Notifications.getPermissionsAsync();
  let status = existing;

  if (existing !== "granted") {
    const req = await Notifications.requestPermissionsAsync();
    status = req.status;
  }
  if (status !== "granted") return;

  const token = (await Notifications.getExpoPushTokenAsync()).data;

  // Opcional: canal Android
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
    });
  }

  await clienteApi.post("/push-token", {
    token,
    platform: Platform.OS,
  });

  const expoToken = (await Notifications.getExpoPushTokenAsync()).data;
  console.log("✅ ExpoPushToken:", expoToken);

  return token;
}
