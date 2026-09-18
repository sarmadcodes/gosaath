import { Image, View } from "react-native";
import { Text } from "@/components/text";
import { makeStyles, radius } from "@/theme";
import { institutionById, institutionLogo, wideRatio } from "@/data/institutions";

export type InstitutionLogoProps = {
  institutionId?: string;
  size?: number;
  /** wide uses the horizontal lockup, for pickers and confirmation rows. */
  variant?: "mark" | "wide";
};

/**
 * Renders an institution's logo, falling back to a monogram on its brand
 * colour when no asset is registered yet.
 *
 * The fallback matters: the Karachi list is long and logos will arrive a few
 * at a time, so every institution has to look deliberate from day one rather
 * than showing a broken image.
 */
export function InstitutionLogo({
  institutionId,
  size = 34,
  variant = "mark",
}: InstitutionLogoProps) {
  const styles = useStyles();
  const institution = institutionId ? institutionById(institutionId) : undefined;
  const asset = institutionId ? institutionLogo(institutionId, variant) : null;

  if (!institution) return null;

  if (asset) {
    if (variant === "wide") {
      // The ratio is recorded in the logo registry rather than measured at
      // runtime: Image.resolveAssetSource does not exist on React Native Web,
      // and every lockup has a different shape.
      return (
        <Image
          source={asset}
          style={{ height: size, width: size * wideRatio(institutionId!) }}
          resizeMode="contain"
          accessibilityIgnoresInvertColors
          accessibilityLabel={institution.shortName ?? institution.name}
        />
      );
    }

    return (
      <Image
        source={asset}
        style={{ width: size, height: size, borderRadius: radius.full }}
        resizeMode="cover"
        accessibilityIgnoresInvertColors
        accessibilityLabel={institution.shortName ?? institution.name}
      />
    );
  }

  const monogram = (institution.shortName ?? institution.name)
    .replace(/[^A-Za-z ]/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

  return (
    <View
      accessible
      accessibilityLabel={institution.shortName ?? institution.name}
      style={[
        styles.fallback,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: institution.brandColor,
        },
      ]}
    >
      <Text
        variant={size > 40 ? "h4" : "caption"}
        style={{ color: "#FFFFFF" }}
        numberOfLines={1}
      >
        {monogram}
      </Text>
    </View>
  );
}

const useStyles = makeStyles(() => ({
  fallback: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
}));
