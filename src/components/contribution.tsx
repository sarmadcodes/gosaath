import { View } from "react-native";
import { Text } from "@/components/text";
import { makeStyles } from "@/theme";

export function formatPkr(amount: number) {
  return `Rs. ${amount.toLocaleString("en-PK")}`;
}

export type ContributionProps = {
  amount: number;
  /** Suppresses the caption where the surrounding copy already explains it. */
  bare?: boolean;
  size?: "regular" | "large";
  tone?: "primary" | "onBrand";
};

/**
 * Money is always labelled as a contribution. The product shares running
 * costs between commuters, so the wording never implies a fare, a price, or
 * driver earnings.
 */
export function Contribution({
  amount,
  bare,
  size = "regular",
  tone = "primary",
}: ContributionProps) {
  const styles = useStyles();

  return (
    <View style={styles.wrap}>
      <Text variant={size === "large" ? "h2" : "h3"} tone={tone}>
        {formatPkr(amount)}
      </Text>
      {bare ? null : (
        <Text
          variant="caption"
          tone={tone === "onBrand" ? "onBrand" : "tertiary"}
          style={tone === "onBrand" ? styles.muted : undefined}
        >
          Estimated contribution
        </Text>
      )}
    </View>
  );
}

const useStyles = makeStyles(() => ({
  wrap: {
    gap: 2,
  },
  muted: {
    opacity: 0.8,
  },
}));
