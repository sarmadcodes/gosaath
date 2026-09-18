import { useState } from "react";
import {
  Pressable,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { Text } from "@/components/text";
import {
  makeStyles,
  MIN_TOUCH_TARGET,
  radius,
  spacing,
  type,
  useColors,
} from "@/theme";

export type InputProps = Omit<TextInputProps, "style"> & {
  label: string;
  /** Shown below the field. Replaced by `error` when the field is invalid. */
  hint?: string;
  error?: string;
  icon?: keyof typeof Feather.glyphMap;
  /** Renders as a tappable row that opens a picker rather than a keyboard. */
  onPressField?: () => void;
  /** Trailing text such as a unit or currency prefix. */
  suffix?: string;
  value?: string;
  placeholder?: string;
  style?: ViewStyle;
};

/**
 * Label sits above the field and stays there. Placeholder text is never used
 * as the label, so the field still explains itself once the user has typed.
 */
export function Input({
  label,
  hint,
  error,
  icon,
  onPressField,
  suffix,
  editable = true,
  style,
  ...rest
}: InputProps) {
  const styles = useStyles();
  const colors = useColors();
  const [focused, setFocused] = useState(false);

  const borderColor = error
    ? colors.error
    : focused
      ? colors.brand
      : colors.border;

  const field = (
    <View
      style={[
        styles.field,
        {
          borderColor,
          borderWidth: error || focused ? 1.5 : 1,
          backgroundColor: editable ? colors.surface : colors.surfaceSecondary,
        },
      ]}
    >
      {icon ? (
        <Feather name={icon} size={18} color={colors.textTertiary} />
      ) : null}
      {onPressField ? (
        <Text
          variant="bodyLarge"
          tone={rest.value ? "primary" : "tertiary"}
          style={styles.flex}
          numberOfLines={1}
        >
          {rest.value || rest.placeholder}
        </Text>
      ) : (
        <TextInput
          {...rest}
          editable={editable}
          onFocus={(e) => {
            setFocused(true);
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            rest.onBlur?.(e);
          }}
          placeholderTextColor={colors.textTertiary}
          style={[styles.input, { color: colors.textPrimary }]}
        />
      )}
      {suffix ? (
        <Text variant="body" tone="tertiary">
          {suffix}
        </Text>
      ) : null}
      {onPressField ? (
        <Feather name="chevron-down" size={18} color={colors.textTertiary} />
      ) : null}
    </View>
  );

  return (
    <View style={[styles.wrap, style]}>
      <Text variant="caption" tone="secondary">
        {label}
      </Text>
      {onPressField ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${label}. ${rest.value ?? "Not set"}`}
          onPress={onPressField}
        >
          {field}
        </Pressable>
      ) : (
        field
      )}
      {error ? (
        <View style={styles.message}>
          {/* Error is announced by icon plus text, never colour alone. */}
          <Feather name="alert-circle" size={13} color={colors.error} />
          <Text variant="bodySmall" tone="error" style={styles.flex}>
            {error}
          </Text>
        </View>
      ) : hint ? (
        <Text variant="bodySmall" tone="tertiary">
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

const useStyles = makeStyles(() => ({
  wrap: {
    gap: spacing.sm,
  },
  field: {
    minHeight: MIN_TOUCH_TARGET + 6,
    borderRadius: radius.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.base,
  },
  input: {
    flex: 1,
    paddingVertical: spacing.md,
    ...type.bodyLarge,
  },
  flex: {
    flex: 1,
  },
  message: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs + 2,
  },
}));
