import { useEffect, useState } from "react";
import { View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { AppBar } from "@/components/app-bar";
import { Button } from "@/components/button";
import { Card } from "@/components/card";
import { ImageUpload } from "@/components/image-upload";
import { Input } from "@/components/input";
import { Screen } from "@/components/screen";
import { SectionHeader } from "@/components/section-header";
import { Sheet } from "@/components/sheet";
import { makeStyles, spacing } from "@/theme";
import { api } from "@/services";
import type { Vehicle, VehicleType } from "@/data/types";

export default function EditVehicle() {
  const styles = useStyles();
  const { type } = useLocalSearchParams<{ type?: string }>();
  const vehicleType: VehicleType = type === "bike" ? "bike" : "car";
  const label = vehicleType === "car" ? "car" : "bike";

  const [existing, setExisting] = useState<Vehicle | null>(null);
  const [model, setModel] = useState("");
  const [plate, setPlate] = useState("");
  const [colour, setColour] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api.vehicles.list().then((list) => {
      if (cancelled) return;
      const match = list.find((v) => v.type === vehicleType);
      if (match) {
        setExisting(match);
        setModel(match.model);
        setPlate(match.plate);
        setColour(match.colour);
        setImageUri(match.imageUrl ?? null);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [vehicleType]);

  const modelOk = model.trim().length > 1;
  const plateOk = plate.trim().length >= 4;
  const colourOk = colour.trim().length > 2;
  const valid = modelOk && plateOk && colourOk;

  async function save() {
    setTouched(true);
    if (!valid) return;
    setSaving(true);
    try {
      await api.vehicles.save({
        id: existing?.id,
        type: vehicleType,
        model: model.trim(),
        plate: plate.trim().toUpperCase(),
        colour: colour.trim(),
        imageUri,
      });
      router.back();
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!existing) return;
    await api.vehicles.remove(existing.id);
    setConfirmRemove(false);
    router.back();
  }

  return (
    <>
      <AppBar title={existing ? `Edit your ${label}` : `Add your ${label}`} />
      <Screen
        footer={
          <Button
            label="Save"
            block
            loading={saving}
            disabled={!valid}
            onPress={save}
          />
        }
        contentStyle={styles.content}
      >
        <View style={styles.section}>
          <SectionHeader title="Details" />
          <Card padding="regular">
            <View style={styles.fields}>
              <Input
                label={vehicleType === "car" ? "Car model" : "Bike model"}
                icon="truck"
                placeholder={
                  vehicleType === "car" ? "Toyota Corolla GLi" : "Honda CG 125"
                }
                value={model}
                onChangeText={setModel}
                autoCapitalize="words"
                onBlur={() => setTouched(true)}
                error={
                  touched && model.length > 0 && !modelOk
                    ? "Enter the make and model."
                    : undefined
                }
              />
              <Input
                label="Number plate"
                icon="hash"
                placeholder="AVR-418"
                value={plate}
                onChangeText={setPlate}
                autoCapitalize="characters"
                autoCorrect={false}
                onBlur={() => setTouched(true)}
                error={
                  touched && plate.length > 0 && !plateOk
                    ? "Enter the full number plate."
                    : undefined
                }
              />
              <Input
                label="Colour"
                icon="droplet"
                placeholder="Silver"
                value={colour}
                onChangeText={setColour}
                autoCapitalize="words"
                onBlur={() => setTouched(true)}
                error={
                  touched && colour.length > 0 && !colourOk
                    ? "Enter the colour."
                    : undefined
                }
              />
            </View>
          </Card>
        </View>

        <View style={styles.section}>
          <SectionHeader
            title="Photo"
            caption="One photo is enough. It helps passengers spot you at the pickup point."
          />
          <Card padding="regular">
            <ImageUpload
              label={`Your ${label}`}
              hint="Show the front of the vehicle with the number plate visible"
              value={imageUri}
              onChange={setImageUri}
            />
          </Card>
        </View>

        {existing ? (
          <Card padding="none">
            <Button
              label={`Remove this ${label}`}
              variant="tertiary"
              block
              onPress={() => setConfirmRemove(true)}
            />
          </Card>
        ) : null}
      </Screen>

      <Sheet
        visible={confirmRemove}
        onClose={() => setConfirmRemove(false)}
        title={`Remove your ${label}?`}
        caption="Any commute where you offer seats with this vehicle will be paused until you add another."
      >
        <View style={styles.sheetActions}>
          <Button
            label="Remove"
            variant="destructive"
            block
            onPress={remove}
          />
          <Button
            label="Keep it"
            variant="tertiary"
            block
            onPress={() => setConfirmRemove(false)}
          />
        </View>
      </Sheet>
    </>
  );
}

const useStyles = makeStyles(() => ({
  content: {
    gap: spacing.lg,
    paddingTop: spacing.base,
  },
  section: {
    gap: spacing.md,
  },
  fields: {
    gap: spacing.lg,
  },
  sheetActions: {
    paddingHorizontal: spacing.base,
    gap: spacing.sm,
  },
}));
