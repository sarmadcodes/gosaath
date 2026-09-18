import { useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Button } from "@/components/button";
import { Sheet } from "@/components/sheet";
import { Text } from "@/components/text";
import { makeStyles, radius, spacing, useColors } from "@/theme";

export type TimePickerProps = {
  visible: boolean;
  title: string;
  caption?: string;
  /** "7:30 AM" — the same string format stored on a DaySchedule. */
  value?: string;
  onClose: () => void;
  onSelect: (value: string) => void;
  /** Offered per day only: marks that day as not travelling. */
  onClear?: () => void;
  clearLabel?: string;
};

const HOURS = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
/** Five-minute steps: nobody sets a class time to 8:03. */
const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

type Meridiem = "AM" | "PM";

/** Fixed so the column can scroll the selected value into view exactly. */
const ITEM_HEIGHT = 40;
const ITEM_GAP = 8;

function parse(value?: string) {
  const match = value?.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return { hour: 8, minute: 0, meridiem: "AM" as Meridiem };
  return {
    hour: Number(match[1]),
    minute: Number(match[2]),
    meridiem: match[3]!.toUpperCase() as Meridiem,
  };
}

function format(hour: number, minute: number, meridiem: Meridiem) {
  return `${hour}:${String(minute).padStart(2, "0")} ${meridiem}`;
}

/**
 * Manual time selection.
 *
 * A fixed list of preset times only works while everyone's timetable looks the
 * same, and university timetables do not — an 8:45 lab and a 1:15 lecture are
 * both ordinary. Hour and minute are chosen directly instead, in five-minute
 * steps because a class does not start at 8:03.
 */
export function TimePicker({
  visible,
  title,
  caption,
  value,
  onClose,
  onSelect,
  onClear,
  clearLabel = "Not travelling this day",
}: TimePickerProps) {
  const styles = useStyles();
  const colors = useColors();

  const [hour, setHour] = useState(() => parse(value).hour);
  const [minute, setMinute] = useState(() => parse(value).minute);
  const [meridiem, setMeridiem] = useState<Meridiem>(
    () => parse(value).meridiem,
  );
  const [openedAt, setOpenedAt] = useState(0);

  // Re-seed each time it opens: the sheet stays mounted between uses, and the
  // same picker serves several fields.
  useEffect(() => {
    if (!visible) return;
    const parsed = parse(value);
    setHour(parsed.hour);
    setMinute(parsed.minute);
    setMeridiem(parsed.meridiem);
    setOpenedAt((n) => n + 1);
  }, [visible, value]);

  return (
    <Sheet visible={visible} onClose={onClose} title={title} caption={caption}>
      <View style={styles.body}>
        <View style={styles.preview}>
          <Feather name="clock" size={16} color={colors.brand} />
          <Text variant="h2" tone="brand">
            {format(hour, minute, meridiem)}
          </Text>
        </View>

        <View style={styles.columns}>
          <Column
            label="Hour"
            items={HOURS}
            selected={hour}
            onSelect={setHour}
            scrollKey={openedAt}
          />
          <Column
            label="Minute"
            items={MINUTES}
            selected={minute}
            onSelect={setMinute}
            pad
            scrollKey={openedAt}
          />
          <View style={styles.meridiemColumn}>
            <Text variant="caption" tone="tertiary" uppercase>
              AM / PM
            </Text>
            <View style={styles.meridiemStack}>
              {(["AM", "PM"] as Meridiem[]).map((m) => {
                const active = meridiem === m;
                return (
                  <Pressable
                    key={m}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={m}
                    onPress={() => setMeridiem(m)}
                    style={[styles.cell, active && styles.cellActive]}
                  >
                    <Text
                      variant="bodyLarge"
                      tone={active ? "onBrand" : "primary"}
                    >
                      {m}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>

        <Button
          label="Set time"
          block
          style={styles.confirm}
          onPress={() => {
            onSelect(format(hour, minute, meridiem));
            onClose();
          }}
        />
        {onClear ? (
          <Button
            label={clearLabel}
            variant="tertiary"
            block
            style={styles.clear}
            onPress={() => {
              onClear();
              onClose();
            }}
          />
        ) : null}
      </View>
    </Sheet>
  );
}

function Column({
  label,
  items,
  selected,
  onSelect,
  pad,
  scrollKey,
}: {
  label: string;
  items: number[];
  selected: number;
  onSelect: (value: number) => void;
  pad?: boolean;
  /** Changes when the sheet opens, so the column re-centres its selection. */
  scrollKey: number;
}) {
  const styles = useStyles();
  const ref = useRef<ScrollView>(null);

  // A selected value scrolled out of sight reads as nothing being selected,
  // which is how someone ends up setting a time they did not mean to.
  useEffect(() => {
    const index = items.indexOf(selected);
    if (index < 0) return;
    const y = Math.max(0, index * (ITEM_HEIGHT + ITEM_GAP) - ITEM_HEIGHT);
    const timer = setTimeout(
      () => ref.current?.scrollTo({ y, animated: false }),
      60,
    );
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrollKey]);

  return (
    <View style={styles.column}>
      <Text variant="caption" tone="tertiary" uppercase>
        {label}
      </Text>
      <ScrollView
        ref={ref}
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {items.map((item) => {
          const active = item === selected;
          const text = pad ? String(item).padStart(2, "0") : String(item);
          return (
            <Pressable
              key={item}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              accessibilityLabel={text}
              onPress={() => onSelect(item)}
              style={[styles.cell, active && styles.cellActive]}
            >
              <Text variant="bodyLarge" tone={active ? "onBrand" : "primary"}>
                {text}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  body: {
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.base,
  },
  preview: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
    borderRadius: radius.md,
    backgroundColor: c.brandSecondary,
  },
  columns: {
    flexDirection: "row",
    gap: spacing.md,
  },
  column: {
    flex: 1,
    gap: spacing.sm,
  },
  meridiemColumn: {
    width: 74,
    gap: spacing.sm,
  },
  meridiemStack: {
    gap: ITEM_GAP,
  },
  scroll: {
    height: 176,
  },
  scrollContent: {
    gap: ITEM_GAP,
    paddingBottom: spacing.sm,
  },
  cell: {
    height: ITEM_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.surface,
  },
  cellActive: {
    backgroundColor: c.brand,
    borderColor: c.brand,
  },
  confirm: {
    marginTop: spacing.lg,
  },
  clear: {
    marginTop: spacing.sm,
  },
}));
