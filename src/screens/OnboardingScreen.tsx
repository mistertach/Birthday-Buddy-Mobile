import React, { useRef, useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, Dimensions,
    FlatList, NativeScrollEvent, NativeSyntheticEvent,
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const SLIDES = [
    {
        id: '1',
        emoji: '🎂',
        title: 'Never miss a birthday',
        body: 'Add your friends and family once. Birthday Buddy reminds you at the right time — no more awkward late messages.',
        bg: '#fff1f5',
        accent: '#ec4899',
    },
    {
        id: '2',
        emoji: '💬',
        title: 'Send wishes in seconds',
        body: 'Choose from warm, funny, or heartfelt messages — or let AI write a personalised wish. Send via WhatsApp with one tap.',
        bg: '#f0f9ff',
        accent: '#0ea5e9',
    },
    {
        id: '3',
        emoji: '🎉',
        title: 'Plan parties & gifts',
        body: 'Track RSVPs, manage gift budgets, and plan events. Everything you need to celebrate the people you love.',
        bg: '#f5f3ff',
        accent: '#7c3aed',
    },
];

type Props = {
    onDone: () => void;
};

export default function OnboardingScreen({ onDone }: Props) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const flatListRef = useRef<FlatList>(null);
    const isLast = currentIndex === SLIDES.length - 1;

    const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
        const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
        setCurrentIndex(index);
    };

    const goNext = () => {
        if (isLast) {
            onDone();
        } else {
            flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
        }
    };

    return (
        <View style={styles.container}>
            <FlatList
                ref={flatListRef}
                data={SLIDES}
                keyExtractor={s => s.id}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={handleScroll}
                renderItem={({ item }) => (
                    <View style={[styles.slide, { width: SCREEN_WIDTH, backgroundColor: item.bg }]}>
                        <View style={[styles.emojiRing, { backgroundColor: item.accent + '22' }]}>
                            <Text style={styles.emoji}>{item.emoji}</Text>
                        </View>
                        <Text style={[styles.title, { color: item.accent }]}>{item.title}</Text>
                        <Text style={styles.body}>{item.body}</Text>
                    </View>
                )}
            />

            {/* Dots */}
            <View style={styles.dots}>
                {SLIDES.map((_, i) => (
                    <View
                        key={i}
                        style={[styles.dot, i === currentIndex && styles.dotActive,
                            i === currentIndex && { backgroundColor: SLIDES[i].accent }]}
                    />
                ))}
            </View>

            {/* CTA */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.nextBtn, { backgroundColor: SLIDES[currentIndex].accent }]}
                    onPress={goNext}
                    activeOpacity={0.85}
                >
                    <Text style={styles.nextBtnText}>
                        {isLast ? "Let's go →" : 'Next →'}
                    </Text>
                </TouchableOpacity>
                {!isLast && (
                    <TouchableOpacity onPress={onDone} style={styles.skipBtn}>
                        <Text style={styles.skipText}>Skip</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    slide: {
        flex: 1, alignItems: 'center', justifyContent: 'center',
        paddingHorizontal: 36, paddingTop: 60,
    },
    emojiRing: {
        width: 120, height: 120, borderRadius: 60,
        alignItems: 'center', justifyContent: 'center', marginBottom: 32,
    },
    emoji: { fontSize: 60 },
    title: { fontSize: 28, fontWeight: '800', textAlign: 'center', marginBottom: 16, letterSpacing: -0.5 },
    body: { fontSize: 16, color: '#475569', textAlign: 'center', lineHeight: 24 },
    dots: {
        flexDirection: 'row', justifyContent: 'center', gap: 8,
        paddingVertical: 20, backgroundColor: '#fff',
    },
    dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#e2e8f0' },
    dotActive: { width: 24 },
    footer: { paddingHorizontal: 24, paddingBottom: 48, backgroundColor: '#fff', alignItems: 'center', gap: 12 },
    nextBtn: {
        width: '100%', paddingVertical: 16, borderRadius: 16, alignItems: 'center',
    },
    nextBtnText: { color: '#fff', fontSize: 17, fontWeight: '800' },
    skipBtn: { paddingVertical: 8 },
    skipText: { color: '#94a3b8', fontSize: 15 },
});
