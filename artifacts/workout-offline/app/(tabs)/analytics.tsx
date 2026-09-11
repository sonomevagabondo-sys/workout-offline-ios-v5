import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useWorkout } from '@/context/WorkoutContext';
import {
  dayVolume,
  estimatedOneRepMax,
  formatItalianDate,
  HistorySet,
} from '@/domain/workout';
import { EmptyState, Pill, ScreenHeader, SectionTitle } from '@/components/WorkoutUI';

type Metric = 'Volume' | 'Peso massimo' | '1RM stimato';

type CurrentCycle = {
  cycleNumber: number;
  volume: number;
  completedDays: number;
  totalTrainingDays: number;
  completedOn: string;
  sets: HistorySet[];
};

export default function AnalyticsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const workout = useWorkout();
  const [metric, setMetric] = useState<Metric>('Volume');
  const [expandedCycle, setExpandedCycle] = useState<number | null>(workout.program.cycleNumber);
  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  const currentVolume = workout.program.days.reduce((total, day) => total + dayVolume(day), 0);
  const currentCycle: CurrentCycle = {
    cycleNumber: workout.program.cycleNumber,
    volume: currentVolume,
    completedDays: workout.program.days.filter((day) => day.completed).length,
    totalTrainingDays: workout.program.days.filter((day) => day.type !== 'Rest').length,
    completedOn: workout.today,
    sets: [],
  };
  const cycles = [
    ...workout.history.map((cycle) => ({ ...cycle, sets: cycle.sets ?? [] })),
    currentCycle,
  ];
  const bestExercises = useMemo(
    () =>
      workout.program.days
        .flatMap((day) => day.exercises)
        .reduce<Record<string, { weight: number; volume: number }>>((acc, exercise) => {
          const current = acc[exercise.name] ?? { weight: 0, volume: 0 };
          exercise.sets.forEach((set) => {
            current.weight = Math.max(current.weight, Number(set.weight || 0));
            current.volume += Number(set.weight || 0) * Number(set.reps || 0);
          });
          acc[exercise.name] = current;
          return acc;
        }, {}),
    [workout.program.days],
  );
  const muscleStats = useMemo(() => {
    const stats = new Map<string, { volume: number; exercises: number }>();
    workout.program.days.forEach((day) => {
      day.exercises.forEach((exercise) => {
        const current = stats.get(exercise.group) ?? { volume: 0, exercises: 0 };
        current.exercises += 1;
        current.volume += exercise.sets.reduce((total, set) => total + Number(set.weight || 0) * Number(set.reps || 0), 0);
        stats.set(exercise.group, current);
      });
    });
    return Array.from(stats.entries())
      .map(([group, values]) => ({ group, ...values }))
      .sort((a, b) => b.volume - a.volume || b.exercises - a.exercises);
  }, [workout.program.days]);

  return (
    <View style={[page.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          page.content,
          { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 110 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader eyebrow="Il tuo percorso" title="Statistiche" />
        <View style={page.summaryGrid}>
          <SummaryCard icon="activity" label="Streak" value={`${workout.streak}`} suffix="giorni" color={colors.orange} />
          <SummaryCard icon="award" label="Record" value={`${workout.record}`} suffix="giorni" color={colors.primary} />
          <SummaryCard icon="bar-chart-2" label="Volume ciclo" value={`${Math.round(currentVolume)}`} suffix="kg" color={colors.success} />
        </View>

        <SectionTitle title="Volume per ciclo" action={<Pill tone="purple">IN CORSO</Pill>} />
        <View style={[page.chartCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={page.barChart}>
            {cycles.slice(-6).map((cycle) => {
              const max = Math.max(...cycles.map((item) => item.volume), 1);
              const height = Math.max(8, (cycle.volume / max) * 132);
              return (
                <View key={cycle.cycleNumber} style={page.barItem}>
                  <View style={page.barValueWrap}>
                    <Text style={[page.barValue, { color: colors.mutedForeground }]}>
                      {cycle.volume > 999 ? `${(cycle.volume / 1000).toFixed(1)}k` : Math.round(cycle.volume)}
                    </Text>
                    <View style={[page.bar, { height, backgroundColor: cycle.cycleNumber === workout.program.cycleNumber ? colors.primary : colors.muted }]} />
                  </View>
                  <Text style={[page.barLabel, { color: colors.mutedForeground }]}>
                    {cycle.cycleNumber === workout.program.cycleNumber ? 'Ora' : `C${cycle.cycleNumber}`}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        <SectionTitle title="Progressione esercizi" />
        <View style={[page.segmented, { backgroundColor: colors.muted }]}>
          {(['Volume', 'Peso massimo', '1RM stimato'] as const).map((item) => (
            <Text
              key={item}
              onPress={() => setMetric(item)}
              style={[
                page.segment,
                {
                  color: metric === item ? colors.foreground : colors.mutedForeground,
                  backgroundColor: metric === item ? colors.card : 'transparent',
                },
              ]}
            >
              {item}
            </Text>
          ))}
        </View>
        <View style={[page.progressCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={page.progressHeader}>
            <View style={[page.exerciseDot, { backgroundColor: colors.accent }]}>
              <Feather name="trending-up" size={18} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[page.progressTitle, { color: colors.foreground }]}>Panca piana</Text>
              <Text style={[page.progressSubtitle, { color: colors.mutedForeground }]}>{metric} · ultimo ciclo</Text>
            </View>
            <Text style={[page.progressMetric, { color: colors.success }]}>+12%</Text>
          </View>
          <View style={page.lineChart}>
            <View style={[page.guideLine, { backgroundColor: colors.border, top: 24 }]} />
            <View style={[page.guideLine, { backgroundColor: colors.border, top: 68 }]} />
            <View style={[page.guideLine, { backgroundColor: colors.border, top: 112 }]} />
            <View style={[page.line, { backgroundColor: colors.primary, transform: [{ rotate: '-14deg' }], top: 62, left: 25, width: 90 }]} />
            <View style={[page.line, { backgroundColor: colors.primary, transform: [{ rotate: '20deg' }], top: 39, left: 107, width: 72 }]} />
            <View style={[page.line, { backgroundColor: colors.primary, transform: [{ rotate: '-10deg' }], top: 64, left: 176, width: 92 }]} />
          </View>
          <View style={page.axis}>
            <Text style={[page.axisText, { color: colors.mutedForeground }]}>C1</Text>
            <Text style={[page.axisText, { color: colors.mutedForeground }]}>C2</Text>
            <Text style={[page.axisText, { color: colors.mutedForeground }]}>C3</Text>
            <Text style={[page.axisText, { color: colors.mutedForeground }]}>Ora</Text>
          </View>
        </View>

        <SectionTitle title="Dettaglio allenamenti" action={<Text style={[page.sectionHint, { color: colors.mutedForeground }]}>peso · rip.</Text>} />
        <View style={[page.detailCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {cycles.slice().reverse().map((cycle) => {
            const isCurrent = cycle.cycleNumber === workout.program.cycleNumber;
            const cycleOpen = expandedCycle === cycle.cycleNumber;
            const cycleDays = isCurrent
              ? workout.program.days.map((day) => ({
                  order: day.order,
                  name: day.name,
                  type: day.type,
                  sets: day.exercises.flatMap((exercise) =>
                    exercise.sets.map((set, setIndex) => ({
                      dayOrder: day.order,
                      dayName: day.name,
                      dayType: day.type,
                      exerciseName: exercise.name,
                      group: exercise.group,
                      setIndex,
                      weight: Number(set.weight || 0),
                      reps: Number(set.reps || 0),
                      completedOn: day.completedOn ?? workout.today,
                    })),
                  ),
                }))
              : Array.from(new Set(cycle.sets.map((set) => set.dayOrder))).sort((a, b) => a - b).map((order) => ({
                  order,
                  name: cycle.sets.find((set) => set.dayOrder === order)?.dayName ?? `Giorno ${order}`,
                  type: cycle.sets.find((set) => set.dayOrder === order)?.dayType ?? 'Rest',
                  sets: cycle.sets.filter((set) => set.dayOrder === order),
                }));

            return (
              <View key={cycle.cycleNumber} style={[page.cycleBlock, { borderBottomColor: colors.border }]}>
                <Pressable onPress={() => setExpandedCycle(cycleOpen ? null : cycle.cycleNumber)} style={page.cycleHeader}>
                  <View style={[page.cycleDot, { backgroundColor: isCurrent ? colors.primary : colors.muted }]}>
                    <Text style={[page.cycleDotText, { color: isCurrent ? colors.primaryForeground : colors.mutedForeground }]}>{cycle.cycleNumber}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[page.cycleName, { color: colors.foreground }]}>Ciclo {cycle.cycleNumber} {isCurrent ? '· in corso' : ''}</Text>
                    <Text style={[page.cycleMeta, { color: colors.mutedForeground }]}>{Math.round(cycle.volume).toLocaleString('it-IT')} kg · {cycle.completedDays}/{cycle.totalTrainingDays} giorni</Text>
                  </View>
                  <Feather name={cycleOpen ? 'chevron-up' : 'chevron-down'} size={18} color={colors.mutedForeground} />
                </Pressable>
                {cycleOpen ? (
                  <View style={page.cycleContent}>
                    {cycleDays.map((day) => {
                      const dayKey = `${cycle.cycleNumber}-${day.order}`;
                      const dayOpen = expandedDay === dayKey;
                      const exerciseNames = Array.from(new Set(day.sets.map((set) => set.exerciseName)));
                      return (
                        <View key={dayKey} style={[page.detailDay, { borderTopColor: colors.border }]}>
                          <Pressable onPress={() => setExpandedDay(dayOpen ? null : dayKey)} style={page.detailDayHeader}>
                            <View style={{ flex: 1 }}>
                              <Text style={[page.detailDayTitle, { color: colors.foreground }]}>Giorno {day.order} · {day.type === 'Rest' ? 'Riposo' : day.type}</Text>
                              <Text style={[page.detailDayMeta, { color: colors.mutedForeground }]}>
                                {day.type === 'Rest' ? 'Nessuna serie' : `${exerciseNames.length} esercizi · ${day.sets.length} serie`}
                              </Text>
                            </View>
                            <Feather name={dayOpen ? 'minus-circle' : 'plus-circle'} size={18} color={colors.primary} />
                          </Pressable>
                          {dayOpen && day.type !== 'Rest' ? (
                            <View style={page.exerciseDetails}>
                              {exerciseNames.map((exerciseName) => {
                                const exerciseSets = day.sets.filter((set) => set.exerciseName === exerciseName);
                                return (
                                  <View key={exerciseName} style={page.exerciseDetail}>
                                    <View style={page.exerciseDetailHeader}>
                                      <Text style={[page.exerciseDetailName, { color: colors.foreground }]}>{exerciseName}</Text>
                                      <Text style={[page.exerciseDetailGroup, { color: colors.mutedForeground }]}>{exerciseSets[0]?.group}</Text>
                                    </View>
                                    {exerciseSets.map((set) => (
                                      <View key={`${exerciseName}-${set.setIndex}`} style={[page.historySetRow, { backgroundColor: colors.surface2 }]}>
                                        <Text style={[page.historySetNumber, { color: colors.mutedForeground }]}>{set.setIndex + 1}</Text>
                                        <Text style={[page.historySetValue, { color: colors.foreground }]}>{set.weight > 0 ? `${set.weight} kg` : '—'}</Text>
                                        <Text style={[page.historySetSeparator, { color: colors.mutedForeground }]}>×</Text>
                                        <Text style={[page.historySetValue, { color: colors.foreground }]}>{set.reps > 0 ? `${set.reps} rip.` : '—'}</Text>
                                      </View>
                                    ))}
                                  </View>
                                );
                              })}
                            </View>
                          ) : null}
                        </View>
                      );
                    })}
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>

        <SectionTitle title="I tuoi record" />
        {Object.entries(bestExercises).filter(([, item]) => item.weight > 0).slice(0, 4).map(([name, item]) => (
          <View key={name} style={[page.recordRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[page.recordIcon, { backgroundColor: colors.accent }]}><Feather name="arrow-up" size={16} color={colors.primary} /></View>
            <View style={{ flex: 1 }}><Text style={[page.recordName, { color: colors.foreground }]}>{name}</Text><Text style={[page.recordMeta, { color: colors.mutedForeground }]}>Miglior peso · {formatItalianDate(workout.today)}</Text></View>
            <View style={page.recordRight}><Text style={[page.recordValue, { color: colors.foreground }]}>{item.weight} kg</Text><Text style={[page.recordMeta, { color: colors.mutedForeground }]}>1RM {Math.round(estimatedOneRepMax(item.weight, 8))}</Text></View>
          </View>
        ))}
        {Object.values(bestExercises).every((item) => item.weight === 0) ? <EmptyState title="Costruisci i tuoi record" description="Completa il tuo primo allenamento per vedere i migliori carichi per esercizio." /> : null}

        <SectionTitle title="Gruppi muscolari" />
        <View style={[page.muscleCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {muscleStats.length === 0 ? <Text style={[page.muscleEmpty, { color: colors.mutedForeground }]}>Aggiungi esercizi al programma per vedere i gruppi muscolari.</Text> : muscleStats.map((item, index) => {
            const totalVolume = muscleStats.reduce((total, stat) => total + stat.volume, 0);
            const totalExercises = muscleStats.reduce((total, stat) => total + stat.exercises, 0);
            const percentage = totalVolume > 0 ? Math.round((item.volume / totalVolume) * 100) : Math.round((item.exercises / totalExercises) * 100);
            return <View key={item.group} style={page.muscleRow}>
              <View style={{ flex: 1 }}><Text style={[page.muscleName, { color: colors.foreground }]}>{item.group}</Text><View style={[page.muscleTrack, { backgroundColor: colors.muted }]}><View style={[page.muscleFill, { backgroundColor: [colors.primary, colors.orange, colors.success, colors.accentForeground][index % 4], width: `${Math.max(percentage, 4)}%` }]} /></View></View>
              <Text style={[page.muscleValue, { color: colors.mutedForeground }]}>{percentage}%</Text>
            </View>;
          })}
        </View>
      </ScrollView>
    </View>
  );
}

function SummaryCard({ icon, label, value, suffix, color }: { icon: keyof typeof Feather.glyphMap; label: string; value: string; suffix: string; color: string }) {
  const colors = useColors();
  return <View style={[page.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}><View style={[page.summaryIcon, { backgroundColor: `${color}22` }]}><Feather name={icon} size={16} color={color} /></View><Text style={[page.summaryLabel, { color: colors.mutedForeground }]}>{label}</Text><Text style={[page.summaryValue, { color: colors.foreground }]}>{value}<Text style={[page.summarySuffix, { color: colors.mutedForeground }]}> {suffix}</Text></Text></View>;
}

const page = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 18 },
  summaryGrid: { flexDirection: 'row', gap: 8 },
  summaryCard: { flex: 1, minHeight: 118, borderWidth: 1, borderRadius: 16, padding: 12 },
  summaryIcon: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  summaryLabel: { fontSize: 11, fontWeight: '700' },
  summaryValue: { fontSize: 20, fontWeight: '900', marginTop: 4 },
  summarySuffix: { fontSize: 10, fontWeight: '700' },
  chartCard: { borderRadius: 18, borderWidth: 1, padding: 16, minHeight: 205 },
  barChart: { height: 165, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', paddingTop: 10 },
  barItem: { alignItems: 'center', justifyContent: 'flex-end', height: '100%', gap: 8 },
  barValueWrap: { height: 145, justifyContent: 'flex-end', alignItems: 'center', gap: 5 },
  barValue: { fontSize: 9, fontWeight: '700' },
  bar: { width: 26, borderRadius: 8 },
  barLabel: { fontSize: 10, fontWeight: '700' },
  segmented: { borderRadius: 12, padding: 3, flexDirection: 'row', marginBottom: 10 },
  segment: { flex: 1, paddingVertical: 9, textAlign: 'center', borderRadius: 10, fontSize: 11, fontWeight: '800' },
  progressCard: { borderRadius: 18, borderWidth: 1, padding: 16 },
  progressHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  exerciseDot: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  progressTitle: { fontSize: 15, fontWeight: '800' },
  progressSubtitle: { fontSize: 11, marginTop: 3 },
  progressMetric: { fontSize: 13, fontWeight: '900' },
  lineChart: { height: 140, marginTop: 18, overflow: 'hidden', position: 'relative' },
  guideLine: { height: 1, left: 0, right: 0, position: 'absolute' },
  line: { height: 3, position: 'absolute', borderRadius: 3, transformOrigin: 'left center' },
  axis: { flexDirection: 'row', justifyContent: 'space-between' },
  axisText: { fontSize: 10 },
  sectionHint: { fontSize: 11, fontWeight: '700' },
  detailCard: { borderRadius: 18, borderWidth: 1, overflow: 'hidden' },
  cycleBlock: { borderBottomWidth: 1 },
  cycleHeader: { minHeight: 68, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 10 },
  cycleDot: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  cycleDotText: { fontSize: 12, fontWeight: '900' },
  cycleName: { fontSize: 14, fontWeight: '900' },
  cycleMeta: { fontSize: 11, marginTop: 3 },
  cycleContent: { paddingHorizontal: 13 },
  detailDay: { borderTopWidth: 1 },
  detailDayHeader: { minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 8 },
  detailDayTitle: { fontSize: 13, fontWeight: '800' },
  detailDayMeta: { fontSize: 11, marginTop: 3 },
  exerciseDetails: { paddingBottom: 12 },
  exerciseDetail: { marginBottom: 12 },
  exerciseDetailHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  exerciseDetailName: { fontSize: 12, fontWeight: '800' },
  exerciseDetailGroup: { fontSize: 10 },
  historySetRow: { minHeight: 32, borderRadius: 8, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 9, marginBottom: 4 },
  historySetNumber: { width: 22, fontSize: 11, fontWeight: '800' },
  historySetValue: { flex: 1, fontSize: 12, fontWeight: '700' },
  historySetSeparator: { fontSize: 12, paddingHorizontal: 8 },
  recordRow: { borderRadius: 15, borderWidth: 1, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  recordIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  recordName: { fontSize: 14, fontWeight: '800' },
  recordMeta: { fontSize: 11, marginTop: 3 },
  recordRight: { alignItems: 'flex-end' },
  recordValue: { fontSize: 14, fontWeight: '900' },
  muscleCard: { borderRadius: 18, borderWidth: 1, padding: 16, gap: 16 },
  muscleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  muscleName: { fontSize: 13, fontWeight: '800', marginBottom: 7 },
  muscleTrack: { height: 7, borderRadius: 7, overflow: 'hidden' },
  muscleFill: { height: 7, borderRadius: 7 },
  muscleValue: { fontSize: 12, fontWeight: '800', width: 35, textAlign: 'right' },
  muscleEmpty: { fontSize: 12, lineHeight: 18 },
});