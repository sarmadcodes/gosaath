import { useEffect, useState } from "react";
import { Pressable, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Card } from "@/components/card";
import { Input } from "@/components/input";
import { SectionHeader } from "@/components/section-header";
import { Text } from "@/components/text";
import { makeStyles, MIN_TOUCH_TARGET, spacing, useColors } from "@/theme";
import { api } from "@/services";
import type { AreaSuggestion } from "@/data/types";

export type LocationSearchProps = {
  label?: string;
  placeholder?: string;
  onSelect: (suggestion: AreaSuggestion) => void;
};

/**
 * Area picker, shaped for a Google Maps-backed search without depending on
 * one. It calls `api.location.search`, so connecting the real service is a
 * change to that method and nothing else.
 *
 * Whatever the user searches resolves to an area. There is no "use my current
 * location" here on purpose: the product never needs a precise position, and
 * offering one would imply it does.
 */
export function LocationSearch({
  label = "Where do you start from?",
  placeholder = "Search for an area or landmark",
  onSelect,
}: LocationSearchProps) {
  const styles = useStyles();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AreaSuggestion[]>([]);
  const [recent, setRecent] = useState<AreaSuggestion[]>([]);

  useEffect(() => {
    let cancelled = false;
    api.location.recent().then((items) => {
      if (!cancelled) setRecent(items);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    // Trailing debounce: a type-ahead that fires per keystroke is the thing
    // that makes a real Maps integration expensive.
    const timer = setTimeout(() => {
      api.location.search(query).then((items) => {
        if (!cancelled) setResults(items);
      });
    }, 180);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  const showRecent = query.trim().length === 0 && recent.length > 0;
  const list = showRecent ? recent : results;

  return (
    <View style={styles.wrap}>
      <Input
        label={label}
        icon="search"
        placeholder={placeholder}
        value={query}
        onChangeText={setQuery}
        autoCorrect={false}
      />

      {list.length > 0 ? (
        <View style={styles.section}>
          <SectionHeader title={showRecent ? "Recent" : "Areas"} />
          <Card padding="none">
            {list.map((item, index) => (
              <LocationResult
                key={item.areaId}
                suggestion={item}
                last={index === list.length - 1}
                onPress={() => onSelect(item)}
              />
            ))}
          </Card>
        </View>
      ) : (
        <Text variant="bodySmall" tone="tertiary">
          No area matches that name. Try the nearest well-known area instead.
        </Text>
      )}
    </View>
  );
}

export type LocationResultProps = {
  suggestion: AreaSuggestion;
  last?: boolean;
  onPress: () => void;
};

/** One row in the results list. Area name first, landmark as support. */
export function LocationResult({
  suggestion,
  last,
  onPress,
}: LocationResultProps) {
  const styles = useStyles();
  const colors = useColors();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        suggestion.hint
          ? `${suggestion.name}. ${suggestion.hint}`
          : suggestion.name
      }
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        !last && styles.divider,
        pressed && styles.pressed,
      ]}
    >
      <Feather name="map-pin" size={16} color={colors.textTertiary} />
      <View style={styles.rowCopy}>
        <Text variant="bodyLarge" numberOfLines={1}>
          {suggestion.name}
        </Text>
        {suggestion.hint ? (
          <Text variant="bodySmall" tone="tertiary" numberOfLines={1}>
            {suggestion.hint}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const useStyles = makeStyles((c) => ({
  wrap: {
    gap: spacing.lg,
  },
  section: {
    gap: spacing.md,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
    minHeight: MIN_TOUCH_TARGET + 4,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: c.border,
  },
  pressed: {
    backgroundColor: c.surfaceSecondary,
  },
  rowCopy: {
    flex: 1,
    gap: 1,
  },
}));
