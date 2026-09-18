import { useState } from "react";
import { View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { AppBar } from "@/components/app-bar";
import { Button } from "@/components/button";
import { Card } from "@/components/card";
import { OptionSheet } from "@/components/option-sheet";
import { Screen } from "@/components/screen";
import { SectionHeader } from "@/components/section-header";
import { Sheet } from "@/components/sheet";
import { Text } from "@/components/text";
import { SkeletonForm } from "@/components/skeleton";
import { useMe } from "@/hooks/data";
import type { User } from "@/data/types";
import { makeStyles, radius, spacing, useColors } from "@/theme";
import {
  campusById,
  institutionById,
  institutions,
  sortInstitutions,
} from "@/data/institutions";

export default function MyInstitutions() {
  const styles = useStyles();
  const { data: me } = useMe();

  if (!me) {
    return (
      <>
        <AppBar title="My institutions" />
        <Screen contentStyle={styles.content}>
          <SkeletonForm />
        </Screen>
      </>
    );
  }

  return <MyInstitutionsBody me={me} />;
}

function MyInstitutionsBody({ me }: { me: User }) {
  const styles = useStyles();
  const colors = useColors();

  const [additional, setAdditional] = useState<string[]>(
    me.additionalInstitutionIds,
  );
  const [addOpen, setAddOpen] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);

  const primary = institutionById(me.institutionId);
  const campus = campusById(me.campusId);

  const addable = sortInstitutions(
    institutions.filter(
      (i) => i.id !== me.institutionId && !additional.includes(i.id),
    ),
  );

  return (
    <>
      <AppBar title="My institutions" />
      <Screen contentStyle={styles.content}>
        <Text variant="body" tone="secondary">
          Your primary community is what you see by default. Adding another
          lets you search its rides too, but it does not expose your commute to
          everyone.
        </Text>

        <View style={styles.section}>
          <SectionHeader title="Primary" />
          <Card tone="ride" padding="regular">
            <View style={styles.row}>
              <View style={styles.mark}>
                <Feather name="award" size={18} color={colors.brand} />
              </View>
              <View style={styles.flex}>
                <Text variant="h4" numberOfLines={2}>
                  {primary?.shortName ?? primary?.name}
                </Text>
                <Text variant="bodySmall" tone="secondary">
                  {campus?.name}
                </Text>
              </View>
            </View>
            {/* The primary cannot simply be removed. Doing so would leave the
                account with no community to match within. */}
            <Text variant="bodySmall" tone="tertiary" style={styles.note}>
              To change your primary institution, pick a new one first. It
              cannot be left empty.
            </Text>
            <Button
              label="Change primary institution"
              variant="secondary"
              size="compact"
              style={styles.changeButton}
              onPress={() => setAddOpen(true)}
            />
          </Card>
        </View>

        <View style={styles.section}>
          <SectionHeader
            title="Additional"
            caption="Optional. Only add one if you genuinely travel there."
          />
          {additional.length === 0 ? (
            <Card padding="regular">
              <Text variant="bodySmall" tone="secondary">
                You have not added any other institutions.
              </Text>
            </Card>
          ) : (
            <Card padding="none">
              {additional.map((id, index) => {
                const institution = institutionById(id);
                return (
                  <View
                    key={id}
                    style={[
                      styles.addedRow,
                      index !== additional.length - 1 && styles.divider,
                    ]}
                  >
                    <Text variant="bodyLarge" style={styles.flex} numberOfLines={1}>
                      {institution?.shortName ?? institution?.name}
                    </Text>
                    <Button
                      label="Remove"
                      variant="tertiary"
                      size="compact"
                      onPress={() => setRemoving(id)}
                    />
                  </View>
                );
              })}
            </Card>
          )}

          <Button
            label="Add another institution"
            variant="secondary"
            icon="plus"
            onPress={() => setAddOpen(true)}
          />
        </View>
      </Screen>

      <OptionSheet
        visible={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add an institution"
        options={addable.map((i) => i.shortName ?? i.name)}
        onSelect={(label) => {
          const match = addable.find(
            (i) => (i.shortName ?? i.name) === label,
          );
          if (match) setAdditional((list) => [...list, match.id]);
        }}
      />

      <Sheet
        visible={!!removing}
        onClose={() => setRemoving(null)}
        title="Remove this institution?"
        caption="You will stop seeing rides from that community. Your primary institution is unaffected."
      >
        <View style={styles.sheetActions}>
          <Button
            label="Remove"
            variant="destructive"
            block
            onPress={() => {
              setAdditional((list) => list.filter((id) => id !== removing));
              setRemoving(null);
            }}
          />
          <Button
            label="Keep it"
            variant="tertiary"
            block
            onPress={() => setRemoving(null)}
          />
        </View>
      </Sheet>
    </>
  );
}

const useStyles = makeStyles((c) => ({
  content: {
    gap: spacing.lg,
    paddingTop: spacing.base,
  },
  section: {
    gap: spacing.md,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  mark: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: c.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  flex: {
    flex: 1,
    gap: 2,
  },
  note: {
    marginTop: spacing.md,
  },
  changeButton: {
    alignSelf: "flex-start",
    marginTop: spacing.md,
  },
  addedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.base,
    minHeight: 60,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: c.border,
  },
  sheetActions: {
    paddingHorizontal: spacing.base,
    gap: spacing.sm,
  },
}));
