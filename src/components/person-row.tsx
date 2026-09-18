import { ReactNode } from "react";
import { View } from "react-native";
import { Avatar } from "@/components/avatar";
import { Badge } from "@/components/badge";
import { Text } from "@/components/text";
import { makeStyles, spacing } from "@/theme";
import type { PublicUser } from "@/data/types";

export type PersonRowProps = {
  user: PublicUser;
  /** Shown beside the name, for example "Driver" in a commute group. */
  role?: string;
  /** Secondary line, such as an area or campus. Never personal detail. */
  caption?: string;
  size?: "sm" | "md" | "lg";
  highlighted?: boolean;
  trailing?: ReactNode;
};

/**
 * First name, optional photo, optional verified badge. Nothing else.
 *
 * There are no public profiles in this product, so this row deliberately
 * cannot show a rating, a ride count, a join date or a full name.
 */
export function PersonRow({
  user,
  role,
  caption,
  size = "md",
  highlighted,
  trailing,
}: PersonRowProps) {
  const styles = useStyles();

  return (
    <View style={styles.row}>
      <Avatar
        name={user.firstName}
        photoUrl={user.photoUrl}
        size={size}
        highlighted={highlighted}
      />
      <View style={styles.body}>
        <View style={styles.nameLine}>
          <Text variant="h4" numberOfLines={1} style={styles.shrink}>
            {user.firstName}
          </Text>
          {role ? (
            <Text variant="caption" tone="brand">
              {role}
            </Text>
          ) : null}
        </View>
        {caption ? (
          <Text variant="bodySmall" tone="secondary" numberOfLines={1}>
            {caption}
          </Text>
        ) : null}
        {user.verified ? (
          <View style={styles.badge}>
            <Badge kind="verified" />
          </View>
        ) : null}
      </View>
      {trailing}
    </View>
  );
}

const useStyles = makeStyles(() => ({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  body: {
    flex: 1,
    gap: spacing.xs,
  },
  nameLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  shrink: {
    flexShrink: 1,
  },
  badge: {
    marginTop: 2,
  },
}));
