import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, Alert, Switch } from 'react-native';
import { useKermaStore } from '../../store/useKermaStore';
import { KermaLogo } from '../../components/KermaLogo';
import { costPerMile, vehicleLabel, isZeroEmission } from '../../engine/vehicleCost';
import { Colors, Typography, Spacing, Radius, Shadows } from '../../constants/theme';

const VEHICLE_OPTIONS = [
  { value: 'gas',     label: '🚗 Gas',          sub: 'Petrol powered' },
  { value: 'hybrid',  label: '🚗 Hybrid',        sub: 'Gas + electric' },
  { value: 'electric',label: '⚡ Electric (EV)', sub: 'Zero emissions' },
  { value: 'phev',    label: '⚡ Plug-in Hybrid', sub: 'PHEV' },
  { value: 'bike',    label: '🚲 Bike / Walk',   sub: 'Zero travel cost' },
  { value: 'transit', label: '🚌 Public Transit', sub: 'Bus / Metro' },
];

const ALLERGY_OPTIONS = ['None', 'Gluten-free', 'Dairy-free', 'Nut allergy', 'Vegan', 'Halal', 'Kosher'];
const DIET_OPTIONS = ['No preference', 'Organic preferred', 'Low-sodium', 'Diabetic-friendly', 'Keto'];
const ECO_OPTIONS = [
  { value: 'none',     label: '⚪ No preference' },
  { value: 'local',    label: '🌿 Local products first' },
  { value: 'organic',  label: '🌱 Organic preferred' },
  { value: 'lowcarbon',label: '♻️ Low carbon footprint' },
];
const QUALITY_OPTIONS = [
  { value: 'balanced',      label: '⚖️ Balanced (price + quality)' },
  { value: 'price-first',   label: '💰 Price first' },
  { value: 'quality-first', label: '⭐ Quality first' },
];

function SectionHeader({ title }: { title: string }) {
  return (
    <Text style={styles.sectionHeader}>{title}</Text>
  );
}

function SelectRow({ label, value, options, onChange }: {
  label: string;
  value: string;
  options: string[] | { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const displayVal = typeof options[0] === 'string'
    ? value
    : (options as { value: string; label: string }[]).find(o => o.value === value)?.label ?? value;

  return (
    <View>
      <TouchableOpacity style={styles.pfRow} onPress={() => setOpen(!open)}>
        <Text style={styles.pfLabel}>{label}</Text>
        <Text style={styles.pfVal}>{displayVal} ›</Text>
      </TouchableOpacity>
      {open && (
        <View style={styles.optionList}>
          {(options as any[]).map((opt: any) => {
            const val = typeof opt === 'string' ? opt : opt.value;
            const lbl = typeof opt === 'string' ? opt : opt.label;
            return (
              <TouchableOpacity
                key={val}
                style={[styles.optionItem, value === val && styles.optionSelected]}
                onPress={() => { onChange(val); setOpen(false); }}
              >
                <Text style={[styles.optionText, value === val && styles.optionTextSelected]}>{lbl}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}

export default function ProfileScreen() {
  const { household, setHousehold, saveToStorage, isPremium } = useKermaStore();
  const cpm = costPerMile(household.vehicle);

  const update = (updates: any) => {
    setHousehold(updates);
    setTimeout(saveToStorage, 300);
  };

  const updateVehicle = (updates: any) => {
    setHousehold({ vehicle: { ...household.vehicle, ...updates } });
    setTimeout(saveToStorage, 300);
  };

  const updatePrefs = (updates: any) => {
    setHousehold({ preferences: { ...household.preferences, ...updates } });
    setTimeout(saveToStorage, 300);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <KermaLogo size={28} />
        <Text style={styles.title}>Profile</Text>
        <View style={styles.planBadge}>
          <Text style={styles.planBadgeText}>MVP · All unlocked</Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>

          {/* VEHICLE */}
          <SectionHeader title="Vehicle & Transport" />
          <View style={styles.card}>
            <SectionHeader title="" />
            <View style={styles.vehicleGrid}>
              {VEHICLE_OPTIONS.map(opt => (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.vehicleOpt, household.vehicle.type === opt.value && styles.vehicleOptSelected]}
                  onPress={() => updateVehicle({ type: opt.value })}
                >
                  <Text style={styles.vehicleOptLabel}>{opt.label}</Text>
                  <Text style={styles.vehicleOptSub}>{opt.sub}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Cost per mile display */}
            <View style={styles.cpmRow}>
              <Text style={styles.cpmLabel}>Real cost per mile</Text>
              <View style={[styles.cpmBadge, isZeroEmission(household.vehicle) && styles.cpmBadgeGreen]}>
                <Text style={styles.cpmValue}>
                  {household.vehicle.type === 'bike' ? 'Near-free' : `$${cpm.toFixed(3)}/mi`}
                </Text>
                {isZeroEmission(household.vehicle) && <Text style={styles.cpmEco}> · Zero emissions ♻️</Text>}
              </View>
            </View>
          </View>

          {/* HOUSEHOLD */}
          <SectionHeader title="Household" />
          <View style={styles.card}>
            <View style={styles.pfRow}>
              <Text style={styles.pfLabel}>📍 Location</Text>
              <Text style={styles.pfVal}>{household.location.city}, CA {household.location.zip}</Text>
            </View>
            <View style={[styles.pfRow, styles.pfRowBorder]}>
              <Text style={styles.pfLabel}>💵 Weekly budget</Text>
              <Text style={styles.pfVal}>${household.budget.weekly}</Text>
            </View>
            <View style={[styles.pfRow, styles.pfRowBorder]}>
              <Text style={styles.pfLabel}>👨‍👩‍👧‍👦 Adults</Text>
              <View style={styles.stepper}>
                <TouchableOpacity onPress={() => update({ members: { ...household.members, adults: Math.max(1, household.members.adults - 1) } })}>
                  <Text style={styles.stepperBtn}>−</Text>
                </TouchableOpacity>
                <Text style={styles.stepperVal}>{household.members.adults}</Text>
                <TouchableOpacity onPress={() => update({ members: { ...household.members, adults: household.members.adults + 1 } })}>
                  <Text style={styles.stepperBtn}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={[styles.pfRow, styles.pfRowBorder]}>
              <Text style={styles.pfLabel}>👶 Kids</Text>
              <View style={styles.stepper}>
                <TouchableOpacity onPress={() => update({ members: { ...household.members, kids: Math.max(0, household.members.kids - 1) } })}>
                  <Text style={styles.stepperBtn}>−</Text>
                </TouchableOpacity>
                <Text style={styles.stepperVal}>{household.members.kids}</Text>
                <TouchableOpacity onPress={() => update({ members: { ...household.members, kids: household.members.kids + 1 } })}>
                  <Text style={styles.stepperBtn}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* DIETARY */}
          <SectionHeader title="Dietary & Health" />
          <View style={styles.card}>
            <SelectRow
              label="⚠️ Allergies"
              value={household.preferences.diet === 'none' ? 'None' : household.preferences.diet}
              options={ALLERGY_OPTIONS}
              onChange={v => updatePrefs({ diet: v === 'None' ? 'none' : v })}
            />
          </View>

          {/* CONTEXT */}
          <SectionHeader title="Context & Environment" />
          <View style={styles.card}>
            <SelectRow
              label="♻️ Eco preference"
              value={household.preferences.ecoMode}
              options={ECO_OPTIONS}
              onChange={v => updatePrefs({ ecoMode: v })}
            />
            <View style={styles.pfRowBorder}>
              <SelectRow
                label="⭐ Quality weight"
                value={household.preferences.qualityWeight}
                options={QUALITY_OPTIONS}
                onChange={v => updatePrefs({ qualityWeight: v })}
              />
            </View>
          </View>

          {/* PRIVACY */}
          <SectionHeader title="Privacy & Data" />
          <View style={styles.card}>
            <View style={styles.pfRow}>
              <Text style={styles.pfLabel}>🔒 Storage</Text>
              <Text style={[styles.pfVal, { color: Colors.kerma }]}>On device only</Text>
            </View>
            <View style={[styles.pfRow, styles.pfRowBorder]}>
              <Text style={styles.pfLabel}>📡 Location</Text>
              <Text style={[styles.pfVal, { color: Colors.kerma }]}>Session only</Text>
            </View>
            <TouchableOpacity
              style={[styles.pfRow, styles.pfRowBorder]}
              onPress={() => Alert.alert('Clear all data?', 'This will reset Kerma.', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Clear', style: 'destructive', onPress: () => {} },
              ])}
            >
              <Text style={styles.pfLabel}>🗑 Clear all data</Text>
              <Text style={[styles.pfVal, { color: Colors.red }]}>Clear →</Text>
            </TouchableOpacity>
          </View>

          {/* ABOUT */}
          <View style={styles.aboutBox}>
            <Text style={styles.aboutText}>
              KERMA v2.0 · by PIONEXIS{'\n'}
              Agent: ASTRIDE AI{'\n'}
              Orange County MVP · All features unlocked{'\n'}{'\n'}
              <Text style={{ color: Colors.kerma }}>"The best purchase decision for this household, today."</Text>
            </Text>
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.xl, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  title: { fontFamily: Typography.serifBlack, fontSize: 20, color: Colors.text, flex: 1 },
  planBadge: { backgroundColor: Colors.goldLight, borderWidth: 1, borderColor: 'rgba(200,136,42,0.25)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  planBadgeText: { fontFamily: Typography.bold, fontSize: 9, color: Colors.gold },
  scroll: { flex: 1 },
  content: { padding: Spacing.xl, gap: Spacing.md, paddingBottom: 100 },
  sectionHeader: { fontFamily: Typography.bold, fontSize: 10, color: Colors.t3, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: -4 },
  card: { backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, overflow: 'hidden', ...Shadows.sm },
  vehicleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, padding: Spacing.md },
  vehicleOpt: { flex: 1, minWidth: '45%', backgroundColor: Colors.bg2, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.sm, padding: Spacing.md },
  vehicleOptSelected: { backgroundColor: Colors.kermaPale, borderColor: 'rgba(10,107,75,0.4)' },
  vehicleOptLabel: { fontFamily: Typography.semiBold, fontSize: 12, color: Colors.text, marginBottom: 2 },
  vehicleOptSub: { fontFamily: Typography.regular, fontSize: 10, color: Colors.t2 },
  cpmRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.border },
  cpmLabel: { fontFamily: Typography.medium, fontSize: 12, color: Colors.t2 },
  cpmBadge: { backgroundColor: Colors.bg2, borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 4, flexDirection: 'row', alignItems: 'center' },
  cpmBadgeGreen: { backgroundColor: Colors.kermaLight },
  cpmValue: { fontFamily: Typography.bold, fontSize: 12, color: Colors.kerma },
  cpmEco: { fontFamily: Typography.medium, fontSize: 10, color: Colors.kerma },
  pfRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.md + 1 },
  pfRowBorder: { borderTopWidth: 1, borderTopColor: Colors.border },
  pfLabel: { fontFamily: Typography.regular, fontSize: 13, color: Colors.t2 },
  pfVal: { fontFamily: Typography.semiBold, fontSize: 12, color: Colors.text },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  stepperBtn: { fontSize: 20, color: Colors.kerma, fontFamily: Typography.bold, width: 28, textAlign: 'center' },
  stepperVal: { fontFamily: Typography.bold, fontSize: 16, color: Colors.text, width: 24, textAlign: 'center' },
  optionList: { backgroundColor: Colors.bg2, borderTopWidth: 1, borderTopColor: Colors.border },
  optionItem: { padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  optionSelected: { backgroundColor: Colors.kermaLight },
  optionText: { fontFamily: Typography.regular, fontSize: 13, color: Colors.text },
  optionTextSelected: { fontFamily: Typography.semiBold, color: Colors.kerma },
  aboutBox: { backgroundColor: Colors.kermaPale, borderRadius: Radius.md, padding: Spacing.lg, marginTop: Spacing.md },
  aboutText: { fontFamily: Typography.regular, fontSize: 11, color: Colors.t2, textAlign: 'center', lineHeight: 18 },
});
