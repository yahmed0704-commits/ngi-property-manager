import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/EmptyState';
import { useAuth } from '@/context/AuthContext';
import { useRental } from '@/context/RentalContext';
import { useColors } from '@/hooks/useColors';
import {
  MaintenancePriority,
  MaintenanceStatus,
  RentPaymentStatus,
  RentalUnit,
  TenantStatus,
} from '@/types';

type RentalTab = 'Units' | 'Payments' | 'Maintenance';

const TENANT_STATUS_COLORS: Record<TenantStatus, string> = {
  Active: '#22C55E',
  'Ending Soon': '#F59E0B',
  Vacant: '#EF4444',
};

const PAYMENT_STATUS_COLORS: Record<RentPaymentStatus, string> = {
  Paid: '#22C55E',
  Pending: '#3B82F6',
  Late: '#EF4444',
};

const PRIORITY_COLORS: Record<MaintenancePriority, string> = {
  Low: '#22C55E',
  Medium: '#F59E0B',
  High: '#EF4444',
};

const MAINT_STATUS_COLORS: Record<MaintenanceStatus, string> = {
  Open: '#EF4444',
  'In Progress': '#F59E0B',
  Completed: '#22C55E',
};

function fmt(n: number) {
  return '$' + n.toLocaleString('en-US');
}

function daysUntil(dateStr: string) {
  if (!dateStr) return null;
  const diff = Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
  return diff;
}

export default function RentalsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { canEdit } = useAuth();
  const { user } = useAuth();
  const {
    units, payments, maintenance,
    deleteUnit, addPayment, markPaymentPaid, deletePayment,
    addMaintenance, updateMaintenance, deleteMaintenance,
    getUnitPayments, getUnitMaintenance,
  } = useRental();

  const [activeTab, setActiveTab] = useState<RentalTab>('Units');
  const [expandedUnit, setExpandedUnit] = useState<string | null>(null);
  const [showAddPayment, setShowAddPayment] = useState<string | null>(null);
  const [showAddMaintenance, setShowAddMaintenance] = useState(false);
  const [maintTitle, setMaintTitle] = useState('');
  const [maintDesc, setMaintDesc] = useState('');
  const [maintPriority, setMaintPriority] = useState<MaintenancePriority>('Medium');
  const [maintUnitId, setMaintUnitId] = useState('');
  const [maintVendor, setMaintVendor] = useState('');
  const [payMonth, setPayMonth] = useState('');
  const [payAmount, setPayAmount] = useState('');

  const topInset = Platform.OS === 'web' ? 67 : insets.top;

  const stats = useMemo(() => {
    const active = units.filter((u) => u.status === 'Active');
    const vacant = units.filter((u) => u.status === 'Vacant');
    const monthlyIncome = active.reduce((s, u) => s + u.monthlyRent, 0);
    const openMaintenance = maintenance.filter((m) => m.status !== 'Completed');
    const thisMonth = new Date().toISOString().slice(0, 7);
    const thisMonthPending = payments.filter((p) => p.month === thisMonth && p.status !== 'Paid');
    return { active, vacant, monthlyIncome, openMaintenance, thisMonthPending };
  }, [units, payments, maintenance]);

  const handleDeleteUnit = (id: string) => {
    Alert.alert('Remove Unit', 'Remove this rental unit?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => deleteUnit(id) },
    ]);
  };

  const handleMarkPaid = (paymentId: string) => {
    markPaymentPaid(paymentId, new Date().toISOString().split('T')[0]);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleAddPayment = (unitId: string) => {
    if (!payMonth.trim() || !payAmount.trim()) return;
    addPayment({
      unitId,
      month: payMonth.trim(),
      amount: Number(payAmount.replace(/,/g, '')),
      dueDate: payMonth + '-01',
      status: 'Pending',
    });
    setPayMonth('');
    setPayAmount('');
    setShowAddPayment(null);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleAddMaintenance = () => {
    if (!maintTitle.trim() || !maintUnitId) return;
    addMaintenance({
      unitId: maintUnitId,
      title: maintTitle.trim(),
      description: maintDesc.trim() || undefined,
      priority: maintPriority,
      status: 'Open',
      dateSubmitted: new Date().toISOString().split('T')[0],
      vendor: maintVendor.trim() || undefined,
      submittedBy: user?.name ?? 'Unknown',
    });
    setMaintTitle('');
    setMaintDesc('');
    setMaintVendor('');
    setShowAddMaintenance(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleUpdateMaintStatus = (id: string, status: MaintenanceStatus) => {
    updateMaintenance(id, {
      status,
      dateCompleted: status === 'Completed' ? new Date().toISOString().split('T')[0] : undefined,
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.headerBar, { paddingTop: topInset + 12, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: colors.foreground }]}>Rentals</Text>
          {canEdit && (
            <TouchableOpacity
              style={[styles.addBtn, { backgroundColor: colors.navy }]}
              onPress={() => router.push('/rental/add')}
              activeOpacity={0.85}
            >
              <Feather name="plus" size={18} color="#fff" />
            </TouchableOpacity>
          )}
        </View>

        {/* Summary Banner */}
        <View style={[styles.summaryRow, { backgroundColor: colors.navy, borderRadius: 14 }]}>
          <SumStat label="Total Units" value={String(units.length)} colors={colors} />
          <View style={styles.sumDivider} />
          <SumStat label="Occupied" value={`${stats.active.length}/${units.length}`} colors={colors} />
          <View style={styles.sumDivider} />
          <SumStat label="Monthly Income" value={fmt(stats.monthlyIncome)} colors={colors} />
          <View style={styles.sumDivider} />
          <SumStat label="Vacant" value={String(stats.vacant.length)} colors={colors} valueColor={stats.vacant.length > 0 ? '#FCA5A5' : '#86EFAC'} />
        </View>

        {/* Alerts */}
        {stats.thisMonthPending.length > 0 && (
          <View style={[styles.alertBanner, { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' }]}>
            <Feather name="alert-circle" size={14} color="#D97706" />
            <Text style={[styles.alertText, { color: '#D97706' }]}>
              {stats.thisMonthPending.length} rent payment{stats.thisMonthPending.length > 1 ? 's' : ''} pending this month
            </Text>
          </View>
        )}
        {stats.openMaintenance.length > 0 && (
          <View style={[styles.alertBanner, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}>
            <Feather name="tool" size={14} color="#EF4444" />
            <Text style={[styles.alertText, { color: '#EF4444' }]}>
              {stats.openMaintenance.length} open maintenance request{stats.openMaintenance.length > 1 ? 's' : ''}
            </Text>
          </View>
        )}

        {/* Tabs */}
        <View style={styles.tabRow}>
          {(['Units', 'Payments', 'Maintenance'] as RentalTab[]).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && { backgroundColor: colors.navy }]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, { color: activeTab === tab ? '#fff' : colors.mutedForeground }]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── UNITS TAB ── */}
        {activeTab === 'Units' && (
          <>
            {units.length === 0 ? (
              <EmptyState icon="home" title="No rental units" subtitle="Add your first rental unit to get started" />
            ) : (
              units.map((unit) => {
                const isExpanded = expandedUnit === unit.id;
                const unitPayments = getUnitPayments(unit.id);
                const latestPayment = unitPayments[0];
                const daysLeft = daysUntil(unit.leaseEnd);

                return (
                  <View key={unit.id} style={[styles.unitCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    {/* Card Header */}
                    <TouchableOpacity
                      style={styles.unitHeader}
                      onPress={() => setExpandedUnit(isExpanded ? null : unit.id)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.unitHeaderLeft}>
                        <View style={styles.unitAddressRow}>
                          <Text style={[styles.unitAddress, { color: colors.foreground }]} numberOfLines={1}>{unit.address}</Text>
                          <View style={[styles.statusBadge, { backgroundColor: TENANT_STATUS_COLORS[unit.status] + '20' }]}>
                            <Text style={[styles.statusText, { color: TENANT_STATUS_COLORS[unit.status] }]}>{unit.status}</Text>
                          </View>
                        </View>
                        <Text style={[styles.unitCity, { color: colors.mutedForeground }]}>{unit.city}, {unit.state} · {unit.type}</Text>
                        {unit.status !== 'Vacant' && (
                          <Text style={[styles.tenantName, { color: colors.foreground }]}>
                            <Feather name="user" size={11} color={colors.mutedForeground} /> {unit.tenantName}
                          </Text>
                        )}
                      </View>
                      <View style={styles.unitHeaderRight}>
                        <Text style={[styles.rentAmount, { color: colors.navy }]}>{fmt(unit.monthlyRent)}</Text>
                        <Text style={[styles.rentLabel, { color: colors.mutedForeground }]}>/mo</Text>
                        <Feather name={isExpanded ? 'chevron-up' : 'chevron-down'} size={16} color={colors.mutedForeground} style={{ marginTop: 6 }} />
                      </View>
                    </TouchableOpacity>

                    {/* Quick Stats Row */}
                    <View style={[styles.unitQuickStats, { borderTopColor: colors.border }]}>
                      {unit.status !== 'Vacant' ? (
                        <>
                          <QuickStat label="Lease Ends" value={unit.leaseEnd || '—'} colors={colors} valueColor={daysLeft !== null && daysLeft < 60 ? '#F59E0B' : undefined} />
                          <QuickStat label="Security Dep." value={fmt(unit.securityDeposit)} colors={colors} />
                          <QuickStat
                            label="Last Payment"
                            value={latestPayment ? latestPayment.status : 'None'}
                            colors={colors}
                            valueColor={latestPayment ? PAYMENT_STATUS_COLORS[latestPayment.status] : undefined}
                          />
                        </>
                      ) : (
                        <View style={styles.vacantBanner}>
                          <Feather name="home" size={14} color={colors.mutedForeground} />
                          <Text style={[styles.vacantText, { color: colors.mutedForeground }]}>Unit is currently vacant — ready to rent at {fmt(unit.monthlyRent)}/mo</Text>
                        </View>
                      )}
                    </View>

                    {/* Expanded Detail */}
                    {isExpanded && (
                      <View style={[styles.expandedSection, { borderTopColor: colors.border }]}>
                        {unit.status !== 'Vacant' && (
                          <>
                            {/* Contact */}
                            <Text style={[styles.expandLabel, { color: colors.foreground }]}>Tenant Contact</Text>
                            {unit.tenantPhone ? (
                              <View style={styles.contactRow}>
                                <Feather name="phone" size={13} color={colors.mutedForeground} />
                                <Text style={[styles.contactText, { color: colors.foreground }]}>{unit.tenantPhone}</Text>
                              </View>
                            ) : null}
                            {unit.tenantEmail ? (
                              <View style={styles.contactRow}>
                                <Feather name="mail" size={13} color={colors.mutedForeground} />
                                <Text style={[styles.contactText, { color: colors.foreground }]}>{unit.tenantEmail}</Text>
                              </View>
                            ) : null}

                            {/* Lease Info */}
                            <Text style={[styles.expandLabel, { color: colors.foreground, marginTop: 14 }]}>Lease Info</Text>
                            <View style={[styles.leaseGrid, { backgroundColor: colors.secondary, borderRadius: 10 }]}>
                              <View style={styles.leaseGridItem}>
                                <Text style={[styles.leaseGridLabel, { color: colors.mutedForeground }]}>Start</Text>
                                <Text style={[styles.leaseGridValue, { color: colors.foreground }]}>{unit.leaseStart}</Text>
                              </View>
                              <View style={[styles.leaseGridDivider, { backgroundColor: colors.border }]} />
                              <View style={styles.leaseGridItem}>
                                <Text style={[styles.leaseGridLabel, { color: colors.mutedForeground }]}>End</Text>
                                <Text style={[styles.leaseGridValue, { color: daysLeft !== null && daysLeft < 60 ? '#F59E0B' : colors.foreground }]}>
                                  {unit.leaseEnd}
                                  {daysLeft !== null && daysLeft > 0 && ` (${daysLeft}d)`}
                                </Text>
                              </View>
                              <View style={[styles.leaseGridDivider, { backgroundColor: colors.border }]} />
                              <View style={styles.leaseGridItem}>
                                <Text style={[styles.leaseGridLabel, { color: colors.mutedForeground }]}>Deposit</Text>
                                <Text style={[styles.leaseGridValue, { color: colors.foreground }]}>{fmt(unit.securityDeposit)}</Text>
                              </View>
                            </View>

                            {/* Recent Payments */}
                            <Text style={[styles.expandLabel, { color: colors.foreground, marginTop: 14 }]}>Recent Payments</Text>
                            {unitPayments.slice(0, 4).map((p) => (
                              <View key={p.id} style={[styles.paymentRow, { borderBottomColor: colors.border }]}>
                                <View>
                                  <Text style={[styles.paymentMonth, { color: colors.foreground }]}>{p.month}</Text>
                                  {p.paidDate ? <Text style={[styles.paymentDate, { color: colors.mutedForeground }]}>Paid {p.paidDate}</Text> : null}
                                </View>
                                <View style={styles.paymentRight}>
                                  <Text style={[styles.paymentAmount, { color: colors.foreground }]}>{fmt(p.amount)}</Text>
                                  <View style={[styles.payStatusBadge, { backgroundColor: PAYMENT_STATUS_COLORS[p.status] + '20' }]}>
                                    <Text style={[styles.payStatusText, { color: PAYMENT_STATUS_COLORS[p.status] }]}>{p.status}</Text>
                                  </View>
                                  {p.status !== 'Paid' && canEdit && (
                                    <TouchableOpacity
                                      style={[styles.markPaidBtn, { backgroundColor: '#22C55E' }]}
                                      onPress={() => handleMarkPaid(p.id)}
                                    >
                                      <Text style={styles.markPaidText}>Mark Paid</Text>
                                    </TouchableOpacity>
                                  )}
                                </View>
                              </View>
                            ))}

                            {/* Add Payment */}
                            {canEdit && (
                              <>
                                {showAddPayment === unit.id ? (
                                  <View style={[styles.addPayForm, { backgroundColor: colors.secondary, borderRadius: 10 }]}>
                                    <View style={styles.addPayRow}>
                                      <TextInput
                                        style={[styles.addPayInput, { borderColor: colors.border, color: colors.foreground, flex: 1 }]}
                                        placeholder="Month (2026-06)"
                                        placeholderTextColor={colors.mutedForeground}
                                        value={payMonth}
                                        onChangeText={setPayMonth}
                                      />
                                      <TextInput
                                        style={[styles.addPayInput, { borderColor: colors.border, color: colors.foreground, flex: 1 }]}
                                        placeholder="Amount"
                                        placeholderTextColor={colors.mutedForeground}
                                        value={payAmount}
                                        onChangeText={setPayAmount}
                                        keyboardType="numeric"
                                      />
                                    </View>
                                    <TouchableOpacity style={[styles.addPaySubmit, { backgroundColor: colors.gold }]} onPress={() => handleAddPayment(unit.id)}>
                                      <Text style={styles.addPaySubmitText}>Add Payment</Text>
                                    </TouchableOpacity>
                                  </View>
                                ) : (
                                  <TouchableOpacity
                                    style={[styles.addPayTrigger, { borderColor: colors.border }]}
                                    onPress={() => { setShowAddPayment(unit.id); setPayAmount(String(unit.monthlyRent)); }}
                                  >
                                    <Feather name="plus" size={14} color={colors.mutedForeground} />
                                    <Text style={[styles.addPayTriggerText, { color: colors.mutedForeground }]}>Add Payment Record</Text>
                                  </TouchableOpacity>
                                )}
                              </>
                            )}
                          </>
                        )}

                        {unit.notes ? (
                          <View style={[styles.notesBox, { backgroundColor: colors.secondary }]}>
                            <Text style={[styles.notesText, { color: colors.mutedForeground }]}>{unit.notes}</Text>
                          </View>
                        ) : null}

                        {canEdit && (
                          <TouchableOpacity style={styles.deleteUnitBtn} onPress={() => handleDeleteUnit(unit.id)}>
                            <Feather name="trash-2" size={13} color="#EF4444" />
                            <Text style={styles.deleteUnitText}>Remove Unit</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </>
        )}

        {/* ── PAYMENTS TAB ── */}
        {activeTab === 'Payments' && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>All Rent Payments</Text>
            {payments.length === 0 ? (
              <EmptyState icon="dollar-sign" title="No payment records" subtitle="Add payment records from the Units tab" />
            ) : (
              [...payments]
                .sort((a, b) => b.month.localeCompare(a.month))
                .map((p) => {
                  const unit = units.find((u) => u.id === p.unitId);
                  return (
                    <View key={p.id} style={[styles.payCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                      <View style={[styles.payCardLeft, { backgroundColor: PAYMENT_STATUS_COLORS[p.status] + '18', borderRadius: 12 }]}>
                        <Feather name={p.status === 'Paid' ? 'check-circle' : p.status === 'Late' ? 'alert-circle' : 'clock'} size={18} color={PAYMENT_STATUS_COLORS[p.status]} />
                      </View>
                      <View style={styles.payCardInfo}>
                        <Text style={[styles.payCardAddress, { color: colors.foreground }]} numberOfLines={1}>{unit?.address ?? 'Unknown'}</Text>
                        <Text style={[styles.payCardMonth, { color: colors.mutedForeground }]}>{p.month} · Due {p.dueDate}</Text>
                        {p.paidDate ? <Text style={[styles.payCardDate, { color: '#16A34A' }]}>Paid {p.paidDate}</Text> : null}
                        {p.notes ? <Text style={[styles.payCardNotes, { color: colors.mutedForeground }]}>{p.notes}</Text> : null}
                      </View>
                      <View style={styles.payCardRight}>
                        <Text style={[styles.payCardAmount, { color: colors.foreground }]}>{fmt(p.amount)}</Text>
                        <View style={[styles.payStatusBadge, { backgroundColor: PAYMENT_STATUS_COLORS[p.status] + '20' }]}>
                          <Text style={[styles.payStatusText, { color: PAYMENT_STATUS_COLORS[p.status] }]}>{p.status}</Text>
                        </View>
                        {p.status !== 'Paid' && canEdit && (
                          <TouchableOpacity
                            style={[styles.markPaidBtn, { backgroundColor: '#22C55E', marginTop: 4 }]}
                            onPress={() => handleMarkPaid(p.id)}
                          >
                            <Text style={styles.markPaidText}>Mark Paid</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  );
                })
            )}
          </>
        )}

        {/* ── MAINTENANCE TAB ── */}
        {activeTab === 'Maintenance' && (
          <>
            {canEdit && (
              <>
                <TouchableOpacity
                  style={[styles.addMaintBtn, { backgroundColor: colors.navy }]}
                  onPress={() => setShowAddMaintenance(!showAddMaintenance)}
                >
                  <Feather name="plus" size={16} color="#fff" />
                  <Text style={styles.addMaintBtnText}>New Request</Text>
                </TouchableOpacity>

                {showAddMaintenance && (
                  <View style={[styles.addMaintForm, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Text style={[styles.expandLabel, { color: colors.foreground }]}>New Maintenance Request</Text>

                    <Text style={[styles.formLabel, { color: colors.mutedForeground }]}>Unit</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
                      <View style={styles.unitChips}>
                        {units.filter((u) => u.status !== 'Vacant').map((u) => (
                          <TouchableOpacity
                            key={u.id}
                            style={[styles.unitChip, { borderColor: maintUnitId === u.id ? colors.navy : colors.border, backgroundColor: maintUnitId === u.id ? colors.navy + '18' : colors.secondary }]}
                            onPress={() => setMaintUnitId(u.id)}
                          >
                            <Text style={[styles.unitChipText, { color: maintUnitId === u.id ? colors.navy : colors.mutedForeground }]} numberOfLines={1}>{u.address}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </ScrollView>

                    <Text style={[styles.formLabel, { color: colors.mutedForeground }]}>Title</Text>
                    <TextInput style={[styles.formInput, { borderColor: colors.border, color: colors.foreground }]} placeholder="e.g. Leaky faucet in bathroom" placeholderTextColor={colors.mutedForeground} value={maintTitle} onChangeText={setMaintTitle} />

                    <Text style={[styles.formLabel, { color: colors.mutedForeground, marginTop: 8 }]}>Description (optional)</Text>
                    <TextInput style={[styles.formInput, { borderColor: colors.border, color: colors.foreground, height: 64 }]} placeholder="More details..." placeholderTextColor={colors.mutedForeground} value={maintDesc} onChangeText={setMaintDesc} multiline />

                    <Text style={[styles.formLabel, { color: colors.mutedForeground, marginTop: 8 }]}>Priority</Text>
                    <View style={styles.priorityRow}>
                      {(['Low', 'Medium', 'High'] as MaintenancePriority[]).map((p) => (
                        <TouchableOpacity key={p} style={[styles.priorityChip, { borderColor: maintPriority === p ? PRIORITY_COLORS[p] : colors.border, backgroundColor: maintPriority === p ? PRIORITY_COLORS[p] + '18' : colors.secondary }]} onPress={() => setMaintPriority(p)}>
                          <Text style={[styles.priorityChipText, { color: maintPriority === p ? PRIORITY_COLORS[p] : colors.mutedForeground }]}>{p}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    <Text style={[styles.formLabel, { color: colors.mutedForeground, marginTop: 8 }]}>Vendor (optional)</Text>
                    <TextInput style={[styles.formInput, { borderColor: colors.border, color: colors.foreground }]} placeholder="e.g. NJ Plumbing Pros" placeholderTextColor={colors.mutedForeground} value={maintVendor} onChangeText={setMaintVendor} />

                    <TouchableOpacity style={[styles.addMaintSubmit, { backgroundColor: colors.gold }]} onPress={handleAddMaintenance}>
                      <Text style={styles.addMaintSubmitText}>Submit Request</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}

            {maintenance.length === 0 ? (
              <EmptyState icon="tool" title="No maintenance requests" subtitle="Add a request to track repair work" />
            ) : (
              [...maintenance]
                .sort((a, b) => {
                  const order: Record<MaintenanceStatus, number> = { Open: 0, 'In Progress': 1, Completed: 2 };
                  return order[a.status] - order[b.status];
                })
                .map((req) => {
                  const unit = units.find((u) => u.id === req.unitId);
                  return (
                    <View key={req.id} style={[styles.maintCard, { backgroundColor: colors.card, borderColor: colors.border, borderLeftColor: PRIORITY_COLORS[req.priority], borderLeftWidth: 4 }]}>
                      <View style={styles.maintHeader}>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.maintTitle, { color: colors.foreground }]}>{req.title}</Text>
                          <Text style={[styles.maintUnit, { color: colors.mutedForeground }]}>{unit?.address ?? 'Unknown'} · {req.dateSubmitted}</Text>
                        </View>
                        <View style={styles.maintBadges}>
                          <View style={[styles.priorityBadge, { backgroundColor: PRIORITY_COLORS[req.priority] + '20' }]}>
                            <Text style={[styles.priorityBadgeText, { color: PRIORITY_COLORS[req.priority] }]}>{req.priority}</Text>
                          </View>
                          <View style={[styles.maintStatusBadge, { backgroundColor: MAINT_STATUS_COLORS[req.status] + '20' }]}>
                            <Text style={[styles.maintStatusText, { color: MAINT_STATUS_COLORS[req.status] }]}>{req.status}</Text>
                          </View>
                        </View>
                      </View>
                      {req.description ? <Text style={[styles.maintDesc, { color: colors.mutedForeground }]}>{req.description}</Text> : null}
                      {req.vendor ? <Text style={[styles.maintVendor, { color: colors.mutedForeground }]}>Vendor: {req.vendor}</Text> : null}
                      {(req.estimatedCost || req.actualCost) ? (
                        <Text style={[styles.maintCost, { color: colors.mutedForeground }]}>
                          {req.estimatedCost ? `Est: ${fmt(req.estimatedCost)}` : ''}
                          {req.estimatedCost && req.actualCost ? '  ·  ' : ''}
                          {req.actualCost ? `Actual: ${fmt(req.actualCost)}` : ''}
                        </Text>
                      ) : null}
                      {req.submittedBy ? <Text style={[styles.maintSubmitter, { color: colors.mutedForeground }]}>By {req.submittedBy}</Text> : null}

                      {canEdit && req.status !== 'Completed' && (
                        <View style={styles.maintActions}>
                          {req.status === 'Open' && (
                            <TouchableOpacity style={[styles.maintActionBtn, { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' }]} onPress={() => handleUpdateMaintStatus(req.id, 'In Progress')}>
                              <Text style={styles.maintActionText}>Start</Text>
                            </TouchableOpacity>
                          )}
                          <TouchableOpacity style={[styles.maintActionBtn, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }]} onPress={() => handleUpdateMaintStatus(req.id, 'Completed')}>
                            <Text style={[styles.maintActionText, { color: '#16A34A' }]}>Complete</Text>
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => deleteMaintenance(req.id)} style={styles.maintDeleteBtn}>
                            <Feather name="trash-2" size={14} color={colors.mutedForeground} />
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  );
                })
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function SumStat({ label, value, colors, valueColor }: { label: string; value: string; colors: any; valueColor?: string }) {
  return (
    <View style={styles.sumStatItem}>
      <Text style={[styles.sumStatValue, { color: valueColor ?? '#fff' }]}>{value}</Text>
      <Text style={styles.sumStatLabel}>{label}</Text>
    </View>
  );
}

function QuickStat({ label, value, colors, valueColor }: { label: string; value: string; colors: any; valueColor?: string }) {
  return (
    <View style={styles.quickStatItem}>
      <Text style={[styles.quickStatLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[styles.quickStatValue, { color: valueColor ?? colors.foreground }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  headerBar: { paddingHorizontal: 16, paddingBottom: 10, borderBottomWidth: 1 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  title: { fontSize: 26, fontFamily: 'Inter_700Bold' },
  addBtn: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  summaryRow: { flexDirection: 'row', padding: 14, marginBottom: 8 },
  sumDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginVertical: 4 },
  sumStatItem: { flex: 1, alignItems: 'center' },
  sumStatValue: { fontSize: 15, fontFamily: 'Inter_700Bold', color: '#fff' },
  sumStatLabel: { fontSize: 9, fontFamily: 'Inter_400Regular', color: 'rgba(255,255,255,0.6)', marginTop: 2, textAlign: 'center' },
  alertBanner: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 10, borderWidth: 1, padding: 10, marginBottom: 6 },
  alertText: { fontSize: 12, fontFamily: 'Inter_500Medium', flex: 1 },
  tabRow: { flexDirection: 'row', gap: 6, marginTop: 8 },
  tab: { borderRadius: 20, paddingHorizontal: 16, paddingVertical: 6 },
  tabText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  list: { paddingHorizontal: 16, paddingTop: 14 },
  sectionTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold', marginBottom: 12 },
  unitCard: { borderRadius: 16, borderWidth: 1, marginBottom: 12, overflow: 'hidden' },
  unitHeader: { flexDirection: 'row', alignItems: 'flex-start', padding: 14, gap: 10 },
  unitHeaderLeft: { flex: 1 },
  unitAddressRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  unitAddress: { fontSize: 14, fontFamily: 'Inter_600SemiBold', flex: 1 },
  statusBadge: { borderRadius: 20, paddingHorizontal: 9, paddingVertical: 3 },
  statusText: { fontSize: 10, fontFamily: 'Inter_600SemiBold' },
  unitCity: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 3 },
  tenantName: { fontSize: 13, fontFamily: 'Inter_500Medium', marginTop: 4 },
  unitHeaderRight: { alignItems: 'flex-end' },
  rentAmount: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  rentLabel: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  unitQuickStats: { flexDirection: 'row', borderTopWidth: 1, paddingHorizontal: 14, paddingVertical: 10 },
  quickStatItem: { flex: 1, alignItems: 'center' },
  quickStatLabel: { fontSize: 9, fontFamily: 'Inter_400Regular', marginBottom: 2 },
  quickStatValue: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  vacantBanner: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  vacantText: { fontSize: 12, fontFamily: 'Inter_400Regular', flex: 1 },
  expandedSection: { borderTopWidth: 1, padding: 14 },
  expandLabel: { fontSize: 13, fontFamily: 'Inter_600SemiBold', marginBottom: 8 },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  contactText: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  leaseGrid: { flexDirection: 'row', padding: 12, marginBottom: 4 },
  leaseGridItem: { flex: 1, alignItems: 'center' },
  leaseGridLabel: { fontSize: 10, fontFamily: 'Inter_400Regular', marginBottom: 3 },
  leaseGridValue: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  leaseGridDivider: { width: 1, marginVertical: 4 },
  paymentRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1 },
  paymentMonth: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  paymentDate: { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 2 },
  paymentRight: { alignItems: 'flex-end', gap: 4 },
  paymentAmount: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  payStatusBadge: { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 },
  payStatusText: { fontSize: 10, fontFamily: 'Inter_600SemiBold' },
  markPaidBtn: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  markPaidText: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: '#fff' },
  addPayForm: { padding: 12, marginTop: 8 },
  addPayRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  addPayInput: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, fontSize: 13, fontFamily: 'Inter_400Regular' },
  addPaySubmit: { borderRadius: 8, paddingVertical: 8, alignItems: 'center' },
  addPaySubmitText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: '#fff' },
  addPayTrigger: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderStyle: 'dashed', borderRadius: 8, padding: 10, marginTop: 10, justifyContent: 'center' },
  addPayTriggerText: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  notesBox: { borderRadius: 8, padding: 10, marginTop: 10 },
  notesText: { fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 18 },
  deleteUnitBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 12, alignSelf: 'flex-end' },
  deleteUnitText: { fontSize: 12, fontFamily: 'Inter_500Medium', color: '#EF4444' },
  payCard: { flexDirection: 'row', alignItems: 'flex-start', borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 10, gap: 12 },
  payCardLeft: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  payCardInfo: { flex: 1 },
  payCardAddress: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  payCardMonth: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  payCardDate: { fontSize: 11, fontFamily: 'Inter_500Medium', marginTop: 2 },
  payCardNotes: { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 2 },
  payCardRight: { alignItems: 'flex-end', gap: 4 },
  payCardAmount: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  addMaintBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9, marginBottom: 14 },
  addMaintBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: '#fff' },
  addMaintForm: { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 14 },
  formLabel: { fontSize: 12, fontFamily: 'Inter_500Medium', marginBottom: 5 },
  formInput: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, fontSize: 14, fontFamily: 'Inter_400Regular' },
  unitChips: { flexDirection: 'row', gap: 8 },
  unitChip: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 6 },
  unitChipText: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  priorityRow: { flexDirection: 'row', gap: 8 },
  priorityChip: { flex: 1, borderRadius: 8, borderWidth: 1, paddingVertical: 8, alignItems: 'center' },
  priorityChipText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  addMaintSubmit: { borderRadius: 10, paddingVertical: 10, alignItems: 'center', marginTop: 10 },
  addMaintSubmitText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: '#fff' },
  maintCard: { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 10 },
  maintHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 6 },
  maintTitle: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  maintUnit: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  maintBadges: { alignItems: 'flex-end', gap: 4 },
  priorityBadge: { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  priorityBadgeText: { fontSize: 10, fontFamily: 'Inter_600SemiBold' },
  maintStatusBadge: { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  maintStatusText: { fontSize: 10, fontFamily: 'Inter_600SemiBold' },
  maintDesc: { fontSize: 13, fontFamily: 'Inter_400Regular', marginBottom: 4, lineHeight: 18 },
  maintVendor: { fontSize: 12, fontFamily: 'Inter_400Regular', marginBottom: 2 },
  maintCost: { fontSize: 12, fontFamily: 'Inter_500Medium', marginBottom: 2 },
  maintSubmitter: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  maintActions: { flexDirection: 'row', gap: 8, marginTop: 10, alignItems: 'center' },
  maintActionBtn: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 6 },
  maintActionText: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: '#D97706' },
  maintDeleteBtn: { marginLeft: 'auto' as any },
});
