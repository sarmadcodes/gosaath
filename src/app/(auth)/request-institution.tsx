import { useState } from "react";
import { View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { AppBar } from "@/components/app-bar";
import { Button } from "@/components/button";
import { Card } from "@/components/card";
import { Input } from "@/components/input";
import { OptionSheet } from "@/components/option-sheet";
import { Screen } from "@/components/screen";
import { Text } from "@/components/text";
import { makeStyles, radius, spacing, useColors } from "@/theme";
import { api } from "@/services";
import { useSignup } from "@/state/signup";
import type { InstitutionType } from "@/data/types";

const TYPE_LABELS: Record<InstitutionType, string> = {
  university: "University",
  college: "College",
  school: "School",
  organisation: "Company or organisation",
};

export default function RequestInstitution() {
  const styles = useStyles();
  const colors = useColors();
  const { draft } = useSignup();

  const [name, setName] = useState("");
  const [type, setType] = useState<InstitutionType>(
    draft.institutionType ?? "university",
  );
  const [website, setWebsite] = useState("");
  const [campusName, setCampusName] = useState("");
  const [email, setEmail] = useState("");
  const [typeOpen, setTypeOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const emailOk = /^\S+@\S+\.\S+$/.test(email);
  const valid = name.trim().length > 2 && emailOk;

  async function submit() {
    setSubmitting(true);
    try {
      await api.institutions.request({
        name: name.trim(),
        type,
        website: website.trim() || undefined,
        campusName: campusName.trim() || undefined,
        requestedByEmail: email.trim(),
      });
      setSent(true);
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <>
        <AppBar title="Request sent" showBack={false} />
        <Screen
          footer={<Button label="Done" block onPress={() => router.back()} />}
          contentStyle={styles.content}
        >
          <View style={styles.doneMark}>
            <Feather name="check" size={26} color={colors.success} />
          </View>
          <Text variant="h2" style={styles.centred}>
            Thanks, we will take a look
          </Text>
          <Text variant="bodyLarge" tone="secondary" style={styles.centred}>
            Our team reviews every request before an institution appears in the
            app. We will email {email} once it is added.
          </Text>
        </Screen>
      </>
    );
  }

  return (
    <>
      <AppBar title="Request an institution" />
      <Screen
        footer={
          <Button
            label="Send request"
            block
            loading={submitting}
            disabled={!valid}
            onPress={submit}
          />
        }
        contentStyle={styles.content}
      >
        {/* Requests never create an institution directly. An admin reviews
            them, which is what keeps the community lists trustworthy. */}
        <Text variant="body" tone="secondary">
          Tell us about your institution and we will review it. Nothing is added
          automatically.
        </Text>

        <Card padding="regular">
          <View style={styles.fields}>
            <Input
              label="Institution name"
              icon="award"
              placeholder="Full official name"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
            <Input
              label="Type"
              icon="layers"
              value={TYPE_LABELS[type]}
              onPressField={() => setTypeOpen(true)}
            />
            <Input
              label="Campus name"
              icon="map-pin"
              placeholder="Optional"
              value={campusName}
              onChangeText={setCampusName}
            />
            <Input
              label="Website or email domain"
              icon="globe"
              placeholder="Optional, e.g. szabist.pk"
              value={website}
              onChangeText={setWebsite}
              autoCapitalize="none"
              keyboardType="url"
            />
            <Input
              label="Your email"
              icon="mail"
              placeholder="So we can tell you when it is added"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
        </Card>
      </Screen>

      <OptionSheet
        visible={typeOpen}
        onClose={() => setTypeOpen(false)}
        title="Institution type"
        options={Object.values(TYPE_LABELS)}
        value={TYPE_LABELS[type]}
        onSelect={(label) => {
          const match = (
            Object.entries(TYPE_LABELS) as [InstitutionType, string][]
          ).find(([, value]) => value === label);
          if (match) setType(match[0]);
        }}
      />
    </>
  );
}

const useStyles = makeStyles((c) => ({
  content: {
    gap: spacing.lg,
    paddingTop: spacing.base,
  },
  fields: {
    gap: spacing.lg,
  },
  doneMark: {
    alignSelf: "center",
    width: 56,
    height: 56,
    borderRadius: radius.full,
    backgroundColor: c.successBg,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing["2xl"],
    marginBottom: spacing.sm,
  },
  centred: {
    textAlign: "center",
  },
}));
