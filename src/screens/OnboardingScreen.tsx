import React, { useRef, useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, Dimensions,
    FlatList, NativeSyntheticEvent, NativeScrollEvent, TextInput, ScrollView,
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

type FeatureItem = { icon: string; text: string };

type InfoSlide = {
    id: string;
    type: 'info';
    emoji: string;
    title: string;
    body: string;
    features: FeatureItem[];
    bg: string;
    accent: string;
};

const INFO_SLIDES: InfoSlide[] = [
    {
        id: 'never-miss',
        type: 'info',
        emoji: '🎂',
        title: 'Never miss a birthday',
        body: 'Add the people you care about once and Birthday Buddy takes care of the rest.',
        features: [
            { icon: '🔔', text: 'Smart reminders days before so you have time to prepare' },
            { icon: '🎁', text: 'Get a heads-up 2 weeks early for people you gift' },
            { icon: '🔄', text: 'Year-round tracking — never feel awkward again' },
        ],
        bg: '#fff1f5',
        accent: '#ec4899',
    },
    {
        id: 'say-it',
        type: 'info',
        emoji: '💬',
        title: 'Say exactly the right thing',
        body: 'The perfect message for every person, every birthday.',
        features: [
            { icon: '🥰', text: 'Warm & heartfelt, funny, casual, or formal — you choose the tone' },
            { icon: '⚡', text: 'One tap to open WhatsApp and send instantly' },
            { icon: '⏰', text: "Belated? We've got sweet late messages covered too" },
        ],
        bg: '#f0f9ff',
        accent: '#0ea5e9',
    },
    {
        id: 'plan-parties',
        type: 'info',
        emoji: '🎉',
        title: 'Plan parties & gifts',
        body: 'Go beyond a simple reminder — make celebrations truly special.',
        features: [
            { icon: '📅', text: 'Create events and track RSVPs in one place' },
            { icon: '🛍️', text: "Track gift ideas, budgets, and whether it's been bought or wrapped" },
            { icon: '📝', text: 'Add notes on favourites, sizes, and wish-list hints' },
        ],
        bg: '#f5f3ff',
        accent: '#7c3aed',
    },
    {
        id: 'add-easy',
        type: 'info',
        emoji: '⚡',
        title: 'Set up in seconds',
        body: 'Getting started is effortless — however you prefer to add people.',
        features: [
            { icon: '📱', text: 'Import straight from your phone contacts' },
            { icon: '✍️', text: 'Add manually with just a name and birthday date' },
            { icon: '👥', text: 'Invite a friend and share birthdays with each other instantly' },
        ],
        bg: '#f0fdf4',
        accent: '#16a34a',
    },
];

type BirthdaySlide = { id: string; type: 'birthday'; bg: string; accent: string };
type AnySlide = InfoSlide | BirthdaySlide;

const ALL_SLIDES: AnySlide[] = [
    ...INFO_SLIDES,
    { id: 'birthday', type: 'birthday', bg: '#fff8fc', accent: '#ec4899' },
];

type Props = {
    onDone: (birthday?: { day: number; month: number }) => void;
};

export default function OnboardingScreen({ onDone }: Props) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const flatListRef = useRef<FlatList>(null);

    const [bdayDay, setBdayDay] = useState('');
    const [bdayMonth, setBdayMonth] = useState<number | null>(null);

    const TOTAL = ALL_SLIDES.length;
    const isBirthdaySlide = currentIndex === TOTAL - 1;
    const currentSlide = ALL_SLIDES[currentIndex];
    const currentAccent = currentSlide.accent;
    const currentBg = currentSlide.bg;

    const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
        const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
        setCurrentIndex(index);
    };

    const goNext = () => {
        if (isBirthdaySlide) {
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

    return (
        <View style={[styles.container, { backgroundColor: currentBg }]}>
            <FlatList
                ref={flatListRef}
                data={ALL_SLIDES}
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

                    const s = item as InfoSlide;
                    return (
                        <View style={[styles.slide, { width: SCREEN_WIDTH, backgroundColor: s.bg }]}>
                            <View style={[styles.emojiRing, { backgroundColor: s.accent + '22' }]}>
                                <Text style={styles.emoji}>{s.emoji}</Text>
                            </View>
                            <Text style={[styles.title, { color: s.accent }]}>{s.title}</Text>
                            <Text style={styles.body}>{s.body}</Text>

                            <View style={styles.featureList}>
                                {s.features.map((f, i) => (
                                    <View key={i} style={[styles.featureRow, { backgroundColor: s.accent + '12' }]}>
                                        <Text style={styles.featureIcon}>{f.icon}</Text>
                                        <Text style={styles.featureText}>{f.text}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    );
                }}
            />

            {/* Dots */}
            <View style={styles.dots}>
                {ALL_SLIDES.map((_, i) => (
                    <View
                        key={i}
                        style={[
                            styles.dot,
                            i === currentIndex && styles.dotActive,
                            i === currentIndex && { backgroundColor: currentAccent },
                        ]}
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
                        {isBirthdaySlide
                            ? (bdayDay && bdayMonth ? 'Save & get started →' : 'Get started →')
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
        paddingHorizontal: 28, paddingTop: 48, paddingBottom: 20,
    },
    emojiRing: {
        width: 100, height: 100, borderRadius: 50,
        alignItems: 'center', justifyContent: 'center', marginBottom: 22,
    },
    emoji: { fontSize: 50 },
    title: { fontSize: 26, fontWeight: '800', textAlign: 'center', marginBottom: 10, letterSpacing: -0.5 },
    body: { fontSize: 15, color: '#475569', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
    // Feature list
    featureList: { width: '100%', gap: 10 },
    featureRow: {
        flexDirection: 'row', alignItems: 'flex-start', gap: 10,
        borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11,
    },
    featureIcon: { fontSize: 18, lineHeight: 22 },
    featureText: { flex: 1, fontSize: 14, color: '#334155', lineHeight: 20, fontWeight: '500' },
    // Birthday slide
    monthScroll: { maxHeight: 50, marginTop: 20, width: SCREEN_WIDTH - 56 },
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
        paddingVertical: 14, backgroundColor: 'transparent',
    },
    dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#e2e8f0' },
    dotActive: { width: 24 },
    footer: { paddingHorizontal: 24, paddingBottom: 44, alignItems: 'center', gap: 10 },
    nextBtn: { width: '100%', paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
    nextBtnText: { color: '#fff', fontSize: 17, fontWeight: '800' },
    skipBtn: { paddingVertical: 8 },
    skipText: { color: '#94a3b8', fontSize: 15 },
});
