import { Feather } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useData } from '@/context/DataContext';
import { useColors } from '@/hooks/useColors';

function fmt(n: number) {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 0 });
}

export default function ReportsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { properties, expenses, calcNetProfit } = useData();
  const topInset = Platform.OS === 'web' ? 67 : insets.top;

  const report = useMemo(() => {
    const sold = properties.filter((p) => p.status === 'Sold' || p.status === 'Completed');
    const active = properties.filter((p) =>
      ['Under Contract', 'Purchased', 'Renovating', 'Listed'].includes(p.status),
    );

    const totalPurchase = properties.reduce((s, p) => s + p.purchasePrice, 0);
    const totalClosing = properties.reduce((s, p) => s + p.closingCosts, 0);
    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
    const totalBudget = properties.reduce((s, p) => s + p.budgetItems.reduce((b, i) => b + i.estimated, 0), 0);
    const totalActual = properties.reduce((s, p) => s + p.budgetItems.reduce((b, i) => b + i.actual, 0), 0);
    const totalProfit = sold.reduce((s, p) => s + calcNetProfit(p), 0);
    const totalRevenue = sold.reduce((s, p) => s + (p.saleInfo?.salePrice ?? 0), 0);

    const byCategory: Record<string, number> = {};
    expenses.forEach((e) => {
      byCategory[e.category] = (byCategory[e.category] ?? 0) + e.amount;
    });
    const categoryBreakdown = Object.entries(byCategory)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);

    const propReports = properties.map((p) => {
      const propExp = expenses.filter((e) => e.propertyId === p.id).reduce((s, e) => s + e.amount, 0);
      const budget = p.budgetItems.reduce((s, b) => s + b.estimated, 0);
      const profit = calcNetProfit(p);
      return { ...p, propExp, budget, profit };
    });

    return {
      sold, active, totalPurchase, totalClosing, totalExpenses,
      totalBudget, totalActual, totalProfit, totalRevenue, categoryBreakdown, propReports,
    };
  }, [properties, expenses, calcNetProfit]);

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingTop: topInset + 12, paddingBottom: insets.bottom + 100 }]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.pageTitle, { color: colors.foreground }]}>Reports</Text>

      {/* Company Summary */}
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Company Overview</Text>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Row label="Total Properties" value={String(properties.length)} colors={colors} />
        <Row label="Active Projects" value={String(report.active.length)} colors={colors} />
        <Row label="Completed / Sold" value={String(report.sold.length)} colors={colors} />
        <Row label="Total Purchase Amount" value={fmt(report.totalPurchase)} colors={colors} />
        <Row label="Total Closing Costs" value={fmt(report.totalClosing)} colors={colors} />
        <Row label="Total Expenses Paid" value={fmt(report.totalExpenses)} colors={colors} />
        <Row label="Total Sale Revenue" value={fmt(report.totalRevenue)} colors={colors} />
        <Row
          label="Total Net Profit"
          value={fmt(report.totalProfit)}
          colors={colors}
          valueColor={report.totalProfit >= 0 ? '#22C55E' : '#EF4444'}
          last
        />
      </View>

      {/* Budget vs Actual */}
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Budget vs. Actual</Text>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Row label="Total Estimated Budget" value={fmt(report.totalBudget)} colors={colors} />
        <Row
          label="Total Actual Spent"
          value={fmt(report.totalActual)}
          colors={colors}
          valueColor={report.totalActual > report.totalBudget && report.totalBudget > 0 ? '#EF4444' : '#22C55E'}
        />
        <Row
          label="Variance"
          value={fmt(Math.abs(report.totalBudget - report.totalActual))}
          colors={colors}
          valueColor={report.totalActual > report.totalBudget ? '#EF4444' : '#22C55E'}
          last
        />
      </View>

      {/* Expense by Category */}
      {report.categoryBreakdown.length > 0 && (
        <>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Expenses by Category</Text>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {report.categoryBreakdown.map(([cat, amt], i) => (
              <Row
                key={cat}
                label={cat}
                value={fmt(amt)}
                colors={colors}
                last={i === report.categoryBreakdown.length - 1}
              />
            ))}
          </View>
        </>
      )}

      {/* Per-Property */}
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Per-Property Summary</Text>
      {report.propReports.map((p) => (
        <View key={p.id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.propHeader}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.propAddress, { color: colors.foreground }]}>{p.address}</Text>
              <Text style={[styles.propSub, { color: colors.mutedForeground }]}>
                {p.city}, {p.state} · {p.status}
              </Text>
            </View>
            {p.saleInfo && (
              <View style={[styles.profitBadge, { backgroundColor: p.profit >= 0 ? '#F0FDF4' : '#FEF2F2' }]}>
                <Feather name={p.profit >= 0 ? 'trending-up' : 'trending-down'} size={12} color={p.profit >= 0 ? '#16A34A' : '#DC2626'} />
                <Text style={[styles.profitText, { color: p.profit >= 0 ? '#16A34A' : '#DC2626' }]}>
                  {fmt(p.profit)}
                </Text>
              </View>
            )}
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <Row label="Purchase Price" value={fmt(p.purchasePrice)} colors={colors} />
          <Row label="Closing Costs" value={fmt(p.closingCosts)} colors={colors} />
          <Row label="Renovation Budget" value={p.budget > 0 ? fmt(p.budget) : '—'} colors={colors} />
          <Row label="Expenses Paid" value={fmt(p.propExp)} colors={colors} />
          {p.saleInfo && (
            <>
              <Row label="Sale Price" value={fmt(p.saleInfo.salePrice)} colors={colors} />
              <Row label="Selling Costs" value={fmt(p.saleInfo.sellingClosingCosts + p.saleInfo.realtorCommission + p.saleInfo.attorneyFee)} colors={colors} />
              <Row label="Net Profit" value={fmt(p.profit)} colors={colors} valueColor={p.profit >= 0 ? '#22C55E' : '#EF4444'} last />
            </>
          )}
        </View>
      ))}
    </ScrollView>
  );
}

function Row({
  label,
  value,
  colors,
  valueColor,
  last = false,
}: {
  label: string;
  value: string;
  colors: ReturnType<typeof import('@/hooks/useColors').useColors>;
  valueColor?: string;
  last?: boolean;
}) {
  return (
    <View style={[styles.row, !last && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
      <Text style={[styles.rowLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[styles.rowValue, { color: valueColor ?? colors.foreground }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 16 },
  pageTitle: { fontSize: 26, fontFamily: 'Inter_700Bold', marginBottom: 20 },
  sectionTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold', marginBottom: 10, marginTop: 4 },
  card: { borderRadius: 14, borderWidth: 1, marginBottom: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12 },
  rowLabel: { fontSize: 13, fontFamily: 'Inter_400Regular', flex: 1 },
  rowValue: { fontSize: 14, fontFamily: 'Inter_600SemiBold', textAlign: 'right' },
  propHeader: { flexDirection: 'row', alignItems: 'flex-start', padding: 14, gap: 10 },
  propAddress: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  propSub: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  profitBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  profitText: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  divider: { height: 1 },
});
