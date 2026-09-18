import { useState } from "react";
import { View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { AlertBanner } from "@/components/alert-banner";
import { AppBar } from "@/components/app-bar";
import { Badge } from "@/components/badge";
import { Button } from "@/components/button";
import { Card } from "@/components/card";
import { ImageUpload } from "@/components/image-upload";
import { Screen } from "@/components/screen";
import { SectionHeader } from "@/components/section-header";
import { Text } from "@/components/text";
import { makeStyles, radius, spacing, useColors } from "@/theme";
import { SkeletonForm } from "@/components/skeleton";
import { api } from "@/services";
import { useMe } from "@/hooks/data";
import type { BadgeStatus, User } from "@/data/types";

const ACCEPTED = [
  "Student card",
  "Employee or staff card",
  "Faculty card",
  "Enrolment or employment letter",
];

export default function Verification() {
  const styles = useStyles();
  const { data: me } = useMe();

  if (!me) {
    return (
      <>
        <AppBar title="Verified badge" />
        <Screen contentStyle={styles.content}>
          <SkeletonForm />
        </Screen>
      </>
    );
  }

  return <VerificationBody me={me} />;
}

function VerificationBody({ me }: { me: User }) {
  const styles = useStyles();
  const colors = useColors();

  const [status, setStatus] = useState<BadgeStatus>(me.badgeStatus);
  const [document, setDocument] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (!document) return;
    setSubmitting(true);
    try {
      const updated = await api.me.requestBadge(document);
      setStatus(updated.badgeStatus);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <AppBar title="Get verified" />
      <Screen
        footer={
          status === "none" || status === "rejected" ? (
            <Button
              label="Submit for review"
              block
              loading={submitting}
              disabled={!document}
              onPress={submit}
            />
          ) : (
            <Button label="Done" block onPress={() => router.back()} />
          )
        }
        contentStyle={styles.content}
      >
        {/* Verification is optional here. Your institution email already got
            you an account; the badge is extra reassurance for other people. */}
        <Card tone="ride" padding="regular">
          <View style={styles.headerRow}>
            <View style={styles.mark}>
              <Feather name="shield" size={20} color={colors.brand} />
            </View>
            <View style={styles.flex}>
              <Text variant="h4">The verified badge is optional</Text>
              <Text variant="bodySmall" tone="secondary">
                Your institution email already verified your account. This badge
                just tells other commuters a human checked your ID.
              </Text>
            </View>
          </View>
        </Card>

        {status === "approved" ? (
          <>
            <AlertBanner
              tone="success"
              title="You are verified"
              body="Your badge shows on your ride listings and seat requests."
            />
            <Card padding="regular">
              <Text variant="caption" tone="tertiary" uppercase>
                On your listings
              </Text>
              <View style={styles.badgePreview}>
                <Badge kind="verified" />
              </View>
            </Card>
          </>
        ) : status === "pending" ? (
          <AlertBanner
            tone="warning"
            title="We are reviewing your document"
            body="This usually takes a few hours. You can keep using the app in the meantime."
          />
        ) : (
          <>
            {status === "rejected" ? (
              <AlertBanner
                tone="error"
                title="We could not read your document"
                body="The photo was too blurry to confirm. Try again in daylight with the whole card in frame."
              />
            ) : null}

            <View style={styles.section}>
              <SectionHeader
                title="What we accept"
                caption="Anything that shows your name and your institution."
              />
              <Card padding="regular">
                <View style={styles.list}>
                  {ACCEPTED.map((item) => (
                    <View key={item} style={styles.listRow}>
                      <Feather name="check" size={15} color={colors.brand} />
                      <Text variant="body" tone="secondary" style={styles.flex}>
                        {item}
                      </Text>
                    </View>
                  ))}
                </View>
              </Card>
            </View>

            <View style={styles.section}>
              <SectionHeader title="Upload your proof" />
              <Card padding="regular">
                <ImageUpload
                  label="Your document"
                  hint="Make sure your name and institution are readable"
                  aspect="square"
                  value={document}
                  onChange={setDocument}
                />
              </Card>
            </View>
          </>
        )}

        {/* Restating this at the point of upload, where the worry actually
            occurs, rather than only in a privacy policy nobody opens. */}
        <Card tone="inset">
          <View style={styles.privacyRow}>
            <Feather name="lock" size={16} color={colors.textSecondary} />
            <Text variant="bodySmall" tone="secondary" style={styles.flex}>
              Your document is only used to check your identity. It is never
              shown to other commuters, and only the badge is ever public.
            </Text>
          </View>
        </Card>
      </Screen>
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
  headerRow: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "flex-start",
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
  list: {
    gap: spacing.md,
  },
  listRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  badgePreview: {
    marginTop: spacing.sm,
  },
  privacyRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
  },
}));
