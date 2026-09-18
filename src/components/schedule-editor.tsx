import { useState } from "react";
import { Pressable, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Card } from "@/components/card";
import { DayPicker } from "@/components/day-picker";
import { Input } from "@/components/input";
import { OptionSheet } from "@/components/option-sheet";
import { TimePicker } from "@/components/time-picker";
import { Text } from "@/components/text";
import { ToggleRow } from "@/components/toggle-row";
import { makeStyles, MIN_TOUCH_TARGET, spacing, useColors } from "@/theme";
import {
  applyToAll,
  daysOf,
  describeDayTimes,
  isUniform,
  sortSchedule,
  syncScheduleToDays,
  uniformTimes,
} from "@/utils/schedule";
import type { CommuteDirection, DaySchedule, Weekday } from "@/data/types";

export const DEPARTURE_TIMES = [
  "6:30 AM",
  "7:00 AM",
  "7:15 AM",
  "7:30 AM",
  "7:45 AM",
  "8:00 AM",
  "8:30 AM",
  "9:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
];

export const RETURN_TIMES = [
  "12:00 PM",
  "1:00 PM",
  "2:00 PM",
  "3:00 PM",
  "3:30 PM",
  "4:00 PM",
  "4:30 PM",
  "5:00 PM",
  "5:30 PM",
  "6:00 PM",
  "7:00 PM",
  "8:00 PM",
];

/** Lets a day be marked as "not travelling this leg". */
const NOT_TRAVELLING = "Not travelling";

export type ScheduleEditorProps = {
  schedule: DaySchedule[];
  onChange: (schedule: DaySchedule[]) => void;
  direction: CommuteDirection;
};

type Leg = "departure" | "return";
type TimeTarget = { day: Weekday | "all"; leg: Leg };

/**
 * Days plus times, where the times may differ per day.
 *
 * Timetables are rarely uniform, but most people still travel at one time on
 * most days. So "same time every day" is the default and stays a two-tap job,
 * and per-day editing is one switch away rather than the starting point.
 *
 * Per-day rows expand inline rather than opening a sheet, because the time
 * picker is itself a sheet and stacking modals is fragile on Android.
 */
export function ScheduleEditor({
  schedule,
  onChange,
  direction,
}: ScheduleEditorProps) {
  const styles = useStyles();
  const colors = useColors();

  const [perDay, setPerDay] = useState(() => !isUniform(schedule));
  const [expanded, setExpanded] = useState<Weekday | null>(null);
  const [target, setTarget] = useState<TimeTarget | null>(null);

  const days = daysOf(schedule);
  const shared = uniformTimes(schedule);
  const showDeparture = direction !== "returning";
  const showReturn = direction !== "going";

  function setDays(nextDays: Weekday[]) {
    onChange(syncScheduleToDays(schedule, nextDays));
  }

  function setPerDayMode(on: boolean) {
    setPerDay(on);
    setExpanded(null);
    if (!on) {
      // Collapsing back to one time: the first day's times win, so the user
      // never keeps a schedule they can no longer see on screen.
      const first = sortSchedule(schedule)[0];
      onChange(applyToAll(days, first?.arriveBy, first?.leaveCampusAt));
    }
  }

  function setTime(value: string) {
    if (!target) return;
    const key = target.leg === "departure" ? "arriveBy" : "leaveCampusAt";
    const next = value === NOT_TRAVELLING ? undefined : value;

    onChange(
      schedule.map((entry) =>
        target.day === "all" || entry.day === target.day
          ? { ...entry, [key]: next }
          : entry,
      ),
    );
  }

  const targetEntry =
    target && target.day !== "all"
      ? schedule.find((e) => e.day === target.day)
      : undefined;

  const currentValue =
    target?.day === "all"
      ? target.leg === "departure"
        ? shared?.arriveBy
        : shared?.leaveCampusAt
      : target?.leg === "departure"
        ? targetEntry?.arriveBy
        : targetEntry?.leaveCampusAt;

  return (
    <>
      <Card padding="regular">
        <DayPicker value={days} onChange={setDays} />
        {days.length === 0 ? (
          <Text variant="bodySmall" tone="error" style={styles.error}>
            Choose at least one day.
          </Text>
        ) : null}
      </Card>

      {days.length > 0 ? (
        <>
          <Card padding="none">
            <ToggleRow
              label="Different times on some days"
              caption="Turn this on if your timetable changes during the week"
              icon="sliders"
              value={perDay}
              onChange={setPerDayMode}
              last
            />
          </Card>

          {perDay ? (
            <Card padding="none">
              {sortSchedule(schedule).map((entry, index) => {
                const isOpen = expanded === entry.day;
                const last = index === schedule.length - 1;
                return (
                  <View key={entry.day}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityState={{ expanded: isOpen }}
                      accessibilityLabel={`${entry.day}. ${describeDayTimes(entry)}`}
                      onPress={() => setExpanded(isOpen ? null : entry.day)}
                      style={({ pressed }) => [
                        styles.dayRow,
                        !last && !isOpen && styles.divider,
                        pressed && styles.pressed,
                      ]}
                    >
                      <Text variant="h4" style={styles.dayLabel}>
                        {entry.day}
                      </Text>
                      <Text
                        variant="body"
                        tone={
                          entry.arriveBy || entry.leaveCampusAt
                            ? "secondary"
                            : "tertiary"
                        }
                        style={styles.flex}
                        numberOfLines={1}
                      >
                        {describeDayTimes(entry)}
                      </Text>
                      <Feather
                        name={isOpen ? "chevron-up" : "chevron-down"}
                        size={18}
                        color={colors.textTertiary}
                      />
                    </Pressable>

                    {isOpen ? (
                      <View style={[styles.expanded, !last && styles.divider]}>
                        {showDeparture ? (
                          <Input
                            label="Class starts at"
                            icon="clock"
                            value={entry.arriveBy ?? ""}
                            placeholder={NOT_TRAVELLING}
                            onPressField={() =>
                              setTarget({ day: entry.day, leg: "departure" })
                            }
                          />
                        ) : null}
                        {showReturn ? (
                          <Input
                            label="Class ends at"
                            icon="log-out"
                            value={entry.leaveCampusAt ?? ""}
                            placeholder={NOT_TRAVELLING}
                            onPressField={() =>
                              setTarget({ day: entry.day, leg: "return" })
                            }
                          />
                        ) : null}
                      </View>
                    ) : null}
                  </View>
                );
              })}
            </Card>
          ) : (
            <Card padding="regular">
              <View style={styles.fields}>
                {showDeparture ? (
                  <Input
                    label="Class starts at"
                    icon="clock"
                    value={shared?.arriveBy ?? ""}
                    placeholder="Select a time"
                    onPressField={() => setTarget({ day: "all", leg: "departure" })}
                  />
                ) : null}
                {showReturn ? (
                  <Input
                    label="Class ends at"
                    icon="log-out"
                    value={shared?.leaveCampusAt ?? ""}
                    placeholder="Select a time"
                    onPressField={() => setTarget({ day: "all", leg: "return" })}
                  />
                ) : null}
              </View>
            </Card>
          )}
        </>
      ) : null}

      {/* Times are chosen directly rather than picked from a fixed list:
          university timetables do not fall on tidy half hours. */}
      <TimePicker
        visible={!!target}
        onClose={() => setTarget(null)}
        title={target?.leg === "return" ? "Class ends at" : "Class starts at"}
        caption={
          target?.leg === "return"
            ? "When you are done on campus and heading back."
            : "The time you need to be on campus by."
        }
        value={currentValue === NOT_TRAVELLING ? undefined : currentValue}
        onSelect={setTime}
        onClear={
          target && target.day !== "all"
            ? () => setTime(NOT_TRAVELLING)
            : undefined
        }
      />
    </>
  );
}

const useStyles = makeStyles((c) => ({
  error: {
    marginTop: spacing.md,
  },
  fields: {
    gap: spacing.base,
  },
  dayRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
    minHeight: MIN_TOUCH_TARGET + 6,
  },
  expanded: {
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.base,
    gap: spacing.base,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: c.border,
  },
  pressed: {
    backgroundColor: c.surfaceSecondary,
  },
  dayLabel: {
    width: 44,
  },
  flex: {
    flex: 1,
  },
}));
