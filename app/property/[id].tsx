import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
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

import { EmptyState } from '@/components/EmptyState';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { useColors } from '@/hooks/useColors';
import {
  DOCUMENT_TYPES,
  PHOTO_CATEGORIES,
  BudgetItem,
  DocumentType,
  PhotoCategory,
  PROPERTY_STATUSES,
  Property,
} from '@/types';

type Tab = 'Overview' | 'Budget' | 'Expenses' | 'Timeline' | 'Photos' | 'Docs';

const STATUS_COLORS: Record<string, string> = {
  'Under Contract': '#F59E0B',
  Purchased: '#3B82F6',
  Renovating: '#8B5CF6',
  Listed: '#06B6D4',
  Sold: '#22C55E',
  Rented: '#10B981',
  Completed: '#6B7280',
};

const PHOTO_CATEGORY_COLORS: Record<PhotoCategory, string> = {
  Before: '#EF4444',
  Progress: '#F59E0B',
  After: '#22C55E',
};

const DOC_ICONS: Record<string, string> = {
  'Closing Document': 'file-text',
  'Loan Document': 'dollar-sign',
  Permit: 'shield',
  'Contractor Agreement': 'users',
  Invoice: 'file',
  Receipt: 'credit-card',
  'Lien Waiver': 'check-square',
  'Draw Request': 'send',
  Insurance: 'umbrella',
  'Inspection Report': 'search',
  Other: 'paperclip',
};

function fmt(n: number) {
  return '$' + n.toLocaleString('en-US');
}

export default function PropertyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { canEdit, canDelete, user } = useAuth();
  const {
    properties, expenses, timeline,
    updateProperty, deleteProperty,
    addTimelineEvent, addPhoto, removePhoto, addDocument, removeDocument,
  } = useData();

  const [activeTab, setActiveTab] = useState<Tab>('Overview');
  const [editingStatus, setEditingStatus] = useState(false);
  const [timelineTitle, setTimelineTitle] = useState('');
  const [timelineNote, setTimelineNote] = useState('');
  const [showAddTimeline, setShowAddTimeline] = useState(false);
  const [photoCategory, setPhotoCategory] = useState<PhotoCategory>('Before');
  const [showAddDoc, setShowAddDoc] = useState(false);
  const [docName, setDocName] = useState('');
  const [docType, setDocType] = useState<DocumentType>('Closing Document');
  const [docNotes, setDocNotes] = useState('');
  const [showDocTypePicker, setShowDocTypePicker] = useState(false);

  const property = properties.find((p) => p.id === id);
  if (!property) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <EmptyState icon="home" title="Property not found" />
      </View>
    );
  }

  const propExpenses = expenses.filter((e) => e.propertyId === id);
  const propTimeline = timeline
    .filter((t) => t.propertyId === id)
    .sort((a, b) => b.date.localeCompare(a.date));
  const totalExpenses = propExpenses.reduce((s, e) => s + e.amount, 0);
  const totalBudget = property.budgetItems.reduce((s, b) => s + b.estimated, 0);
  const totalActual = property.budgetItems.reduce((s, b) => s + b.actual, 0);
  const photos = property.propertyPhotos ?? [];
  const documents = property.documents ?? [];

  const handleDelete = () => {
    Alert.alert('Delete Property', 'Are you sure? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteProperty(property.id);
          router.back();
        },
      },
    ]);
  };

  const handleStatusChange = (status: Property['status']) => {
    updateProperty(property.id, { status });
    setEditingStatus(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleAddTimeline = () => {
    if (!timelineTitle.trim()) return;
    addTimelineEvent({
      propertyId: property.id,
      title: timelineTitle.trim(),
      note: timelineNote.trim() || undefined,
      date: new Date().toISOString().split('T')[0],
      addedBy: user?.name ?? 'Unknown',
    });
    setTimelineTitle('');
    setTimelineNote('');
    setShowAddTimeline(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handlePickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow photo library access to add photos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (!result.canceled) {
      for (const asset of result.assets) {
        addPhoto(property.id, {
          uri: asset.uri,
          category: photoCategory,
          date: new Date().toISOString().split('T')[0],
          addedBy: user?.name ?? 'Unknown',
        });
      }
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow camera access to take photos.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      quality: 0.8,
    });
    if (!result.canceled) {
      addPhoto(property.id, {
        uri: result.assets[0].uri,
        category: photoCategory,
        date: new Date().toISOString().split('T')[0],
        addedBy: user?.name ?? 'Unknown',
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleRemovePhoto = (photoId: string) => {
    Alert.alert('Remove Photo', 'Remove this photo from the project?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removePhoto(property.id, photoId) },
    ]);
  };

  const handleAddDocument = () => {
    if (!docName.trim()) return;
    addDocument(property.id, {
      name: docName.trim(),
      type: docType,
      date: new Date().toISOString().split('T')[0],
      notes: docNotes.trim() || undefined,
      addedBy: user?.name ?? 'Unknown',
    });
    setDocName('');
    setDocNotes('');
    setShowAddDoc(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleRemoveDocument = (docId: string) => {
    Alert.alert('Remove Document', 'Remove this document record?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removeDocument(property.id, docId) },
    ]);
  };

  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const TABS: Tab[] = ['Overview', 'Budget', 'Expenses', 'Timeline', 'Photos', 'Docs'];

  const beforePhotos = photos.filter((p) => p.category === 'Before');
  const progressPhotos = photos.filter((p) => p.category === 'Progress');
  const afterPhotos = photos.filter((p) => p.category === 'After');

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.topBar, { paddingTop: topInset + 8, backgroundColor: colors.navy }]}>
        <View style={styles.topBarInner}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-left" size={20} color="#fff" />
          </TouchableOpacity>
          <View style={styles.topBarTitle}>
            <Text style={styles.topBarAddress} numberOfLines={1}>{property.address}</Text>
            <Text style={styles.topBarCity}>{property.city}, {property.state}</Text>
          </View>
          {canDelete && (
            <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn}>
              <Feather name="trash-2" size={18} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
          )}
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.activeTab]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, { color: activeTab === tab ? '#fff' : 'rgba(255,255,255,0.55)' }]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── OVERVIEW ── */}
        {activeTab === 'Overview' && (
          <View>
            <View style={styles.statusRow}>
              <TouchableOpacity
                style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[property.status] + '22' }]}
                onPress={() => canEdit && setEditingStatus(!editingStatus)}
              >
                <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[property.status] }]} />
                <Text style={[styles.statusText, { color: STATUS_COLORS[property.status] }]}>{property.status}</Text>
                {canEdit && <Feather name="chevron-down" size={12} color={STATUS_COLORS[property.status]} />}
              </TouchableOpacity>
            </View>
            {editingStatus && (
              <View style={[styles.statusPicker, { backgroundColor: colors.card, borderColor: colors.border }]}>
                {PROPERTY_STATUSES.map((s) => (
                  <TouchableOpacity key={s} style={[styles.statusOption, { borderBottomColor: colors.border }]} onPress={() => handleStatusChange(s)}>
                    <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[s] }]} />
                    <Text style={[styles.statusOptionText, { color: colors.foreground }]}>{s}</Text>
                    {property.status === s && <Feather name="check" size={14} color={colors.gold} />}
                  </TouchableOpacity>
                ))}
              </View>
            )}
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>Purchase Details</Text>
              <DetailRow label="Property Type" value={property.type} colors={colors} />
              <DetailRow label="Purchase Price" value={fmt(property.purchasePrice)} colors={colors} />
              <DetailRow label="Closing Costs" value={fmt(property.closingCosts)} colors={colors} />
              <DetailRow label="Closing Date" value={property.closingDate} colors={colors} />
              {property.lenderName && <DetailRow label="Lender" value={property.lenderName} colors={colors} />}
              {property.loanNumber && <DetailRow label="Loan Number" value={property.loanNumber} colors={colors} last />}
            </View>
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>Financial Summary</Text>
              <DetailRow label="Renovation Budget" value={totalBudget > 0 ? fmt(totalBudget) : '—'} colors={colors} />
              <DetailRow label="Expenses Paid" value={fmt(totalExpenses)} colors={colors} valueColor={totalExpenses > totalBudget && totalBudget > 0 ? '#EF4444' : undefined} />
              {property.saleInfo && (
                <>
                  <DetailRow label="Sale Price" value={fmt(property.saleInfo.salePrice)} colors={colors} />
                  <DetailRow label="Realtor Commission" value={fmt(property.saleInfo.realtorCommission)} colors={colors} />
                  <DetailRow label="Selling Costs" value={fmt(property.saleInfo.sellingClosingCosts)} colors={colors} />
                </>
              )}
              <View style={[styles.detailRow, { borderTopColor: colors.border, borderTopWidth: 1 }]}>
                <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>Total Investment</Text>
                <Text style={[styles.detailValue, { color: colors.foreground, fontFamily: 'Inter_700Bold' }]}>
                  {fmt(property.purchasePrice + property.closingCosts + totalExpenses)}
                </Text>
              </View>
            </View>
            {property.notes ? (
              <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.cardTitle, { color: colors.foreground }]}>Notes</Text>
                <Text style={[styles.notes, { color: colors.mutedForeground }]}>{property.notes}</Text>
              </View>
            ) : null}
          </View>
        )}

        {/* ── BUDGET ── */}
        {activeTab === 'Budget' && (
          <View>
            <View style={[styles.budgetSummary, { backgroundColor: colors.navy }]}>
              <View style={styles.budgetSumItem}>
                <Text style={styles.budgetSumLabel}>Estimated</Text>
                <Text style={styles.budgetSumValue}>{fmt(totalBudget)}</Text>
              </View>
              <View style={styles.budgetSumDivider} />
              <View style={styles.budgetSumItem}>
                <Text style={styles.budgetSumLabel}>Actual</Text>
                <Text style={[styles.budgetSumValue, { color: totalActual > totalBudget ? '#FCA5A5' : '#86EFAC' }]}>{fmt(totalActual)}</Text>
              </View>
              <View style={styles.budgetSumDivider} />
              <View style={styles.budgetSumItem}>
                <Text style={styles.budgetSumLabel}>Variance</Text>
                <Text style={[styles.budgetSumValue, { color: totalActual > totalBudget ? '#FCA5A5' : '#86EFAC' }]}>
                  {totalActual > totalBudget ? '+' : '-'}{fmt(Math.abs(totalActual - totalBudget))}
                </Text>
              </View>
            </View>
            {property.budgetItems.length === 0 ? (
              <EmptyState icon="clipboard" title="No budget items" subtitle="Budget items will appear here" />
            ) : (
              <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.budgetHeaderRow, { borderBottomColor: colors.border }]}>
                  <Text style={[styles.budgetHeaderCell, { color: colors.mutedForeground, flex: 2 }]}>Category</Text>
                  <Text style={[styles.budgetHeaderCell, { color: colors.mutedForeground }]}>Estimated</Text>
                  <Text style={[styles.budgetHeaderCell, { color: colors.mutedForeground }]}>Actual</Text>
                </View>
                {property.budgetItems.map((item, idx) => (
                  <BudgetRowComp key={item.id} item={item} colors={colors} last={idx === property.budgetItems.length - 1} />
                ))}
              </View>
            )}
          </View>
        )}

        {/* ── EXPENSES ── */}
        {activeTab === 'Expenses' && (
          <View>
            {canEdit && (
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: colors.navy }]}
                onPress={() => router.push({ pathname: '/expense/add', params: { propertyId: property.id } })}
              >
                <Feather name="plus" size={16} color="#fff" />
                <Text style={styles.actionBtnText}>Add Expense</Text>
              </TouchableOpacity>
            )}
            {propExpenses.length === 0 ? (
              <EmptyState icon="credit-card" title="No expenses" subtitle="Add expenses to track project costs" />
            ) : (
              propExpenses.map((e) => (
                <View key={e.id} style={[styles.expRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.expVendor, { color: colors.foreground }]}>{e.vendor}</Text>
                    <Text style={[styles.expSub, { color: colors.mutedForeground }]}>{e.category} · {e.date} · {e.paymentMethod}</Text>
                    {e.notes ? <Text style={[styles.expNotes, { color: colors.mutedForeground }]}>{e.notes}</Text> : null}
                    {e.approvedBy ? <Text style={[styles.expApproved, { color: '#16A34A' }]}>Approved by {e.approvedBy}</Text> : null}
                  </View>
                  <Text style={[styles.expAmt, { color: colors.foreground }]}>{fmt(e.amount)}</Text>
                </View>
              ))
            )}
          </View>
        )}

        {/* ── TIMELINE ── */}
        {activeTab === 'Timeline' && (
          <View>
            {canEdit && (
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: colors.navy }]}
                onPress={() => setShowAddTimeline(!showAddTimeline)}
              >
                <Feather name="plus" size={16} color="#fff" />
                <Text style={styles.actionBtnText}>Add Update</Text>
              </TouchableOpacity>
            )}
            {showAddTimeline && (
              <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.cardTitle, { color: colors.foreground }]}>New Update</Text>
                <TextInput style={[styles.tlInput, { borderColor: colors.border, color: colors.foreground }]} placeholder="Title (e.g. Kitchen completed)" placeholderTextColor={colors.mutedForeground} value={timelineTitle} onChangeText={setTimelineTitle} />
                <TextInput style={[styles.tlInput, { borderColor: colors.border, color: colors.foreground, height: 72, marginTop: 8 }]} placeholder="Optional notes..." placeholderTextColor={colors.mutedForeground} value={timelineNote} onChangeText={setTimelineNote} multiline />
                <TouchableOpacity style={[styles.tlSaveBtn, { backgroundColor: colors.gold }]} onPress={handleAddTimeline}>
                  <Text style={styles.tlSaveText}>Save Update</Text>
                </TouchableOpacity>
              </View>
            )}
            {propTimeline.length === 0 ? (
              <EmptyState icon="clock" title="No timeline entries" subtitle="Track project milestones and updates" />
            ) : (
              <View style={styles.timeline}>
                {propTimeline.map((event, idx) => (
                  <View key={event.id} style={styles.tlItem}>
                    <View style={styles.tlLeft}>
                      <View style={[styles.tlDot, { backgroundColor: colors.gold }]} />
                      {idx < propTimeline.length - 1 && <View style={[styles.tlLine, { backgroundColor: colors.border }]} />}
                    </View>
                    <View style={[styles.tlContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
                      <Text style={[styles.tlTitle, { color: colors.foreground }]}>{event.title}</Text>
                      <Text style={[styles.tlDate, { color: colors.mutedForeground }]}>{event.date} · {event.addedBy}</Text>
                      {event.note ? <Text style={[styles.tlNote, { color: colors.mutedForeground }]}>{event.note}</Text> : null}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* ── PHOTOS ── */}
        {activeTab === 'Photos' && (
          <View>
            {canEdit && (
              <View>
                {/* Category Selector */}
                <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>Add photos as:</Text>
                <View style={styles.categoryRow}>
                  {PHOTO_CATEGORIES.map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.categoryChip,
                        { borderColor: photoCategory === cat ? PHOTO_CATEGORY_COLORS[cat] : colors.border, backgroundColor: photoCategory === cat ? PHOTO_CATEGORY_COLORS[cat] + '18' : colors.card },
                      ]}
                      onPress={() => setPhotoCategory(cat)}
                    >
                      <Text style={[styles.categoryChipText, { color: photoCategory === cat ? PHOTO_CATEGORY_COLORS[cat] : colors.mutedForeground }]}>{cat}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={styles.photoActions}>
                  <TouchableOpacity style={[styles.photoActionBtn, { backgroundColor: colors.navy }]} onPress={handlePickPhoto} activeOpacity={0.85}>
                    <Feather name="image" size={16} color="#fff" />
                    <Text style={styles.photoActionText}>Library</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.photoActionBtn, { backgroundColor: colors.gold }]} onPress={handleTakePhoto} activeOpacity={0.85}>
                    <Feather name="camera" size={16} color="#fff" />
                    <Text style={styles.photoActionText}>Camera</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {photos.length === 0 ? (
              <EmptyState icon="image" title="No photos yet" subtitle="Add before, progress, and after photos to document the renovation" />
            ) : (
              <>
                {[{ label: 'Before', list: beforePhotos }, { label: 'Progress', list: progressPhotos }, { label: 'After', list: afterPhotos }]
                  .filter((g) => g.list.length > 0)
                  .map((group) => (
                    <View key={group.label} style={styles.photoGroup}>
                      <View style={styles.photoGroupHeader}>
                        <View style={[styles.photoCategoryDot, { backgroundColor: PHOTO_CATEGORY_COLORS[group.label as PhotoCategory] }]} />
                        <Text style={[styles.photoGroupLabel, { color: colors.foreground }]}>{group.label} ({group.list.length})</Text>
                      </View>
                      <View style={styles.photoGrid}>
                        {group.list.map((photo) => (
                          <TouchableOpacity
                            key={photo.id}
                            style={styles.photoCell}
                            onLongPress={() => canEdit && handleRemovePhoto(photo.id)}
                            activeOpacity={0.85}
                          >
                            <Image source={{ uri: photo.uri }} style={styles.photoThumb} contentFit="cover" />
                            <View style={[styles.photoDateBadge, { backgroundColor: 'rgba(0,0,0,0.55)' }]}>
                              <Text style={styles.photoDateText}>{photo.date}</Text>
                            </View>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  ))}
                {canEdit && (
                  <Text style={[styles.holdHint, { color: colors.mutedForeground }]}>Hold a photo to remove it</Text>
                )}
              </>
            )}
          </View>
        )}

        {/* ── DOCS ── */}
        {activeTab === 'Docs' && (
          <View>
            {canEdit && (
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: colors.navy }]}
                onPress={() => setShowAddDoc(!showAddDoc)}
              >
                <Feather name="plus" size={16} color="#fff" />
                <Text style={styles.actionBtnText}>Add Document</Text>
              </TouchableOpacity>
            )}

            {showAddDoc && (
              <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.cardTitle, { color: colors.foreground }]}>Add Document Record</Text>
                <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Document Name</Text>
                <TextInput
                  style={[styles.tlInput, { borderColor: colors.border, color: colors.foreground }]}
                  placeholder="e.g. Purchase Agreement.pdf"
                  placeholderTextColor={colors.mutedForeground}
                  value={docName}
                  onChangeText={setDocName}
                />
                <Text style={[styles.fieldLabel, { color: colors.mutedForeground, marginTop: 10 }]}>Document Type</Text>
                <TouchableOpacity
                  style={[styles.picker, { borderColor: colors.border, backgroundColor: colors.secondary }]}
                  onPress={() => setShowDocTypePicker(!showDocTypePicker)}
                >
                  <Text style={[styles.pickerText, { color: colors.foreground }]}>{docType}</Text>
                  <Feather name="chevron-down" size={14} color={colors.mutedForeground} />
                </TouchableOpacity>
                {showDocTypePicker && (
                  <View style={[styles.docTypeDrop, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
                    <ScrollView style={{ maxHeight: 180 }} showsVerticalScrollIndicator={false}>
                      {DOCUMENT_TYPES.map((t) => (
                        <TouchableOpacity
                          key={t}
                          style={[styles.dropOption, { borderBottomColor: colors.border }]}
                          onPress={() => { setDocType(t); setShowDocTypePicker(false); }}
                        >
                          <Text style={[styles.dropText, { color: colors.foreground }]}>{t}</Text>
                          {docType === t && <Feather name="check" size={14} color={colors.gold} />}
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
                <Text style={[styles.fieldLabel, { color: colors.mutedForeground, marginTop: 10 }]}>Notes (optional)</Text>
                <TextInput
                  style={[styles.tlInput, { borderColor: colors.border, color: colors.foreground }]}
                  placeholder="Any notes about this document..."
                  placeholderTextColor={colors.mutedForeground}
                  value={docNotes}
                  onChangeText={setDocNotes}
                />
                <TouchableOpacity style={[styles.tlSaveBtn, { backgroundColor: colors.gold }]} onPress={handleAddDocument}>
                  <Text style={styles.tlSaveText}>Save Document</Text>
                </TouchableOpacity>
              </View>
            )}

            {documents.length === 0 ? (
              <EmptyState icon="file-text" title="No documents" subtitle="Add closing docs, permits, contracts, and receipts" />
            ) : (
              documents.map((doc) => (
                <View key={doc.id} style={[styles.docRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={[styles.docIcon, { backgroundColor: colors.navy + '18' }]}>
                    <Feather name={(DOC_ICONS[doc.type] ?? 'file') as any} size={16} color={colors.navy} />
                  </View>
                  <View style={styles.docInfo}>
                    <Text style={[styles.docName, { color: colors.foreground }]} numberOfLines={1}>{doc.name}</Text>
                    <Text style={[styles.docMeta, { color: colors.mutedForeground }]}>{doc.type} · {doc.date}</Text>
                    {doc.notes ? <Text style={[styles.docNotes, { color: colors.mutedForeground }]}>{doc.notes}</Text> : null}
                    <Text style={[styles.docAddedBy, { color: colors.mutedForeground }]}>Added by {doc.addedBy}</Text>
                  </View>
                  {canEdit && (
                    <TouchableOpacity onPress={() => handleRemoveDocument(doc.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <Feather name="trash-2" size={15} color={colors.mutedForeground} />
                    </TouchableOpacity>
                  )}
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function DetailRow({ label, value, colors, valueColor, last }: { label: string; value: string; colors: any; valueColor?: string; last?: boolean }) {
  return (
    <View style={[styles.detailRow, !last && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
      <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[styles.detailValue, { color: valueColor ?? colors.foreground }]}>{value}</Text>
    </View>
  );
}

function BudgetRowComp({ item, colors, last }: { item: BudgetItem; colors: any; last: boolean }) {
  const over = item.actual > item.estimated && item.estimated > 0;
  return (
    <View style={[styles.budgetRow, !last && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
      <Text style={[styles.budgetCat, { color: colors.foreground, flex: 2 }]}>{item.category}</Text>
      <Text style={[styles.budgetVal, { color: colors.mutedForeground }]}>${item.estimated.toLocaleString()}</Text>
      <Text style={[styles.budgetVal, { color: over ? '#EF4444' : '#22C55E', fontFamily: 'Inter_600SemiBold' }]}>${item.actual.toLocaleString()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topBar: { paddingBottom: 0 },
  topBarInner: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 12, gap: 12 },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  topBarTitle: { flex: 1 },
  topBarAddress: { fontSize: 16, fontFamily: 'Inter_700Bold', color: '#fff' },
  topBarCity: { fontSize: 12, fontFamily: 'Inter_400Regular', color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  deleteBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  tabs: { flexDirection: 'row', paddingHorizontal: 12, gap: 4, paddingBottom: 12 },
  tab: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  activeTab: { backgroundColor: 'rgba(255,255,255,0.18)' },
  tabText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  content: { padding: 16 },
  statusRow: { marginBottom: 12 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  statusPicker: { borderRadius: 14, borderWidth: 1, marginBottom: 12, overflow: 'hidden' },
  statusOption: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderBottomWidth: 1 },
  statusOptionText: { flex: 1, fontSize: 14, fontFamily: 'Inter_400Regular' },
  card: { borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 14 },
  cardTitle: { fontSize: 14, fontFamily: 'Inter_600SemiBold', marginBottom: 12 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  detailLabel: { fontSize: 13, fontFamily: 'Inter_400Regular', flex: 1 },
  detailValue: { fontSize: 13, fontFamily: 'Inter_500Medium', textAlign: 'right', flex: 1 },
  notes: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 22 },
  budgetSummary: { borderRadius: 14, padding: 16, flexDirection: 'row', marginBottom: 14 },
  budgetSumItem: { flex: 1, alignItems: 'center' },
  budgetSumLabel: { fontSize: 11, fontFamily: 'Inter_400Regular', color: 'rgba(255,255,255,0.6)', marginBottom: 4 },
  budgetSumValue: { fontSize: 15, fontFamily: 'Inter_700Bold', color: '#fff' },
  budgetSumDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginVertical: 4 },
  budgetHeaderRow: { flexDirection: 'row', paddingBottom: 8, marginBottom: 2, borderBottomWidth: 1 },
  budgetHeaderCell: { fontSize: 11, fontFamily: 'Inter_500Medium', flex: 1, textAlign: 'right' },
  budgetRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  budgetCat: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  budgetVal: { flex: 1, fontSize: 13, fontFamily: 'Inter_400Regular', textAlign: 'right' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9, marginBottom: 14 },
  actionBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: '#fff' },
  expRow: { borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 10, flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  expVendor: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  expSub: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  expNotes: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 4 },
  expApproved: { fontSize: 11, fontFamily: 'Inter_500Medium', marginTop: 4 },
  expAmt: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  timeline: { paddingLeft: 4 },
  tlItem: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  tlLeft: { alignItems: 'center', width: 16, paddingTop: 14 },
  tlDot: { width: 12, height: 12, borderRadius: 6 },
  tlLine: { flex: 1, width: 2, marginTop: 4 },
  tlContent: { flex: 1, borderRadius: 12, borderWidth: 1, padding: 12 },
  tlTitle: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  tlDate: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  tlNote: { fontSize: 13, fontFamily: 'Inter_400Regular', marginTop: 6, lineHeight: 18 },
  tlInput: { borderWidth: 1, borderRadius: 10, padding: 10, fontSize: 14, fontFamily: 'Inter_400Regular' },
  tlSaveBtn: { borderRadius: 10, paddingVertical: 10, alignItems: 'center', marginTop: 10 },
  tlSaveText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: '#fff' },
  sectionLabel: { fontSize: 12, fontFamily: 'Inter_500Medium', marginBottom: 8 },
  categoryRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  categoryChip: { flex: 1, borderRadius: 10, borderWidth: 1.5, paddingVertical: 8, alignItems: 'center' },
  categoryChipText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  photoActions: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  photoActionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 12, paddingVertical: 12 },
  photoActionText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: '#fff' },
  photoGroup: { marginBottom: 20 },
  photoGroupHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  photoCategoryDot: { width: 10, height: 10, borderRadius: 5 },
  photoGroupLabel: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  photoCell: { width: '48%', borderRadius: 12, overflow: 'hidden', position: 'relative' },
  photoThumb: { width: '100%', aspectRatio: 1, borderRadius: 12 },
  photoDateBadge: { position: 'absolute', bottom: 6, left: 6, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  photoDateText: { fontSize: 10, fontFamily: 'Inter_500Medium', color: '#fff' },
  holdHint: { textAlign: 'center', fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 8, marginBottom: 4 },
  fieldLabel: { fontSize: 12, fontFamily: 'Inter_500Medium', marginBottom: 5 },
  picker: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
  pickerText: { fontSize: 13, fontFamily: 'Inter_400Regular', flex: 1 },
  docTypeDrop: { borderRadius: 10, borderWidth: 1, marginTop: 4, marginBottom: 4, overflow: 'hidden' },
  dropOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1 },
  dropText: { fontSize: 13, fontFamily: 'Inter_400Regular', flex: 1 },
  docRow: { flexDirection: 'row', alignItems: 'flex-start', borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 10, gap: 12 },
  docIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  docInfo: { flex: 1 },
  docName: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  docMeta: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  docNotes: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 4 },
  docAddedBy: { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 4 },
});
