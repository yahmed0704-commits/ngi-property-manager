import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useColors } from '@/hooks/useColors';
import { Property } from '@/types';

const STATUS_COLORS: Record<string, string> = {
  'Under Contract': '#F59E0B',
  'Purchased': '#3B82F6',
  'Renovating': '#8B5CF6',
  'Listed': '#06B6D4',
  'Sold': '#22C55E',
  'Rented': '#10B981',
  'Completed': '#6B7280',
};

function fmt(n: number) {
  return '$' + n.toLocaleString('en-US');
}

interface Props {
  property: Property;
  totalExpenses: number;
}

export function PropertyCard({ property, totalExpenses }: Props) {
  const colors = useColors();
  const router = useRouter();
  const totalBudget = property.budgetItems.reduce((s, b) => s + b.estimated, 0);
  const overBudget = totalExpenses > totalBudget && totalBudget > 0;

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => router.push(`/property/${property.id}`)}
      activeOpacity={0.8}
    >
      <View style={styles.header}>
        <View style={styles.addressBlock}>
          <Text style={[styles.address, { color: colors.foreground }]} numberOfLines={1}>
            {property.address}
          </Text>
          <Text style={[styles.subAddress, { color: colors.mutedForeground }]}>
            {property.city}, {property.state} {property.zip}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[property.status] + '20' }]}>
          <Text style={[styles.statusText, { color: STATUS_COLORS[property.status] }]}>
            {property.status}
          </Text>
        </View>
      </View>

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      <View style={styles.stats}>
        <View style={styles.stat}>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Purchase</Text>
          <Text style={[styles.statValue, { color: colors.foreground }]}>{fmt(property.purchasePrice)}</Text>
        </View>
        <View style={styles.stat}>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Budget</Text>
          <Text style={[styles.statValue, { color: colors.foreground }]}>{totalBudget > 0 ? fmt(totalBudget) : '—'}</Text>
        </View>
        <View style={styles.stat}>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Spent</Text>
          <Text style={[styles.statValue, { color: overBudget ? '#EF4444' : colors.foreground }]}>
            {fmt(totalExpenses)}
          </Text>
        </View>
      </View>

      {overBudget && (
        <View style={styles.alert}>
          <Feather name="alert-triangle" size={12} color="#EF4444" />
          <Text style={styles.alertText}>Over budget by {fmt(totalExpenses - totalBudget)}</Text>
        </View>
      )}

      <View style={styles.footer}>
        <Text style={[styles.type, { color: colors.mutedForeground }]}>{property.type}</Text>
        <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  addressBlock: { flex: 1 },
  address: { fontSize: 15, fontFamily: 'Inter_600SemiBold', lineHeight: 20 },
  subAddress: { fontSize: 13, fontFamily: 'Inter_400Regular', marginTop: 2 },
  statusBadge: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  divider: { height: 1, marginVertical: 12 },
  stats: { flexDirection: 'row', justifyContent: 'space-between' },
  stat: { alignItems: 'flex-start' },
  statLabel: { fontSize: 11, fontFamily: 'Inter_400Regular', marginBottom: 2 },
  statValue: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  alert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 10,
    backgroundColor: '#FEF2F2',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  alertText: { fontSize: 11, fontFamily: 'Inter_500Medium', color: '#EF4444' },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  type: { fontSize: 12, fontFamily: 'Inter_400Regular' },
});
