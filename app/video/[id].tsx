import { Ionicons } from '@expo/vector-icons';
import { useEvent, useEventListener } from 'expo';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
  type ViewToken,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { COLORS } from '@/constants/colors';
import { useApp } from '@/context/app-context';
import type { Video } from '@/types';
import { formatDuration, formatViews } from '@/utils/formatters';

interface ClipItemProps {
  video: Video;
  active: boolean;
  liked: boolean;
  onToggleLike: () => void;
  onOpenListing: () => void;
  onShare: () => void;
  onEnded: () => void;
  height: number;
  bottomInset: number;
}

/** Một clip dựng đứng full màn hình — tự phát khi là clip đang hiển thị */
function ClipItem({
  video,
  active,
  liked,
  onToggleLike,
  onOpenListing,
  onShare,
  onEnded,
  height,
  bottomInset,
}: ClipItemProps) {
  const player = useVideoPlayer(video.videoUrl, (p) => {
    p.loop = false;
    p.timeUpdateEventInterval = 0.25;
  });

  // Chỉ clip đang hiển thị được phát
  useEffect(() => {
    if (active) {
      player.play();
    } else {
      player.pause();
    }
  }, [active, player]);

  const { isPlaying } = useEvent(player, 'playingChange', { isPlaying: player.playing });
  const timePayload = useEvent(player, 'timeUpdate', {
    currentTime: 0,
    currentLiveTimestamp: null,
    currentOffsetFromLive: null,
    bufferedPosition: 0,
  });
  const currentTime = timePayload?.currentTime ?? 0;

  // Hết clip → chuyển sang clip kế tiếp (giống Shorts)
  useEventListener(player, 'playToEnd', () => {
    if (active) onEnded();
  });

  const duration = player.duration > 0 ? player.duration : video.durationSec;
  const progress = duration > 0 ? Math.min(1, Math.max(0, currentTime / duration)) : 0;

  return (
    <View style={[styles.item, { height }]}>
      {/* Video — chạm để phát/tạm dừng */}
      <TouchableOpacity
        activeOpacity={1}
        style={StyleSheet.absoluteFill}
        onPress={() => (isPlaying ? player.pause() : player.play())}
      >
        <VideoView player={player} style={styles.video} contentFit="cover" nativeControls={false} />
      </TouchableOpacity>

      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.6)']}
        style={styles.bottomGradient}
        pointerEvents="none"
      />

      {/* Nút play trung tâm khi đang dừng */}
      {!isPlaying && (
        <View style={styles.centerPlay} pointerEvents="none">
          <View style={styles.centerPlayBtn}>
            <Ionicons name="play" size={32} color={COLORS.white} />
          </View>
        </View>
      )}

      {/* Thanh tiến trình */}
      <View style={[styles.progressTrack, { bottom: bottomInset }]} pointerEvents="none">
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>

      {/* Hành động bên phải (giống Shorts) */}
      <View style={[styles.rail, { bottom: bottomInset + 110 }]}>
        {video.listingId && (
          <TouchableOpacity style={styles.railBtn} onPress={onToggleLike} hitSlop={6}>
            <Ionicons
              name={liked ? 'heart' : 'heart-outline'}
              size={27}
              color={liked ? COLORS.warmGold : COLORS.white}
            />
            <Text style={styles.railLabel}>{liked ? 'Đã thích' : 'Thích'}</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.railBtn} onPress={onShare} hitSlop={6}>
          <Ionicons name="share-social" size={26} color={COLORS.white} />
          <Text style={styles.railLabel}>Chia sẻ</Text>
        </TouchableOpacity>
        {video.listingId && (
          <TouchableOpacity style={styles.railBtn} onPress={onOpenListing} hitSlop={6}>
            <Ionicons name="home" size={26} color={COLORS.white} />
            <Text style={styles.railLabel}>Xem tin</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Thông tin phía dưới */}
      <View style={[styles.info, { paddingBottom: bottomInset + 24 }]} pointerEvents="none">
        <Text style={styles.title} numberOfLines={2}>
          {video.title}
        </Text>
        <View style={styles.metaRow}>
          <Ionicons name="eye-outline" size={12} color="rgba(255,255,255,0.85)" />
          <Text style={styles.meta}>{formatViews(video.views)} lượt xem</Text>
          <Text style={styles.metaDot}>•</Text>
          <Text style={styles.meta}>{formatDuration(video.durationSec)}</Text>
        </View>
        <View style={styles.hashRow}>
          <Text style={styles.hash}>#XemNhà</Text>
          <Text style={styles.hash}>#Tour360</Text>
          <Text style={styles.hash}>#VoNo</Text>
        </View>
      </View>
    </View>
  );
}

export default function VideoShortsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const { toggleFavorite, isFavorite, videos } = useApp();

  const initialIndex = videos.findIndex((v) => v.id === id);
  const [currentIndex, setCurrentIndex] = useState(() => Math.max(0, initialIndex));
  const listRef = useRef<FlatList<Video>>(null);

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0 && viewableItems[0].index != null) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 60 }).current;

  const scrollToIndex = useCallback((index: number) => {
    if (index < 0 || index >= videos.length) return;
    listRef.current?.scrollToIndex({ index, animated: true });
  }, [videos.length]);

  if (initialIndex === -1) {
    // Firestore có thể chưa kịp trả dữ liệu — hiển thị đang tải thay vì báo lỗi
    if (videos.length === 0) {
      return (
        <View style={[styles.container, styles.center]}>
          <Text style={styles.notFound}>Đang tải video...</Text>
        </View>
      );
    }
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { top: insets.top + 8 }]} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <View style={styles.center}>
          <Ionicons name="videocam-off-outline" size={40} color={COLORS.textSecondary} />
          <Text style={styles.notFound}>Không tìm thấy clip</Text>
          <TouchableOpacity onPress={() => router.back()} hitSlop={6}>
            <Text style={styles.backLink}>Quay lại</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        ref={listRef}
        data={videos}
        keyExtractor={(v) => v.id}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        getItemLayout={(_, index) => ({ length: height, offset: height * index, index })}
        initialScrollIndex={initialIndex}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        renderItem={({ item, index }) => (
          <ClipItem
            video={item}
            active={index === currentIndex}
            liked={!!item.listingId && isFavorite(item.listingId)}
            onToggleLike={() => item.listingId && toggleFavorite(item.listingId)}
            onOpenListing={() => item.listingId && router.push(`/listing/${item.listingId}`)}
            onShare={() =>
              Share.share({
                message: `${item.title}\nXem trên VoNo - Tìm Nhà Nhanh`,
              }).catch(() => {})
            }
            onEnded={() => scrollToIndex(currentIndex + 1)}
            height={height}
            bottomInset={insets.bottom}
          />
        )}
      />

      {/* Nút quay lại */}
      <TouchableOpacity
        onPress={() => router.back()}
        style={[styles.backBtn, { top: insets.top + 8 }]}
        hitSlop={8}
      >
        <Ionicons name="arrow-back" size={24} color={COLORS.white} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#12100C',
  },
  item: {
    width: '100%',
    position: 'relative',
    backgroundColor: '#000',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '38%',
  },
  centerPlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerPlayBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  progressTrack: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.warmGold,
  },
  rail: {
    position: 'absolute',
    right: 12,
    alignItems: 'center',
    gap: 18,
  },
  railBtn: {
    alignItems: 'center',
    gap: 3,
  },
  railLabel: {
    fontSize: 10.5,
    fontWeight: '600',
    color: COLORS.white,
  },
  info: {
    position: 'absolute',
    left: 14,
    right: 72,
    bottom: 0,
    gap: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.white,
    lineHeight: 22,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  meta: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
  },
  metaDot: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
  },
  hashRow: {
    flexDirection: 'row',
    gap: 10,
  },
  hash: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.warmGold,
  },
  backBtn: {
    position: 'absolute',
    left: 14,
    zIndex: 10,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  notFound: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.white,
  },
  backLink: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.warmGold,
  },
});
