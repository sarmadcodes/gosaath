import { useState } from "react";
import { View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { AppBar } from "@/components/app-bar";
import { Avatar } from "@/components/avatar";
import { Button } from "@/components/button";
import { Card } from "@/components/card";
import { Input } from "@/components/input";
import { OptionSheet } from "@/components/option-sheet";
import { Screen } from "@/components/screen";
import { SectionHeader } from "@/components/section-header";
import { Text } from "@/components/text";
import { makeStyles, spacing } from "@/theme";
import { SkeletonForm } from "@/components/skeleton";
import { api } from "@/services";
import { uploadFile } from "@/services/upload";
import { areas, areaName } from "@/data/areas";
import { communityLabel } from "@/data/institutions";
import { useMe } from "@/hooks/data";
import type { User } from "@/data/types";

/**
 * The form seeds its fields from the loaded account, so it is only mounted
 * once that account exists. Otherwise every field would have to reconcile a
 * late-arriving value against whatever the user had already typed.
 */
export default function ProfileEdit() {
  const styles = useStyles();
  const { data: me } = useMe();

  if (!me) {
    return (
      <>
        <AppBar title="Edit profile" />
        <Screen contentStyle={styles.content}>
          <SkeletonForm />
        </Screen>
      </>
    );
  }

  return <ProfileEditForm me={me} />;
}

function ProfileEditForm({ me }: { me: User }) {
  const styles = useStyles();

  const [name, setName] = useState(me.name);
  const [phone, setPhone] = useState(me.phone);
  const [photoUrl, setPhotoUrl] = useState<string | null>(
    me.photoUrl ?? null,
  );
  const [area, setArea] = useState(areaName(me.areaId));
  const [areaOpen, setAreaOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const phoneDigits = phone.replace(/\D/g, "");
  const phoneOk = phoneDigits.length === 11 && phoneDigits.startsWith("03");
  const nameOk = name.trim().length > 1;
  const valid = nameOk && phoneOk && !!area;
  const [saveError, setSaveError] = useState<string | null>(null);

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

  async function save() {
    if (!valid) return;
    setSaving(true);
    setSaveError(null);
    try {
      const areaId = areas.find((a) => a.name === area)?.id ?? me.areaId;

      // A newly chosen photo is still a file on the phone. It has to reach
      // storage before the account can point at it, or the photo exists for
      // nobody but the person who picked it.
      if (photoUrl && photoUrl !== me.photoUrl && !photoUrl.startsWith("http")) {
        const key = await uploadFile({ uri: photoUrl, kind: "photo" });
        await api.me.setPhoto(key);
      } else if (photoUrl === null && me.photoUrl) {
        await api.me.setPhoto(null);
      }

      await api.me.update({ name: name.trim(), phone, areaId });
      router.back();
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : "We could not save your profile.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <AppBar title="Edit profile" />
      <Screen
        footer={
          <>
            {saveError ? (
              <Text variant="bodySmall" tone="error" style={styles.saveError}>
                {saveError}
              </Text>
            ) : null}
            <Button
              label="Save"
              block
              loading={saving}
              disabled={!valid}
              onPress={save}
            />
          </>
        }
        contentStyle={styles.content}
      >
        <View style={styles.photoBlock}>
          <Avatar name={name || "?"} photoUrl={photoUrl} size="xl" />
          <View style={styles.photoActions}>
            <Button
              label={photoUrl ? "Change photo" : "Add a photo"}
              variant="tertiary"
              size="compact"
              onPress={pickPhoto}
            />
            {photoUrl ? (
              <Button
                label="Remove"
                variant="tertiary"
                size="compact"
                onPress={() => setPhotoUrl(null)}
              />
            ) : null}
          </View>
        </View>

        <Card padding="regular">
          <View style={styles.fields}>
            <Input
              label="Full name"
              icon="user"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
            <Input
              label="Mobile number"
              icon="phone"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              error={
                phone.length > 0 && !phoneOk
                  ? "Enter an 11 digit number starting with 03."
                  : undefined
              }
            />
            <Input
              label="Where you live"
              icon="map-pin"
              value={area}
              hint="Your area only. Your exact address is never asked for."
              onPressField={() => setAreaOpen(true)}
            />
          </View>
        </Card>

        <View style={styles.section}>
          <SectionHeader title="Fixed details" />
          <Card padding="regular">
            {/* Email and institution decide which community the account lives
                in, so they are not free-text fields here. */}
            <View style={styles.fixedRow}>
              <Text variant="caption" tone="tertiary" uppercase>
                Institution email
              </Text>
              <Text variant="bodyLarge">{me.email}</Text>
            </View>
            <View style={styles.fixedRow}>
              <Text variant="caption" tone="tertiary" uppercase>
                Community
              </Text>
              <Text variant="bodyLarge">
                {communityLabel(
                  me.institutionId,
                  me.campusId,
                )}
              </Text>
            </View>
            <Text variant="bodySmall" tone="secondary" style={styles.note}>
              To change your institution, go to My institutions. Changing your
              email needs a new verification code.
            </Text>
          </Card>
        </View>
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
  saveError: {
    marginBottom: spacing.sm,
  },
  content: {
    gap: spacing.lg,
    paddingTop: spacing.base,
  },
  photoBlock: {
    alignItems: "center",
    gap: spacing.sm,
  },
  photoActions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  fields: {
    gap: spacing.lg,
  },
  section: {
    gap: spacing.md,
  },
  fixedRow: {
    gap: 2,
    marginBottom: spacing.base,
  },
  note: {
    marginTop: spacing.xs,
  },
}));
