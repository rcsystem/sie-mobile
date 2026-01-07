import { View, Text } from "react-native";

type Props = {
  estado: string;
};

export default function EstadoBadge({ estado }: Props) {
  let backgroundColor = "#ccc";
  let textColor = "#000";
  let label = estado;

  switch (estado?.toUpperCase()) {
    case "PENDIENTE":
      backgroundColor = "#FEF3C7"; // amarillo suave
      textColor = "#92400E";
      label = "Pendiente";
      break;

    case "AUTORIZADA":
      backgroundColor = "#DCFCE7"; // verde suave
      textColor = "#166534";
      label = "Autorizado";
      break;

    case "CANCELADO":
      backgroundColor = "#FEE2E2"; // rojo suave
      textColor = "#991B1B";
      label = "Cancelado";
      break;
  }

  return (
    <View
      style={{
        alignSelf: "flex-start",
        backgroundColor,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
      }}
    >
      <Text style={{ color: textColor, fontWeight: "700", fontSize: 12 }}>
        {label}
      </Text>
    </View>
  );
}
