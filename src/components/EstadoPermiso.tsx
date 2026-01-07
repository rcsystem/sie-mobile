import { View, Text } from "react-native";

type Props = {
  tipo_permiso: string;
};

export default function EstadoBadge({ tipo_permiso }: Props) {
  let backgroundColor = "#ccc";
  let textColor = "#000";
  let label = tipo_permiso;

  switch (tipo_permiso?.toUpperCase()) {
    case "PERSONAL":
      backgroundColor = "#FEF3C7"; // amarillo suave
      textColor = "#92400E";
      label = "Personal";
      break;

    case "LABORAL":
      backgroundColor = "#DCFCE7"; // verde suave
      textColor = "#166534";
      label = "Laboral";
      break;

    case "CANCELADA":
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
