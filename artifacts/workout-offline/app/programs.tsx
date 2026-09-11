import React, { useMemo, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { createProgram, DayType, Exercise, exerciseCatalog } from '@/domain/workout';
import { useWorkout } from '@/context/WorkoutContext';
import { PrimaryButton, SecondaryButton } from '@/components/WorkoutUI';

type PendingExercise = {
  name: string;
  group: string;
  defaultSets: string;
  defaultReps: string;
  custom: boolean;
};

export default function ProgramsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const workout = useWorkout();
  const [name, setName] = useState('');
  const [types, setTypes] = useState<DayType[]>(['Upper', 'Lower', 'Rest', 'Upper', 'Lower', 'Rest', 'Rest']);
  const [selected, setSelected] = useState<Record<number, Exercise[]>>({});
  const [dayIndex, setDayIndex] = useState(0);
  const [pending, setPending] = useState<PendingExercise | null>(null);
  const [exerciseName, setExerciseName] = useState('');
  const [targetSets, setTargetSets] = useState('');
  const [targetReps, setTargetReps] = useState('');
  const groups = useMemo(() => Array.from(new Set(exerciseCatalog.map((exercise) => exercise.group))), []);
  const currentExercises = selected[dayIndex] ?? [];

  const toggleType = (index: number) => {
    setTypes((current) =>
      current.map((type, itemIndex) => (itemIndex === index ? (type === 'Rest' ? 'Upper' : 'Rest') : type)),
    );
  };

  const openExerciseConfig = (item: PendingExercise) => {
    setPending(item);
    setExerciseName(item.name);
    setTargetSets(item.defaultSets);
    setTargetReps(item.defaultReps);
  };

  const openCatalogConfig = (item: (typeof exerciseCatalog)[number]) => {
    openExerciseConfig({
      name: item.name,
      group: item.group,
      defaultSets: String(item.sets),
      defaultReps: String(item.reps),
      custom: false,
    });
  };

  const openCustomConfig = () => {
    openExerciseConfig({
      name: '',
      group: 'Custom',
      defaultSets: '',
      defaultReps: '',
      custom: true,
    });
  };

  const closeExerciseConfig = () => {
    setPending(null);
    setExerciseName('');
    setTargetSets('');
    setTargetReps('');
  };

  const saveExercise = () => {
    const cleanName = exerciseName.trim();
    const sets = Number(targetSets);
    const reps = Number(targetReps);
    if (!cleanName || !Number.isInteger(sets) || sets < 1 || sets > 20 || !Number.isInteger(reps) || reps < 1 || reps > 100) {
      Alert.alert('Dati non validi', 'Inserisci un nome, almeno 1 set e un target di ripetizioni valido.');
      return;
    }
    const exercise: Exercise = {
      id: `${dayIndex}-${cleanName}-${Date.now()}`,
      name: cleanName,
      group: pending?.group ?? 'Custom',
      targetSets: sets,
      targetReps: reps,
      sets: Array.from({ length: sets }, (_, setIndex) => ({
        id: `${dayIndex}-${cleanName}-${Date.now()}-${setIndex}`,
        weight: '',
        reps: '',
      })),
    };
    setSelected((current) => {
      const list = current[dayIndex] ?? [];
      const existingIndex = list.findIndex((item) => item.name === cleanName);
      const next = existingIndex >= 0 ? list.map((item, index) => (index === existingIndex ? exercise : item)) : [...list, exercise];
      return { ...current, [dayIndex]: next };
    });
    closeExerciseConfig();
  };

  const removeExercise = (exerciseNameToRemove: string) => {
    setSelected((current) => ({
      ...current,
      [dayIndex]: (current[dayIndex] ?? []).filter((exercise) => exercise.name !== exerciseNameToRemove),
    }));
  };

  const editExercise = (exercise: Exercise) => {
    openExerciseConfig({
      name: exercise.name,
      group: exercise.group,
      defaultSets: String(exercise.targetSets),
      defaultReps: String(exercise.targetReps),
      custom: exercise.group === 'Custom',
    });
  };

  const save = () => {
    const missingExercises = types.findIndex((type, index) => type !== 'Rest' && (selected[index] ?? []).length === 0);
    if (missingExercises >= 0) {
      setDayIndex(missingExercises);
      Alert.alert('Aggiungi un esercizio', `Il Giorno ${missingExercises + 1} è un giorno di allenamento: aggiungi almeno un esercizio.`);
      return;
    }
    const program = createProgram(
      name.trim() || 'Il mio programma',
      types.map((type, index) => ({ type, exercises: selected[index] ?? [] })),
      workout.today,
    );
    workout.createNewProgram(program);
    router.back();
  };

  return (
    <View style={[page.root, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={[page.content, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 32 }]} keyboardShouldPersistTaps="handled">
        <View style={page.header}><Pressable onPress={() => router.back()}><Feather name="x" size={24} color={colors.foreground} /></Pressable><Text style={[page.title, { color: colors.foreground }]}>Programmi</Text><View style={{ width: 24 }} /></View>
        <Text style={[page.subtitle, { color: colors.mutedForeground }]}>Crea un ciclo da 7 giorni. Per ogni esercizio scegli quanti set e quante ripetizioni target vuoi fare.</Text>
        <View style={[page.existing, { backgroundColor: colors.card, borderColor: colors.border }]}><View style={[page.existingIcon, { backgroundColor: colors.accent }]}><Feather name="check" size={18} color={colors.primary} /></View><View style={{ flex: 1 }}><Text style={[page.existingTitle, { color: colors.foreground }]}>{workout.program.name}</Text><Text style={[page.existingMeta, { color: colors.mutedForeground }]}>Programma attivo · ciclo {workout.program.cycleNumber}</Text></View><Text style={[page.active, { color: colors.success }]}>ATTIVO</Text></View>
        <Text style={[page.label, { color: colors.foreground }]}>Nome programma</Text>
        <TextInput value={name} onChangeText={setName} placeholder="es. Forza e controllo" placeholderTextColor={colors.mutedForeground} style={[page.input, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border }]} />
        <Text style={[page.label, { color: colors.foreground }]}>Struttura settimana</Text>
        {types.map((type, index) => (
          <View key={index} style={[page.dayRow, { backgroundColor: colors.card, borderColor: index === dayIndex ? colors.primary : colors.border }]}>
            <Pressable onPress={() => setDayIndex(index)} style={page.dayIndex}><View style={[page.dayIndexCircle, { backgroundColor: colors.muted }]}><Text style={[page.dayIndexText, { color: colors.mutedForeground }]}>{index + 1}</Text></View></Pressable>
            <Pressable onPress={() => setDayIndex(index)} style={{ flex: 1 }}><Text style={[page.dayName, { color: colors.foreground }]}>Giorno {index + 1}</Text><Text style={[page.dayType, { color: colors.mutedForeground }]}>{type === 'Rest' ? 'Riposo' : `${type} · ${(selected[index] ?? []).length} esercizi`}</Text></Pressable>
            <Pressable onPress={() => { setDayIndex(index); toggleType(index); }} style={[page.typeButton, { backgroundColor: type === 'Rest' ? colors.muted : colors.accent }]}><Text style={[page.typeButtonText, { color: type === 'Rest' ? colors.mutedForeground : colors.primary }]}>{type === 'Rest' ? 'Riposo' : 'Allenamento'}</Text></Pressable>
          </View>
        ))}
        {types[dayIndex] !== 'Rest' ? (
          <View style={[page.exercisePicker, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={page.pickerHeader}><View><Text style={[page.pickerTitle, { color: colors.foreground }]}>Esercizi · giorno {dayIndex + 1}</Text><Text style={[page.pickerSubtitle, { color: colors.mutedForeground }]}>Tocca un esercizio e imposta il suo target</Text></View><Pressable onPress={() => setDayIndex((dayIndex + 1) % 7)}><Text style={[page.next, { color: colors.primary }]}>Prossimo</Text></Pressable></View>
            <View style={page.selectedHeader}><Text style={[page.groupTitle, { color: colors.mutedForeground }]}>AGGIUNTI ({currentExercises.length})</Text><Pressable onPress={openCustomConfig} style={[page.customButton, { backgroundColor: colors.accent }]}><Feather name="plus" size={14} color={colors.primary} /><Text style={[page.customButtonText, { color: colors.primary }]}>Custom</Text></Pressable></View>
            {currentExercises.length === 0 ? <Text style={[page.noExercises, { color: colors.mutedForeground }]}>Nessun esercizio aggiunto a questa giornata.</Text> : currentExercises.map((exercise) => <View key={exercise.id} style={[page.selectedRow, { backgroundColor: colors.surface2 }]}><View style={[page.checkbox, { backgroundColor: colors.primary, borderColor: colors.primary }]}><Feather name="check" size={12} color={colors.primaryForeground} /></View><View style={{ flex: 1 }}><Text style={[page.choiceName, { color: colors.foreground }]}>{exercise.name}</Text><Text style={[page.selectedTarget, { color: colors.mutedForeground }]}>{exercise.targetSets} set × {exercise.targetReps} rip. target · {exercise.group}</Text></View><Pressable onPress={() => editExercise(exercise)} hitSlop={8}><Feather name="edit-2" size={15} color={colors.primary} /></Pressable><Pressable onPress={() => removeExercise(exercise.name)} hitSlop={8}><Feather name="trash-2" size={15} color={colors.destructive} /></Pressable></View>)}
            <Text style={[page.groupTitle, { color: colors.mutedForeground }]}>CATALOGO</Text>
            {groups.map((group) => <View key={group}><Text style={[page.catalogGroup, { color: colors.mutedForeground }]}>{group}</Text>{exerciseCatalog.filter((item) => item.group === group).map((item) => { const checked = currentExercises.some((exercise) => exercise.name === item.name); return <Pressable key={item.name} onPress={() => checked ? removeExercise(item.name) : openCatalogConfig(item)} style={page.exerciseChoice}><View style={[page.checkbox, { borderColor: checked ? colors.primary : colors.border, backgroundColor: checked ? colors.primary : 'transparent' }]}>{checked ? <Feather name="check" size={12} color={colors.primaryForeground} /> : null}</View><Text style={[page.choiceName, { color: colors.foreground }]}>{item.name}</Text><Text style={[page.choiceTarget, { color: colors.mutedForeground }]}>{checked ? 'Aggiunto' : `${item.sets}×${item.reps} suggerito`}</Text></Pressable>; })}</View>)}
          </View>
        ) : null}
        <PrimaryButton label="Salva e attiva programma" icon="check" onPress={save} />
        <SecondaryButton label="Annulla" onPress={() => router.back()} />
      </ScrollView>
      <Modal visible={pending !== null} transparent animationType="slide" onRequestClose={closeExerciseConfig}>
        <View style={[page.modalBackdrop, { backgroundColor: `${colors.background}CC` }]}>
          <View style={[page.modalCard, { backgroundColor: colors.card, borderColor: colors.border, paddingBottom: insets.bottom + 18 }]}>
            <View style={page.modalHandle} />
            <View style={page.modalHeader}><View style={{ flex: 1 }}><Text style={[page.modalTitle, { color: colors.foreground }]}>{pending?.custom ? 'Nuovo esercizio custom' : 'Imposta esercizio'}</Text><Text style={[page.modalSubtitle, { color: colors.mutedForeground }]}>Definisci il target prima di aggiungerlo</Text></View><Pressable onPress={closeExerciseConfig}><Feather name="x" size={20} color={colors.mutedForeground} /></Pressable></View>
            <Text style={[page.modalLabel, { color: colors.foreground }]}>Nome esercizio</Text>
            <TextInput value={exerciseName} onChangeText={setExerciseName} editable={pending?.custom ?? false} placeholder="es. Affondi bulgari" placeholderTextColor={colors.mutedForeground} style={[page.modalInput, { color: colors.foreground, backgroundColor: colors.surface2, borderColor: colors.border, opacity: pending?.custom ? 1 : 0.7 }]} />
            <View style={page.targetRow}><View style={{ flex: 1 }}><Text style={[page.modalLabel, { color: colors.foreground }]}>Numero di set</Text><TextInput value={targetSets} onChangeText={setTargetSets} keyboardType="number-pad" placeholder="3" placeholderTextColor={colors.mutedForeground} style={[page.modalInput, { color: colors.foreground, backgroundColor: colors.surface2, borderColor: colors.border }]} /></View><View style={{ flex: 1 }}><Text style={[page.modalLabel, { color: colors.foreground }]}>Ripetizioni target</Text><TextInput value={targetReps} onChangeText={setTargetReps} keyboardType="number-pad" placeholder="10" placeholderTextColor={colors.mutedForeground} style={[page.modalInput, { color: colors.foreground, backgroundColor: colors.surface2, borderColor: colors.border }]} /></View></View>
            <PrimaryButton label="Aggiungi esercizio" icon="plus" onPress={saveExercise} />
            <SecondaryButton label="Annulla" onPress={closeExerciseConfig} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const page = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 18, gap: 12 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  title: { fontSize: 20, fontWeight: '900' },
  subtitle: { fontSize: 14, lineHeight: 20, marginBottom: 8 },
  existing: { borderWidth: 1, borderRadius: 16, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  existingIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  existingTitle: { fontSize: 14, fontWeight: '800' },
  existingMeta: { fontSize: 11, marginTop: 3 },
  active: { fontSize: 10, fontWeight: '900' },
  label: { fontSize: 13, fontWeight: '800', marginTop: 6 },
  input: { minHeight: 48, borderWidth: 1, borderRadius: 13, paddingHorizontal: 14, fontSize: 15 },
  dayRow: { borderWidth: 1, borderRadius: 15, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 10 },
  dayIndex: { width: 30, alignItems: 'center' },
  dayIndexCircle: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  dayIndexText: { fontSize: 12, fontWeight: '900' },
  dayName: { fontSize: 13, fontWeight: '800' },
  dayType: { fontSize: 11, marginTop: 3 },
  typeButton: { paddingHorizontal: 9, paddingVertical: 7, borderRadius: 8 },
  typeButtonText: { fontSize: 10, fontWeight: '800' },
  exercisePicker: { borderWidth: 1, borderRadius: 18, padding: 14, marginTop: 4, gap: 6 },
  pickerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  pickerTitle: { fontSize: 15, fontWeight: '900' },
  pickerSubtitle: { fontSize: 11, marginTop: 3 },
  next: { fontSize: 12, fontWeight: '900' },
  selectedHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  selectedRow: { minHeight: 50, borderRadius: 12, paddingHorizontal: 9, flexDirection: 'row', alignItems: 'center', gap: 9 },
  selectedTarget: { fontSize: 10, marginTop: 3 },
  customButton: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 9, paddingVertical: 6, borderRadius: 8 },
  customButtonText: { fontSize: 11, fontWeight: '900' },
  noExercises: { fontSize: 12, paddingVertical: 8 },
  groupTitle: { fontSize: 11, fontWeight: '800', marginTop: 10, marginBottom: 2, letterSpacing: 0.6 },
  catalogGroup: { fontSize: 10, fontWeight: '800', marginTop: 7, marginBottom: 1, textTransform: 'uppercase' },
  exerciseChoice: { minHeight: 42, flexDirection: 'row', alignItems: 'center', gap: 9 },
  checkbox: { width: 22, height: 22, borderRadius: 7, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  choiceName: { flex: 1, fontSize: 13, fontWeight: '700' },
  choiceTarget: { fontSize: 10, fontWeight: '700' },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end' },
  modalCard: { borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, padding: 18, gap: 10 },
  modalHandle: { width: 36, height: 4, borderRadius: 4, backgroundColor: '#777180', alignSelf: 'center', marginBottom: 4 },
  modalHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6 },
  modalTitle: { fontSize: 20, fontWeight: '900' },
  modalSubtitle: { fontSize: 12, marginTop: 4 },
  modalLabel: { fontSize: 12, fontWeight: '800', marginTop: 3 },
  modalInput: { minHeight: 46, borderWidth: 1, borderRadius: 12, paddingHorizontal: 13, fontSize: 15 },
  targetRow: { flexDirection: 'row', gap: 10 },
});