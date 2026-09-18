import { useState } from "react";
import { Image, Pressable, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Feather } from "@expo/vector-icons";
import { Text } from "@/components/text";
import { makeStyles, MIN_TOUCH_TARGET, radius, spacing, useColors } from "@/theme";

export type ImageUploadProps = {
  value?: string | null;
  onChange: (uri: string | null) => void;
  label: string;
  /** What the photo needs to show, so the user gets it right first time. */
  hint?: string;
  /** Square for documents and profile photos, wide for vehicles. */
  aspect?: "square" | "wide";
};

/**
 * Single image with preview, replace and remove.
 *
 * Deliberately one image, not a gallery: the brief only ever needs one usable
 * photo, and asking for several is the fastest way to make people abandon the
 * form. Quality is capped on pick so the upload stays small.
 */
export function ImageUpload({
  value,
  onChange,
  label,
  hint,
  aspect = "wide",
}: ImageUploadProps) {
  const styles = useStyles();
  const colors = useColors();
  const [busy, setBusy] = useState(false);
  const [denied, setDenied] = useState(false);

  const ratio: [number, number] = aspect === "square" ? [1, 1] : [4, 3];

  async function pick() {
    setBusy(true);
    setDenied(false);
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setDenied(true);
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: ratio,
        // Compressed on the way in rather than after, which keeps the upload
        // small without pulling in a separate image manipulation dependency.
        quality: 0.6,
      });

      if (!result.canceled && result.assets[0]) {
        onChange(result.assets[0].uri);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.wrap}>
      <Text variant="caption" tone="secondary">
        {label}
      </Text>

      {value ? (
        <View>
          <Image
            source={{ uri: value }}
            style={[styles.preview, aspect === "square" && styles.square]}
            accessibilityIgnoresInvertColors
            accessibilityLabel={`${label} preview`}
          />
          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Replace photo"
              onPress={pick}
              style={({ pressed }) => [styles.action, pressed && styles.pressed]}
            >
              <Feather name="refresh-cw" size={15} color={colors.brand} />
              <Text variant="button" tone="brand">
                Replace
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Remove photo"
              onPress={() => onChange(null)}
              style={({ pressed }) => [styles.action, pressed && styles.pressed]}
            >
              <Feather name="trash-2" size={15} color={colors.error} />
              <Text variant="button" tone="error">
                Remove
              </Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={hint ? `${label}. ${hint}` : label}
          onPress={pick}
          disabled={busy}
          style={({ pressed }) => [
            styles.dropzone,
            aspect === "square" && styles.square,
            pressed && styles.pressed,
          ]}
        >
          <View style={styles.mark}>
            <Feather name="camera" size={20} color={colors.brand} />
          </View>
          <Text variant="button" tone="brand">
            {busy ? "Opening…" : "Add a photo"}
          </Text>
          {hint ? (
            <Text variant="bodySmall" tone="tertiary" style={styles.centred}>
              {hint}
            </Text>
          ) : null}
        </Pressable>
      )}

      {denied ? (
        <Text variant="bodySmall" tone="error">
          We need permission to open your photos. You can allow it in your
          device settings.
        </Text>
      ) : null}
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  wrap: {
    gap: spacing.sm,
  },
  dropzone: {
    aspectRatio: 4 / 3,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: c.border,
    backgroundColor: c.surfaceSecondary,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  square: {
    aspectRatio: 1,
  },
  preview: {
    width: "100%",
    aspectRatio: 4 / 3,
    borderRadius: radius.lg,
    backgroundColor: c.surfaceSecondary,
  },
  mark: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: c.brandSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  actions: {
    flexDirection: "row",
    gap: spacing.lg,
    marginTop: spacing.md,
  },
  action: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm - 2,
    minHeight: MIN_TOUCH_TARGET - 8,
  },
  pressed: {
    opacity: 0.7,
  },
  centred: {
    textAlign: "center",
  },
}));
