import * as SecureStore from "expo-secure-store";

export async function guardar(llave: string, valor: string) {
  await SecureStore.setItemAsync(llave, valor);
}

export async function leer(llave: string) {
  return await SecureStore.getItemAsync(llave);
}

export async function borrar(llave: string) {
  await SecureStore.deleteItemAsync(llave);
}

// Aliases para mantener compatibilidad con código que usa nombres *_Item
export const guardarItem = guardar;
export const leerItem = leer;
export const borrarItem = borrar;
