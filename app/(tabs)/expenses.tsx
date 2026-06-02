import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/EmptyState';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { useColors } from '@/hooks/useColors';

export default function ExpensesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { canEdit } = useAuth();
  const { expenses, properties, deleteExpense } = useData();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return [...expenses]
      .sort((a, b) => b.date.localeCompare(a.date))
      .filter(
        (e) =>
          !q ||
          e.vendor.toLowerCase().includes(q) ||
          e.category.toLowerCase().includes(q) ||
          e.notes?.toLowerCase().includes(q),
      );
  }, [expenses, search]);

  const total = filtered.reduce((s, e) => s + e.amount, 0);
  const topInset = Platform.OS === 'web' ? 67 : insets.top;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.headerBar, { paddingTop: topInset + 12, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: colors.foreground }]}>Expenses</Text>
          {canEdit && (
            <TouchableOpacity
              style={[styles.addBtn, { backgroundColor: colors.navy }]}
              onPress={() => router.push('/expense/add')}
              activeOpacity={0.85}
            >
              <Feather name="plus" size={18} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
        <View style={[styles.totalBanner, { backgroundColor: colors.navy }]}>
          <Text style={styles.totalLabel}>Total Shown</Text>
          <Text style={styles.totalValue}>${total.toLocaleString()}</Text>
        </View>
        <View style={[styles.searchWrap, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
          <Feather name="search" size={15} color={colors.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder="Search vendor, category..."
            placeholderTextColor={colors.mutedForeground}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Feather name="x" size={15} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {filtered.length === 0 ? (
          <EmptyState icon="credit-card" title="No expenses found" subtitle="Add expenses to track project costs" />
        ) : (
          filtered.map((e) => {
            const prop = properties.find((p) => p.id === e.propertyId);
            return (
              <View key={e.id} style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.iconWrap, { backgroundColor: colors.navy + '18' }]}>
                  <Feather name="file-text" size={16} color={colors.navy} />
                </View>
                <View style={styles.info}>
                  <Text style={[styles.vendor, { color: colors.foreground }]}>{e.vendor}</Text>
                  <Text style={[styles.sub, { color: colors.mutedForeground }]}>
                    {e.category} · {e.date}
                  </Text>
                  {prop && (
                    <Text style={[styles.propName, { color: colors.mutedForeground }]} numberOfLines={1}>
                      {prop.address}
                    </Text>
                  )}
                  <View style={styles.tags}>
                    <View style={[styles.tag, { backgroundColor: colors.secondary }]}>
                      <Text style={[styles.tagText, { color: colors.mutedForeground }]}>{e.paymentMethod}</Text>
                    </View>
                    {e.approvedBy && (
                      <View style={[styles.tag, { backgroundColor: '#F0FDF4' }]}>
                        <Text style={[styles.tagText, { color: '#16A34A' }]}>Approved</Text>
                      </View>
                    )}
                  </View>
                </View>
                <View style={styles.rightCol}>
                  <Text style={[styles.amount, { color: colors.foreground }]}>
                    ${e.amount.toLocaleString()}
                  </Text>
                  {canEdit && (
                    <TouchableOpacity
                      onPress={() => deleteExpense(e.id)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Feather name="trash-2" size={14} color={colors.mutedForeground} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  headerBar: { paddingHorizontal: 16, paddingBottom: 10, borderBottomWidth: 1 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  title: { fontSize: 26, fontFamily: 'Inter_700Bold' },
  addBtn: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  totalBanner: { borderRadius: 12, padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  totalLabel: { fontSize: 13, fontFamily: 'Inter_400Regular', color: 'rgba(255,255,255,0.7)' },
  totalValue: { fontSize: 20, fontFamily: 'Inter_700Bold', color: '#fff' },
  searchWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9 },
  searchInput: { flex: 1, fontSize: 14, fontFamily: 'Inter_400Regular' },
  list: { paddingHorizontal: 16, paddingTop: 14 },
  row: { flexDirection: 'row', alignItems: 'flex-start', borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 10, gap: 10 },
  iconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  info: { flex: 1 },
  vendor: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  sub: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  propName: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  tags: { flexDirection: 'row', gap: 6, marginTop: 6 },
  tag: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  tagText: { fontSize: 10, fontFamily: 'Inter_500Medium' },
  rightCol: { alignItems: 'flex-end', gap: 8 },
  amount: { fontSize: 15, fontFamily: 'Inter_700Bold' },
});
