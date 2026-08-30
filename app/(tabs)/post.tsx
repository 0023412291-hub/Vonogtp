import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ActionButton } from '@/components/action-button';
import { AmenityCheckbox } from '@/components/amenity-checkbox';
import { FormField } from '@/components/form-field';
import { PickerModal } from '@/components/picker-modal';
import { SectionHeader } from '@/components/section-header';
import { Stepper } from '@/components/stepper';
import { StepProgress } from '@/components/step-progress';
import { BORDER_RADIUS, COLORS } from '@/constants/colors';
import { useApp } from '@/context/app-context';
import { DISTRICTS } from '@/data/constants';
import { AMENITIES, DIRECTIONS, FURNISHED_OPTIONS, LEGALS, PROPERTY_TYPES, type Condition, type DealType, type Direction, type Furnished, type Legal, type Listing, type PropertyType } from '@/types';
import { cloudinaryConfigured, uploadImagesToCloudinary } from '@/utils/cloudinary';
import { dealLabel, formatDealPrice, formatPriceShort } from '@/utils/formatters';
import { isValidPhone } from '@/utils/validation';

const STEP_LABELS = ['Thông tin cơ bản', 'Ảnh', 'Mô tả & tiện nghi', 'Liên hệ', 'Xác nhận'];

interface FormState {
  title: string;
  type: PropertyType | null;
  deal: DealType;
  districtId: string;
  ward: string;
  price: string;
  area: string;
  bedrooms: number;
  bathrooms: number;
  floors: number;
  direction: Direction | '';
  legal: Legal | '';
  frontage: string;
  furnished: Furnished | '';
  images: string[];
  description: string;
  amenities: string[];
  customAmenities: string[];
  customInput: string;
  condition: Condition;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  showPhone: boolean;
  termsAccepted: boolean;
}

const INITIAL_FORM: FormState = {
  title: '',
  type: null,
  deal: 'rent',
  districtId: '',
  ward: '',
  price: '',
  area: '',
  bedrooms: 1,
  bathrooms: 1,
  floors: 1,
  direction: '',
  legal: '',
  frontage: '',
  furnished: '',
  images: [],
  description: '',
  amenities: [],
  customAmenities: [],
  customInput: '',
  condition: 'new',
  contactName: '',
  contactPhone: '',
  contactEmail: '',
  showPhone: true,
  termsAccepted: false,
};

export default function PostScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { editId } = useLocalSearchParams<{ editId?: string }>();
  const { addListing, getListing, updateListing } = useApp();
  const isEdit = Boolean(editId);

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [districtPicker, setDistrictPicker] = useState(false);
  const [wardPicker, setWardPicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  /** Trạng thái upload ảnh lên Cloudinary ("2/5") — hiện trên nút Đăng tin */
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  // Chế độ chỉnh sửa: nạp toàn bộ dữ liệu tin vào form (giống hệt khi đăng)
  useEffect(() => {
    if (!editId) return;
    const l = getListing(editId);
    if (!l) return;
    setForm({
      title: l.title,
      type: l.type,
      deal: l.deal ?? 'rent',
      districtId: l.districtId,
      ward: l.ward,
      price: String(l.price),
      area: String(l.area),
      bedrooms: l.bedrooms,
      bathrooms: l.bathrooms,
      floors: l.floor ?? 1,
      direction: l.direction ?? '',
      legal: l.legal ?? '',
      frontage: l.frontage != null ? String(l.frontage) : '',
      furnished: l.furnished ?? '',
      images: l.images,
      description: l.description,
      amenities: AMENITIES.filter((a) => l.amenities.includes(a)),
      customAmenities: l.amenities.filter((a) => !AMENITIES.includes(a)),
      customInput: '',
      condition: l.condition ?? 'new',
      contactName: l.contact.name,
      contactPhone: l.contact.phone,
      contactEmail: l.contact.email ?? '',
      showPhone: l.showPhone,
      termsAccepted: true,
    });
    setStep(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId]);

  const district = DISTRICTS.find((d) => d.id === form.districtId);
  const selectedType = PROPERTY_TYPES.find((t) => t.value === form.type);

  // ---------- Validation ----------
  const validateStep = (s: number): boolean => {
    const e: Record<string, string> = {};
    if (s === 0) {
      if (form.title.trim().length < 10) e.title = 'Tiêu đề phải có ít nhất 10 ký tự';
      if (!form.type) e.type = 'Vui lòng chọn loại hình';
      if (!form.districtId) e.districtId = 'Vui lòng chọn quận/huyện';
      if (!form.ward) e.ward = 'Vui lòng chọn phường/xã';
      if (!form.price || Number(form.price) <= 0) e.price = 'Vui lòng nhập giá hợp lệ';
      if (!form.area || Number(form.area) <= 0) e.area = 'Vui lòng nhập diện tích hợp lệ';
    }
    if (s === 1 && form.images.length < 3) {
      e.images = 'Vui lòng chọn tối thiểu 3 ảnh';
    }
    if (s === 2 && form.description.trim().length < 20) {
      e.description = 'Mô tả phải có ít nhất 20 ký tự';
    }
    if (s === 3) {
      if (!form.contactName.trim()) e.contactName = 'Vui lòng nhập tên chủ nhà';
      if (!isValidPhone(form.contactPhone)) e.contactPhone = 'Số điện thoại không hợp lệ';
    }
    if (s === 4 && !form.termsAccepted) e.terms = 'Bạn cần đồng ý với điều khoản';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => {
    if (validateStep(step)) setStep((s) => Math.min(s + 1, 4));
  };

  const back = () => {
    setErrors({});
    setStep((s) => Math.max(s - 1, 0));
  };

  // ---------- Images ----------
  const pickFromLibrary = async () => {
    const remaining = 12 - form.images.length;
    if (remaining <= 0) {
      Alert.alert('Giới hạn', 'Tối đa 12 ảnh mỗi tin đăng.');
      return;
    }
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        selectionLimit: remaining,
        quality: 0.7,
      });
      if (!result.canceled) {
        set('images', [...form.images, ...result.assets.map((a) => a.uri)].slice(0, 12));
      }
    } catch (err) {
      console.warn('Chọn ảnh từ thư viện lỗi:', err);
      Alert.alert(
        'Không mở được thư viện ảnh',
        String((err as Error)?.message ?? err) +
          '\n\nNếu bạn chạy bản dev (expo run:android), có thể cần build lại app để cập nhật module ảnh.',
      );
    }
  };

  const launchCamera = async () => {
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.7 });
    if (!result.canceled) {
      set('images', [...form.images, result.assets[0].uri].slice(0, 12));
    }
  };

  const takePhoto = async () => {
    let perm;
    try {
      perm = await ImagePicker.requestCameraPermissionsAsync();
    } catch (err) {
      console.warn('Xin quyền camera lỗi:', err);
      Alert.alert(
        'Không mở được camera',
        String((err as Error)?.message ?? err) +
          '\n\nNếu bạn chạy bản dev (expo run:android), có thể cần build lại app để cập nhật module camera.',
      );
      return;
    }
    if (!perm.granted) {
      Alert.alert(
        'Cần quyền camera',
        perm.canAskAgain
          ? 'Vui lòng cấp quyền camera để chụp ảnh đăng tin.'
          : 'Quyền camera đã bị tắt vĩnh viễn. Vào Cài đặt để bật lại.',
        perm.canAskAgain
          ? [{ text: 'Thử lại', onPress: () => launchCamera() }]
          : [
              { text: 'Huỷ', style: 'cancel' },
              { text: 'Mở cài đặt', onPress: () => Linking.openSettings() },
            ],
      );
      return;
    }
    try {
      await launchCamera();
    } catch (err) {
      console.warn('Mở camera lỗi:', err);
      Alert.alert(
        'Không mở được camera',
        String((err as Error)?.message ?? err) +
          '\n\nNếu bạn chạy bản dev (expo run:android), có thể cần build lại app để cập nhật module camera.',
      );
    }
  };

  const removeImage = (idx: number) => set('images', form.images.filter((_, i) => i !== idx));
  const moveImage = (idx: number, dir: -1 | 1) => {
    const next = [...form.images];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    set('images', next);
  };

  // ---------- Submit ----------
  const submit = async () => {
    if (!validateStep(4)) return;
    setSubmitting(true);
    try {
      // Ảnh local (chụp/chọn từ máy) phải upload lên Cloudinary để mọi người xem được
      let images = form.images;
      if (cloudinaryConfigured() && images.some((u) => !u.startsWith('http'))) {
        setUploadProgress(`0/${images.length}`);
        try {
          images = await uploadImagesToCloudinary(images, (done, total) =>
            setUploadProgress(`${done}/${total}`),
          );
        } finally {
          setUploadProgress(null);
        }
      }
      const price = Number(form.price);
      const area = Number(form.area);
      const frontage = Number(form.frontage);
      const listingData: Omit<Listing, 'id' | 'createdAt' | 'isFavorite' | 'status'> = {
        title: form.title.trim(),
        price,
        area,
        deal: form.deal,
        direction: form.direction || undefined,
        legal: form.deal === 'sale' ? (form.legal || undefined) : undefined,
        frontage: frontage > 0 ? frontage : undefined,
        floor: form.type === 'nha_nguyen_can' ? form.floors : undefined,
        furnished: form.deal === 'sale' ? (form.furnished || undefined) : undefined,
        districtId: form.districtId,
        district: district?.name ?? '',
        ward: form.ward,
        address: `${form.ward}, ${district?.name ?? ''}`,
        type: form.type ?? 'phong_tro',
        bedrooms: form.bedrooms,
        bathrooms: form.bathrooms,
        description: form.description.trim(),
        amenities: [...form.amenities, ...form.customAmenities],
        images,
        contact: {
          name: form.contactName.trim(),
          phone: form.contactPhone.trim(),
          // Firestore không nhận giá trị undefined → dùng chuỗi rỗng khi không nhập
          email: form.contactEmail.trim() || '',
        },
        showPhone: form.showPhone,
        latitude: 10.7769 + (Math.random() - 0.5) * 0.06,
        longitude: 106.7009 + (Math.random() - 0.5) * 0.06,
        condition: form.condition,
      };
      if (editId) {
        await updateListing(editId, listingData);
        setSuccessId(editId);
      } else {
        const created = await addListing(listingData);
        setSuccessId(created.id);
      }
      setStep(0);
    } catch (err) {
      console.warn('Lưu tin thất bại:', err);
      Alert.alert(
        'Không lưu được tin',
        'Đã có lỗi khi lưu tin lên máy chủ. Vui lòng kiểm tra kết nối mạng và thử lại.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ---------- Success ----------
  if (successId) {
    return (
      <View style={[styles.container, styles.successWrap, { paddingTop: insets.top }]}>
        <View style={styles.successIcon}>
          <Ionicons name="checkmark" size={44} color={COLORS.white} />
        </View>
        <Text style={styles.successTitle}>{isEdit ? 'Cập nhật tin thành công!' : 'Đăng tin thành công!'}</Text>
        <Text style={styles.successMsg}>
          {isEdit
            ? 'Thay đổi của bạn đã được lưu và áp dụng ngay trên tin đăng.'
            : 'Tin của bạn đã được đăng và sẽ xuất hiện trong danh sách trong vòng vài phút.'}
        </Text>
        <Text style={styles.successId}>ID tin: #{successId.toUpperCase()}</Text>
        <View style={styles.successActions}>
          <ActionButton
            label="Xem tin của bạn"
            onPress={() => {
              const id = successId;
              setSuccessId(null);
              setForm(INITIAL_FORM);
              router.push(`/listing/${id}`);
            }}
          />
          <ActionButton
            label="Quay về trang chủ"
            variant="soft"
            onPress={() => {
              setSuccessId(null);
              setForm(INITIAL_FORM);
              router.replace('/(tabs)');
            }}
          />
          <ActionButton
            label="Đăng tin khác"
            variant="ghost"
            onPress={() => {
              setSuccessId(null);
              setForm(INITIAL_FORM);
            }}
          />
        </View>
      </View>
    );
  }

  // ---------- Render ----------
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
        <Text style={styles.headerTitle}>{isEdit ? 'Chỉnh Sửa Tin' : 'Đăng Tin'}</Text>
        <StepProgress step={step} total={5} labels={STEP_LABELS} />
      </View>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.form}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {step === 0 && (
          <>
            <SectionHeader title="Thông tin cơ bản" />
            <FormField
              label="Tiêu đề tin"
              required
              value={form.title}
              onChangeText={(t) => set('title', t)}
              placeholder="VD: Phòng rộng mặt tiền, đầy đủ nội thất..."
              maxLength={100}
              error={errors.title}
              counter={{ current: form.title.length, max: 100 }}
            />

            <Text style={styles.fieldLabel}>
              Hình thức <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.conditionRow}>
              {(
                [
                  { value: 'rent' as DealType, label: 'Cho thuê' },
                  { value: 'sale' as DealType, label: 'Bán' },
                ] as { value: DealType; label: string }[]
              ).map((o) => {
                const active = form.deal === o.value;
                return (
                  <TouchableOpacity
                    key={o.value}
                    style={[styles.conditionChip, active && styles.conditionChipActive]}
                    onPress={() => set('deal', o.value)}
                  >
                    <Ionicons
                      name={active ? 'radio-button-on' : 'radio-button-off'}
                      size={16}
                      color={active ? COLORS.warmGold : COLORS.grayMedium}
                    />
                    <Text style={[styles.conditionText, active && styles.conditionTextActive]}>
                      {o.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.fieldLabel}>
              Loại hình <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.typeGrid}>
              {PROPERTY_TYPES.map((t) => {
                const active = form.type === t.value;
                return (
                  <TouchableOpacity
                    key={t.value}
                    style={[styles.typeCard, active && styles.typeCardActive]}
                    onPress={() => set('type', t.value)}
                  >
                    <Ionicons
                      name={active ? 'radio-button-on' : 'radio-button-off'}
                      size={17}
                      color={active ? COLORS.warmGold : COLORS.grayMedium}
                    />
                    <Text style={[styles.typeText, active && styles.typeTextActive]}>
                      {t.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {errors.type && <Text style={styles.errorText}>{errors.type}</Text>}

            <Text style={styles.fieldLabel}>
              Khu vực <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.row}>
              <TouchableOpacity
                style={styles.selectBtn}
                onPress={() => setDistrictPicker(true)}
              >
                <Text style={[styles.selectText, !form.districtId && styles.selectPlaceholder]}>
                  {district?.name ?? 'Chọn quận/huyện'}
                </Text>
                <Ionicons name="chevron-down" size={16} color={COLORS.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.selectBtn, !form.districtId && styles.selectDisabled]}
                disabled={!form.districtId}
                onPress={() => setWardPicker(true)}
              >
                <Text style={[styles.selectText, !form.ward && styles.selectPlaceholder]}>
                  {form.ward || 'Chọn phường/xã'}
                </Text>
                <Ionicons name="chevron-down" size={16} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
            {(errors.districtId || errors.ward) && (
              <Text style={styles.errorText}>{errors.districtId || errors.ward}</Text>
            )}

            <FormField
              label={form.deal === 'sale' ? 'Giá bán (đồng)' : 'Giá cho thuê (đồng/tháng)'}
              required
              value={form.price}
              onChangeText={(t) => set('price', t.replace(/[^0-9]/g, ''))}
              placeholder={form.deal === 'sale' ? '3500000000' : '3500000'}
              keyboardType="number-pad"
              error={errors.price}
              hint={
                form.price
                  ? form.deal === 'sale'
                    ? `≈ ${formatPriceShort(Number(form.price))}`
                    : `≈ ${formatPriceShort(Number(form.price))}/tháng`
                  : undefined
              }
            />

            <FormField
              label="Diện tích (m²)"
              required
              value={form.area}
              onChangeText={(t) => set('area', t.replace(/[^0-9.]/g, ''))}
              placeholder="25"
              keyboardType="decimal-pad"
              error={errors.area}
            />

            <View style={styles.stepperRow}>
              <View style={styles.stepperInfo}>
                <Text style={styles.stepperLabel}>Số phòng ngủ</Text>
                <Text style={styles.stepperHint}>Không bắt buộc</Text>
              </View>
              <Stepper value={form.bedrooms} onChange={(v) => set('bedrooms', v)} min={0} max={10} />
            </View>
            <View style={styles.stepperRow}>
              <View style={styles.stepperInfo}>
                <Text style={styles.stepperLabel}>Số toilet</Text>
                <Text style={styles.stepperHint}>Không bắt buộc</Text>
              </View>
              <Stepper value={form.bathrooms} onChange={(v) => set('bathrooms', v)} min={0} max={10} />
            </View>

            {form.type && form.type !== 'phong_tro' && (
              <>
                <Text style={styles.fieldLabel}>Hướng</Text>
                <View style={styles.chipWrap}>
                  {DIRECTIONS.map((d) => {
                    const active = form.direction === d;
                    return (
                      <TouchableOpacity
                        key={d}
                        style={[styles.conditionChip, active && styles.conditionChipActive]}
                        onPress={() => set('direction', active ? '' : d)}
                      >
                        <Ionicons
                          name={active ? 'checkmark-circle' : 'ellipse-outline'}
                          size={15}
                          color={active ? COLORS.warmGold : COLORS.grayMedium}
                        />
                        <Text style={[styles.conditionText, active && styles.conditionTextActive]}>
                          {d}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}

            {form.type === 'nha_nguyen_can' && (
              <View style={styles.stepperRow}>
                <View style={styles.stepperInfo}>
                  <Text style={styles.stepperLabel}>Số tầng</Text>
                  <Text style={styles.stepperHint}>Số tầng của căn nhà</Text>
                </View>
                <Stepper value={form.floors} onChange={(v) => set('floors', v)} min={1} max={20} />
              </View>
            )}

            {(form.type === 'nha_nguyen_can' || form.type === 'dat_nen') && (
              <FormField
                label="Mặt tiền (m) — không bắt buộc"
                value={form.frontage}
                onChangeText={(t) => set('frontage', t.replace(/[^0-9.]/g, ''))}
                placeholder="4.5"
                keyboardType="decimal-pad"
              />
            )}

            {form.deal === 'sale' && form.type && (
              <>
                <Text style={styles.fieldLabel}>Pháp lý</Text>
                <View style={styles.chipWrap}>
                  {LEGALS.map((lg) => {
                    const active = form.legal === lg;
                    return (
                      <TouchableOpacity
                        key={lg}
                        style={[styles.conditionChip, active && styles.conditionChipActive]}
                        onPress={() => set('legal', active ? '' : lg)}
                      >
                        <Ionicons
                          name={active ? 'radio-button-on' : 'radio-button-off'}
                          size={15}
                          color={active ? COLORS.warmGold : COLORS.grayMedium}
                        />
                        <Text style={[styles.conditionText, active && styles.conditionTextActive]}>
                          {lg}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}

            {form.deal === 'sale' && (form.type === 'nha_nguyen_can' || form.type === 'can_ho') && (
              <>
                <Text style={styles.fieldLabel}>Nội thất</Text>
                <View style={styles.chipWrap}>
                  {FURNISHED_OPTIONS.map((o) => {
                    const active = form.furnished === o.value;
                    return (
                      <TouchableOpacity
                        key={o.value}
                        style={[styles.conditionChip, active && styles.conditionChipActive]}
                        onPress={() => set('furnished', active ? '' : o.value)}
                      >
                        <Ionicons
                          name={active ? 'radio-button-on' : 'radio-button-off'}
                          size={15}
                          color={active ? COLORS.warmGold : COLORS.grayMedium}
                        />
                        <Text style={[styles.conditionText, active && styles.conditionTextActive]}>
                          {o.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}
          </>
        )}

        {step === 1 && (
          <>
            <SectionHeader title="Chọn ảnh (tối thiểu 3 ảnh)" />
            <View style={styles.uploadRow}>
              <TouchableOpacity style={styles.uploadBtn} onPress={takePhoto}>
                <Ionicons name="camera-outline" size={26} color={COLORS.warmGold} />
                <Text style={styles.uploadText}>Chụp ảnh</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.uploadBtn} onPress={pickFromLibrary}>
                <Ionicons name="images-outline" size={26} color={COLORS.warmGold} />
                <Text style={styles.uploadText}>Chọn thư viện</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.imageCounter}>
              Ảnh đã chọn: <Text style={styles.imageCounterStrong}>{form.images.length}/12</Text>
            </Text>

            <View style={styles.imageGrid}>
              {form.images.map((uri, i) => (
                <View key={`${uri}-${i}`} style={styles.imageCell}>
                  <Image source={{ uri }} style={styles.imageThumb} contentFit="cover" />
                  {i === 0 && <Text style={styles.coverBadge}>Ảnh bìa</Text>}
                  <View style={styles.imageActions}>
                    <TouchableOpacity
                      style={[styles.imageActionBtn, i === 0 && styles.imageActionDisabled]}
                      disabled={i === 0}
                      onPress={() => moveImage(i, -1)}
                    >
                      <Ionicons name="chevron-back" size={15} color={COLORS.white} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.imageActionBtn, i === form.images.length - 1 && styles.imageActionDisabled]}
                      disabled={i === form.images.length - 1}
                      onPress={() => moveImage(i, 1)}
                    >
                      <Ionicons name="chevron-forward" size={15} color={COLORS.white} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.imageActionBtn, styles.deleteBtn]}
                      onPress={() => removeImage(i)}
                    >
                      <Ionicons name="trash-outline" size={15} color={COLORS.white} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
              {form.images.length < 12 && (
                <TouchableOpacity style={styles.addCell} onPress={pickFromLibrary}>
                  <Ionicons name="add" size={30} color={COLORS.grayMedium} />
                  <Text style={styles.addText}>Thêm ảnh</Text>
                </TouchableOpacity>
              )}
            </View>
            {errors.images && <Text style={styles.errorText}>{errors.images}</Text>}

            <View style={styles.tipBox}>
              <Ionicons name="bulb-outline" size={16} color={COLORS.info} />
              <Text style={styles.tipText}>
                Mẹo: Ảnh rõ ràng, sáng và đủ góc sẽ có lượt xem nhiều hơn. Ảnh đầu tiên là ảnh bìa của tin.
              </Text>
            </View>
          </>
        )}

        {step === 2 && (
          <>
            <SectionHeader title="Mô tả & tiện nghi" />
            <FormField
              label="Mô tả chi tiết"
              required
              value={form.description}
              onChangeText={(t) => set('description', t)}
              placeholder="Mô tả về phòng, vị trí, tiện ích xung quanh..."
              multiline
              numberOfLines={6}
              maxLength={500}
              error={errors.description}
              counter={{ current: form.description.length, max: 500 }}
            />

            <Text style={styles.fieldLabel}>Tiện nghi (chọn những tiện nghi có sẵn)</Text>
            <View style={styles.amenityGrid}>
              {AMENITIES.map((a) => (
                <AmenityCheckbox
                  key={a}
                  label={a}
                  selected={form.amenities.includes(a)}
                  onToggle={() =>
                    set(
                      'amenities',
                      form.amenities.includes(a)
                        ? form.amenities.filter((x) => x !== a)
                        : [...form.amenities, a],
                    )
                  }
                />
              ))}
              {form.customAmenities.map((c) => (
                <AmenityCheckbox
                  key={c}
                  label={c}
                  selected
                  onToggle={() => set('customAmenities', form.customAmenities.filter((x) => x !== c))}
                />
              ))}
            </View>
            <View style={styles.customRow}>
              <FormField
                value={form.customInput}
                onChangeText={(t) => set('customInput', t)}
                placeholder="Thêm tiện nghi khác..."
              />
              <TouchableOpacity
                style={styles.customAdd}
                onPress={() => {
                  const v = form.customInput.trim();
                  if (v && !form.customAmenities.includes(v)) {
                    set('customAmenities', [...form.customAmenities, v]);
                  }
                  set('customInput', '');
                }}
              >
                <Ionicons name="add" size={20} color={COLORS.white} />
              </TouchableOpacity>
            </View>

            <Text style={styles.fieldLabel}>Tình trạng bất động sản</Text>
            <View style={styles.conditionRow}>
              {(
                [
                  { value: 'new', label: 'Mới' },
                  { value: 'needs_repair', label: 'Cần sửa chữa' },
                ] as { value: Condition; label: string }[]
              ).map((c) => {
                const active = form.condition === c.value;
                return (
                  <TouchableOpacity
                    key={c.value}
                    style={[styles.conditionChip, active && styles.conditionChipActive]}
                    onPress={() => set('condition', c.value)}
                  >
                    <Ionicons
                      name={active ? 'radio-button-on' : 'radio-button-off'}
                      size={16}
                      color={active ? COLORS.warmGold : COLORS.grayMedium}
                    />
                    <Text style={[styles.conditionText, active && styles.conditionTextActive]}>
                      {c.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}

        {step === 3 && (
          <>
            <SectionHeader title="Thông tin liên hệ" />
            <FormField
              label="Tên chủ nhà"
              required
              value={form.contactName}
              onChangeText={(t) => set('contactName', t)}
              placeholder="Nguyễn Văn A"
              error={errors.contactName}
            />
            <FormField
              label="Số điện thoại"
              required
              value={form.contactPhone}
              onChangeText={(t) => set('contactPhone', t)}
              placeholder="0912345678"
              keyboardType="phone-pad"
              prefix="+84"
              error={errors.contactPhone}
            />
            <FormField
              label="Email (không bắt buộc)"
              value={form.contactEmail}
              onChangeText={(t) => set('contactEmail', t)}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.fieldLabel}>Chia sẻ thông tin liên hệ</Text>
            <View style={styles.privacyOptions}>
              {(
                [
                  { value: true, label: 'Hiển thị SĐT trên tin đăng', desc: 'Người xem có thể gọi trực tiếp' },
                  { value: false, label: 'Chỉ liên hệ qua tin nhắn', desc: 'Bảo mật số điện thoại của bạn' },
                ] as { value: boolean; label: string; desc: string }[]
              ).map((o) => {
                const active = form.showPhone === o.value;
                return (
                  <TouchableOpacity
                    key={String(o.value)}
                    style={[styles.privacyOption, active && styles.privacyOptionActive]}
                    onPress={() => set('showPhone', o.value)}
                  >
                    <Ionicons
                      name={active ? 'radio-button-on' : 'radio-button-off'}
                      size={18}
                      color={active ? COLORS.warmGold : COLORS.grayMedium}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.privacyLabel, active && styles.privacyLabelActive]}>
                        {o.label}
                      </Text>
                      <Text style={styles.privacyDesc}>{o.desc}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.tipBox}>
              <Ionicons name="information-circle-outline" size={16} color={COLORS.info} />
              <Text style={styles.tipText}>
                Mẹo: Hiển thị SĐT sẽ nhận được nhiều cuộc gọi hơn từ người có nhu cầu thật.
              </Text>
            </View>
          </>
        )}

        {step === 4 && (
          <>
            <SectionHeader title="Xác nhận thông tin" />
            <View style={styles.previewCard}>
              <Image
                source={{ uri: form.images[0] }}
                style={styles.previewImg}
                contentFit="cover"
              />
              <View style={styles.previewInfo}>
                <Text style={styles.previewTitle} numberOfLines={2}>
                  {form.title}
                </Text>
                <Text style={styles.previewPrice}>
                  {formatDealPrice(Number(form.price), form.deal)}
                </Text>
                <Text style={styles.previewMeta} numberOfLines={1}>
                  {form.area}m² • {form.ward || district?.name}
                </Text>
              </View>
            </View>

            <View style={styles.summarySection}>
              <Text style={styles.summaryLabel}>Mô tả</Text>
              <Text style={styles.summaryText} numberOfLines={3}>
                {form.description}
              </Text>
            </View>

            <View style={styles.summarySection}>
              <Text style={styles.summaryLabel}>Tiện nghi</Text>
              <View style={styles.summaryChips}>
                {[...form.amenities, ...form.customAmenities].map((a) => (
                  <View key={a} style={styles.summaryChip}>
                    <Text style={styles.summaryChipText}>{a}</Text>
                  </View>
                ))}
                {form.amenities.length + form.customAmenities.length === 0 && (
                  <Text style={styles.summaryText}>Không có</Text>
                )}
              </View>
            </View>

            <View style={styles.summarySection}>
              <Text style={styles.summaryLabel}>Liên hệ</Text>
              <Text style={styles.summaryText}>
                {form.contactName} • {form.showPhone ? form.contactPhone : 'Ẩn số (chat)'}
              </Text>
            </View>

            <View style={styles.summarySection}>
              <Text style={styles.summaryLabel}>Loại hình</Text>
              <Text style={styles.summaryText}>
                {dealLabel(form.deal)} • {selectedType?.label} • {form.bedrooms} phòng ngủ •{' '}
                {form.bathrooms} toilet
              </Text>
              <View style={styles.summaryChips}>
                {form.direction && (
                  <View style={styles.summaryChip}>
                    <Text style={styles.summaryChipText}>Hướng {form.direction}</Text>
                  </View>
                )}
                {form.type === 'nha_nguyen_can' && (
                  <View style={styles.summaryChip}>
                    <Text style={styles.summaryChipText}>{form.floors} tầng</Text>
                  </View>
                )}
                {(form.type === 'nha_nguyen_can' || form.type === 'dat_nen') &&
                  form.frontage && (
                    <View style={styles.summaryChip}>
                      <Text style={styles.summaryChipText}>MT {form.frontage}m</Text>
                    </View>
                  )}
                {form.legal && (
                  <View style={styles.summaryChip}>
                    <Text style={styles.summaryChipText}>{form.legal}</Text>
                  </View>
                )}
                {form.furnished && (
                  <View style={styles.summaryChip}>
                    <Text style={styles.summaryChipText}>
                      {FURNISHED_OPTIONS.find((o) => o.value === form.furnished)?.label}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            <TouchableOpacity style={styles.termsRow} onPress={() => set('termsAccepted', !form.termsAccepted)}>
              <Ionicons
                name={form.termsAccepted ? 'checkbox' : 'square-outline'}
                size={20}
                color={form.termsAccepted ? COLORS.warmGold : COLORS.grayMedium}
              />
              <Text style={styles.termsText}>
                Tôi đồng ý với <Text style={styles.termsLink}>Điều khoản sử dụng</Text> và{' '}
                <Text style={styles.termsLink}>Chính sách đăng tin</Text> của VoNo.
              </Text>
            </TouchableOpacity>
            {errors.terms && <Text style={styles.errorText}>{errors.terms}</Text>}
          </>
        )}
      </ScrollView>

      {/* Bottom nav */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 10 }]}>
        {step > 0 && (
          <ActionButton label="Quay lại" variant="soft" onPress={back} style={styles.bottomBack} />
        )}
        {step < 4 ? (
          <ActionButton
            label="Tiếp tục"
            icon="arrow-forward"
            onPress={next}
            style={styles.bottomNext}
          />
        ) : (
          <ActionButton
            label={
              uploadProgress ? `ĐANG TẢI ẢNH ${uploadProgress}...` : isEdit ? 'LƯU THAY ĐỔI' : 'ĐĂNG TIN'
            }
            icon={isEdit ? 'checkmark-circle-outline' : 'hammer-outline'}
            loading={submitting}
            onPress={submit}
            style={styles.bottomNext}
          />
        )}
      </View>

      {/* District picker */}
      <PickerModal
        visible={districtPicker}
        title="Chọn quận/huyện"
        options={DISTRICTS.map((d) => ({ label: d.name, value: d.id }))}
        selected={form.districtId}
        onSelect={(v) => {
          set('districtId', v);
          set('ward', '');
          setDistrictPicker(false);
        }}
        onClose={() => setDistrictPicker(false)}
      />

      {/* Ward picker */}
      <PickerModal
        visible={wardPicker}
        title="Chọn phường/xã"
        options={(district?.wards ?? []).map((w) => ({ label: w, value: w }))}
        selected={form.ward}
        onSelect={(v) => {
          set('ward', v);
          setWardPicker(false);
        }}
        onClose={() => setWardPicker(false)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  flex: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.darkBrown,
    marginTop: 6,
  },
  form: {
    padding: 16,
    paddingBottom: 32,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.darkBrown,
    marginBottom: 8,
    marginTop: 4,
  },
  required: {
    color: COLORS.errorRed,
  },
  errorText: {
    fontSize: 11,
    color: COLORS.errorRed,
    marginTop: 5,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  typeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    width: '48.5%',
  },
  typeCardActive: {
    borderColor: COLORS.warmGold,
    backgroundColor: 'rgba(14, 143, 142, 0.08)',
  },
  typeText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.text,
  },
  typeTextActive: {
    color: COLORS.darkBrown,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  selectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
  },
  selectDisabled: {
    opacity: 0.5,
  },
  selectText: {
    fontSize: 13,
    color: COLORS.text,
  },
  selectPlaceholder: {
    color: COLORS.placeholder,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  stepperInfo: {
    gap: 2,
  },
  stepperLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.darkBrown,
  },
  stepperHint: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  uploadRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  uploadBtn: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    paddingVertical: 18,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: COLORS.warmGold,
    backgroundColor: 'rgba(14, 143, 142, 0.06)',
  },
  uploadText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.darkBrown,
  },
  imageCounter: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 10,
  },
  imageCounterStrong: {
    fontWeight: '700',
    color: COLORS.darkBrown,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 14,
  },
  imageCell: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
    position: 'relative',
  },
  imageThumb: {
    width: '100%',
    height: '100%',
  },
  coverBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: COLORS.warmGold,
    color: COLORS.white,
    fontSize: 9,
    fontWeight: '800',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  imageActions: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    flexDirection: 'row',
    gap: 4,
  },
  imageActionBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageActionDisabled: {
    opacity: 0.3,
  },
  deleteBtn: {
    backgroundColor: COLORS.errorRed,
  },
  addCell: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  addText: {
    fontSize: 11,
    color: COLORS.grayMedium,
  },
  tipBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(13, 115, 119, 0.08)',
    borderRadius: BORDER_RADIUS.md,
    padding: 12,
    marginTop: 4,
  },
  tipText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.text,
    lineHeight: 17,
  },
  amenityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  customRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    marginBottom: 16,
  },
  customAdd: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.warmGold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  conditionRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  conditionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  conditionChipActive: {
    borderColor: COLORS.warmGold,
    backgroundColor: 'rgba(14, 143, 142, 0.08)',
  },
  conditionText: {
    fontSize: 13,
    color: COLORS.text,
  },
  conditionTextActive: {
    fontWeight: '700',
    color: COLORS.darkBrown,
  },
  privacyOptions: {
    gap: 8,
    marginBottom: 14,
  },
  privacyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    padding: 12,
  },
  privacyOptionActive: {
    borderColor: COLORS.warmGold,
  },
  privacyLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  privacyLabelActive: {
    fontWeight: '700',
    color: COLORS.darkBrown,
  },
  privacyDesc: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  previewCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  previewImg: {
    width: 108,
    height: 108,
  },
  previewInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
    gap: 4,
  },
  previewTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.darkBrown,
    lineHeight: 18,
  },
  previewPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.priceAccent,
  },
  previewMeta: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  summarySection: {
    marginBottom: 14,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.bronze,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  summaryText: {
    fontSize: 13,
    color: COLORS.text,
    lineHeight: 19,
  },
  summaryChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  summaryChip: {
    backgroundColor: 'rgba(42, 157, 143, 0.1)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
  },
  summaryChipText: {
    fontSize: 11,
    color: COLORS.successGreen,
    fontWeight: '600',
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  termsText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.text,
    lineHeight: 17,
  },
  termsLink: {
    color: COLORS.warmGold,
    fontWeight: '700',
  },
  bottomBar: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  bottomBack: {
    flex: 0.45,
  },
  bottomNext: {
    flex: 1,
  },

  // Success
  successWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  successIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: COLORS.successGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.darkBrown,
    marginBottom: 8,
  },
  successMsg: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 8,
  },
  successId: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.warmGold,
    marginBottom: 24,
  },
  successActions: {
    alignSelf: 'stretch',
    gap: 10,
  },
});
