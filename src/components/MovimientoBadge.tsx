import { View, Text } from "react-native";

export type Movimiento =
  | "ENTRADA"
  | "SALIDA"
  | "ENTRADA_SALIDA"
  | "INASISTENCIA"
  | "OTRO";

type Props = {
  movimiento: Movimiento;
};

export default function MovimientoBadge({ movimiento }: Props) {
  let bg = "#E5E7EB"; // gris default
  // let fg = "#111827";
  let fg = "#0da71aff";
  let label = "Otro";

  switch (movimiento) {
    case "ENTRADA":
      bg = "#dbfeebff";
      fg = "#1eaf56ff";
      label = "Entrada";
      break;

    case "SALIDA":
      bg = "#E0E7FF";
      fg = "#1590c9ff";
      label = "Salida";
      break;

    case "ENTRADA_SALIDA":
      bg = "#F3E8FF";
      fg = "#6B21A8";
      label = "Entrada → Salida";
      break;

    case "INASISTENCIA":
      bg = "#FFE4E6";
      fg = "#9F1239";
      label = "Inasistencia";
      break;

    case "OTRO":
    default:
      bg = "#E5E7EB";
      fg = "#111827";
      label = "Otro";
      break;
  }

  return (
    <View
      style={{
        alignSelf: "flex-start",
        backgroundColor: bg,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
      }}
    >
      <Text
        style={{
          color: fg,
          fontWeight: "700",
          fontSize: 12,
        }}
      >
        {label}
      </Text>
    </View>
  );
}
