import React, { useCallback, useMemo, useState } from 'react';
import {
    View, Text, SectionList, StyleSheet, TouchableOpacity,
    RefreshControl, ActivityIndicator, Alert, TextInput, ScrollView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { contactsApi } from '../api/contacts';
import { Contact } from '../types';
import {
    getBirthdayStatus, daysUntilBirthday, visualSortDate, monthName, formatBirthday,
} from '../utils/dates';
import ContactCard from '../components/ContactCard';
import { useAuth } from '../auth/AuthContext';
import type { AppStackParamList } from '../navigation/types';
import CalendarGridView from '../components/CalendarGridView';

type Props = NativeStackScreenProps<AppStackParamList, 'Contacts'>;
type Section = { title: string; fullCount: number; data: Contact[] };
type ViewMode = 'list' | 'grid';

const REL_COLORS: Record<string, string> = {
    Family: '#ec4899', Friend: '#6366f1', Partner: '#f43f5e',
    Colleague: '#0ea5e9', Work: '#0ea5e9', Other: '#94a3b8',
};

export default function ContactsScreen({ navigation }: Props) {
    const { user } = useAuth();
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState('');
    const [viewMode, setViewMode] = useState<ViewMode>('list');

    const currentMonthKey = monthName(new Date().getMonth() + 1) + ' ' + new Date().getFullYear();
    const [expandedMonths, setExpandedMonths] = useState<Record<string, boolean>>({ [currentMonthKey]: true });
    const toggleMonth = (key: string) =>
        setExpandedMonths(prev => ({ ...prev, [key]: !prev[key] }));

    const load = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const data = await contactsApi.list();
            setContacts(data);
        } catch (e: any) {
            Alert.alert('Could not load contacts', e?.error || 'Network error');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useFocusEffect(useCallback(() => { load(); }, [load]));

    const filtered = useMemo(() =>
        search.trim()
            ? contacts.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
            : contacts,
        [contacts, search]);

    // Next-up strip: today / missed / upcoming within 14 days
    const nextUp = useMemo(() => {
        return filtered
            .filter(c => {
                const status = getBirthdayStatus(c.day, c.month, c.lastWishedYear);
                const days = daysUntilBirthday(c.day, c.month);
                return (status === 'today' || status === 'missed' || (status === 'upcoming' && days <= 14));
            })
            .sort((a, b) => daysUntilBirthday(a.day, a.month) - daysUntilBirthday(b.day, b.month))
            .slice(0, 8);
    }, [filtered]);

    const sections: Section[] = useMemo(() => {
        const visible = filtered.filter(c => {
            const status = getBirthdayStatus(c.day, c.month, c.lastWishedYear);
            return status !== 'wished';
        });
        const sorted = [...visible].sort(
            (a, b) => visualSortDate(a.day, a.month).getTime() - visualSortDate(b.day, b.month).getTime()
        );
        const map = new Map<string, Contact[]>();
        for (const c of sorted) {
            const vd = visualSortDate(c.day, c.month);
            const key = monthName(vd.getMonth() + 1) + ' ' + vd.getFullYear();
            if (!map.has(key)) map.set(key, []);
            map.get(key)!.push(c);
        }
        return Array.from(map.entries()).map(([title, contacts]) => ({
            title, fullCount: contacts.length,
            data: expandedMonths[title] ? contacts : [],
        }));
    }, [filtered, expandedMonths]);

    const handleWished = useCallback((id: string, wished: boolean) => {
        const year = new Date().getFullYear();
        setContacts(prev => prev.map(c =>
            c.id === id ? { ...c, lastWishedYear: wished ? year : null } : c
        ));
    }, []);

    const handleDeleted = useCallback((id: string) => {
        setContacts(prev => prev.filter(c => c.id !== id));
    }, []);

    if (loading) {
        return <View style={styles.center}><ActivityIndicator size="large" color="#ec4899" /></View>;
    }

    // Rich empty state
    const EmptyState = () => (
        <View style={styles.emptyWrap}>
            <Text style={styles.emptyEmoji}>🎂</Text>
            <Text style={styles.emptyTitle}>Add your first birthday!</Text>
            <Text style={styles.emptyBody}>
                Birthday Buddy reminds you before important dates, helps you send warm wishes,
                and keeps track of everyone you care about.
            </Text>
            <View style={styles.addOptions}>
                <TouchableOpacity style={styles.addOption} onPress={() => navigation.navigate('ContactForm', {})}>
                    <Text style={styles.addOptionEmoji}>✏️</Text>
                    <Text style={styles.addOptionLabel}>Add manually</Text>
                    <Text style={styles.addOptionHint}>Name, birthday, phone</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.addOption} onPress={() => Alert.alert('Coming soon', 'Phone contacts import will be in the next update!')}>
                    <Text style={styles.addOptionEmoji}>📱</Text>
                    <Text style={styles.addOptionLabel}>From your contacts</Text>
                    <Text style={styles.addOptionHint}>Sync from phone</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.addOption} onPress={() => Alert.alert('Import CSV', 'Export a CSV from the web app at birthdaybud.vercel.app and re-import it here.')}>
                    <Text style={styles.addOptionEmoji}>📄</Text>
                    <Text style={styles.addOptionLabel}>From CSV file</Text>
                    <Text style={styles.addOptionHint}>Bulk import</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.greeting}>Hey, {user?.name?.split(' ')[0] || 'there'} 👋</Text>
                    <Text style={styles.subGreeting}>{contacts.length} {contacts.length === 1 ? 'birthday' : 'birthdays'} tracked</Text>
                </View>
                {/* List / Grid toggle */}
                <View style={styles.viewToggle}>
                    <TouchableOpacity
                        style={[styles.toggleBtn, viewMode === 'list' && styles.toggleBtnActive]}
                        onPress={() => setViewMode('list')}
                    >
                        <Text style={[styles.toggleBtnText, viewMode === 'list' && styles.toggleBtnTextActive]}>≡</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.toggleBtn, viewMode === 'grid' && styles.toggleBtnActive]}
                        onPress={() => setViewMode('grid')}
                    >
                        <Text style={[styles.toggleBtnText, viewMode === 'grid' && styles.toggleBtnTextActive]}>📅</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Search */}
            <View style={styles.searchWrap}>
                <Text style={styles.searchIcon}>🔍</Text>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search by name..."
                    placeholderTextColor="#94a3b8"
                    value={search}
                    onChangeText={setSearch}
                    clearButtonMode="while-editing"
                />
            </View>

            {/* Grid view */}
            {viewMode === 'grid' ? (
                <CalendarGridView
                    contacts={contacts}
                    onContactPress={c => navigation.navigate('ContactForm', { id: c.id })}
                />
            ) : (
                /* List view */
                <SectionList
                    sections={sections}
                    keyExtractor={c => c.id}
                    contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}
                    stickySectionHeadersEnabled
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={() => { setRefreshing(true); load(true); }}
                            tintColor="#ec4899"
                        />
                    }
                    ListHeaderComponent={
                        nextUp.length > 0 ? (
                            <View style={styles.nextUpSection}>
                                <Text style={styles.nextUpTitle}>🎂 Coming up</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                    {nextUp.map(c => {
                                        const days = daysUntilBirthday(c.day, c.month);
                                        const status = getBirthdayStatus(c.day, c.month, c.lastWishedYear);
                                        const isToday = status === 'today';
                                        const isMissed = status === 'missed';
                                        return (
                                            <TouchableOpacity
                                                key={c.id}
                                                style={[styles.nextUpCard, isToday && styles.nextUpCardToday, isMissed && styles.nextUpCardMissed]}
                                                onPress={() => navigation.navigate('ContactForm', { id: c.id })}
                                            >
                                                <View style={[styles.nextUpAvatar, isToday && styles.nextUpAvatarToday]}>
                                                    <Text style={styles.nextUpAvatarText}>
                                                        {c.name.charAt(0).toUpperCase()}
                                                    </Text>
                                                </View>
                                                <Text style={styles.nextUpName} numberOfLines={1}>{c.name.split(' ')[0]}</Text>
                                                <Text style={[styles.nextUpDays, isToday && styles.nextUpDaysToday, isMissed && styles.nextUpDaysMissed]}>
                                                    {isToday ? '🎉 Today' : isMissed ? '⏰ Late' : `${days}d`}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </ScrollView>
                            </View>
                        ) : null
                    }
                    ListEmptyComponent={contacts.length === 0 ? <EmptyState /> : (
                        <View style={styles.empty}>
                            <Text style={styles.emptyEmoji}>🔍</Text>
                            <Text style={styles.emptyTitle}>{search ? 'No results found' : 'All caught up!'}</Text>
                            <Text style={styles.emptyBody}>{search ? 'Try a different name' : 'No upcoming unwished birthdays'}</Text>
                        </View>
                    )}
                    renderSectionHeader={({ section }) => {
                        const isExpanded = expandedMonths[section.title] ?? false;
                        return (
                            <TouchableOpacity
                                style={styles.sectionHeader}
                                onPress={() => toggleMonth(section.title)}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.sectionTitle}>{section.title.toUpperCase()}</Text>
                                <View style={styles.sectionPill}>
                                    <Text style={styles.sectionCount}>{section.fullCount}</Text>
                                </View>
                                <Text style={styles.sectionChevron}>{isExpanded ? '⌃' : '⌄'}</Text>
                            </TouchableOpacity>
                        );
                    }}
                    renderItem={({ item }) => (
                        <ContactCard
                            contact={item}
                            onWished={handleWished}
                            onEdit={c => navigation.navigate('ContactForm', { id: c.id })}
                            onDeleted={handleDeleted}
                        />
                    )}
                />
            )}

            {/* FAB */}
            <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('ContactForm', {})}>
                <Text style={styles.fabText}>+</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 20, paddingTop: 60, paddingBottom: 12, backgroundColor: '#fff',
    },
    greeting: { fontSize: 22, fontWeight: '700', color: '#0f172a' },
    subGreeting: { fontSize: 13, color: '#94a3b8', marginTop: 2 },
    viewToggle: { flexDirection: 'row', gap: 4, backgroundColor: '#f1f5f9', borderRadius: 10, padding: 3 },
    toggleBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 7 },
    toggleBtnActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
    toggleBtnText: { fontSize: 18, color: '#94a3b8' },
    toggleBtnTextActive: { color: '#ec4899' },
    searchWrap: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
        marginHorizontal: 16, marginTop: 10, marginBottom: 4,
        borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', paddingHorizontal: 12, paddingVertical: 2,
    },
    searchIcon: { fontSize: 14, marginRight: 6 },
    searchInput: { flex: 1, fontSize: 15, color: '#1e293b', paddingVertical: 10 },
    nextUpSection: { paddingVertical: 12 },
    nextUpTitle: { fontSize: 14, fontWeight: '700', color: '#475569', marginBottom: 10, letterSpacing: 0.3 },
    nextUpCard: {
        alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, padding: 12,
        marginRight: 10, width: 80, borderWidth: 1, borderColor: '#f1f5f9',
        shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 1,
    },
    nextUpCardToday: { backgroundColor: '#fff1f5', borderColor: '#fecdd3' },
    nextUpCardMissed: { backgroundColor: '#fef2f2', borderColor: '#fecaca' },
    nextUpAvatar: {
        width: 40, height: 40, borderRadius: 20, backgroundColor: '#fce7f3',
        alignItems: 'center', justifyContent: 'center', marginBottom: 6,
    },
    nextUpAvatarToday: { backgroundColor: '#ec4899' },
    nextUpAvatarText: { fontSize: 18, fontWeight: '700', color: '#be185d' },
    nextUpName: { fontSize: 12, fontWeight: '600', color: '#1e293b', marginBottom: 2, textAlign: 'center' },
    nextUpDays: { fontSize: 11, color: '#94a3b8' },
    nextUpDaysToday: { color: '#e11d48', fontWeight: '700' },
    nextUpDaysMissed: { color: '#dc2626', fontWeight: '600' },
    sectionHeader: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        paddingVertical: 9, paddingHorizontal: 2, backgroundColor: '#f8fafc',
    },
    sectionTitle: { fontSize: 11, fontWeight: '800', color: '#94a3b8', letterSpacing: 1.2, flex: 1 },
    sectionPill: { backgroundColor: '#e2e8f0', borderRadius: 999, paddingHorizontal: 7, paddingVertical: 2 },
    sectionCount: { fontSize: 10, fontWeight: '700', color: '#64748b' },
    sectionChevron: { fontSize: 13, color: '#94a3b8', fontWeight: '700', marginLeft: 2 },
    empty: { alignItems: 'center', paddingVertical: 40 },
    emptyEmoji: { fontSize: 40, marginBottom: 10 },
    emptyTitle: { fontSize: 17, fontWeight: '700', color: '#1e293b', marginBottom: 4 },
    emptyBody: { fontSize: 14, color: '#94a3b8', textAlign: 'center' },
    // Rich empty state
    emptyWrap: { paddingVertical: 32, paddingHorizontal: 4 },
    addOptions: { gap: 10, marginTop: 20 },
    addOption: {
        backgroundColor: '#fff', borderRadius: 16, padding: 16,
        borderWidth: 1, borderColor: '#f1f5f9', flexDirection: 'row', alignItems: 'center', gap: 14,
    },
    addOptionEmoji: { fontSize: 28, width: 36, textAlign: 'center' },
    addOptionLabel: { fontSize: 15, fontWeight: '700', color: '#1e293b' },
    addOptionHint: { fontSize: 12, color: '#94a3b8', marginTop: 1 },
    fab: {
        position: 'absolute', bottom: 32, right: 24,
        width: 58, height: 58, borderRadius: 29, backgroundColor: '#ec4899',
        alignItems: 'center', justifyContent: 'center',
        shadowColor: '#ec4899', shadowOpacity: 0.4, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 6,
    },
    fabText: { color: '#fff', fontSize: 28, lineHeight: 30, marginTop: -2 },
});
