import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';

import { COLORS } from '@/constants/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ImageGalleryProps {
  images: string[];
  height?: number;
  /** Gọi khi bấm nút prev/next hoặc vuốt đổi ảnh */
  onIndexChange?: (index: number) => void;
}

/** Gallery ảnh dạng swiper với counter "1/8", mũi tên điều hướng và dots */
export function ImageGallery({ images, height = 280, onIndexChange }: ImageGalleryProps) {
  const [index, setIndex] = useState(0);
  const listRef = useRef<FlatList<string>>(null);

  const goTo = (i: number) => {
    const clamped = Math.max(0, Math.min(images.length - 1, i));
    listRef.current?.scrollToOffset({ offset: clamped * SCREEN_WIDTH, animated: true });
    setIndex(clamped);
    onIndexChange?.(clamped);
  };

  const handleMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setIndex(i);
    onIndexChange?.(i);
  };

  if (images.length === 0) return null;

  return (
    <View style={{ height }}>
      <FlatList
        ref={listRef}
        data={images}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(_, i) => String(i)}
        onMomentumScrollEnd={handleMomentumEnd}
        renderItem={({ item }) => (
          <Image source={{ uri: item }} style={{ width: SCREEN_WIDTH, height }} contentFit="cover" />
        )}
      />
      <View style={styles.counter}>
        <Text style={styles.counterText}>
          {index + 1}/{images.length}
        </Text>
      </View>
      {images.length > 1 && (
        <>
          <TouchableOpacity style={[styles.arrow, styles.arrowLeft]} onPress={() => goTo(index - 1)} hitSlop={8}>
            <Ionicons name="chevron-back" size={18} color={COLORS.white} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.arrow, styles.arrowRight]} onPress={() => goTo(index + 1)} hitSlop={8}>
            <Ionicons name="chevron-forward" size={18} color={COLORS.white} />
          </TouchableOpacity>
        </>
      )}
      {images.length > 1 && (
        <View style={styles.dots}>
          {images.map((_, i) => (
            <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  counter: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  counterText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '700',
  },
  arrow: {
    position: 'absolute',
    top: '42%',
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowLeft: { left: 12 },
  arrowRight: { right: 12 },
  dots: {
    position: 'absolute',
    bottom: 12,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  dotActive: {
    backgroundColor: COLORS.warmGold,
    width: 16,
  },
});
