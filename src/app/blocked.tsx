import { useState } from "react";
import { View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { AppBar } from "@/components/app-bar";
import { Button } from "@/components/button";
import { Card } from "@/components/card";
import { EmptyState } from "@/components/empty-state";
import { PersonRow } from "@/components/person-row";
import { Screen } from "@/components/screen";
import { Sheet } from "@/components/sheet";
import { Text } from "@/components/text";
import { makeStyles, spacing, useColors } from "@/theme";
import { api } from "@/services";
import { useBlocked } from "@/hooks/data";
import type { PublicUser } from "@/data/types";

/**
 * Blocking is one-directional for visibility but bidirectional for matching:
 * neither person is surfaced to the other again, without telling the blocked
 * person anything happened.
 */
export default function Blocked() {
  const styles = useStyles();
  const colors = useColors();
  const { data: blocked = [], set } = useBlocked();
  const [unblocking, setUnblocking] = useState<PublicUser | null>(null);

  async function unblock(user: PublicUser) {
    setUnblocking(null);
    set(blocked.filter((b) => b.id !== user.id));
    await api.safety.unblock(user.id);
  }

  return (
    <>
      <AppBar title="Blocked people" />
      <Screen contentStyle={styles.content}>
        {blocked.length === 0 ? (
          <EmptyState
            icon="slash"
            title="You have not blocked anyone"
            body="If someone makes you uncomfortable, you can block them from their ride or after reporting them. They are never told."
          />
        ) : (
          <>
            <Text variant="body" tone="secondary">
              You will not be matched with these people, and they will not see
              your commute.
            </Text>

            <Card padding="none">
              {blocked.map((user, index) => (
                <View
                  key={user.id}
                  style={[
                    styles.row,
                    index !== blocked.length - 1 && styles.divider,
                  ]}
                >
                  <View style={styles.flex}>
                    <PersonRow user={user} size="sm" />
                  </View>
                  <Button
                    label="Unblock"
                    variant="tertiary"
                    size="compact"
                    onPress={() => setUnblocking(user)}
                  />
                </View>
              ))}
            </Card>
          </>
        )}

        <Card tone="inset">
          <View style={styles.noteRow}>
            <Feather name="eye-off" size={16} color={colors.textSecondary} />
            <Text variant="bodySmall" tone="secondary" style={styles.flex}>
              Blocking is silent. The other person is never told, and they
              cannot tell whether you blocked them or simply stopped
              travelling.
            </Text>
          </View>
        </Card>
      </Screen>

      <Sheet
        visible={!!unblocking}
        onClose={() => setUnblocking(null)}
        title={unblocking ? `Unblock ${unblocking.firstName}?` : undefined}
        caption="You may be matched with them again if your commutes line up."
      >
        <View style={styles.sheetActions}>
          <Button
            label="Unblock"
            variant="destructive"
            block
            onPress={() => unblocking && unblock(unblocking)}
          />
          <Button
            label="Keep blocked"
            variant="tertiary"
            block
            onPress={() => setUnblocking(null)}
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
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: c.border,
  },
  flex: {
    flex: 1,
  },
  noteRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  sheetActions: {
    paddingHorizontal: spacing.base,
    gap: spacing.sm,
  },
}));
