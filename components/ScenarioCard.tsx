import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Scenario } from '../engine/ontology';
import { Colors, Typography, Spacing, Radius, Shadows } from '../constants/theme';

interface ScenarioCardProps {
  scenario: Scenario;
  isSelected: boolean;
  onSelect: () => void;
  saving: number;
  rank: number;
}

const BADGE_STYLES: Record<string, { bg: string; color: string }> = {
  'sb-k': { bg: Colors.kermaLight, color: Colors.kerma },
  'sb-g': { bg: Colors.goldLight, color: Colors.gold },
  'sb-b': { bg: Colors.blueLight, color: Colors.blue },
  'sb-p': { bg: Colors.purpleLight, color: Colors.purple },
};

export function ScenarioCard({ scenario, isSelected, onSelect, saving, rank }: ScenarioCardProps) {
  const { trip } = scenario;
  const { costs } = trip;
  const badgeStyle = BADGE_STYLES[scenario.badge] ?? BADGE_STYLES['sb-k'];
  const isOnline = scenario.type === 'online';

  const breakdown = [
    { value: `$${costs.items.toFixed(2)}`, label: 'Items', color: Colors.kerma },
    {
      value: isOnline ? `$${costs.delivery.toFixed(2)}` : `$${costs.gas.toFixed(2)}`,
      label: isOnline ? 'Delivery' : `Gas (${costs.totalMiles.toFixed(1)}mi)`,
      color: Colors.gold,
    },
    { value: `${costs.totalMinutes}min`, label: isOnline ? 'Delivery' : 'Trip', color: Colors.blue },
    { value: `$${costs.time.toFixed(2)}`, label: 'Time cost', color: Colors.purple },
  ];

  return (
    <TouchableOpacity
      style={[
        styles.card,
        rank === 0 && styles.cardBest,
        isSelected && styles.cardSelected,
      ]}
      onPress={onSelect}
      activeOpacity={0.9}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.badge, { backgroundColor: badgeStyle.bg }]}>
            <Text style={[styles.badgeText, { color: badgeStyle.color }]}>
              {scenario.label}
            </Text>
          </View>
          <Text style={styles.name}>{scenario.name}</Text>
          <Text style={styles.sub}>{scenario.sub}</Text>
          {scenario.reasoning ? (
            <Text style={styles.reasoning}>"{scenario.reasoning}"</Text>
          ) : null}
        </View>
        <View style={styles.priceWrap}>
          <Text style={styles.total}>${costs.total.toFixed(2)}</Text>
          <Text style={styles.priceLabel}>real total cost</Text>
          {saving > 0.5 && (
            <Text style={styles.saving}>save ${saving.toFixed(2)}</Text>
          )}
        </View>
      </View>

      {/* Breakdown */}
      <View style={styles.breakdown}>
        {breakdown.map((cell, i) => (
          <View key={i} style={[styles.cell, i < breakdown.length - 1 && styles.cellBorder]}>
            <Text style={[styles.cellValue, { color: cell.color }]}>{cell.value}</Text>
            <Text style={styles.cellLabel}>{cell.label}</Text>
          </View>
        ))}
      </View>

      {/* Tags */}
      <View style={styles.tags}>
        {scenario.trip.stores.map((storeId, i) => (
          <View key={i} style={styles.tag}>
            <Text style={styles.tagText}>
              {isOnline ? '🌐' : '📍'} {storeId.toUpperCase()} · {costs.totalMiles > 0 ? `${(costs.totalMiles / 2).toFixed(1)} mi` : 'online'}
            </Text>
          </View>
        ))}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    overflow: 'hidden',
    marginBottom: Spacing.sm + 2,
    ...Shadows.sm,
  },
  cardBest: {
    borderColor: 'rgba(10,107,75,0.4)',
    shadowColor: Colors.kerma,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  cardSelected: {
    borderColor: Colors.kerma,
    borderWidth: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: Spacing.sm,
  },
  headerLeft: { flex: 1, minWidth: 0 },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
    marginBottom: 6,
  },
  badgeText: {
    fontFamily: Typography.bold,
    fontSize: 9,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  name: {
    fontFamily: Typography.serifBlack,
    fontSize: 15,
    color: Colors.text,
    marginBottom: 2,
    lineHeight: 20,
  },
  sub: {
    fontFamily: Typography.regular,
    fontSize: 11,
    color: Colors.t2,
  },
  reasoning: {
    fontFamily: Typography.regular,
    fontSize: 10,
    color: Colors.kerma,
    fontStyle: 'italic',
    marginTop: 5,
    lineHeight: 15,
  },
  priceWrap: { alignItems: 'flex-end', flexShrink: 0 },
  total: {
    fontFamily: Typography.serifBlack,
    fontSize: 24,
    color: Colors.text,
    lineHeight: 28,
  },
  priceLabel: {
    fontFamily: Typography.regular,
    fontSize: 9,
    color: Colors.t3,
    marginTop: 2,
  },
  saving: {
    fontFamily: Typography.bold,
    fontSize: 11,
    color: Colors.kerma,
    marginTop: 3,
  },
  breakdown: {
    flexDirection: 'row',
  },
  cell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.sm + 1,
  },
  cellBorder: {
    borderRightWidth: 1,
    borderRightColor: Colors.border,
  },
  cellValue: {
    fontFamily: Typography.serif,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2,
  },
  cellLabel: {
    fontFamily: Typography.regular,
    fontSize: 9,
    color: Colors.t2,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    padding: Spacing.sm,
    backgroundColor: Colors.bg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  tag: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.sm / 2,
    paddingHorizontal: Spacing.sm + 1,
    paddingVertical: 2,
  },
  tagText: {
    fontFamily: Typography.medium,
    fontSize: 10,
    color: Colors.t2,
  },
});
