import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useWorkout } from '@/context/WorkoutContext';
import { dayVolume, formatItalianDate, isDayReadyToFinish, isMilestone } from '@/domain/workout';
import { Pill, PrimaryButton, ScreenHeader, SectionTitle, SetRow, styles as ui } from '@/components/WorkoutUI';

export default function WorkoutScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const workout = useWorkout();
  const [expanded, setExpanded] = useState(true);
  const [celebration, setCelebration] = useState<{ streak: number; epic: boolean; newRecord: boolean } | null>(null);

  useEffect(() => {
    if (workout.streakLostNotice) {
      Alert.alert('Hai perso la streak', 'Un giorno di allenamento è stato saltato. La prossima sessione riparte da 1.', [{ text: 'OK', onPress: workout.dismissStreakLost }], { cancelable: false });
    }
  }, [workout.streakLostNotice]);

  const todayDay = workout.todayDay;
  const ready = todayDay ? isDayReadyToFinish(todayDay) : false;
  const trainingDays = workout.program.days.filter((day) => day.type !== 'Rest').length;
  const completedTrainingDays = workout.program.days.filter((day) => day.completed).length;
  const cycleProgress = Math.min(workout.cycleDay + 1, 7);

  const finish = () => {
    if (todayDay.completed) {
      Alert.alert(`Hai già completato Giorno ${todayDay.order}`, 'Vuoi salvare i nuovi pesi?', [{ text: 'Annulla', style: 'cancel' }, { text: 'Conferma', onPress: () => setCelebration(workout.finishToday()) }]);
      return;
    }
    setCelebration(workout.finishToday());
  };

  if (!workout.hydrated) return <View style={[page.loading, { backgroundColor: colors.background }]}><Text style={{ color: colors.mutedForeground }}>Caricamento...</Text></View>;

  return (
    <View style={[page.root, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={[page.content, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 110 }]} showsVerticalScrollIndicator={false}>
        <ScreenHeader eyebrow={`Programma: ${workout.program.name}`} title="Allenamento" right={<View style={page.streakBadge}><Text style={page.streakIcon}>✦</Text><View><Text style={[page.streakValue, { color: colors.orange }]}>{workout.streak} giorni</Text><Text style={[page.streakRecord, { color: colors.mutedForeground }]}>record {workout.record}</Text></View></View>} />
        <View style={[page.cycleBanner, { backgroundColor: colors.primary }]}>
          <View><Text style={page.cycleEyebrow}>CICLO {workout.program.cycleNumber}</Text><Text style={page.cycleTitle}>Giorno {cycleProgress} <Text style={page.cycleSub}>di 7</Text></Text></View>
          <View style={page.progressTrack}><View style={[page.progressFill, { width: `${(cycleProgress / 7) * 100}%` }]} /></View>
        </View>
        <Pressable onPress={() => router.push('/programs')} style={({ pressed }) => [page.programSwitch, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.75 : 1 }]}>
          <View style={[page.programGlyph, { backgroundColor: colors.accent }]}><Feather name="layers" size={18} color={colors.primary} /></View>
          <View style={{ flex: 1 }}><Text style={[page.programLabel, { color: colors.mutedForeground }]}>Programma attivo</Text><Text style={[page.programName, { color: colors.foreground }]}>{workout.program.name}</Text></View>
          <Text style={[page.newProgram, { color: colors.primary }]}>+ Nuovo</Text><Feather name="chevron-right" size={18} color={colors.mutedForeground} />
        </Pressable>
        <SectionTitle title="Questa settimana" action={<Text style={[page.adherence, { color: colors.mutedForeground }]}>{completedTrainingDays}/{trainingDays} giorni</Text>} />
        <View style={page.dayList}>
          {workout.program.days.map((day) => {
            const isToday = day.order === cycleProgress;
            const isRest = day.type === 'Rest';
            return (
              <View key={day.id} style={[page.dayCard, { backgroundColor: colors.card, borderColor: isToday ? colors.primary : colors.border, borderWidth: isToday ? 1.5 : 1 }]}>
                <Pressable onPress={() => setExpanded(isToday ? !expanded : expanded)} style={page.dayHeader}>
                  <View style={[page.dayNumber, { backgroundColor: day.completed ? `${colors.success}22` : day.skipped ? `${colors.destructive}22` : isToday ? colors.accent : colors.muted }]}>{day.completed ? <Feather name="check" size={15} color={colors.success} /> : day.skipped ? <Feather name="x" size={15} color={colors.destructive} /> : <Text style={[page.dayNumberText, { color: isToday ? colors.primary : colors.mutedForeground }]}>{day.order}</Text>}</View>
                  <View style={{ flex: 1 }}><Text style={[page.dayTitle, { color: colors.foreground }]}>Giorno {day.order} · {day.type === 'Rest' ? 'Riposo' : day.type}</Text><Text style={[page.dayMeta, { color: colors.mutedForeground }]}>{isToday ? `Oggi · ${formatItalianDate(workout.today)}` : day.completed ? 'Completato' : day.skipped ? 'Saltato' : isRest ? 'Recupero' : 'In programma'}</Text></View>
                  {isToday ? <Pill tone="purple">OGGI</Pill> : day.completed ? <Pill tone="green">FATTO</Pill> : day.skipped ? <Pill tone="orange">SALTATO</Pill> : null}
                </Pressable>
                {isToday && !isRest && expanded ? (
                  <View style={[page.todayBody, { borderTopColor: colors.border }]}>
                    <Text style={[page.todayHint, { color: colors.mutedForeground }]}>Inserisci i tuoi carichi. I dati si salvano mentre scrivi.</Text>
                    {day.exercises.map((exercise) => (
                      <View key={exercise.id} style={page.exercise}>
                        <View style={page.exerciseHeader}><View><Text style={[page.exerciseName, { color: colors.foreground }]}>{exercise.name}</Text><Text style={[page.exerciseTarget, { color: colors.primary }]}>{exercise.targetSets} × {exercise.targetReps}</Text></View><Text style={[page.exerciseGroup, { color: colors.mutedForeground }]}>{exercise.group}</Text></View>
                        {exercise.sets.map((set, index) => <SetRow key={set.id} index={index} weight={set.weight} reps={set.reps} unit={workout.unit} onWeightChange={(value) => workout.updateSet(day.id, exercise.id, set.id, 'weight', value)} onRepsChange={(value) => workout.updateSet(day.id, exercise.id, set.id, 'reps', value)} />)}
                      </View>
                    ))}
                    <PrimaryButton label={day.completed ? 'Salva nuovi pesi' : 'Completa giornata'} icon="check" onPress={finish} disabled={!ready} />
                    {!ready ? <Text style={[page.finishHint, { color: colors.mutedForeground }]}>Completa tutte le serie per abilitare il pulsante.</Text> : null}
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>
        <View style={[page.miniStats, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View><Text style={[page.miniLabel, { color: colors.mutedForeground }]}>Volume in corso</Text><Text style={[page.miniValue, { color: colors.foreground }]}>{Math.round(workout.program.days.reduce((total, day) => total + dayVolume(day), 0)).toLocaleString('it-IT')} kg</Text></View>
          <View style={[page.miniDivider, { backgroundColor: colors.border }]} /><View><Text style={[page.miniLabel, { color: colors.mutedForeground }]}>Prossimo obiettivo</Text><Text style={[page.miniValue, { color: colors.orange }]}>{isMilestone(workout.streak + 1) ? `${workout.streak + 1} giorni` : 'Continuità'}</Text></View>
        </View>
      </ScrollView>
      {celebration ? <CelebrationModal celebration={celebration} onClose={() => setCelebration(null)} /> : null}
    </View>
  );
}

function CelebrationModal({ celebration, onClose }: { celebration: { streak: number; epic: boolean; newRecord: boolean }; onClose: () => void }) {
  const colors = useColors();
  return <View style={[page.modalOverlay, { backgroundColor: `${colors.background}F2` }]}><View style={[page.celebration, { backgroundColor: colors.card, borderColor: colors.border }]}><Text style={page.fire}>✦</Text><Text style={[page.celebrationEyebrow, { color: colors.orange }]}>{celebration.newRecord ? 'NUOVO RECORD' : celebration.epic ? 'TRAGUARDO' : 'OTTIMO LAVORO'}</Text><Text style={[page.celebrationNumber, { color: colors.foreground }]}>{celebration.streak}</Text><Text style={[page.celebrationTitle, { color: colors.foreground }]}>{celebration.streak === 1 ? 'giorno di fila' : 'giorni di fila'}</Text><Text style={[page.celebrationBody, { color: colors.mutedForeground }]}>La costanza costruisce risultati. Domani si riparte da qui.</Text><PrimaryButton label="Continua" onPress={onClose} /></View></View>;
}

const page = StyleSheet.create({
  root: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: 18 },
  streakBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingBottom: 4 },
  streakIcon: { fontSize: 25, color: '#FF9800' },
  streakValue: { fontSize: 13, fontWeight: '800' },
  streakRecord: { fontSize: 11, marginTop: 2 },
  cycleBanner: { borderRadius: 18, padding: 18, marginBottom: 12 },
  cycleEyebrow: { color: '#FFFFFFAA', fontSize: 11, letterSpacing: 1.1, fontWeight: '800' },
  cycleTitle: { color: '#FFFFFF', fontSize: 26, fontWeight: '800', marginTop: 4 },
  cycleSub: { fontSize: 16, fontWeight: '600', color: '#FFFFFFAA' },
  progressTrack: { height: 5, borderRadius: 5, backgroundColor: '#FFFFFF33', marginTop: 16, overflow: 'hidden' },
  progressFill: { height: 5, borderRadius: 5, backgroundColor: '#FFFFFF' },
  programSwitch: { borderRadius: 16, borderWidth: 1, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 10 },
  programGlyph: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  programLabel: { fontSize: 11, fontWeight: '600' },
  programName: { fontSize: 15, fontWeight: '800', marginTop: 2 },
  newProgram: { fontSize: 13, fontWeight: '800' },
  adherence: { fontSize: 13, fontWeight: '700' },
  dayList: { gap: 8 },
  dayCard: { borderRadius: 16, overflow: 'hidden' },
  dayHeader: { minHeight: 70, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 },
  dayNumber: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  dayNumberText: { fontSize: 13, fontWeight: '800' },
  dayTitle: { fontSize: 15, fontWeight: '800' },
  dayMeta: { fontSize: 12, marginTop: 3 },
  todayBody: { borderTopWidth: 1, padding: 14 },
  todayHint: { fontSize: 12, lineHeight: 18, marginBottom: 15 },
  exercise: { marginBottom: 18 },
  exerciseHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  exerciseName: { fontSize: 15, fontWeight: '800' },
  exerciseTarget: { fontSize: 12, fontWeight: '800', marginTop: 4 },
  exerciseGroup: { fontSize: 11, marginTop: 2 },
  finishHint: { textAlign: 'center', fontSize: 11, marginTop: 8 },
  miniStats: { borderWidth: 1, borderRadius: 16, padding: 16, flexDirection: 'row', justifyContent: 'space-around', marginTop: 18 },
  miniDivider: { width: 1 },
  miniLabel: { fontSize: 11, fontWeight: '600' },
  miniValue: { fontSize: 17, fontWeight: '800', marginTop: 4 },
  modalOverlay: { ...StyleSheet.absoluteFill, zIndex: 10, alignItems: 'center', justifyContent: 'center', padding: 24 },
  celebration: { width: '100%', borderRadius: 28, borderWidth: 1, alignItems: 'center', padding: 28 },
  fire: { fontSize: 64, color: '#FF9800', marginBottom: 8 },
  celebrationEyebrow: { letterSpacing: 1.5, fontSize: 12, fontWeight: '900' },
  celebrationNumber: { fontSize: 76, lineHeight: 82, fontWeight: '900', letterSpacing: -4 },
  celebrationTitle: { fontSize: 22, fontWeight: '800' },
  celebrationBody: { textAlign: 'center', fontSize: 14, lineHeight: 20, marginTop: 10, marginBottom: 22 },
});