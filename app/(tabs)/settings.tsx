import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/context/AuthContext';
import { useColors } from '@/hooks/useColors';
import { UserRole } from '@/types';

const ROLE_COLORS: Record<UserRole, string> = {
  Admin: '#7C3AED',
  Partner: '#1D4ED8',
  'Project Manager': '#0369A1',
  Contractor: '#B45309',
  Accountant: '#065F46',
  Viewer: '#6B7280',
};

const ALL_PERMISSIONS: Array<{ label: string; roles: UserRole[] }> = [
  { label: 'View properties & dashboard', roles: ['Admin', 'Partner', 'Project Manager', 'Contractor', 'Accountant', 'Viewer'] },
  { label: 'Add / edit properties', roles: ['Admin', 'Partner', 'Project Manager', 'Accountant'] },
  { label: 'Add / edit expenses', roles: ['Admin', 'Partner', 'Project Manager', 'Accountant'] },
  { label: 'Post timeline updates', roles: ['Admin', 'Partner', 'Project Manager', 'Accountant'] },
  { label: 'Approve expenses', roles: ['Admin', 'Partner', 'Accountant'] },
  { label: 'Delete properties', roles: ['Admin', 'Partner'] },
  { label: 'Manage team members', roles: ['Admin'] },
  { label: 'View financial reports', roles: ['Admin', 'Partner', 'Accountant'] },
];

const DEMO_TEAM = [
  { id: 'u1', name: 'Alex Rivera', email: 'admin@nexusgrowth.com', role: 'Admin' as UserRole, active: true },
  { id: 'u2', name: 'Jordan Lee', email: 'pm@nexusgrowth.com', role: 'Project Manager' as UserRole, active: true },
  { id: 'u3', name: 'Sam Torres', email: 'contractor@nexusgrowth.com', role: 'Contractor' as UserRole, active: true },
  { id: 'u4', name: 'Casey Morgan', email: 'finance@nexusgrowth.com', role: 'Accountant' as UserRole, active: true },
  { id: 'u5', name: 'Drew Patel', email: 'partner@nexusgrowth.com', role: 'Partner' as UserRole, active: true },
];

type SettingsTab = 'Profile' | 'Team' | 'Permissions';

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<SettingsTab>('Profile');
  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const isAdmin = user?.role === 'Admin';

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const TABS: SettingsTab[] = isAdmin ? ['Profile', 'Team', 'Permissions'] : ['Profile', 'Permissions'];

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.headerBar, { paddingTop: topInset + 12, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Settings</Text>
        <View style={styles.tabRow}>
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && { backgroundColor: colors.navy }]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, { color: activeTab === tab ? '#fff' : colors.mutedForeground }]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Tab */}
        {activeTab === 'Profile' && (
          <View>
            {/* Logo + Company */}
            <View style={[styles.companyCard, { backgroundColor: colors.navy }]}>
              <Image
                source={require('@/assets/images/logo.png')}
                style={styles.companyLogo}
                contentFit="contain"
                tintColor="#FFFFFF"
              />
              <View>
                <Text style={styles.companyName}>Nexus Growth Inc.</Text>
                <Text style={styles.companyTagline}>Property Management Platform</Text>
              </View>
            </View>

            {/* User Card */}
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.avatarRow}>
                <View style={[styles.avatar, { backgroundColor: ROLE_COLORS[user!.role] + '22' }]}>
                  <Text style={[styles.avatarInitials, { color: ROLE_COLORS[user!.role] }]}>
                    {user!.name.split(' ').map((n) => n[0]).join('').toUpperCase()}
                  </Text>
                </View>
                <View style={styles.avatarInfo}>
                  <Text style={[styles.userName, { color: colors.foreground }]}>{user!.name}</Text>
                  <Text style={[styles.userEmail, { color: colors.mutedForeground }]}>{user!.email}</Text>
                  <View style={[styles.roleBadge, { backgroundColor: ROLE_COLORS[user!.role] + '18' }]}>
                    <Text style={[styles.roleText, { color: ROLE_COLORS[user!.role] }]}>{user!.role}</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Access Summary */}
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Your Access Level</Text>
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {ALL_PERMISSIONS.map((perm, idx) => {
                const hasAccess = perm.roles.includes(user!.role);
                return (
                  <View
                    key={perm.label}
                    style={[styles.permRow, idx < ALL_PERMISSIONS.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}
                  >
                    <Feather
                      name={hasAccess ? 'check-circle' : 'x-circle'}
                      size={16}
                      color={hasAccess ? '#22C55E' : colors.mutedForeground}
                    />
                    <Text style={[styles.permLabel, { color: hasAccess ? colors.foreground : colors.mutedForeground }]}>
                      {perm.label}
                    </Text>
                  </View>
                );
              })}
            </View>

            {/* Sign Out */}
            <TouchableOpacity
              style={[styles.logoutBtn, { borderColor: '#FCA5A5', backgroundColor: '#FEF2F2' }]}
              onPress={handleLogout}
              activeOpacity={0.8}
            >
              <Feather name="log-out" size={16} color="#DC2626" />
              <Text style={[styles.logoutText, { color: '#DC2626' }]}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Team Tab (Admin only) */}
        {activeTab === 'Team' && isAdmin && (
          <View>
            <View style={styles.teamHeaderRow}>
              <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 0 }]}>
                Team Members ({DEMO_TEAM.length})
              </Text>
              <View style={[styles.adminBadge, { backgroundColor: colors.gold + '22' }]}>
                <Feather name="shield" size={12} color={colors.gold} />
                <Text style={[styles.adminBadgeText, { color: colors.gold }]}>Admin View</Text>
              </View>
            </View>

            {DEMO_TEAM.map((member) => (
              <View key={member.id} style={[styles.memberCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.memberAvatar, { backgroundColor: ROLE_COLORS[member.role] + '22' }]}>
                  <Text style={[styles.memberInitials, { color: ROLE_COLORS[member.role] }]}>
                    {member.name.split(' ').map((n) => n[0]).join('').toUpperCase()}
                  </Text>
                </View>
                <View style={styles.memberInfo}>
                  <View style={styles.memberNameRow}>
                    <Text style={[styles.memberName, { color: colors.foreground }]}>{member.name}</Text>
                    {member.id === user?.id && (
                      <View style={[styles.youBadge, { backgroundColor: colors.navy + '18' }]}>
                        <Text style={[styles.youText, { color: colors.navy }]}>You</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.memberEmail, { color: colors.mutedForeground }]}>{member.email}</Text>
                  <View style={[styles.memberRoleBadge, { backgroundColor: ROLE_COLORS[member.role] + '18' }]}>
                    <Text style={[styles.memberRoleText, { color: ROLE_COLORS[member.role] }]}>{member.role}</Text>
                  </View>
                </View>
                <View style={[styles.activeIndicator, { backgroundColor: '#22C55E' }]} />
              </View>
            ))}

            <View style={[styles.infoBox, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
              <Feather name="info" size={14} color={colors.mutedForeground} />
              <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
                Full user management (invite, remove, change roles) will be available when the backend is connected.
              </Text>
            </View>
          </View>
        )}

        {/* Permissions Tab */}
        {activeTab === 'Permissions' && (
          <View>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Role Permissions Matrix</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.matrixScroll}>
              <View>
                {/* Header Row */}
                <View style={[styles.matrixHeaderRow, { backgroundColor: colors.navy }]}>
                  <Text style={[styles.matrixPermCell, styles.matrixHeaderText]}>Permission</Text>
                  {(['Admin', 'Partner', 'Project Manager', 'Contractor', 'Accountant', 'Viewer'] as UserRole[]).map((r) => (
                    <Text key={r} style={[styles.matrixRoleCell, styles.matrixHeaderText]} numberOfLines={2}>{r}</Text>
                  ))}
                </View>

                {ALL_PERMISSIONS.map((perm, idx) => (
                  <View
                    key={perm.label}
                    style={[
                      styles.matrixRow,
                      { backgroundColor: idx % 2 === 0 ? colors.card : colors.secondary, borderBottomColor: colors.border },
                    ]}
                  >
                    <Text style={[styles.matrixPermCell, { color: colors.foreground }]}>{perm.label}</Text>
                    {(['Admin', 'Partner', 'Project Manager', 'Contractor', 'Accountant', 'Viewer'] as UserRole[]).map((r) => (
                      <View key={r} style={styles.matrixRoleCell}>
                        <Feather
                          name={perm.roles.includes(r) ? 'check' : 'minus'}
                          size={14}
                          color={perm.roles.includes(r) ? '#22C55E' : colors.mutedForeground}
                        />
                      </View>
                    ))}
                  </View>
                ))}
              </View>
            </ScrollView>

            {/* Role Legend */}
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Role Descriptions</Text>
            {(
              [
                { role: 'Admin' as UserRole, desc: 'Full access to all features. Can manage team members, approve expenses, and delete records.' },
                { role: 'Partner' as UserRole, desc: 'Can view, add, edit, and delete properties. Can approve expenses and view all reports.' },
                { role: 'Project Manager' as UserRole, desc: 'Can add and edit properties, expenses, and timeline updates. Cannot delete or manage users.' },
                { role: 'Contractor' as UserRole, desc: 'View-only access. Can view assigned projects and their details.' },
                { role: 'Accountant' as UserRole, desc: 'Can add and edit expenses, approve payments, and view financial reports.' },
                { role: 'Viewer' as UserRole, desc: 'Read-only access to all project data.' },
              ] as const
            ).map(({ role, desc }) => (
              <View key={role} style={[styles.roleCard, { backgroundColor: colors.card, borderColor: colors.border, borderLeftColor: ROLE_COLORS[role] }]}>
                <View style={styles.roleCardHeader}>
                  <View style={[styles.roleCardBadge, { backgroundColor: ROLE_COLORS[role] + '18' }]}>
                    <Text style={[styles.roleCardRole, { color: ROLE_COLORS[role] }]}>{role}</Text>
                  </View>
                </View>
                <Text style={[styles.roleCardDesc, { color: colors.mutedForeground }]}>{desc}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  headerBar: { paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1 },
  title: { fontSize: 26, fontFamily: 'Inter_700Bold', marginBottom: 12 },
  tabRow: { flexDirection: 'row', gap: 6 },
  tab: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 },
  tabText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  content: { paddingHorizontal: 16, paddingTop: 16 },
  companyCard: { borderRadius: 16, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 14 },
  companyLogo: { width: 56, height: 56 },
  companyName: { fontSize: 17, fontFamily: 'Inter_700Bold', color: '#fff' },
  companyTagline: { fontSize: 12, fontFamily: 'Inter_400Regular', color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  card: { borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 14 },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  avatarInitials: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  avatarInfo: { flex: 1, gap: 4 },
  userName: { fontSize: 17, fontFamily: 'Inter_700Bold' },
  userEmail: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  roleBadge: { alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  roleText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  sectionTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold', marginBottom: 10, marginTop: 6 },
  permRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 11 },
  permLabel: { fontSize: 13, fontFamily: 'Inter_400Regular', flex: 1 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 12, borderWidth: 1, paddingVertical: 14, marginTop: 8, marginBottom: 4 },
  logoutText: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  teamHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  adminBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  adminBadgeText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  memberCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 10, gap: 12 },
  memberAvatar: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  memberInitials: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  memberInfo: { flex: 1, gap: 4 },
  memberNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  memberName: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  youBadge: { borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2 },
  youText: { fontSize: 10, fontFamily: 'Inter_600SemiBold' },
  memberEmail: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  memberRoleBadge: { alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 9, paddingVertical: 3 },
  memberRoleText: { fontSize: 10, fontFamily: 'Inter_600SemiBold' },
  activeIndicator: { width: 8, height: 8, borderRadius: 4 },
  infoBox: { flexDirection: 'row', gap: 8, borderRadius: 12, borderWidth: 1, padding: 12, marginTop: 4 },
  infoText: { fontSize: 12, fontFamily: 'Inter_400Regular', flex: 1, lineHeight: 18 },
  matrixScroll: { marginHorizontal: -4 },
  matrixHeaderRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 8, marginBottom: 2 },
  matrixHeaderText: { color: '#fff', fontFamily: 'Inter_600SemiBold', fontSize: 10 },
  matrixRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 8, borderBottomWidth: 1 },
  matrixPermCell: { width: 160, fontSize: 11, fontFamily: 'Inter_400Regular', paddingRight: 8 },
  matrixRoleCell: { width: 72, alignItems: 'center', fontSize: 10, fontFamily: 'Inter_500Medium', textAlign: 'center' },
  roleCard: { borderRadius: 12, borderWidth: 1, borderLeftWidth: 4, padding: 14, marginBottom: 10 },
  roleCardHeader: { marginBottom: 6 },
  roleCardBadge: { alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  roleCardRole: { fontSize: 12, fontFamily: 'Inter_700Bold' },
  roleCardDesc: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 20 },
});
