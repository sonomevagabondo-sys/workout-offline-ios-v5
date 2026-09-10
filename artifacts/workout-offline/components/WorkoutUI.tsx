import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';

export function ScreenHeader({ eyebrow, title, right }: { eyebrow?: string; title: string; right?: React.ReactNode }) {
  const colors = useColors();
  return (
    <View style={styles.header}>
      <View style={styles.headerCopy}>
        {eyebrow ? <Text style={[styles.eyebrow, { color: colors.mutedForeground }]}>{eyebrow.toUpperCase()}</Text> : null}
        <Text style={[styles.screenTitle, { color: colors.foreground }]}>{title}</Text>
      </View>
      {right}
    </View>
  );
}

export function Pill({ children, tone = 'purple' }: { children: React.ReactNode; tone?: 'purple' | 'orange' | 'muted' | 'green' }) {
  const colors = useColors();
  const background = tone === 'orange' ? `${colors.orange}22` : tone === 'green' ? `${colors.success}22` : tone === 'muted' ? colors.muted : `${colors.primary}22`;
  const foreground = tone === 'orange' ? colors.orange : tone === 'green' ? colors.success : tone === 'muted' ? colors.mutedForeground : colors.accentForeground;
  return <View style={[styles.pill, { backgroundColor: background }]}><Text style={[styles.pillText, { color: foreground }]}>{children}</Text></View>;
}

export function PrimaryButton({ label, onPress, disabled, icon }: { label: string; onPress: () => void; disabled?: boolean; icon?: keyof typeof Feather.glyphMap }) {
  const colors = useColors();
  return (
    <Pressable testID={`button-${label}`} accessibilityRole="button" accessibilityLabel={label} onPress={onPress} disabled={disabled} style={({ pressed }) => [styles.primaryButton, { backgroundColor: colors.primary, opacity: disabled ? 0.35 : pressed ? 0.78 : 1 }]}>
      {icon ? <Feather name={icon} size={17} color={colors.primaryForeground} /> : null}
      <Text style={[styles.primaryButtonText, { color: colors.primaryForeground }]}>{label}</Text>
    </Pressable>
  );
}

export function SecondaryButton({ label, onPress, icon }: { label: string; onPress: () => void; icon?: keyof typeof Feather.glyphMap }) {
  const colors = useColors();
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.secondaryButton, { borderColor: colors.border, opacity: pressed ? 0.7 : 1 }]}>
      {icon ? <Feather name={icon} size={16} color={colors.foreground} /> : null}
      <Text style={[styles.secondaryButtonText, { color: colors.foreground }]}>{label}</Text>
    </Pressable>
  );
}

export function SectionTitle({ title, action }: { title: string; action?: React.ReactNode }) {
  const colors = useColors();
  return <View style={styles.sectionTitle}><Text style={[styles.sectionTitleText, { color: colors.foreground }]}>{title}</Text>{action}</View>;
}

export function SetRow({ index, weight, reps, unit, onWeightChange, onRepsChange, disabled }: { index: number; weight: string; reps: string; unit: string; onWeightChange: (value: string) => void; onRepsChange: (value: string) => void; disabled?: boolean }) {
  const colors = useColors();
  return (
    <View style={styles.setRow}>
      <View style={[styles.setNumber, { backgroundColor: colors.muted }]}><Text style={[styles.setNumberText, { color: colors.mutedForeground }]}>{index + 1}</Text></View>
      <TextInput accessibilityLabel={`Serie ${index + 1} peso`} testID={`weight-${index + 1}`} keyboardType="decimal-pad" returnKeyType="done" value={weight} onChangeText={onWeightChange} placeholder={unit} placeholderTextColor={colors.mutedForeground} editable={!disabled} style={[styles.setInput, { backgroundColor: colors.surface2, borderColor: colors.border, color: colors.foreground }]} />
      <TextInput accessibilityLabel={`Serie ${index + 1} ripetizioni`} testID={`reps-${index + 1}`} keyboardType="number-pad" returnKeyType="done" value={reps} onChangeText={onRepsChange} placeholder="rip." placeholderTextColor={colors.mutedForeground} editable={!disabled} style={[styles.setInput, { backgroundColor: colors.surface2, borderColor: colors.border, color: colors.foreground }]} />
    </View>
  );
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  const colors = useColors();
  return <View style={[styles.emptyState, { backgroundColor: colors.card, borderColor: colors.border }]}><View style={[styles.emptyIcon, { backgroundColor: colors.accent }]}><Feather name="bar-chart-2" size={22} color={colors.primary} /></View><Text style={[styles.emptyTitle, { color: colors.foreground }]}>{title}</Text><Text style={[styles.emptyDescription, { color: colors.mutedForeground }]}>{description}</Text></View>;
}

export const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 },
  headerCopy: { gap: 5 },
  eyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 1.2 },
  screenTitle: { fontSize: 34, fontWeight: '800', letterSpacing: -1.2 },
  pill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 99, alignSelf: 'flex-start' },
  pillText: { fontSize: 12, fontWeight: '700' },
  primaryButton: { minHeight: 48, paddingHorizontal: 18, borderRadius: 14, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center' },
  primaryButtonText: { fontSize: 15, fontWeight: '800' },
  secondaryButton: { minHeight: 44, paddingHorizontal: 16, borderRadius: 13, borderWidth: 1, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center' },
  secondaryButtonText: { fontSize: 14, fontWeight: '700' },
  sectionTitle: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 26, marginBottom: 12 },
  sectionTitleText: { fontSize: 19, fontWeight: '800', letterSpacing: -0.3 },
  setRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 9 },
  setNumber: { width: 25, height: 25, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  setNumberText: { fontSize: 12, fontWeight: '800' },
  setInput: { flex: 1, minHeight: 42, borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, fontSize: 15, fontWeight: '700' },
  emptyState: { borderRadius: 18, borderWidth: 1, padding: 24, alignItems: 'center', marginTop: 12 },
  emptyIcon: { width: 46, height: 46, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  emptyTitle: { fontSize: 17, fontWeight: '800', textAlign: 'center' },
  emptyDescription: { fontSize: 14, lineHeight: 20, textAlign: 'center', marginTop: 6 },
});