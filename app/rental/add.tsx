import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
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

import { useRental } from '@/context/RentalContext';
import { useColors } from '@/hooks/useColors';
import { PropertyType, TenantStatus } from '@/types';

const PROPERTY_TYPES: PropertyType[] = ['Single Family', 'Multi-Family', 'Condo', 'Commercial', 'Land'];
const STATUSES: TenantStatus[] = ['Active', 'Ending Soon', 'Vacant'];

export default function AddRentalScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { addUnit } = useRental();

  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('NJ');
  const [zip, setZip] = useState('');
  const [type, setType] = useState<PropertyType>('Single Family');
  const [tenantName, setTenantName] = useState('');
  const [tenantPhone, setTenantPhone] = useState('');
  const [tenantEmail, setTenantEmail] = useState('');
  const [monthlyRent, setMonthlyRent] = useState('');
  const [leaseStart, setLeaseStart] = useState('');
  const [leaseEnd, setLeaseEnd] = useState('');
  const [securityDeposit, setSecurityDeposit] = useState('');
  const [status, setStatus] = useState<TenantStatus>('Active');
  const [notes, setNotes] = useState('');

  const topInset = Platform.OS === 'web' ? 16 : insets.top;

  const validate = () => {
    if (!address.trim()) { Alert.alert('Validation', 'Address is required'); return false; }
    if (!city.trim()) { Alert.alert('Validation', 'City is required'); return false; }
    if (!monthlyRent.trim()) { Alert.alert('Validation', 'Monthly rent is required'); return false; }
    if (status !== 'Vacant' && !tenantName.trim()) { Alert.alert('Validation', 'Tenant name is required for occupied units'); return false; }
    return true;
  };

  const handleSave = () => {
    if (!validate()) return;
    addUnit({
      address: address.trim(),
      city: city.trim(),
      state: state.trim(),
      zip: zip.trim(),
      type,
      tenantName: tenantName.trim(),
      tenantPhone: tenantPhone.trim() || undefined,
      tenantEmail: tenantEmail.trim() || undefined,
      monthlyRent: Number(monthlyRent.replace(/,/g, '')),
      leaseStart: leaseStart.trim(),
      leaseEnd: leaseEnd.trim(),
      securityDeposit: Number(securityDeposit.replace(/,/g, '') || '0'),
      status,
      notes: notes.trim() || undefined,
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  };

  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>{label}</Text>
      {children}
    </View>
  );

  const inputStyle = [styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card }];

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.headerBar, { paddingTop: topInset + 12, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Add Rental Unit</Text>
        <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.navy }]} onPress={handleSave}>
          <Text style={styles.saveBtnText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.form, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Property */}
        <Text style={[styles.section, { color: colors.foreground }]}>Property</Text>

        <Field label="Street Address *">
          <TextInput style={inputStyle} placeholder="e.g. 156 Willow Drive" placeholderTextColor={colors.mutedForeground} value={address} onChangeText={setAddress} />
        </Field>

        <View style={styles.row}>
          <View style={[styles.field, { flex: 2 }]}>
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>City *</Text>
            <TextInput style={inputStyle} placeholder="Montclair" placeholderTextColor={colors.mutedForeground} value={city} onChangeText={setCity} />
          </View>
          <View style={[styles.field, { flex: 1 }]}>
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>State</Text>
            <TextInput style={inputStyle} placeholder="NJ" placeholderTextColor={colors.mutedForeground} value={state} onChangeText={setState} maxLength={2} autoCapitalize="characters" />
          </View>
          <View style={[styles.field, { flex: 1 }]}>
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>ZIP</Text>
            <TextInput style={inputStyle} placeholder="07042" placeholderTextColor={colors.mutedForeground} value={zip} onChangeText={setZip} keyboardType="numeric" maxLength={5} />
          </View>
        </View>

        <Field label="Property Type">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.chipRow}>
              {PROPERTY_TYPES.map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.chip, { borderColor: type === t ? colors.navy : colors.border, backgroundColor: type === t ? colors.navy + '15' : colors.card }]}
                  onPress={() => setType(t)}
                >
                  <Text style={[styles.chipText, { color: type === t ? colors.navy : colors.mutedForeground }]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </Field>

        {/* Status */}
        <Field label="Unit Status">
          <View style={styles.chipRow}>
            {STATUSES.map((s) => (
              <TouchableOpacity
                key={s}
                style={[styles.chip, { borderColor: status === s ? colors.gold : colors.border, backgroundColor: status === s ? colors.gold + '15' : colors.card }]}
                onPress={() => setStatus(s)}
              >
                <Text style={[styles.chipText, { color: status === s ? colors.gold : colors.mutedForeground }]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Field>

        {/* Financials */}
        <Text style={[styles.section, { color: colors.foreground }]}>Financials</Text>

        <View style={styles.row}>
          <View style={[styles.field, { flex: 1 }]}>
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Monthly Rent *</Text>
            <TextInput style={inputStyle} placeholder="2,500" placeholderTextColor={colors.mutedForeground} value={monthlyRent} onChangeText={setMonthlyRent} keyboardType="numeric" />
          </View>
          <View style={[styles.field, { flex: 1 }]}>
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Security Deposit</Text>
            <TextInput style={inputStyle} placeholder="2,500" placeholderTextColor={colors.mutedForeground} value={securityDeposit} onChangeText={setSecurityDeposit} keyboardType="numeric" />
          </View>
        </View>

        {/* Tenant (if not vacant) */}
        {status !== 'Vacant' && (
          <>
            <Text style={[styles.section, { color: colors.foreground }]}>Tenant</Text>

            <Field label="Full Name *">
              <TextInput style={inputStyle} placeholder="e.g. Marcus Johnson" placeholderTextColor={colors.mutedForeground} value={tenantName} onChangeText={setTenantName} />
            </Field>

            <View style={styles.row}>
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Phone</Text>
                <TextInput style={inputStyle} placeholder="(973) 555-0100" placeholderTextColor={colors.mutedForeground} value={tenantPhone} onChangeText={setTenantPhone} keyboardType="phone-pad" />
              </View>
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Email</Text>
                <TextInput style={inputStyle} placeholder="tenant@email.com" placeholderTextColor={colors.mutedForeground} value={tenantEmail} onChangeText={setTenantEmail} keyboardType="email-address" autoCapitalize="none" />
              </View>
            </View>

            {/* Lease */}
            <Text style={[styles.section, { color: colors.foreground }]}>Lease</Text>

            <View style={styles.row}>
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Start Date</Text>
                <TextInput style={inputStyle} placeholder="2025-06-01" placeholderTextColor={colors.mutedForeground} value={leaseStart} onChangeText={setLeaseStart} />
              </View>
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>End Date</Text>
                <TextInput style={inputStyle} placeholder="2026-05-31" placeholderTextColor={colors.mutedForeground} value={leaseEnd} onChangeText={setLeaseEnd} />
              </View>
            </View>
          </>
        )}

        {/* Notes */}
        <Text style={[styles.section, { color: colors.foreground }]}>Notes</Text>
        <Field label="">
          <TextInput
            style={[inputStyle, { height: 80, paddingTop: 10 }]}
            placeholder="Any additional notes about the unit..."
            placeholderTextColor={colors.mutedForeground}
            value={notes}
            onChangeText={setNotes}
            multiline
          />
        </Field>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  headerBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1 },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontFamily: 'Inter_600SemiBold' },
  saveBtn: { borderRadius: 10, paddingHorizontal: 18, paddingVertical: 9 },
  saveBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: '#fff' },
  form: { paddingHorizontal: 16, paddingTop: 20 },
  section: { fontSize: 13, fontFamily: 'Inter_700Bold', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 12, marginTop: 8, opacity: 0.6 },
  field: { marginBottom: 14 },
  fieldLabel: { fontSize: 12, fontFamily: 'Inter_500Medium', marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, fontFamily: 'Inter_400Regular' },
  row: { flexDirection: 'row', gap: 10 },
  chipRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 7 },
  chipText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
});
