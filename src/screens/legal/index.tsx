import { View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { AppBar } from "@/components/app-bar";
import { Card } from "@/components/card";
import { Screen } from "@/components/screen";
import { Text } from "@/components/text";
import { makeStyles, spacing, useColors } from "@/theme";
import type { LegalDocument } from "@/data/legal";

/**
 * Shared renderer for the terms and privacy documents.
 *
 * Long-form reading, so the type is larger than the rest of the app and the
 * measure stays narrow. Points are ticked rather than bulleted because most of
 * them are commitments rather than list items.
 */
export function LegalScreen({ document }: { document: LegalDocument }) {
  const styles = useStyles();
  const colors = useColors();

  return (
    <>
      <AppBar title={document.title} />
      <Screen contentStyle={styles.content}>
        <Text variant="bodyLarge" tone="secondary">
          {document.intro}
        </Text>
        <Text variant="caption" tone="tertiary">
          Last updated {document.updated}
        </Text>

        {document.sections.map((section) => (
          <View key={section.heading} style={styles.section}>
            <Text variant="h3">{section.heading}</Text>

            {section.body.map((paragraph) => (
              <Text key={paragraph} variant="body" tone="secondary">
                {paragraph}
              </Text>
            ))}

            {section.points ? (
              <Card padding="regular" style={styles.points}>
                {section.points.map((point, index) => (
                  <View
                    key={point}
                    style={[
                      styles.pointRow,
                      index !== section.points!.length - 1 && styles.pointGap,
                    ]}
                  >
                    <Feather name="check" size={15} color={colors.brand} />
                    <Text variant="bodySmall" tone="secondary" style={styles.flex}>
                      {point}
                    </Text>
                  </View>
                ))}
              </Card>
            ) : null}
          </View>
        ))}
      </Screen>
    </>
  );
}

const useStyles = makeStyles(() => ({
  content: {
    gap: spacing.md,
    paddingTop: spacing.base,
    paddingBottom: spacing["2xl"],
  },
  section: {
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  points: {
    marginTop: spacing.sm,
  },
  pointRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  pointGap: {
    marginBottom: spacing.md,
  },
  flex: {
    flex: 1,
  },
}));
