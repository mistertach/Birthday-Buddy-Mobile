import React, { useRef, useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, Dimensions,
    FlatList, NativeSyntheticEvent, NativeScrollEvent, TextInput, ScrollView,
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const INFO_SLIDES = [
    {
        id: 'never-miss',
        emoji: '🎂',
        title: 'Never miss a birthday',
        body: 'Add your friends and family once. Birthday Buddy reminds you at the right time — no more awkward late messages.',
        bg: '#fff1f5',
        accent: '#ec4899',
    },
    {
        id: 'send-wishes',
        emoji: '💬',
        title: 'Send wishes in seconds',
        body: 'Choose from warm, funny, or heartfelt messages — or let AI write a personalised wish. Send via WhatsApp with one tap.',
        bg: '#f0f9ff',
        accent: '#0ea5e9',
    },
    {
        id: 'plan-parties',
        emoji: '🎉',
        title: 'Plan parties & gifts',
        body: 'Track RSVPs, manage gift budgets, and plan events. Everything you need to celebrate the people you love.',
        bg: '#f5f3ff',
        accent: '#7c3aed',
    },
];

type Props = {
    onDone: (birthday?: { day: number; month: number }) => void;
};

export default function OnboardingScreen({ onDone }: Props) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const flatListRef = useRef<FlatList>(null);

    // Birthday slide state
    const [bdayDay, setBdayDay] = useState('');
    const [bdayMonth, setBdayMonth] = useState<number | null>(null);

    const TOTAL_SLIDES = INFO_SLIDES.length + 1; // info slides + birthday slide
    const isLastSlide = currentIndex === TOTAL_SLIDES - 1;
    const isBirthdaySlide = currentIndex === INFO_SLIDES.length;

    const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
        const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
        setCurrentIndex(index);
    };

    const goNext = () => {
        if (isLastSlide) {
            handleFinish();
        } else {
            flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
        }
    };

    const handleFinish = () => {
        const day = parseInt(bdayDay);
        const hasBirthday = bdayMonth !== null && day >= 1 && day <= 31;
        onDone(hasBirthday ? { day, month: bdayMonth! } : undefined);
    };

    const currentAccent = isBirthdaySlide ? '#ec4899' : INFO_SLIDES[currentIndex]?.accent ?? '#ec4899';
    const currentBg = isBirthdaySlide ? '#fff8fc' : INFO_SLIDES[currentIndex]?.bg ?? '#fff';

    const allSlides = [...INFO_SLIDES.map(s => ({ ...s, type: 'info' as const })),
    { id: 'birthday', type: 'birthday' as const, bg: '#fff8fc', accent: '#ec4899' }];

    return (
        <View style={[styles.container, { backgroundColor: currentBg }]}>
            <FlatList
                ref={flatListRef}
                data={allSlides}
                keyExtractor={s => s.id}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                scrollEnabled={!isBirthdaySlide}
                onMomentumScrollEnd={handleScroll}
                renderItem={({ item }) => {
                    if (item.type === 'birthday') {
                        return (
                            <View style={[styles.slide, { width: SCREEN_WIDTH, backgroundColor: '#fff8fc' }]}>
                                <View style={[styles.emojiRing, { backgroundColor: '#fce7f380' }]}>
                                    <Text style={styles.emoji}>🎂</Text>
                                </View>
                                <Text style={[styles.title, { color: '#ec4899' }]}>When's your birthday?</Text>
                                <Text style={styles.body}>
                                    We'll celebrate you on your big day and let friends know when they invite you.
                                </Text>

                                {/* Month picker */}
                                <ScrollView
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    style={styles.monthScroll}
                                    contentContainerStyle={styles.monthScrollContent}
                                >
                                    {MONTHS.map((m, i) => (
                                        <TouchableOpacity
                                            key={m}
                                            style={[styles.monthChip, bdayMonth === i + 1 && styles.monthChipActive]}
                                            onPress={() => setBdayMonth(i + 1)}
                                        >
                                            <Text style={[styles.monthChipText, bdayMonth === i + 1 && styles.monthChipTextActive]}>
                                                {m}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>

                                {/* Day input */}
                                <View style={styles.dayRow}>
                                    <Text style={styles.dayLabel}>Day</Text>
                                    <TextInput
                                        style={styles.dayInput}
                                        value={bdayDay}
                                        onChangeText={t => setBdayDay(t.replace(/[^0-9]/g, '').slice(0, 2))}
                                        keyboardType="number-pad"
                                        placeholder="e.g. 21"
                                        placeholderTextColor="#94a3b8"
                                        maxLength={2}
                                    />
                                </View>

                                {bdayDay && bdayMonth && (
                                    <Text style={styles.bdayPreview}>
                                        🎉 {MONTHS[bdayMonth - 1]} {bdayDay} — we've got it!
                                    </Text>
                                )}

                                <TouchableOpacity style={styles.skipBday} onPress={() => onDone(undefined)}>
                                    <Text style={styles.skipBdayText}>Skip for now</Text>
                                </TouchableOpacity>
                            </View>
                        );
                    }

                    const s = item as typeof INFO_SLIDES[0] & { type: 'info' };
                    return (
                        <View style={[styles.slide, { width: SCREEN_WIDTH, backgroundColor: s.bg }]}>
                            <View style={[styles.emojiRing, { backgroundColor: s.accent + '22' }]}>
                                <Text style={styles.emoji}>{s.emoji}</Text>
                            </View>
                            <Text style={[styles.title, { color: s.accent }]}>{s.title}</Text>
                            <Text style={styles.body}>{s.body}</Text>
                        </View>
                    );
                }}
            />

            {/* Dots */}
            <View style={styles.dots}>
                {allSlides.map((_, i) => (
                    <View
                        key={i}
                        style={[styles.dot,
                        i === currentIndex && styles.dotActive,
                        i === currentIndex && { backgroundColor: currentAccent }]}
                    />
                ))}
            </View>

            {/* Footer */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.nextBtn, { backgroundColor: currentAccent }]}
                    onPress={goNext}
                    activeOpacity={0.85}
                >
                    <Text style={styles.nextBtnText}>
                        {isLastSlide
                            ? (bdayDay && bdayMonth ? "Save & get started →" : "Get started →")
                            : 'Next →'}
                    </Text>
                </TouchableOpacity>
                {!isBirthdaySlide && (
                    <TouchableOpacity onPress={handleFinish} style={styles.skipBtn}>
                        <Text style={styles.skipText}>Skip all</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    slide: {
        flex: 1, alignItems: 'center', justifyContent: 'center',
        paddingHorizontal: 36, paddingTop: 60, paddingBottom: 20,
    },
    emojiRing: {
        width: 110, height: 110, borderRadius: 55,
        alignItems: 'center', justifyContent: 'center', marginBottom: 28,
    },
    emoji: { fontSize: 56 },
    title: { fontSize: 26, fontWeight: '800', textAlign: 'center', marginBottom: 14, letterSpacing: -0.5 },
    body: { fontSize: 15, color: '#475569', textAlign: 'center', lineHeight: 23 },
    // Birthday slide
    monthScroll: { maxHeight: 50, marginTop: 24, width: SCREEN_WIDTH - 72 },
    monthScrollContent: { gap: 8, paddingHorizontal: 2 },
    monthChip: {
        paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999,
        borderWidth: 1.5, borderColor: '#e2e8f0', backgroundColor: '#fff',
    },
    monthChipActive: { borderColor: '#ec4899', backgroundColor: '#fdf2f8' },
    monthChipText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
    monthChipTextActive: { color: '#ec4899' },
    dayRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 16 },
    dayLabel: { fontSize: 15, fontWeight: '600', color: '#475569' },
    dayInput: {
        width: 80, borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 12,
        paddingHorizontal: 14, paddingVertical: 10, fontSize: 18, fontWeight: '700',
        textAlign: 'center', color: '#0f172a', backgroundColor: '#fff',
    },
    bdayPreview: { marginTop: 14, fontSize: 14, color: '#ec4899', fontWeight: '600' },
    skipBday: { marginTop: 12, paddingVertical: 8 },
    skipBdayText: { fontSize: 13, color: '#94a3b8' },
    // Nav
    dots: {
        flexDirection: 'row', justifyContent: 'center', gap: 8,
        paddingVertical: 16, backgroundColor: 'transparent',
    },
    dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#e2e8f0' },
    dotActive: { width: 24 },
    footer: { paddingHorizontal: 24, paddingBottom: 48, alignItems: 'center', gap: 12 },
    nextBtn: { width: '100%', paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
    nextBtnText: { color: '#fff', fontSize: 17, fontWeight: '800' },
    skipBtn: { paddingVertical: 8 },
    skipText: { color: '#94a3b8', fontSize: 15 },
});
