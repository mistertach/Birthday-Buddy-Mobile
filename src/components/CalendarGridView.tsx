import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, ScrollView,
} from 'react-native';
import { Contact } from '../types';
import { getBirthdayStatus } from '../utils/dates';

const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];
const DAY_HEADERS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

const REL_COLORS: Record<string, string> = {
    Family: '#ec4899', Friend: '#6366f1', Partner: '#f43f5e',
    Work: '#0ea5e9', Colleague: '#0ea5e9', Other: '#94a3b8',
};

function dotColor(c: Contact): string {
    const status = getBirthdayStatus(c.day, c.month, c.lastWishedYear);
    if (status === 'today') return '#e11d48';
    if (status === 'missed') return '#dc2626';
    if (status === 'wished') return '#16a34a';
    return REL_COLORS[c.relationship ?? 'Other'] ?? '#6366f1';
}

type Props = {
    contacts: Contact[];
    onContactPress: (c: Contact) => void;
};

export default function CalendarGridView({ contacts, onContactPress }: Props) {
    const today = new Date();
    const [calYear, setCalYear] = useState(today.getFullYear());
    const [calMonth, setCalMonth] = useState(today.getMonth()); // 0-indexed

    const firstDow = new Date(calYear, calMonth, 1).getDay(); // 0=Sun
    const startDow = firstDow === 0 ? 6 : firstDow - 1; // Mon=0
    const totalDays = new Date(calYear, calMonth + 1, 0).getDate();

    const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    // Map day → contacts
    const dayMap: Record<number, Contact[]> = {};
    contacts.forEach(c => {
        if (c.month === calMonth + 1) {
            if (!dayMap[c.day]) dayMap[c.day] = [];
            dayMap[c.day].push(c);
        }
    });

    const cells: (number | null)[] = [];
    for (let i = 0; i < startDow; i++) cells.push(null);
    for (let d = 1; d <= totalDays; d++) cells.push(d);

    const monthLabel = `${MONTH_NAMES[calMonth]} ${calYear}`;

    const prevMonth = () => {
        if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); }
        else setCalMonth(m => m - 1);
    };
    const nextMonth = () => {
        if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); }
        else setCalMonth(m => m + 1);
    };

    // Selected day details
    const [selectedDay, setSelectedDay] = useState<number | null>(null);
    const selectedContacts = selectedDay ? (dayMap[selectedDay] ?? []) : [];

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            {/* Month nav */}
            <View style={styles.nav}>
                <TouchableOpacity style={styles.navBtn} onPress={prevMonth}>
                    <Text style={styles.navBtnText}>‹</Text>
                </TouchableOpacity>
                <Text style={styles.monthLabel}>{monthLabel}</Text>
                <TouchableOpacity style={styles.navBtn} onPress={nextMonth}>
                    <Text style={styles.navBtnText}>›</Text>
                </TouchableOpacity>
            </View>

            {/* Day headers */}
            <View style={styles.dayHeaders}>
                {DAY_HEADERS.map(d => (
                    <Text key={d} style={styles.dayHeaderText}>{d}</Text>
                ))}
            </View>

            {/* Grid */}
            <View style={styles.grid}>
                {cells.map((day, i) => {
                    if (!day) return <View key={`e-${i}`} style={styles.cell} />;
                    const cellDate = new Date(calYear, calMonth, day);
                    const isToday = cellDate.getTime() === todayMidnight.getTime();
                    const hasContacts = dayMap[day]?.length > 0;
                    const isSelected = selectedDay === day;

                    return (
                        <TouchableOpacity
                            key={day}
                            style={[styles.cell, isToday && styles.cellToday, isSelected && !isToday && styles.cellSelected]}
                            onPress={() => hasContacts ? setSelectedDay(isSelected ? null : day) : undefined}
                            activeOpacity={hasContacts ? 0.7 : 1}
                        >
                            <Text style={[styles.cellDay, isToday && styles.cellDayToday]}>{day}</Text>
                            {hasContacts && (
                                <View style={styles.dots}>
                                    {dayMap[day].slice(0, 3).map((c, ci) => (
                                        <View key={ci} style={[styles.dot, { backgroundColor: isToday ? '#fff' : dotColor(c) }]} />
                                    ))}
                                </View>
                            )}
                        </TouchableOpacity>
                    );
                })}
            </View>

            {/* Legend */}
            <View style={styles.legend}>
                {Object.entries(REL_COLORS).map(([rel, col]) => (
                    <View key={rel} style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: col }]} />
                        <Text style={styles.legendLabel}>{rel}</Text>
                    </View>
                ))}
            </View>

            {/* Selected day contacts */}
            {selectedContacts.length > 0 && (
                <View style={styles.selectedSection}>
                    <Text style={styles.selectedTitle}>
                        {MONTH_NAMES[calMonth]} {selectedDay}
                    </Text>
                    {selectedContacts.map(c => {
                        const status = getBirthdayStatus(c.day, c.month, c.lastWishedYear);
                        return (
                            <TouchableOpacity key={c.id} style={styles.contactChip} onPress={() => onContactPress(c)}>
                                <View style={[styles.chipDot, { backgroundColor: dotColor(c) }]} />
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.chipName}>{c.name}</Text>
                                    {c.relationship ? <Text style={styles.chipRel}>{c.relationship}</Text> : null}
                                </View>
                                {status === 'today' && <Text style={styles.chipBadge}>🎉 Today</Text>}
                                {status === 'missed' && <Text style={[styles.chipBadge, { color: '#dc2626' }]}>⏰ Late</Text>}
                                {status === 'wished' && <Text style={[styles.chipBadge, { color: '#16a34a' }]}>✓ Wished</Text>}
                            </TouchableOpacity>
                        );
                    })}
                </View>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    content: { padding: 16, paddingBottom: 120 },
    nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
    navBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
    navBtnText: { fontSize: 22, color: '#475569', lineHeight: 26 },
    monthLabel: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
    dayHeaders: { flexDirection: 'row', marginBottom: 4 },
    dayHeaderText: { flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '700', color: '#94a3b8', paddingVertical: 4 },
    grid: { flexDirection: 'row', flexWrap: 'wrap' },
    cell: {
        width: '14.285%', aspectRatio: 1, alignItems: 'center', justifyContent: 'flex-start',
        paddingTop: 6, borderRadius: 8,
    },
    cellToday: { backgroundColor: '#ec4899' },
    cellSelected: { backgroundColor: '#fce7f3', borderWidth: 1, borderColor: '#f9a8d4' },
    cellDay: { fontSize: 13, fontWeight: '500', color: '#374151' },
    cellDayToday: { color: '#fff', fontWeight: '800' },
    dots: { flexDirection: 'row', gap: 2, marginTop: 2 },
    dot: { width: 4, height: 4, borderRadius: 2 },
    legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16, padding: 12, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#f1f5f9' },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    legendDot: { width: 8, height: 8, borderRadius: 4 },
    legendLabel: { fontSize: 11, color: '#64748b' },
    selectedSection: { marginTop: 16 },
    selectedTitle: { fontSize: 14, fontWeight: '700', color: '#475569', marginBottom: 8 },
    contactChip: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12,
        padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#f1f5f9', gap: 10,
    },
    chipDot: { width: 10, height: 10, borderRadius: 5 },
    chipName: { fontSize: 15, fontWeight: '600', color: '#1e293b' },
    chipRel: { fontSize: 12, color: '#94a3b8' },
    chipBadge: { fontSize: 12, fontWeight: '600', color: '#ec4899' },
});
