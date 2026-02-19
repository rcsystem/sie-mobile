import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { Platform } from "react-native";
import * as Device from "expo-device";
import { clienteApi } from "../api/cliente";
import { useAuth } from "../store/useAuth";

export async function registrarPushTokenEnApi() {
  try {
    console.log("[push] start");

    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;

    if (existing !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    console.log("[push] permission:", finalStatus);
    if (finalStatus !== "granted") return;

    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ??
      Constants?.easConfig?.projectId;

    console.log("[push] projectId:", projectId);

    console.log("[push] calling getExpoPushTokenAsync...");
    const expoResp = await Notifications.getExpoPushTokenAsync({ projectId });
    const expoToken = expoResp.data;

    console.log("[push] expoToken:", expoToken);

    const tokenJwt = useAuth.getState().token;
    console.log("[push] jwt exists:", !!tokenJwt);
    if (!tokenJwt) return;

    console.log("[push] POST /push-token...");
    const resp = await clienteApi.post(
      "/push-token",
      {
        token: expoToken,
        platform: Platform.OS,
        device: Device.modelName ?? "unknown",
      },
      {
        headers: { Authorization: `Bearer ${tokenJwt}` },
      },
    );

    console.log("[push] saved:", resp.status, resp.data);
  } catch (e: any) {
    console.log("[push] FAIL status:", e?.response?.status);
    console.log("[push] FAIL data:", e?.response?.data);
    console.log("[push] FAIL msg:", e?.message);
  }
}
