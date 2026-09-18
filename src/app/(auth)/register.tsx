import { useState } from "react";
import { View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { AppBar } from "@/components/app-bar";
import { Avatar } from "@/components/avatar";
import { Button } from "@/components/button";
import { Card } from "@/components/card";
import { Input } from "@/components/input";
import { OptionSheet } from "@/components/option-sheet";
import { Screen } from "@/components/screen";
import { Text } from "@/components/text";
import { makeStyles, spacing, useColors } from "@/theme";
import { areas } from "@/data/areas";
import { campusById, institutionById } from "@/data/institutions";
import { api } from "@/services";
import { useSignup } from "@/state/signup";

export default function Register() {
  const styles = useStyles();
  const colors = useColors();
  const { draft, update } = useSignup();

  const institution = draft.institutionId
    ? institutionById(draft.institutionId)
    : undefined;
  const campus = draft.campusId ? campusById(draft.campusId) : undefined;

  const [name, setName] = useState(draft.name ?? "");
  const [email, setEmail] = useState(draft.email ?? "");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState(draft.phone ?? "");
  const [photoUrl, setPhotoUrl] = useState<string | null>(draft.photoUrl ?? null);
  const [area, setArea] = useState(draft.areaId ?? "");
  const [areaOpen, setAreaOpen] = useState(false);
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const emailShape = /^\S+@\S+\.\S+$/.test(email);
  // When we know the institution's domains, the email has to be one of them.
  // This is what makes the OTP a real institution check rather than a formality.
  const domainOk =
    !institution?.emailDomains.length ||
    institution.emailDomains.some((domain) =>
      email.toLowerCase().trim().endsWith(`@${domain}`),
    );

  const phoneDigits = phone.replace(/\D/g, "");
  const phoneOk = phoneDigits.length === 11 && phoneDigits.startsWith("03");
  const passwordOk = password.length >= 8;
  const nameOk = name.trim().length > 1;

  const valid = nameOk && emailShape && domainOk && phoneOk && passwordOk && !!area;

  const emailError =
    touched && email.length > 0
      ? !emailShape
        ? "Check this email address."
        : !domainOk
          ? `Use your ${institution?.shortName ?? "institution"} email, ending in ${institution?.emailDomains.map((d) => `@${d}`).join(" or ")}.`
          : undefined
      : undefined;

  async function pickPhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.6,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotoUrl(result.assets[0].uri);
    }
  }

  async function submit() {
    setTouched(true);
    if (!valid) return;

    setSubmitting(true);
    setServerError(null);
    try {
      const areaId = areas.find((a) => a.name === area)?.id ?? "";
      update({ name, email, password, phone, photoUrl, areaId });

      await api.auth.register({
        name,
        email,
        password,
        phone,
        photoUrl,
        userType: draft.userType!,
        institutionId: draft.institutionId!,
        campusId: draft.campusId!,
        areaId,
      });

      router.push({ pathname: "/(auth)/otp", params: { email } });
    } catch (error) {
      setServerError(
        error instanceof Error ? error.message : "Something went wrong.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <AppBar title="Create your account" />
      <Screen
        footer={
          <>
            <Button
              label="Send code"
              block
              loading={submitting}
              disabled={!valid}
              onPress={submit}
            />
            <Text variant="caption" tone="tertiary" style={styles.centred}>
              By continuing you agree to our terms and privacy policy.
            </Text>
          </>
        }
        contentStyle={styles.content}
      >
        {/* The community was chosen two screens ago, so it is confirmed here
            rather than asked for again. */}
        <Card tone="ride" padding="compact">
          <View style={styles.community}>
            <Feather name="award" size={18} color={colors.brand} />
            <View style={styles.flex}>
              <Text variant="caption" tone="tertiary" uppercase>
                Your community
              </Text>
              <Text variant="h4" numberOfLines={2}>
                {institution?.shortName ?? institution?.name}
                {campus ? ` · ${campus.name}` : ""}
              </Text>
            </View>
          </View>
        </Card>

        <View style={styles.photoBlock}>
          <Avatar name={name || "?"} photoUrl={photoUrl} size="xl" />
          <Button
            label={photoUrl ? "Change photo" : "Add a photo"}
            variant="tertiary"
            size="compact"
            onPress={pickPhoto}
          />
          <Text variant="caption" tone="tertiary">
            Optional. You can add this later from Profile.
          </Text>
        </View>

        <Card padding="regular">
          <View style={styles.fields}>
            <Input
              label="Full name"
              icon="user"
              placeholder="Your name"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              onBlur={() => setTouched(true)}
              error={
                touched && name.length > 0 && !nameOk
                  ? "Enter your full name."
                  : undefined
              }
            />
            <Input
              label={
                institution?.shortName
                  ? `${institution.shortName.replace(/ University$/, "")} email`
                  : "Institution email"
              }
              icon="mail"
              placeholder={
                institution?.emailDomains[0]
                  ? `you@${institution.emailDomains[0]}`
                  : "you@institution.edu.pk"
              }
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              onBlur={() => setTouched(true)}
              hint={
                emailError
                  ? undefined
                  : `Your university email helps us keep GoSaath within the ${institution?.shortName ?? "campus"} community.`
              }
              error={emailError}
            />
            <Input
              label="Password"
              icon="lock"
              placeholder="At least 8 characters"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              onBlur={() => setTouched(true)}
              error={
                touched && password.length > 0 && !passwordOk
                  ? "Use at least 8 characters."
                  : undefined
              }
            />
            <Input
              label="Mobile number"
              icon="phone"
              placeholder="0301 2345678"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              autoComplete="tel"
              onBlur={() => setTouched(true)}
              error={
                touched && phone.length > 0 && !phoneOk
                  ? "Enter an 11 digit number starting with 03."
                  : undefined
              }
            />
            <Input
              label="Where you live"
              icon="map-pin"
              placeholder="Select your area"
              value={area}
              hint="Your area only. Your exact address is never asked for."
              onPressField={() => setAreaOpen(true)}
            />
          </View>
        </Card>

        {serverError ? (
          <Text variant="bodySmall" tone="error">
            {serverError}
          </Text>
        ) : null}
      </Screen>

      <OptionSheet
        visible={areaOpen}
        onClose={() => setAreaOpen(false)}
        title="Where you live"
        options={areas.map((a) => a.name)}
        value={area}
        onSelect={setArea}
      />
    </>
  );
}

const useStyles = makeStyles(() => ({
  content: {
    gap: spacing.lg,
    paddingTop: spacing.base,
  },
  community: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  flex: {
    flex: 1,
  },
  photoBlock: {
    alignItems: "center",
    gap: spacing.sm,
  },
  fields: {
    gap: spacing.lg,
  },
  centred: {
    textAlign: "center",
  },
}));
