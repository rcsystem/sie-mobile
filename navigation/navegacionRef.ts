import { createNavigationContainerRef } from "@react-navigation/native";

// Ref global para poder navegar desde lugares fuera de componentes
// (por ejemplo, desde handlers de notificaciones push)
export const navegacionRef = createNavigationContainerRef<any>();

export function navegar(nombrePantalla: string, params?: any) {
  if (navegacionRef.isReady()) {
    navegacionRef.navigate(nombrePantalla as never, params as never);
  }
}
