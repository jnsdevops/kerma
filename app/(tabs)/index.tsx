import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, Alert, Platform, ActivityIndicator,
} from 'react-native';
import * as Location from 'expo-location';
import { useKermaStore } from '../../store/useKermaStore';
import { AstrideAgent } from '../../components/AstrideAgent';
import { ScenarioCard } from '../../components/ScenarioCard';
import { KermaLogo } from '../../components/KermaLogo';
import { optimize, calcOptimizationScore } from '../../engine/costOptimizer';
import { getEmoji, getBestPrice, STORE_CONFIGS } from '../../engine/priceDatabase';
import { costPerMile, vehicleLabel } from '../../engine/vehicleCost';
import { Colors, Typography, Spacing, Radius, Shadows } from '../../constants/theme';
import { TripRecord } from '../../engine/ontology';

const QUICK_ITEMS = [
  { label: '🥛 Milk', name: 'Milk' },
  { label: '🥚 Eggs', name: 'Eggs' },
  { label: '🍞 Bread', name: 'Bread' },
  { label: '🧈 Butter', name: 'Butter' },
  { label: '🐔 Chicken', name: 'Chicken' },
  { label: '🍝 Pasta', name: 'Pasta' },
  { label: '🧀 Cheese', name: 'Cheese' },
  { label: '☕ Coffee', name: 'Coffee' },
  { label: '👶 Huggies', name: 'Huggies' },
  { label: '🍚 Rice', name: 'Rice' },
];

export default function ShopScreen() {
  const {
    household, items, addItem, removeItem, clearItems, setItems,
    scenarios, setScenarios, chosenScenario, setChosenScenario,
    isOptimizing, setIsOptimizing, addTrip, setLocation, setGpsLocked,
    gpsLocked,
  } = useKermaStore();

  const [itemInput, setItemInput] = useState('');
  const [qtyInput, setQtyInput] = useState('1');
  const [phase, setPhase] = useState<'list' | 'results' | 'confirmed'>('list');
  const [loadingStep, setLoadingStep] = useState(0);
  const inputRef = useRef<TextInput>(null);

  // GPS on mount
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setLocation(loc.coords.latitude, loc.coords.longitude);
        setGpsLocked(true);
      }
    })();
  }, []);

  const agentMessage = () => {
    const cpm = costPerMile(household.vehicle);
    return `Hi! I'm <b>Astride</b>, your Kerma agent. I'm watching <b>Walmart Tustin, Ralph's Irvine, Target Lake Forest & Costco Laguna Hills</b>. Right now: eggs at <b>$4.98 Walmart vs $8.99 Ralph's</b>. Your ${household.vehicle.type === 'electric' ? '<b>EV costs just $' + cpm.toFixed(3) + '/mi</b> — multi-stop trips are cheaper for you' : 'vehicle costs $' + cpm.toFixed(3) + '/mi'}. Add your list and I'll find the real best deal.`;
  };

  const handleAddItem = () => {
    const name = itemInput.trim();
    if (!name) return;
    addItem(name, parseInt(qtyInput) || 1, getEmoji(name));
    setItemInput('');
    setQtyInput('1');
    inputRef.current?.focus();
  };

  const handleOptimize = async () => {
    if (!items.length) return;
    setIsOptimizing(true);
    setPhase('list');

    // Simulate API calls with progressive steps
    const steps = ['Fetching live prices…', 'Scraping weekly deals…', 'Calculating GPS distances…', 'Running TSP optimizer…', 'Scoring brands…', 'Building scenarios…'];
    for (let i = 0; i < steps.length; i++) {
      setLoadingStep(i);
      await new Promise(r => setTimeout(r, 500 + Math.random() * 250));
    }

    const results = optimize({
      items: items.map(i => ({ name: i.name, qty: i.qty, emoji: i.emoji })),
      household,
    });

    setScenarios(results);
    setIsOptimizing(false);
    setPhase('results');
  };

  const handleApprove = () => {
    if (!chosenScenario) return;
    const maxTotal = Math.max(...scenarios.map(s => s.trip.costs.total));
    const saving = maxTotal - chosenScenario.trip.costs.total;
    const score = calcOptimizationScore(chosenScenario, saving, maxTotal, household.budget.weekly, true);

    const record: TripRecord = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString('en-US', { timeZone: 'America/Los_Angeles', month: 'short', day: 'numeric' }),
      name: chosenScenario.name,
      sub: chosenScenario.sub,
      total: chosenScenario.trip.costs.total,
      saving,
      score,
      type: chosenScenario.type,
      itemCount: items.length,
      miles: chosenScenario.trip.costs.totalMiles,
      minutes: chosenScenario.trip.costs.totalMinutes,
      budgetRespected: chosenScenario.trip.costs.total <= household.budget.weekly,
      vehicleType: household.vehicle.type,
    };

    addTrip(record);
    setPhase('confirmed');
  };

  const handleNewList = () => {
    clearItems();
    setScenarios([]);
    setChosenScenario(null);
    setPhase('list');
  };

  // ── RENDER ──
  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.logo}>
            <KermaLogo size={32} />
            <View>
              <Text style={styles.logoName}>Kerma</Text>
              <Text style={styles.logoSub}>by Pionexis · Astride AI</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <View style={styles.mvpChip}>
              <Text style={styles.mvpText}>MVP · All unlocked</Text>
            </View>
          </View>
        </View>
        <View style={styles.gpsBar}>
          <Text style={styles.gpsPin}>📍</Text>
          <Text style={styles.gpsTxt} numberOfLines={1}>
            {gpsLocked
              ? `${household.location.lat.toFixed(4)}N · GPS locked`
              : `${household.location.city}, CA · Default`}
          </Text>
          <View style={[styles.gpsBadge, gpsLocked ? styles.gpsLocked : styles.gpsDefault]}>
            <Text style={styles.gpsBadgeTxt}>{gpsLocked ? 'LOCKED' : 'DEFAULT'}</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>

          {/* ── LOADING ── */}
          {isOptimizing && (
            <View style={styles.loadWrap}>
              <ActivityIndicator size="large" color={Colors.kerma} />
              <Text style={styles.loadTitle}>Astride is optimizing…</Text>
              <Text style={styles.loadSub}>
                {['Fetching live prices…', 'Scraping weekly deals…', 'Calculating GPS distances…', 'Running TSP optimizer…', 'Scoring brands…', 'Building scenarios…'][loadingStep]}
              </Text>
            </View>
          )}

          {/* ── LIST PHASE ── */}
          {!isOptimizing && phase === 'list' && (
            <>
              <AstrideAgent message={agentMessage()} />

              {/* Quick chips */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
                {QUICK_ITEMS.map(q => (
                  <TouchableOpacity
                    key={q.name}
                    style={styles.chip}
                    onPress={() => addItem(q.name, 1, getEmoji(q.name))}
                  >
                    <Text style={styles.chipText}>{q.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Input row */}
              <View style={styles.inputRow}>
                <TextInput
                  ref={inputRef}
                  style={styles.inp}
                  value={itemInput}
                  onChangeText={setItemInput}
                  placeholder="Add item (milk, eggs, Huggies…)"
                  placeholderTextColor={Colors.t3}
                  onSubmitEditing={handleAddItem}
                  returnKeyType="done"
                />
                <TextInput
                  style={[styles.inp, styles.inpSm]}
                  value={qtyInput}
                  onChangeText={setQtyInput}
                  keyboardType="number-pad"
                  placeholder="Qty"
                  placeholderTextColor={Colors.t3}
                />
                <TouchableOpacity style={styles.btnAdd} onPress={handleAddItem}>
                  <Text style={styles.btnAddTxt}>+</Text>
                </TouchableOpacity>
              </View>

              {/* Items */}
              {items.map(item => {
                const bp = getBestPrice(item.name);
                return (
                  <View key={item.id} style={styles.li}>
                    <Text style={styles.liEmoji}>{item.emoji}</Text>
                    <Text style={styles.liName}>{item.name}</Text>
                    {bp && <Text style={styles.liPrice}>${bp.best.toFixed(2)}</Text>}
                    {bp && bp.diff > 0.5 && <Text style={styles.liSave}>save ${bp.diff.toFixed(2)}</Text>}
                    <Text style={styles.liQty}>×{item.qty}</Text>
                    <TouchableOpacity onPress={() => removeItem(item.id)}>
                      <Text style={styles.liRm}>✕</Text>
                    </TouchableOpacity>
                  </View>
                );
              })}

              {/* Vehicle context */}
              {items.length > 0 && (
                <View style={styles.vehicleBar}>
                  <Text style={styles.vehicleLabel}>
                    {household.vehicle.type === 'electric' ? '⚡' : '🚗'} {vehicleLabel(household.vehicle)} · {household.location.city} OC
                  </Text>
                </View>
              )}

              {/* Optimize button */}
              <TouchableOpacity
                style={[styles.btnMain, !items.length && styles.btnDisabled]}
                onPress={handleOptimize}
                disabled={!items.length}
              >
                <Text style={styles.btnMainTxt}>Optimize across 4 OC stores</Text>
              </TouchableOpacity>
            </>
          )}

          {/* ── RESULTS PHASE ── */}
          {!isOptimizing && phase === 'results' && (
            <>
              {/* Mode tabs */}
              <View style={styles.modeTabs}>
                <Text style={styles.resultsTitle}>Best plans for you</Text>
                <TouchableOpacity style={styles.editBtn} onPress={() => setPhase('list')}>
                  <Text style={styles.editBtnTxt}>← Edit list</Text>
                </TouchableOpacity>
              </View>

              {/* Formula */}
              <View style={styles.formula}>
                <Text style={styles.formulaTitle}>KERMA COST FORMULA — TRANSPARENT</Text>
                <Text style={styles.formulaEq}>
                  <Text style={{ color: Colors.kerma }}>Real cost</Text> = items − coupons
                  {'\n'}+ <Text style={{ color: Colors.gold }}>miles × ${costPerMile(household.vehicle).toFixed(3)}/mi</Text> + <Text style={{ color: Colors.gold }}>min × $/min</Text>
                  {'\n'}+ delivery + <Text style={{ color: Colors.red }}>$2 × extra stops</Text>
                  {'\n'}+ <Text style={{ color: Colors.purple }}>quality weight</Text> + <Text style={{ color: Colors.blue }}>weather</Text>
                </Text>
              </View>

              {/* Context bar */}
              <View style={styles.contextBar}>
                <Text style={styles.contextItem}>
                  {household.vehicle.type === 'electric' ? '⚡' : '🚗'} {vehicleLabel(household.vehicle)}
                </Text>
                <Text style={styles.contextItem}>☀️ Clear · 73°F OC</Text>
                <Text style={styles.contextItem}>📍 {household.location.city}</Text>
              </View>

              {/* Scenario cards */}
              {scenarios.map((scenario, i) => {
                const maxTotal = Math.max(...scenarios.map(s => s.trip.costs.total));
                return (
                  <ScenarioCard
                    key={scenario.id}
                    scenario={scenario}
                    rank={i}
                    isSelected={chosenScenario?.id === scenario.id}
                    saving={maxTotal - scenario.trip.costs.total}
                    onSelect={() => setChosenScenario(scenario)}
                  />
                );
              })}

              {/* Validate */}
              {chosenScenario && (
                <View style={styles.validateBox}>
                  <View style={styles.validateTitle}>
                    <View style={styles.vDot} />
                    <Text style={styles.validateTitleTxt}>Your approval — Astride never pays</Text>
                  </View>
                  <View style={styles.vRow}>
                    <View>
                      <Text style={styles.vName}>{chosenScenario.name}</Text>
                      <Text style={styles.vSub}>{chosenScenario.sub}</Text>
                    </View>
                    <Text style={styles.vPrice}>${chosenScenario.trip.costs.total.toFixed(2)}</Text>
                  </View>
                  <Text style={styles.disclaimer}>
                    ⚠ Kerma never executes purchases. This is a plan only. You pay at the store's own checkout.
                  </Text>
                  <TouchableOpacity style={styles.btnVal} onPress={handleApprove}>
                    <Text style={styles.btnValTxt}>✓ Approve this plan</Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}

          {/* ── CONFIRMED PHASE ── */}
          {!isOptimizing && phase === 'confirmed' && chosenScenario && (
            <View style={styles.confirmed}>
              <Text style={styles.confIco}>✅</Text>
              <Text style={styles.confTitle}>Plan approved!</Text>
              <Text style={styles.confSub}>{chosenScenario.name} · {chosenScenario.sub}</Text>
              <View style={styles.confStats}>
                {[
                  { v: `$${(Math.max(...scenarios.map(s => s.trip.costs.total)) - chosenScenario.trip.costs.total).toFixed(2)}`, l: 'Saved' },
                  { v: `${chosenScenario.trip.costs.totalMinutes}min`, l: 'Time' },
                  { v: `${household.vehicle.type === 'electric' ? '⚡' : '🚗'} ${chosenScenario.trip.costs.totalMiles.toFixed(1)}mi`, l: 'Miles' },
                ].map((stat, i) => (
                  <View key={i} style={styles.confStat}>
                    <Text style={styles.confStatV}>{stat.v}</Text>
                    <Text style={styles.confStatL}>{stat.l}</Text>
                  </View>
                ))}
              </View>
              <Text style={styles.confNote}>
                <Text style={{ color: Colors.kerma, fontFamily: Typography.semiBold }}>No payment was made.</Text> For online orders, Kerma opens the store cart. For in-store, route sent to Maps.
              </Text>
              <TouchableOpacity style={styles.btnMain} onPress={handleNewList}>
                <Text style={styles.btnMainTxt}>+ Start new list</Text>
              </TouchableOpacity>
            </View>
          )}

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: {
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
  },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  logo: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  logoName: { fontFamily: Typography.serifBlack, fontSize: 20, color: Colors.text, letterSpacing: -0.5 },
  logoSub: { fontFamily: Typography.medium, fontSize: 9, color: Colors.t3, letterSpacing: 1.5, textTransform: 'uppercase' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  mvpChip: { backgroundColor: Colors.kermaLight, borderWidth: 1, borderColor: 'rgba(10,107,75,0.2)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  mvpText: { fontFamily: Typography.bold, fontSize: 10, color: Colors.kerma },
  gpsBar: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.bg2, borderRadius: Radius.sm, paddingHorizontal: Spacing.md, paddingVertical: 7 },
  gpsPin: { fontSize: 12 },
  gpsTxt: { fontFamily: Typography.medium, fontSize: 11, color: Colors.t2, flex: 1 },
  gpsBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10 },
  gpsLocked: { backgroundColor: Colors.kermaLight },
  gpsDefault: { backgroundColor: Colors.amberLight },
  gpsBadgeTxt: { fontFamily: Typography.bold, fontSize: 8, color: Colors.kerma },
  scroll: { flex: 1 },
  content: { padding: Spacing.xl, gap: Spacing.md, paddingBottom: 100 },
  loadWrap: { alignItems: 'center', gap: Spacing.lg, paddingVertical: Spacing.xxxl },
  loadTitle: { fontFamily: Typography.serif, fontSize: 17, color: Colors.text },
  loadSub: { fontFamily: Typography.regular, fontSize: 12, color: Colors.t2 },
  chipsScroll: { marginHorizontal: -Spacing.xl, paddingHorizontal: Spacing.xl },
  chip: { backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, borderRadius: 20, paddingHorizontal: Spacing.md, paddingVertical: 6, marginRight: Spacing.sm, ...Shadows.sm },
  chipText: { fontFamily: Typography.medium, fontSize: 12, color: Colors.t2 },
  inputRow: { flexDirection: 'row', gap: Spacing.sm },
  inp: { flex: 1, backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.sm, paddingHorizontal: Spacing.md, paddingVertical: 11, fontFamily: Typography.regular, fontSize: 14, color: Colors.text, ...Shadows.sm },
  inpSm: { flex: 0, width: 54, textAlign: 'center' },
  btnAdd: { width: 44, height: 44, backgroundColor: Colors.kerma, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center', ...Shadows.sm },
  btnAddTxt: { color: Colors.white, fontSize: 22, lineHeight: 26 },
  li: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.sm, padding: Spacing.md, ...Shadows.sm },
  liEmoji: { fontSize: 18, width: 22, textAlign: 'center' },
  liName: { flex: 1, fontFamily: Typography.medium, fontSize: 13, color: Colors.text },
  liPrice: { fontFamily: Typography.bold, fontSize: 11, color: Colors.kerma },
  liSave: { fontFamily: Typography.bold, fontSize: 10, color: Colors.gold },
  liQty: { fontFamily: Typography.medium, fontSize: 10, color: Colors.t2, backgroundColor: Colors.bg2, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  liRm: { fontSize: 15, color: Colors.t3, padding: 3 },
  vehicleBar: { backgroundColor: Colors.kermaLight, borderRadius: Radius.sm, padding: Spacing.sm + 2 },
  vehicleLabel: { fontFamily: Typography.medium, fontSize: 11, color: Colors.kerma, textAlign: 'center' },
  btnMain: { backgroundColor: Colors.kerma, borderRadius: Radius.md, padding: 15, alignItems: 'center', shadowColor: Colors.kerma, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 12, elevation: 4 },
  btnMainTxt: { fontFamily: Typography.semiBold, fontSize: 15, color: Colors.white },
  btnDisabled: { opacity: 0.35 },
  modeTabs: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  resultsTitle: { fontFamily: Typography.bold, fontSize: 11, color: Colors.t3, letterSpacing: 1.5, textTransform: 'uppercase' },
  editBtn: { backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.full, paddingHorizontal: 12, paddingVertical: 5 },
  editBtnTxt: { fontFamily: Typography.medium, fontSize: 11, color: Colors.t2 },
  formula: { backgroundColor: Colors.kermaPale, borderWidth: 1, borderColor: 'rgba(10,107,75,0.15)', borderRadius: Radius.md, padding: Spacing.md },
  formulaTitle: { fontFamily: Typography.bold, fontSize: 9, color: Colors.kerma, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 7 },
  formulaEq: { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 11, color: Colors.text, lineHeight: 18 },
  contextBar: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, padding: Spacing.md, ...Shadows.sm },
  contextItem: { fontFamily: Typography.medium, fontSize: 11, color: Colors.t2 },
  validateBox: { backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.kerma, borderRadius: Radius.md, padding: Spacing.lg, ...Shadows.lg },
  validateTitle: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: Spacing.md },
  vDot: { width: 7, height: 7, borderRadius: 99, backgroundColor: Colors.kerma },
  validateTitleTxt: { fontFamily: Typography.semiBold, fontSize: 13, color: Colors.text },
  vRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.kermaPale, borderWidth: 1, borderColor: 'rgba(10,107,75,0.2)', borderRadius: Radius.sm, padding: Spacing.md, marginBottom: Spacing.md },
  vName: { fontFamily: Typography.bold, fontSize: 13, color: Colors.kerma },
  vSub: { fontFamily: Typography.regular, fontSize: 10, color: Colors.t2, marginTop: 2 },
  vPrice: { fontFamily: Typography.serifBlack, fontSize: 22, color: Colors.text },
  disclaimer: { fontFamily: Typography.regular, fontSize: 10, color: Colors.t2, backgroundColor: Colors.amberLight, borderWidth: 1, borderColor: 'rgba(212,114,10,0.2)', borderRadius: Radius.sm, padding: Spacing.md, marginBottom: Spacing.md, lineHeight: 15 },
  btnVal: { backgroundColor: Colors.kerma, borderRadius: Radius.sm, padding: 14, alignItems: 'center', shadowColor: Colors.kerma, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.22, shadowRadius: 10, elevation: 3 },
  btnValTxt: { fontFamily: Typography.bold, fontSize: 14, color: Colors.white },
  confirmed: { alignItems: 'center', gap: Spacing.lg, paddingVertical: Spacing.xxl },
  confIco: { fontSize: 58 },
  confTitle: { fontFamily: Typography.serifBlack, fontSize: 26, color: Colors.text },
  confSub: { fontFamily: Typography.regular, fontSize: 13, color: Colors.t2, textAlign: 'center' },
  confStats: { flexDirection: 'row', gap: Spacing.sm, width: '100%' },
  confStat: { flex: 1, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.sm, padding: Spacing.md, alignItems: 'center', ...Shadows.sm },
  confStatV: { fontFamily: Typography.serifBlack, fontSize: 18, color: Colors.kerma, marginBottom: 3 },
  confStatL: { fontFamily: Typography.medium, fontSize: 9, color: Colors.t2 },
  confNote: { backgroundColor: Colors.kermaPale, borderWidth: 1, borderColor: 'rgba(10,107,75,0.15)', borderRadius: Radius.md, padding: Spacing.md, fontFamily: Typography.regular, fontSize: 12, color: Colors.t2, lineHeight: 18, width: '100%' },
});
