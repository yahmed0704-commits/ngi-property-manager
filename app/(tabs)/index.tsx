import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { useRental } from '@/context/RentalContext';
import { useColors } from '@/hooks/useColors';

function fmt(n: number) {
  if (n >= 1_000_000) return '$' + (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return '$' + (n / 1_000).toFixed(0) + 'K';
  return '$' + n.toLocaleString();
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

const RENT_STATUS_COLORS: Record<string, string> = {
  Active: '#22C55E',
  'Ending Soon': '#F59E0B',
  Vacant: '#EF4444',
};

export default function DashboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { properties, expenses, calcNetProfit } = useData();
  const { units, payments, maintenance, markPaymentPaid } = useRental();
  const router = useRouter();

  const topInset = Platform.OS === 'web' ? 67 : insets.top;

  // ── Fix & Flip stats ──────────────────────────────────────────────────────
  const flipStats = useMemo(() => {
    const active = properties.filter((p) =>
      ['Under Contract', 'Purchased', 'Renovating', 'Listed'].includes(p.status),
    );
    const completed = properties.filter((p) => ['Sold', 'Completed'].includes(p.status));
    const totalPurchase = properties.reduce((s, p) => s + p.purchasePrice, 0);
    const totalBudget = properties.reduce(
      (s, p) => s + p.budgetItems.reduce((bs, b) => bs + b.estimated, 0),
      0,
    );
    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
    const totalProfit = completed.reduce((s, p) => s + calcNetProfit(p), 0);

    const overBudget = active.filter((p) => {
      const budget = p.budgetItems.reduce((s, b) => s + b.estimated, 0);
      const spent = expenses
        .filter((e) => e.propertyId === p.id)
        .reduce((s, e) => s + e.amount, 0);
      return budget > 0 && spent > budget;
    });

    return { active, completed, totalPurchase, totalBudget, totalExpenses, totalProfit, overBudget };
  }, [properties, expenses, calcNetProfit]);

  // ── Rental stats ──────────────────────────────────────────────────────────
  const rentalStats = useMemo(() => {
    const occupied = units.filter((u) => u.status !== 'Vacant');
    const vacant = units.filter((u) => u.status === 'Vacant');
    const endingSoon = units.filter((u) => u.status === 'Ending Soon');
    const monthlyIncome = occupied.reduce((s, u) => s + u.monthlyRent, 0);
    const annualIncome = monthlyIncome * 12;
    const occupancyPct = units.length > 0 ? Math.round((occupied.length / units.length) * 100) : 0;

    const thisMonth = new Date().toISOString().slice(0, 7);
    const pendingPayments = payments.filter(
      (p) => p.month === thisMonth && p.status !== 'Paid',
    );
    const openMaintenance = maintenance.filter((m) => m.status !== 'Completed');
    const highPriorityMaint = openMaintenance.filter((m) => m.priority === 'High');

    const totalSecurityDeposits = occupied.reduce((s, u) => s + u.securityDeposit, 0);

    return {
      occupied, vacant, endingSoon, monthlyIncome, annualIncome,
      occupancyPct, pendingPayments, openMaintenance, highPriorityMaint,
      totalSecurityDeposits,
    };
  }, [units, payments, maintenance]);

  // ── Recent expenses ───────────────────────────────────────────────────────
  const recentExpenses = useMemo(
    () => [...expenses].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 4),
    [expenses],
  );

  const handleMarkPaid = (paymentId: string) => {
    markPaymentPaid(paymentId, new Date().toISOString().split('T')[0]);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        { paddingTop: topInset + 16, paddingBottom: insets.bottom + 100 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: colors.mutedForeground }]}>{getGreeting()}</Text>
          <Text style={[styles.userName, { color: colors.foreground }]}>{user?.name ?? 'Welcome'}</Text>
        </View>
        <View style={[styles.roleTag, { backgroundColor: colors.navy + '18' }]}>
          <Text style={[styles.roleText, { color: colors.navy }]}>{user?.role}</Text>
        </View>
      </View>

      {/* ── Combined Portfolio Banner ────────────────────────────────── */}
      <View style={[styles.portfolioBanner, { backgroundColor: colors.navy }]}>
        <Text style={styles.bannerLabel}>Total Portfolio</Text>
        <Text style={styles.bannerValue}>{fmt(flipStats.totalPurchase + rentalStats.annualIncome)}</Text>
        <Text style={styles.bannerSub}>
          {fmt(flipStats.totalPurchase)} invested · {fmt(rentalStats.annualIncome)}/yr rental income
        </Text>
        <View style={styles.bannerDivider} />
        <View style={styles.bannerPillRow}>
          <View style={styles.bannerPill}>
            <Text style={styles.bannerPillVal}>{flipStats.active.length}</Text>
            <Text style={styles.bannerPillLabel}>Active Flips</Text>
          </View>
          <View style={styles.bannerPill}>
            <Text style={styles.bannerPillVal}>{flipStats.completed.length}</Text>
            <Text style={styles.bannerPillLabel}>Completed</Text>
          </View>
          <View style={styles.bannerPill}>
            <Text style={styles.bannerPillVal}>{rentalStats.occupied.length}/{units.length}</Text>
            <Text style={styles.bannerPillLabel}>Units Rented</Text>
          </View>
          <View style={styles.bannerPill}>
            <Text style={[styles.bannerPillVal, { color: '#C9912A' }]}>{fmt(flipStats.totalProfit)}</Text>
            <Text style={styles.bannerPillLabel}>Net Profit</Text>
          </View>
        </View>
      </View>

      {/* ── Alert Banners ───────────────────────────────────────────────── */}
      {flipStats.overBudget.length > 0 && (
        <TouchableOpacity
          style={[styles.alertBanner, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}
          onPress={() => router.push('/(tabs)/properties')}
          activeOpacity={0.8}
        >
          <Feather name="alert-triangle" size={15} color="#EF4444" />
          <Text style={[styles.alertBannerText, { color: '#EF4444' }]}>
            {flipStats.overBudget.length} project{flipStats.overBudget.length > 1 ? 's' : ''} over budget
          </Text>
          <Feather name="chevron-right" size={13} color="#EF4444" />
        </TouchableOpacity>
      )}
      {rentalStats.pendingPayments.length > 0 && (
        <TouchableOpacity
          style={[styles.alertBanner, { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' }]}
          onPress={() => router.push('/(tabs)/rentals')}
          activeOpacity={0.8}
        >
          <Feather name="dollar-sign" size={15} color="#D97706" />
          <Text style={[styles.alertBannerText, { color: '#D97706' }]}>
            {rentalStats.pendingPayments.length} rent payment{rentalStats.pendingPayments.length > 1 ? 's' : ''} pending this month
          </Text>
          <Feather name="chevron-right" size={13} color="#D97706" />
        </TouchableOpacity>
      )}
      {rentalStats.highPriorityMaint.length > 0 && (
        <TouchableOpacity
          style={[styles.alertBanner, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}
          onPress={() => router.push('/(tabs)/rentals')}
          activeOpacity={0.8}
        >
          <Feather name="tool" size={15} color="#EF4444" />
          <Text style={[styles.alertBannerText, { color: '#EF4444' }]}>
            {rentalStats.highPriorityMaint.length} high-priority maintenance request{rentalStats.highPriorityMaint.length > 1 ? 's' : ''} open
          </Text>
          <Feather name="chevron-right" size={13} color="#EF4444" />
        </TouchableOpacity>
      )}
      {rentalStats.endingSoon.length > 0 && (
        <TouchableOpacity
          style={[styles.alertBanner, { backgroundColor: '#F0F9FF', borderColor: '#BAE6FD' }]}
          onPress={() => router.push('/(tabs)/rentals')}
          activeOpacity={0.8}
        >
          <Feather name="calendar" size={15} color="#0284C7" />
          <Text style={[styles.alertBannerText, { color: '#0284C7' }]}>
            {rentalStats.endingSoon.length} lease{rentalStats.endingSoon.length > 1 ? 's' : ''} ending soon — renewal needed
          </Text>
          <Feather name="chevron-right" size={13} color="#0284C7" />
        </TouchableOpacity>
      )}

      {/* ── Fix & Flip Pipeline ──────────────────────────────────────────── */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Fix & Flip Pipeline</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/properties')}>
            <Text style={[styles.seeAll, { color: colors.gold }]}>See all</Text>
          </TouchableOpacity>
        </View>

        {/* Mini stat row */}
        <View style={[styles.miniStatRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <MiniStat label="Invested" value={fmt(flipStats.totalPurchase)} colors={colors} />
          <View style={[styles.miniStatDiv, { backgroundColor: colors.border }]} />
          <MiniStat label="Budget" value={fmt(flipStats.totalBudget)} colors={colors} />
          <View style={[styles.miniStatDiv, { backgroundColor: colors.border }]} />
          <MiniStat label="Spent" value={fmt(flipStats.totalExpenses)} colors={colors} valueColor={flipStats.totalExpenses > flipStats.totalBudget && flipStats.totalBudget > 0 ? '#EF4444' : undefined} />
          <View style={[styles.miniStatDiv, { backgroundColor: colors.border }]} />
          <MiniStat label="Net Profit" value={fmt(flipStats.totalProfit)} colors={colors} valueColor={colors.gold} />
        </View>

        {flipStats.active.length === 0 ? (
          <View style={[styles.emptyInline, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.emptyInlineText, { color: colors.mutedForeground }]}>No active projects</Text>
          </View>
        ) : (
          flipStats.active.slice(0, 3).map((p) => {
            const propExpenses = expenses
              .filter((e) => e.propertyId === p.id)
              .reduce((s, e) => s + e.amount, 0);
            const budget = p.budgetItems.reduce((s, b) => s + b.estimated, 0);
            const pct = budget > 0 ? Math.min(propExpenses / budget, 1) : 0;
            const isOverBudget = budget > 0 && propExpenses > budget;
            return (
              <TouchableOpacity
                key={p.id}
                style={[styles.projectRow, { backgroundColor: colors.card, borderColor: isOverBudget ? '#FECACA' : colors.border }]}
                onPress={() => router.push(`/property/${p.id}`)}
                activeOpacity={0.8}
              >
                <View style={styles.projectRowLeft}>
                  <View style={styles.projectTopRow}>
                    <Text style={[styles.projectAddress, { color: colors.foreground }]} numberOfLines={1}>
                      {p.address}
                    </Text>
                    <View style={[styles.statusPill, { backgroundColor: colors.navy + '15' }]}>
                      <Text style={[styles.statusPillText, { color: colors.navy }]}>{p.status}</Text>
                    </View>
                  </View>
                  <Text style={[styles.projectCity, { color: colors.mutedForeground }]}>
                    {p.city}, {p.state}
                  </Text>
                  {budget > 0 && (
                    <View style={styles.progressWrap}>
                      <View style={[styles.progressBg, { backgroundColor: colors.muted }]}>
                        <View
                          style={[
                            styles.progressFill,
                            {
                              width: `${pct * 100}%` as any,
                              backgroundColor: isOverBudget ? '#EF4444' : colors.gold,
                            },
                          ]}
                        />
                      </View>
                      <Text style={[styles.progressLabel, { color: isOverBudget ? '#EF4444' : colors.mutedForeground }]}>
                        {Math.round(pct * 100)}% of budget
                      </Text>
                    </View>
                  )}
                </View>
                <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
              </TouchableOpacity>
            );
          })
        )}
      </View>

      {/* ── Rental Portfolio ─────────────────────────────────────────────── */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Rental Portfolio</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/rentals')}>
            <Text style={[styles.seeAll, { color: colors.gold }]}>See all</Text>
          </TouchableOpacity>
        </View>

        {/* Rental income + occupancy summary */}
        <View style={[styles.rentalSummaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.rentalSummaryLeft}>
            <Text style={[styles.rentalIncomeValue, { color: colors.foreground }]}>{fmt(rentalStats.monthlyIncome)}</Text>
            <Text style={[styles.rentalIncomeLabel, { color: colors.mutedForeground }]}>monthly income</Text>
          </View>
          <View style={[styles.rentalSummaryDiv, { backgroundColor: colors.border }]} />
          <View style={styles.rentalSummaryRight}>
            {/* Occupancy bar */}
            <View style={styles.occupancyRow}>
              <Text style={[styles.occupancyPct, { color: colors.foreground }]}>{rentalStats.occupancyPct}%</Text>
              <Text style={[styles.occupancyLabel, { color: colors.mutedForeground }]}>occupied</Text>
            </View>
            <View style={[styles.occBg, { backgroundColor: colors.muted }]}>
              <View
                style={[styles.occFill, { width: `${rentalStats.occupancyPct}%` as any, backgroundColor: rentalStats.occupancyPct === 100 ? '#22C55E' : colors.gold }]}
              />
            </View>
            <Text style={[styles.occSubtext, { color: colors.mutedForeground }]}>
              {rentalStats.occupied.length} rented · {rentalStats.vacant.length} vacant
            </Text>
          </View>
        </View>

        {/* Unit cards */}
        {units.length === 0 ? (
          <View style={[styles.emptyInline, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.emptyInlineText, { color: colors.mutedForeground }]}>No rental units yet</Text>
          </View>
        ) : (
          units.map((unit) => {
            const thisMonth = new Date().toISOString().slice(0, 7);
            const thisMonthPayment = payments.find(
              (p) => p.unitId === unit.id && p.month === thisMonth,
            );
            const openMaint = maintenance.filter(
              (m) => m.unitId === unit.id && m.status !== 'Completed',
            );

            return (
              <TouchableOpacity
                key={unit.id}
                style={[styles.rentalRow, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => router.push('/(tabs)/rentals')}
                activeOpacity={0.8}
              >
                {/* Left status stripe */}
                <View style={[styles.rentalStripe, { backgroundColor: RENT_STATUS_COLORS[unit.status] }]} />

                <View style={styles.rentalRowBody}>
                  <View style={styles.rentalRowTop}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.rentalAddress, { color: colors.foreground }]} numberOfLines={1}>
                        {unit.address}
                      </Text>
                      <Text style={[styles.rentalCity, { color: colors.mutedForeground }]}>
                        {unit.city}, {unit.state}
                      </Text>
                    </View>
                    <View style={styles.rentalRowRight}>
                      <Text style={[styles.rentalRent, { color: colors.navy }]}>{fmt(unit.monthlyRent)}</Text>
                      <Text style={[styles.rentalRentSub, { color: colors.mutedForeground }]}>/mo</Text>
                    </View>
                  </View>

                  <View style={styles.rentalRowMeta}>
                    <View style={[styles.rentalStatusChip, { backgroundColor: RENT_STATUS_COLORS[unit.status] + '18' }]}>
                      <Text style={[styles.rentalStatusText, { color: RENT_STATUS_COLORS[unit.status] }]}>
                        {unit.status}
                      </Text>
                    </View>
                    {unit.status !== 'Vacant' && (
                      <Text style={[styles.rentalTenant, { color: colors.mutedForeground }]} numberOfLines={1}>
                        {unit.tenantName}
                      </Text>
                    )}
                    {openMaint.length > 0 && (
                      <View style={styles.maintChip}>
                        <Feather name="tool" size={10} color="#EF4444" />
                        <Text style={styles.maintChipText}>{openMaint.length} open</Text>
                      </View>
                    )}
                  </View>

                  {/* This month's payment status + quick action */}
                  {unit.status !== 'Vacant' && (
                    <View style={[styles.paymentBar, { borderTopColor: colors.border }]}>
                      {thisMonthPayment ? (
                        <View style={styles.paymentBarInner}>
                          <Feather
                            name={thisMonthPayment.status === 'Paid' ? 'check-circle' : 'clock'}
                            size={13}
                            color={thisMonthPayment.status === 'Paid' ? '#22C55E' : '#F59E0B'}
                          />
                          <Text style={[styles.paymentBarText, { color: thisMonthPayment.status === 'Paid' ? '#22C55E' : '#D97706' }]}>
                            {thisMonthPayment.status === 'Paid'
                              ? `Rent paid · ${thisMonthPayment.paidDate}`
                              : `Rent ${thisMonthPayment.status.toLowerCase()} — ${thisMonthPayment.month}`}
                          </Text>
                          {thisMonthPayment.status !== 'Paid' && (
                            <TouchableOpacity
                              style={styles.markPaidBtn}
                              onPress={(e) => { e.stopPropagation(); handleMarkPaid(thisMonthPayment.id); }}
                            >
                              <Text style={styles.markPaidText}>Mark Paid</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      ) : (
                        <View style={styles.paymentBarInner}>
                          <Feather name="alert-circle" size={13} color={colors.mutedForeground} />
                          <Text style={[styles.paymentBarText, { color: colors.mutedForeground }]}>
                            No payment recorded for {new Date().toISOString().slice(0, 7)}
                          </Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </View>

      {/* ── Recent Expenses ──────────────────────────────────────────────── */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Recent Expenses</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/expenses')}>
            <Text style={[styles.seeAll, { color: colors.gold }]}>See all</Text>
          </TouchableOpacity>
        </View>
        {recentExpenses.length === 0 ? (
          <View style={[styles.emptyInline, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.emptyInlineText, { color: colors.mutedForeground }]}>No expenses yet</Text>
          </View>
        ) : (
          recentExpenses.map((e) => {
            const prop = properties.find((p) => p.id === e.propertyId);
            return (
              <View key={e.id} style={[styles.expRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.expIcon, { backgroundColor: colors.navy + '18' }]}>
                  <Feather name="file-text" size={14} color={colors.navy} />
                </View>
                <View style={styles.expInfo}>
                  <Text style={[styles.expVendor, { color: colors.foreground }]} numberOfLines={1}>{e.vendor}</Text>
                  <Text style={[styles.expProp, { color: colors.mutedForeground }]} numberOfLines={1}>
                    {prop?.address ?? 'Unknown'} · {e.category}
                  </Text>
                </View>
                <Text style={[styles.expAmt, { color: colors.foreground }]}>
                  ${e.amount.toLocaleString()}
                </Text>
              </View>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}

function MiniStat({ label, value, colors, valueColor }: { label: string; value: string; colors: any; valueColor?: string }) {
  return (
    <View style={styles.miniStatItem}>
      <Text style={[styles.miniStatValue, { color: valueColor ?? colors.foreground }]}>{value}</Text>
      <Text style={[styles.miniStatLabel, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 16 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  greeting: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  userName: { fontSize: 22, fontFamily: 'Inter_700Bold', marginTop: 2 },
  roleTag: { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  roleText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },

  portfolioBanner: {
    borderRadius: 18, padding: 18, marginBottom: 14,
  },
  bannerLabel: { fontSize: 11, fontFamily: 'Inter_500Medium', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: 0.8 },
  bannerValue: { fontSize: 32, fontFamily: 'Inter_700Bold', color: '#fff', marginTop: 4 },
  bannerSub: { fontSize: 12, fontFamily: 'Inter_400Regular', color: 'rgba(255,255,255,0.55)', marginTop: 3 },
  bannerDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.12)', marginVertical: 14 },
  bannerPillRow: { flexDirection: 'row', justifyContent: 'space-between' },
  bannerPill: { alignItems: 'center', flex: 1 },
  bannerPillVal: { fontSize: 16, fontFamily: 'Inter_700Bold', color: '#fff' },
  bannerPillLabel: { fontSize: 10, fontFamily: 'Inter_400Regular', color: 'rgba(255,255,255,0.55)', marginTop: 3, textAlign: 'center' },

  alertBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderRadius: 12, borderWidth: 1, padding: 11, marginBottom: 10,
  },
  alertBannerText: { flex: 1, fontSize: 13, fontFamily: 'Inter_500Medium' },

  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  seeAll: { fontSize: 13, fontFamily: 'Inter_500Medium' },

  miniStatRow: { flexDirection: 'row', borderRadius: 14, borderWidth: 1, paddingVertical: 12, marginBottom: 10 },
  miniStatItem: { flex: 1, alignItems: 'center' },
  miniStatValue: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  miniStatLabel: { fontSize: 10, fontFamily: 'Inter_400Regular', marginTop: 3 },
  miniStatDiv: { width: 1, marginVertical: 4 },

  emptyInline: { borderRadius: 12, borderWidth: 1, padding: 20, alignItems: 'center' },
  emptyInlineText: { fontSize: 14, fontFamily: 'Inter_400Regular' },

  projectRow: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 8,
  },
  projectRowLeft: { flex: 1, marginRight: 8 },
  projectTopRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  projectAddress: { fontSize: 14, fontFamily: 'Inter_600SemiBold', flex: 1 },
  statusPill: { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  statusPillText: { fontSize: 10, fontFamily: 'Inter_600SemiBold' },
  projectCity: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 3 },
  progressWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  progressBg: { flex: 1, height: 4, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: 4, borderRadius: 2 },
  progressLabel: { fontSize: 11, fontFamily: 'Inter_400Regular', minWidth: 60 },

  rentalSummaryCard: {
    flexDirection: 'row', borderRadius: 14, borderWidth: 1,
    padding: 14, marginBottom: 10,
  },
  rentalSummaryLeft: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  rentalIncomeValue: { fontSize: 24, fontFamily: 'Inter_700Bold' },
  rentalIncomeLabel: { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 3 },
  rentalSummaryDiv: { width: 1, marginHorizontal: 14, marginVertical: 4 },
  rentalSummaryRight: { flex: 1, justifyContent: 'center' },
  occupancyRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4, marginBottom: 6 },
  occupancyPct: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  occupancyLabel: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  occBg: { height: 6, borderRadius: 3, overflow: 'hidden', marginBottom: 5 },
  occFill: { height: 6, borderRadius: 3 },
  occSubtext: { fontSize: 11, fontFamily: 'Inter_400Regular' },

  rentalRow: {
    flexDirection: 'row', borderRadius: 14, borderWidth: 1,
    marginBottom: 8, overflow: 'hidden',
  },
  rentalStripe: { width: 4 },
  rentalRowBody: { flex: 1, padding: 12 },
  rentalRowTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  rentalAddress: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  rentalCity: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  rentalRowRight: { alignItems: 'flex-end' },
  rentalRent: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  rentalRentSub: { fontSize: 10, fontFamily: 'Inter_400Regular' },
  rentalRowMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8, flexWrap: 'wrap' },
  rentalStatusChip: { borderRadius: 20, paddingHorizontal: 9, paddingVertical: 3 },
  rentalStatusText: { fontSize: 10, fontFamily: 'Inter_600SemiBold' },
  rentalTenant: { fontSize: 12, fontFamily: 'Inter_400Regular', flex: 1 },
  maintChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FEF2F2', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  maintChipText: { fontSize: 10, fontFamily: 'Inter_600SemiBold', color: '#EF4444' },
  paymentBar: { borderTopWidth: 1, marginTop: 10, paddingTop: 8 },
  paymentBarInner: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  paymentBarText: { fontSize: 12, fontFamily: 'Inter_400Regular', flex: 1 },
  markPaidBtn: { backgroundColor: '#22C55E', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  markPaidText: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: '#fff' },

  expRow: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 8, gap: 10,
  },
  expIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  expInfo: { flex: 1 },
  expVendor: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  expProp: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  expAmt: { fontSize: 14, fontFamily: 'Inter_700Bold' },
});
