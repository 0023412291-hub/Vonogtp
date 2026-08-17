import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { BORDER_RADIUS, COLORS, SHADOWS } from '@/constants/colors';
import type { Video } from '@/types';
import { formatDuration, formatViews } from '@/utils/formatters';

interface VideoCardProps {
  video: Video;
  onPress: () => void;
}

/** Card short clip dựng đứng 9:16 — dùng trong list lướt ngang "Xem nhà trực quan" */
export function VideoCard({ video, onPress }: VideoCardProps) {
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={styles.card}>
      <View style={styles.thumbWrap}>
        <Image source={{ uri: video.thumbnail }} style={styles.thumb} contentFit="cover" transition={150} />
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.6)']} style={styles.gradient} />
        {/* Nút play */}
        <View style={styles.playBtn}>
          <Ionicons name="play" size={18} color={COLORS.white} />
        </View>
        {/* Độ dài */}
        <View style={styles.durationBadge}>
          <Text style={styles.durationText}>{formatDuration(video.durationSec)}</Text>
        </View>
        {/* Lượt xem */}
        <View style={styles.viewsBadge}>
          <Ionicons name="eye-outline" size={10} color={COLORS.white} />
          <Text style={styles.viewsText}>{formatViews(video.views)}</Text>
        </View>
      </View>
      <Text style={styles.title} numberOfLines={2}>
        {video.title}
      </Text>
      <Text style={styles.sub} numberOfLines={1}>
        {formatViews(video.views)} lượt xem
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 150,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.light,
  },
  thumbWrap: {
    aspectRatio: 9 / 16,
    position: 'relative',
    backgroundColor: '#111',
  },
  thumb: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '70%',
  },
  playBtn: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -19,
    marginLeft: -19,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  durationBadge: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  durationText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.white,
  },
  viewsBadge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  viewsText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: COLORS.white,
  },
  title: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.darkBrown,
    lineHeight: 16,
    paddingHorizontal: 8,
    paddingTop: 7,
  },
  sub: {
    fontSize: 10.5,
    color: COLORS.textSecondary,
    paddingHorizontal: 8,
    paddingTop: 3,
    paddingBottom: 8,
  },
});
