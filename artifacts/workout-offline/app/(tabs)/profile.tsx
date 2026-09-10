import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useWorkout } from '@/context/WorkoutContext';
import { ScreenHeader, SectionTitle, SecondaryButton, PrimaryButton } from '@/components/WorkoutUI';

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const workout = useWorkout();
  const [name, setName] = useState(workout.profileName);
  const [editing, setEditing] = useState(false);
  return <View style={[page.root, { backgroundColor: colors.background }]}><ScrollView contentContainerStyle={[page.content, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 110 }]} showsVerticalScrollIndicator={false}>
    <ScreenHeader eyebrow="Solo sul tuo dispositivo" title="Profilo" />
    <View style={[page.identity, { backgroundColor: colors.card, borderColor: colors.border }]}><View style={[page.avatar, { backgroundColor: colors.accent }]}><Text style={[page.avatarText, { color: colors.primary }]}>{(workout.profileName || 'IO').slice(0, 2).toUpperCase()}</Text></View><View style={{ flex: 1 }}><Text style={[page.identityName, { color: colors.foreground }]}>{workout.profileName || 'Il tuo profilo'}</Text><Text style={[page.identityMeta, { color: colors.mutedForeground }]}>Nessun account · dati locali</Text></View><Pressable onPress={() => setEditing(!editing)}><Feather name="edit-2" size={17} color={colors.mutedForeground} /></Pressable></View>
    {editing ? <View style={page.editBox}><TextInput value={name} onChangeText={setName} placeholder="Come ti chiami?" placeholderTextColor={colors.mutedForeground} style={[page.nameInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]} /><PrimaryButton label="Salva nome" onPress={() => { workout.setProfileName(name.trim()); setEditing(false); }} /></View> : null}
    <SectionTitle title="Preferenze" />
    <View style={[page.settingsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <SettingRow icon="moon" title="Tema" value={workout.theme === 'dark' ? 'Scuro' : workout.theme === 'light' ? 'Chiaro' : 'Sistema'} colors={colors} onPress={() => workout.setTheme(workout.theme === 'dark' ? 'light' : 'dark')} />
      <View style={[page.separator, { backgroundColor: colors.border }]} />
      <SettingRow icon="sliders" title="Unità di misura" value={workout.unit.toUpperCase()} colors={colors} onPress={() => workout.setUnit(workout.unit === 'kg' ? 'lb' : 'kg')} />
    </View>
    <SectionTitle title="Il tuo percorso" />
    <View style={page.metrics}><Metric label="Allenamenti" value={`${workout.logs.length}`} colors={colors} /><Metric label="Cicli chiusi" value={`${workout.history.length}`} colors={colors} /><Metric label="Record streak" value={`${workout.record}`} colors={colors} /></View>
    <SectionTitle title="Informazioni" />
    <View style={[page.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}><InfoRow icon="shield" text="Nessun login, nessun cloud, nessun tracking" colors={colors} /><InfoRow icon="database" text="I tuoi allenamenti restano su questo dispositivo" colors={colors} /><InfoRow icon="info" text="Workout Offline · versione 1.0" colors={colors} /></View>
    <SecondaryButton label="Azzera nome profilo" onPress={() => Alert.alert('Rimuovere il nome?', 'Il resto dei tuoi allenamenti resterà intatto.', [{ text: 'Annulla', style: 'cancel' }, { text: 'Rimuovi', style: 'destructive', onPress: workout.clearProfile }])} />
  </ScrollView></View>;
}

function SettingRow({ icon, title, value, colors, onPress }: { icon: keyof typeof Feather.glyphMap; title: string; value: string; colors: ReturnType<typeof useColors>; onPress: () => void }) { return <Pressable onPress={onPress} style={page.settingRow}><View style={[page.settingIcon, { backgroundColor: colors.accent }]}><Feather name={icon} size={16} color={colors.primary} /></View><Text style={[page.settingTitle, { color: colors.foreground }]}>{title}</Text><Text style={[page.settingValue, { color: colors.mutedForeground }]}>{value}</Text><Feather name="chevron-right" size={17} color={colors.mutedForeground} /></Pressable>; }
function InfoRow({ icon, text, colors }: { icon: keyof typeof Feather.glyphMap; text: string; colors: ReturnType<typeof useColors> }) { return <View style={page.infoRow}><Feather name={icon} size={16} color={colors.mutedForeground} /><Text style={[page.infoText, { color: colors.mutedForeground }]}>{text}</Text></View>; }
function Metric({ label, value, colors }: { label: string; value: string; colors: ReturnType<typeof useColors> }) { return <View style={page.metric}><Text style={[page.metricValue, { color: colors.foreground }]}>{value}</Text><Text style={[page.metricLabel, { color: colors.mutedForeground }]}>{label}</Text></View>; }
const page = StyleSheet.create({ root: { flex: 1 }, content: { paddingHorizontal: 18 }, identity: { borderRadius: 18, borderWidth: 1, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }, avatar: { width: 52, height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center' }, avatarText: { fontSize: 18, fontWeight: '900' }, identityName: { fontSize: 16, fontWeight: '800' }, identityMeta: { fontSize: 12, marginTop: 4 }, editBox: { marginTop: 10, gap: 10 }, nameInput: { borderWidth: 1, borderRadius: 13, paddingHorizontal: 14, minHeight: 46, fontSize: 15 }, settingsCard: { borderWidth: 1, borderRadius: 18, paddingHorizontal: 14 }, settingRow: { minHeight: 62, flexDirection: 'row', alignItems: 'center', gap: 11 }, settingIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }, settingTitle: { flex: 1, fontSize: 14, fontWeight: '800' }, settingValue: { fontSize: 13, fontWeight: '700' }, separator: { height: 1 }, metrics: { flexDirection: 'row', gap: 8 }, metric: { flex: 1, borderRadius: 15, padding: 14, backgroundColor: '#1B1E24' }, metricValue: { fontSize: 24, fontWeight: '900' }, metricLabel: { fontSize: 10, marginTop: 5 }, infoCard: { borderWidth: 1, borderRadius: 18, padding: 16, gap: 16, marginBottom: 14 }, infoRow: { flexDirection: 'row', gap: 10, alignItems: 'center' }, infoText: { flex: 1, fontSize: 13, lineHeight: 18 }, });