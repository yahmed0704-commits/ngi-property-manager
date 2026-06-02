import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useData } from '@/context/DataContext';
import { useColors } from '@/hooks/useColors';
import {
  BUDGET_CATEGORIES,
  BudgetItem,
  PROPERTY_STATUSES,
  PROPERTY_TYPES,
  PropertyStatus,
  PropertyType,
} from '@/types';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 6);
}

interface FormState {
  address: string;
  city: string;
  state: string;
  zip: string;
  type: PropertyType;
  purchasePrice: string;
  closingDate: string;
  closingCosts: string;
  lenderName: string;
  loanNumber: string;
  status: PropertyStatus;
  notes: string;
}

export default function AddPropertyScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { addProperty } = useData();

  const [form, setForm] = useState<FormState>({
    address: '',
    city: '',
    state: '',
    zip: '',
    type: 'Single Family',
    purchasePrice: '',
    closingDate: new Date().toISOString().split('T')[0],
    closingCosts: '',
    lenderName: '',
    loanNumber: '',
    status: 'Purchased',
    notes: '',
  });

  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);
  const [errors, setErrors] = useState<Partial<FormState>>({});
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [showStatusPicker, setShowStatusPicker] = useState(false);
  const [showBudgetPicker, setShowBudgetPicker] = useState(false);

  const set = (key: keyof FormState, val: string) => {
    setForm((f) => ({ ...f, [key]: val }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const validate = () => {
    const e: Partial<FormState> = {};
    if (!form.address.trim()) e.address = 'Address is required';
    if (!form.city.trim()) e.city = 'City is required';
    if (!form.purchasePrice.trim() || isNaN(Number(form.purchasePrice))) e.purchasePrice = 'Enter a valid amount';
    if (!form.closingDate.trim()) e.closingDate = 'Date is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    addProperty({
      address: form.address.trim(),
      city: form.city.trim(),
      state: form.state.trim(),
      zip: form.zip.trim(),
      type: form.type,
      purchasePrice: Number(form.purchasePrice.replace(/,/g, '')),
      closingDate: form.closingDate,
      closingCosts: Number(form.closingCosts.replace(/,/g, '') || '0'),
      lenderName: form.lenderName.trim() || undefined,
      loanNumber: form.loanNumber.trim() || undefined,
      status: form.status,
      notes: form.notes.trim() || undefined,
      budgetItems,
      propertyPhotos: [],
      documents: [],
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  };

  const addBudgetItem = (category: string) => {
    setBudgetItems((prev) => [...prev, { id: uid(), category, estimated: 0, actual: 0 }]);
    setShowBudgetPicker(false);
  };

  const updateBudgetItem = (id: string, field: 'estimated' | 'actual', val: string) => {
    setBudgetItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: Number(val.replace(/,/g, '') || '0') } : item)),
    );
  };

  const removeBudgetItem = (id: string) => {
    setBudgetItems((prev) => prev.filter((item) => item.id !== id));
  };

  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const usedCategories = budgetItems.map((b) => b.category);
  const availableCategories = BUDGET_CATEGORIES.filter((c) => !usedCategories.includes(c));

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topInset + 12, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="x" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Add Property</Text>
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
        {/* Location */}
        <SectionTitle title="Property Location" colors={colors} />
        <Field label="Street Address *" error={errors.address} colors={colors}>
          <TextInput style={[styles.input, { color: colors.foreground, borderColor: errors.address ? '#EF4444' : colors.border }]} placeholder="142 Maple Street" placeholderTextColor={colors.mutedForeground} value={form.address} onChangeText={(v) => set('address', v)} />
        </Field>
        <View style={styles.row2}>
          <View style={{ flex: 2 }}>
            <Field label="City *" error={errors.city} colors={colors}>
              <TextInput style={[styles.input, { color: colors.foreground, borderColor: errors.city ? '#EF4444' : colors.border }]} placeholder="Newark" placeholderTextColor={colors.mutedForeground} value={form.city} onChangeText={(v) => set('city', v)} />
            </Field>
          </View>
          <View style={{ flex: 1 }}>
            <Field label="State" colors={colors}>
              <TextInput style={[styles.input, { color: colors.foreground, borderColor: colors.border }]} placeholder="NJ" placeholderTextColor={colors.mutedForeground} value={form.state} onChangeText={(v) => set('state', v)} maxLength={2} autoCapitalize="characters" />
            </Field>
          </View>
          <View style={{ flex: 1 }}>
            <Field label="ZIP" colors={colors}>
              <TextInput style={[styles.input, { color: colors.foreground, borderColor: colors.border }]} placeholder="07102" placeholderTextColor={colors.mutedForeground} value={form.zip} onChangeText={(v) => set('zip', v)} keyboardType="numeric" maxLength={5} />
            </Field>
          </View>
        </View>

        {/* Type & Status */}
        <SectionTitle title="Classification" colors={colors} />
        <View style={styles.row2}>
          <View style={{ flex: 1 }}>
            <Field label="Property Type" colors={colors}>
              <TouchableOpacity style={[styles.picker, { borderColor: colors.border, backgroundColor: colors.secondary }]} onPress={() => setShowTypePicker(!showTypePicker)}>
                <Text style={[styles.pickerText, { color: colors.foreground }]}>{form.type}</Text>
                <Feather name="chevron-down" size={14} color={colors.mutedForeground} />
              </TouchableOpacity>
            </Field>
          </View>
          <View style={{ flex: 1 }}>
            <Field label="Status" colors={colors}>
              <TouchableOpacity style={[styles.picker, { borderColor: colors.border, backgroundColor: colors.secondary }]} onPress={() => setShowStatusPicker(!showStatusPicker)}>
                <Text style={[styles.pickerText, { color: colors.foreground }]}>{form.status}</Text>
                <Feather name="chevron-down" size={14} color={colors.mutedForeground} />
              </TouchableOpacity>
            </Field>
          </View>
        </View>
        {showTypePicker && (
          <View style={[styles.dropCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {PROPERTY_TYPES.map((t) => (
              <TouchableOpacity key={t} style={[styles.dropOption, { borderBottomColor: colors.border }]} onPress={() => { set('type', t); setShowTypePicker(false); }}>
                <Text style={[styles.dropText, { color: colors.foreground }]}>{t}</Text>
                {form.type === t && <Feather name="check" size={14} color={colors.gold} />}
              </TouchableOpacity>
            ))}
          </View>
        )}
        {showStatusPicker && (
          <View style={[styles.dropCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {PROPERTY_STATUSES.map((s) => (
              <TouchableOpacity key={s} style={[styles.dropOption, { borderBottomColor: colors.border }]} onPress={() => { set('status', s); setShowStatusPicker(false); }}>
                <Text style={[styles.dropText, { color: colors.foreground }]}>{s}</Text>
                {form.status === s && <Feather name="check" size={14} color={colors.gold} />}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Purchase Details */}
        <SectionTitle title="Purchase Details" colors={colors} />
        <View style={styles.row2}>
          <View style={{ flex: 1 }}>
            <Field label="Purchase Price *" error={errors.purchasePrice} colors={colors}>
              <TextInput style={[styles.input, { color: colors.foreground, borderColor: errors.purchasePrice ? '#EF4444' : colors.border }]} placeholder="0" placeholderTextColor={colors.mutedForeground} value={form.purchasePrice} onChangeText={(v) => set('purchasePrice', v)} keyboardType="numeric" />
            </Field>
          </View>
          <View style={{ flex: 1 }}>
            <Field label="Closing Costs" colors={colors}>
              <TextInput style={[styles.input, { color: colors.foreground, borderColor: colors.border }]} placeholder="0" placeholderTextColor={colors.mutedForeground} value={form.closingCosts} onChangeText={(v) => set('closingCosts', v)} keyboardType="numeric" />
            </Field>
          </View>
        </View>
        <Field label="Closing Date *" error={errors.closingDate} colors={colors}>
          <TextInput style={[styles.input, { color: colors.foreground, borderColor: errors.closingDate ? '#EF4444' : colors.border }]} placeholder="2025-01-15" placeholderTextColor={colors.mutedForeground} value={form.closingDate} onChangeText={(v) => set('closingDate', v)} />
        </Field>
        <View style={styles.row2}>
          <View style={{ flex: 1 }}>
            <Field label="Lender Name" colors={colors}>
              <TextInput style={[styles.input, { color: colors.foreground, borderColor: colors.border }]} placeholder="First National Bank" placeholderTextColor={colors.mutedForeground} value={form.lenderName} onChangeText={(v) => set('lenderName', v)} />
            </Field>
          </View>
          <View style={{ flex: 1 }}>
            <Field label="Loan Number" colors={colors}>
              <TextInput style={[styles.input, { color: colors.foreground, borderColor: colors.border }]} placeholder="Optional" placeholderTextColor={colors.mutedForeground} value={form.loanNumber} onChangeText={(v) => set('loanNumber', v)} />
            </Field>
          </View>
        </View>

        {/* Budget */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Renovation Budget</Text>
          {availableCategories.length > 0 && (
            <TouchableOpacity onPress={() => setShowBudgetPicker(!showBudgetPicker)}>
              <Feather name="plus-circle" size={20} color={colors.gold} />
            </TouchableOpacity>
          )}
        </View>
        {showBudgetPicker && (
          <View style={[styles.dropCard, { backgroundColor: colors.card, borderColor: colors.border, maxHeight: 220 }]}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {availableCategories.map((cat) => (
                <TouchableOpacity key={cat} style={[styles.dropOption, { borderBottomColor: colors.border }]} onPress={() => addBudgetItem(cat)}>
                  <Text style={[styles.dropText, { color: colors.foreground }]}>{cat}</Text>
                  <Feather name="plus" size={14} color={colors.gold} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
        {budgetItems.length > 0 && (
          <View style={[styles.budgetCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.budgetHeader}>
              <Text style={[styles.budgetHeaderCell, { color: colors.mutedForeground, flex: 2 }]}>Category</Text>
              <Text style={[styles.budgetHeaderCell, { color: colors.mutedForeground }]}>Estimated</Text>
              <Text style={[styles.budgetHeaderCell, { color: colors.mutedForeground }]}>Actual</Text>
              <View style={{ width: 24 }} />
            </View>
            {budgetItems.map((item) => (
              <View key={item.id} style={[styles.budgetItemRow, { borderTopColor: colors.border }]}>
                <Text style={[styles.budgetItemCat, { color: colors.foreground }]} numberOfLines={1}>{item.category}</Text>
                <TextInput
                  style={[styles.budgetInput, { borderColor: colors.border, color: colors.foreground }]}
                  placeholder="0"
                  placeholderTextColor={colors.mutedForeground}
                  value={item.estimated > 0 ? String(item.estimated) : ''}
                  onChangeText={(v) => updateBudgetItem(item.id, 'estimated', v)}
                  keyboardType="numeric"
                />
                <TextInput
                  style={[styles.budgetInput, { borderColor: colors.border, color: colors.foreground }]}
                  placeholder="0"
                  placeholderTextColor={colors.mutedForeground}
                  value={item.actual > 0 ? String(item.actual) : ''}
                  onChangeText={(v) => updateBudgetItem(item.id, 'actual', v)}
                  keyboardType="numeric"
                />
                <TouchableOpacity onPress={() => removeBudgetItem(item.id)}>
                  <Feather name="x" size={16} color={colors.mutedForeground} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Notes */}
        <SectionTitle title="Notes" colors={colors} />
        <TextInput
          style={[styles.textarea, { borderColor: colors.border, backgroundColor: colors.card, color: colors.foreground }]}
          placeholder="Any notes about this property..."
          placeholderTextColor={colors.mutedForeground}
          value={form.notes}
          onChangeText={(v) => set('notes', v)}
          multiline
          numberOfLines={4}
        />
      </KeyboardAwareScrollView>
    </View>
  );
}

function SectionTitle({ title, colors }: { title: string; colors: any }) {
  return <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{title}</Text>;
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
  sectionTitle: { fontSize: 14, fontFamily: 'Inter_600SemiBold', marginTop: 16, marginBottom: 10 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, marginBottom: 10 },
  field: { marginBottom: 10 },
  label: { fontSize: 12, fontFamily: 'Inter_500Medium', marginBottom: 5 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, fontFamily: 'Inter_400Regular' },
  textarea: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 14, fontFamily: 'Inter_400Regular', minHeight: 96, textAlignVertical: 'top' },
  errorText: { color: '#EF4444', fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 4 },
  row2: { flexDirection: 'row', gap: 10 },
  picker: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
  pickerText: { fontSize: 13, fontFamily: 'Inter_400Regular', flex: 1 },
  dropCard: { borderRadius: 12, borderWidth: 1, marginBottom: 10, overflow: 'hidden' },
  dropOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 11, borderBottomWidth: 1 },
  dropText: { fontSize: 14, fontFamily: 'Inter_400Regular' },
  budgetCard: { borderRadius: 12, borderWidth: 1, marginBottom: 10, overflow: 'hidden' },
  budgetHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 8, gap: 8 },
  budgetHeaderCell: { fontSize: 11, fontFamily: 'Inter_500Medium', flex: 1, textAlign: 'right' },
  budgetItemRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 8, borderTopWidth: 1, gap: 8 },
  budgetItemCat: { fontSize: 12, fontFamily: 'Inter_400Regular', flex: 2 },
  budgetInput: { flex: 1, borderWidth: 1, borderRadius: 8, paddingHorizontal: 6, paddingVertical: 5, fontSize: 13, fontFamily: 'Inter_400Regular', textAlign: 'right' },
});
