import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { useColors } from '@/hooks/useColors';
import { EXPENSE_CATEGORIES, PAYMENT_METHODS } from '@/types';

export default function AddExpenseScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { properties, addExpense } = useData();
  const params = useLocalSearchParams<{ propertyId?: string }>();

  const [propertyId, setPropertyId] = useState(params.propertyId ?? '');
  const [category, setCategory] = useState('');
  const [vendor, setVendor] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('Check');
  const [notes, setNotes] = useState('');
  const [approvedBy, setApprovedBy] = useState(user?.name ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [showPropertyPicker, setShowPropertyPicker] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showPaymentPicker, setShowPaymentPicker] = useState(false);

  const selectedProperty = properties.find((p) => p.id === propertyId);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!propertyId) e.propertyId = 'Select a property';
    if (!category) e.category = 'Select a category';
    if (!vendor.trim()) e.vendor = 'Vendor is required';
    if (!amount.trim() || isNaN(Number(amount.replace(/,/g, '')))) e.amount = 'Enter a valid amount';
    if (!date.trim()) e.date = 'Date is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    addExpense({
      propertyId,
      category,
      vendor: vendor.trim(),
      amount: Number(amount.replace(/,/g, '')),
      date,
      paymentMethod,
      notes: notes.trim() || undefined,
      approvedBy: approvedBy.trim() || undefined,
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  };

  const topInset = Platform.OS === 'web' ? 67 : insets.top;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topInset + 12, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="x" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Add Expense</Text>
        <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.navy }]} onPress={handleSave}>
          <Text style={styles.saveBtnText}>Save</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAwareScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
        bottomOffset={20}
        keyboardShouldPersistTaps="handled"
      >
        {/* Property */}
        <Field label="Property *" error={errors.propertyId} colors={colors}>
          <TouchableOpacity
            style={[styles.picker, { borderColor: errors.propertyId ? '#EF4444' : colors.border, backgroundColor: colors.secondary }]}
            onPress={() => setShowPropertyPicker(!showPropertyPicker)}
          >
            <Text style={[styles.pickerText, { color: selectedProperty ? colors.foreground : colors.mutedForeground }]}>
              {selectedProperty ? selectedProperty.address : 'Select a property...'}
            </Text>
            <Feather name="chevron-down" size={14} color={colors.mutedForeground} />
          </TouchableOpacity>
        </Field>
        {showPropertyPicker && (
          <View style={[styles.dropCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {properties.map((p) => (
              <TouchableOpacity
                key={p.id}
                style={[styles.dropOption, { borderBottomColor: colors.border }]}
                onPress={() => { setPropertyId(p.id); setShowPropertyPicker(false); setErrors((e) => ({ ...e, propertyId: undefined as any })); }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.dropText, { color: colors.foreground }]}>{p.address}</Text>
                  <Text style={[styles.dropSub, { color: colors.mutedForeground }]}>{p.city}, {p.state}</Text>
                </View>
                {propertyId === p.id && <Feather name="check" size={14} color={colors.gold} />}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Category */}
        <Field label="Category *" error={errors.category} colors={colors}>
          <TouchableOpacity
            style={[styles.picker, { borderColor: errors.category ? '#EF4444' : colors.border, backgroundColor: colors.secondary }]}
            onPress={() => setShowCategoryPicker(!showCategoryPicker)}
          >
            <Text style={[styles.pickerText, { color: category ? colors.foreground : colors.mutedForeground }]}>
              {category || 'Select a category...'}
            </Text>
            <Feather name="chevron-down" size={14} color={colors.mutedForeground} />
          </TouchableOpacity>
        </Field>
        {showCategoryPicker && (
          <View style={[styles.dropCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {EXPENSE_CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.dropOption, { borderBottomColor: colors.border }]}
                onPress={() => { setCategory(cat); setShowCategoryPicker(false); setErrors((e) => ({ ...e, category: undefined as any })); }}
              >
                <Text style={[styles.dropText, { color: colors.foreground }]}>{cat}</Text>
                {category === cat && <Feather name="check" size={14} color={colors.gold} />}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Vendor */}
        <Field label="Vendor / Contractor *" error={errors.vendor} colors={colors}>
          <TextInput
            style={[styles.input, { color: colors.foreground, borderColor: errors.vendor ? '#EF4444' : colors.border }]}
            placeholder="e.g. Pro Renovations LLC"
            placeholderTextColor={colors.mutedForeground}
            value={vendor}
            onChangeText={setVendor}
          />
        </Field>

        {/* Amount & Date */}
        <View style={styles.row2}>
          <View style={{ flex: 1 }}>
            <Field label="Amount *" error={errors.amount} colors={colors}>
              <TextInput
                style={[styles.input, { color: colors.foreground, borderColor: errors.amount ? '#EF4444' : colors.border }]}
                placeholder="0"
                placeholderTextColor={colors.mutedForeground}
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
              />
            </Field>
          </View>
          <View style={{ flex: 1 }}>
            <Field label="Date Paid *" error={errors.date} colors={colors}>
              <TextInput
                style={[styles.input, { color: colors.foreground, borderColor: errors.date ? '#EF4444' : colors.border }]}
                placeholder="2025-01-15"
                placeholderTextColor={colors.mutedForeground}
                value={date}
                onChangeText={setDate}
              />
            </Field>
          </View>
        </View>

        {/* Payment Method */}
        <Field label="Payment Method" colors={colors}>
          <TouchableOpacity
            style={[styles.picker, { borderColor: colors.border, backgroundColor: colors.secondary }]}
            onPress={() => setShowPaymentPicker(!showPaymentPicker)}
          >
            <Text style={[styles.pickerText, { color: colors.foreground }]}>{paymentMethod}</Text>
            <Feather name="chevron-down" size={14} color={colors.mutedForeground} />
          </TouchableOpacity>
        </Field>
        {showPaymentPicker && (
          <View style={[styles.dropCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {PAYMENT_METHODS.map((pm) => (
              <TouchableOpacity
                key={pm}
                style={[styles.dropOption, { borderBottomColor: colors.border }]}
                onPress={() => { setPaymentMethod(pm); setShowPaymentPicker(false); }}
              >
                <Text style={[styles.dropText, { color: colors.foreground }]}>{pm}</Text>
                {paymentMethod === pm && <Feather name="check" size={14} color={colors.gold} />}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Approved By */}
        <Field label="Approved By" colors={colors}>
          <TextInput
            style={[styles.input, { color: colors.foreground, borderColor: colors.border }]}
            placeholder="Name"
            placeholderTextColor={colors.mutedForeground}
            value={approvedBy}
            onChangeText={setApprovedBy}
          />
        </Field>

        {/* Notes */}
        <Field label="Notes" colors={colors}>
          <TextInput
            style={[styles.textarea, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]}
            placeholder="Optional notes..."
            placeholderTextColor={colors.mutedForeground}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
          />
        </Field>
      </KeyboardAwareScrollView>
    </View>
  );
}

function Field({ label, children, error, colors }: { label: string; children: React.ReactNode; error?: string; colors: any }) {
  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: colors.mutedForeground }]}>{label}</Text>
      {children}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1 },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontFamily: 'Inter_600SemiBold' },
  saveBtn: { borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8 },
  saveBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: '#fff' },
  content: { paddingHorizontal: 16, paddingTop: 16 },
  field: { marginBottom: 14 },
  label: { fontSize: 12, fontFamily: 'Inter_500Medium', marginBottom: 5 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, fontFamily: 'Inter_400Regular' },
  textarea: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 14, fontFamily: 'Inter_400Regular', minHeight: 80, textAlignVertical: 'top' },
  errorText: { color: '#EF4444', fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 4 },
  row2: { flexDirection: 'row', gap: 10 },
  picker: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
  pickerText: { fontSize: 13, fontFamily: 'Inter_400Regular', flex: 1 },
  dropCard: { borderRadius: 12, borderWidth: 1, marginBottom: 10, overflow: 'hidden' },
  dropOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 11, borderBottomWidth: 1 },
  dropText: { fontSize: 14, fontFamily: 'Inter_400Regular', flex: 1 },
  dropSub: { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 2 },
});
