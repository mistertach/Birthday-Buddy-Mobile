import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, ScrollView,
    Switch, Alert, Linking, Modal, TextInput,
} from 'react-native';
import { useAuth } from '../auth/AuthContext';
import InviteScreen from './InviteScreen';

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const PREMIUM_FEATURES = [
    { icon: '🔔', label: 'Push notifications for every birthday' },
    { icon: '🤖', label: 'Unlimited AI-generated wish messages' },
    { icon: '📋', label: 'Import contacts from your phone' },
    { icon: '🔗', label: 'Share birthday lists with family' },
    { icon: '📊', label: 'Birthday stats & streaks' },
];

export default function ProfileScreen() {
    const { user, logout, updateProfile } = useAuth();
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [showInvite, setShowInvite] = useState(false);
    const [editingBirthday, setEditingBirthday] = useState(false);
    const [bdayDay, setBdayDay] = useState(user?.birthdayDay?.toString() ?? '');
    const [bdayMonth, setBdayMonth] = useState<number | null>(user?.birthdayMonth ?? null);
    const [savingBday, setSavingBday] = useState(false);

    const isPremium = user?.plan === 'premium';
    const hasBirthday = !!(user?.birthdayDay && user?.birthdayMonth);

    const initials = (user?.name ?? user?.email ?? '?')
        .split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

    // Check if today is user's birthday
    const today = new Date();
    const isMyBirthday = hasBirthday &&
        user!.birthdayDay === today.getDate() &&
        user!.birthdayMonth === today.getMonth() + 1;

    const bdayLabel = hasBirthday
        ? `${MONTHS_SHORT[user!.birthdayMonth! - 1]} ${user!.birthdayDay}`
        : 'Not set';

    const handleSaveBirthday = async () => {
        const day = parseInt(bdayDay);
        if (!bdayMonth || isNaN(day) || day < 1 || day > 31) {
            Alert.alert('Invalid date', 'Please enter a valid day and select a month.');
            return;
        }
        setSavingBday(true);
        try {
            await updateProfile({ birthdayDay: day, birthdayMonth: bdayMonth });
            setEditingBirthday(false);
        } catch {
            Alert.alert('Error', 'Could not save birthday. Please try again.');
        } finally {
            setSavingBday(false);
        }
    };

    const handleSignOut = () => {
        Alert.alert('Sign out', 'Are you sure you want to sign out?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Sign out', style: 'destructive', onPress: logout },
        ]);
    };

    const handleUpgrade = () => {
        Alert.alert('Coming soon', 'Premium subscriptions will be available soon. Stay tuned!');
    };

    return (
        <>
            <ScrollView style={styles.container} contentContainerStyle={styles.content}>

                {/* Self-birthday banner */}
                {isMyBirthday && (
                    <View style={styles.birthdayBanner}>
                        <Text style={styles.birthdayBannerText}>🎂 Happy Birthday, {user?.name?.split(' ')[0]}! 🎉</Text>
                        <Text style={styles.birthdayBannerSub}>Hope you have an incredible day!</Text>
                    </View>
                )}

                {/* Avatar + name */}
                <View style={styles.hero}>
                    <View style={[styles.avatar, isPremium && styles.avatarPremium, isMyBirthday && styles.avatarBirthday]}>
                        <Text style={styles.avatarText}>{isMyBirthday ? '🎂' : initials}</Text>
                    </View>
                    <Text style={styles.name}>{user?.name ?? 'Birthday Buddy User'}</Text>
                    <Text style={styles.email}>{user?.email}</Text>
                    <View style={[styles.planBadge, isPremium && styles.planBadgePremium]}>
                        <Text style={[styles.planBadgeText, isPremium && styles.planBadgeTextPremium]}>
                            {isPremium ? '⭐ Premium' : '🎁 Free plan'}
                        </Text>
                    </View>
                </View>

                {/* Stats row */}
                <View style={styles.statsRow}>
                    <View style={styles.statBox}>
                        <Text style={styles.statNumber}>{user?.wishesDelivered ?? 0}</Text>
                        <Text style={styles.statLabel}>Wishes sent</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statBox}>
                        <Text style={styles.statNumber}>{user?.streak ?? 0}</Text>
                        <Text style={styles.statLabel}>Day streak 🔥</Text>
                    </View>
                </View>

                {/* My birthday */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>MY BIRTHDAY</Text>
                    {editingBirthday ? (
                        <View style={styles.bdayEdit}>
                            <Text style={styles.bdayEditLabel}>When were you born?</Text>
                            {/* Month chips */}
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.monthScroll} contentContainerStyle={{ gap: 6 }}>
                                {MONTHS_SHORT.map((m, i) => (
                                    <TouchableOpacity
                                        key={m}
                                        style={[styles.monthChip, bdayMonth === i + 1 && styles.monthChipActive]}
                                        onPress={() => setBdayMonth(i + 1)}
                                    >
                                        <Text style={[styles.monthChipText, bdayMonth === i + 1 && styles.monthChipTextActive]}>{m}</Text>
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
                            <View style={styles.bdayActions}>
                                <TouchableOpacity style={styles.bdaySaveBtn} onPress={handleSaveBirthday} disabled={savingBday}>
                                    <Text style={styles.bdaySaveBtnText}>{savingBday ? 'Saving…' : 'Save birthday'}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.bdayCancelBtn} onPress={() => setEditingBirthday(false)}>
                                    <Text style={styles.bdayCancelBtnText}>Cancel</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ) : (
                        <TouchableOpacity style={styles.menuRow} onPress={() => {
                            setBdayDay(user?.birthdayDay?.toString() ?? '');
                            setBdayMonth(user?.birthdayMonth ?? null);
                            setEditingBirthday(true);
                        }}>
                            <Text style={styles.menuRowIcon}>🎂</Text>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.menuRowLabel}>Your birthday</Text>
                                <Text style={[styles.menuRowHint, hasBirthday && { color: '#ec4899' }]}>{bdayLabel}</Text>
                            </View>
                            <Text style={styles.menuRowChevron}>›</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Upgrade banner */}
                {!isPremium && (
                    <TouchableOpacity style={styles.upgradeBanner} onPress={handleUpgrade} activeOpacity={0.85}>
                        <View style={styles.upgradeContent}>
                            <Text style={styles.upgradeTitle}>✨ Upgrade to Premium</Text>
                            <Text style={styles.upgradeSubtitle}>Unlock the full Birthday Buddy experience</Text>
                            <View style={styles.featureList}>
                                {PREMIUM_FEATURES.map((f, i) => (
                                    <View key={i} style={styles.featureRow}>
                                        <Text style={styles.featureIcon}>{f.icon}</Text>
                                        <Text style={styles.featureText}>{f.label}</Text>
                                    </View>
                                ))}
                            </View>
                            <View style={styles.upgradeBtn}>
                                <Text style={styles.upgradeBtnText}>Upgrade — $2.99 / month</Text>
                            </View>
                        </View>
                    </TouchableOpacity>
                )}

                {/* Settings */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>SETTINGS</Text>
                    <View style={styles.settingRow}>
                        <View style={styles.settingInfo}>
                            <Text style={styles.settingLabel}>Birthday reminders</Text>
                            <Text style={styles.settingHint}>Get notified on the day</Text>
                        </View>
                        <Switch
                            value={notificationsEnabled}
                            onValueChange={setNotificationsEnabled}
                            trackColor={{ false: '#e2e8f0', true: '#ec4899' }}
                            thumbColor="#fff"
                        />
                    </View>
                </View>

                {/* Share */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>SHARE</Text>
                    <TouchableOpacity style={[styles.menuRow, styles.menuRowInvite]} onPress={() => setShowInvite(true)}>
                        <Text style={styles.menuRowIcon}>🎁</Text>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.menuRowLabel, { color: '#ec4899' }]}>Invite a friend</Text>
                            <Text style={styles.menuRowHint}>
                                {hasBirthday
                                    ? 'Share birthdays + your own date'
                                    : 'Share birthday contacts to help them get started'}
                            </Text>
                        </View>
                        <Text style={styles.menuRowChevron}>›</Text>
                    </TouchableOpacity>
                </View>

                {/* Account */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>ACCOUNT</Text>
                    <TouchableOpacity style={styles.menuRow} onPress={() => Linking.openURL('mailto:support@birthdaybuddy.app')}>
                        <Text style={styles.menuRowIcon}>💬</Text>
                        <Text style={styles.menuRowLabel}>Contact support</Text>
                        <Text style={styles.menuRowChevron}>›</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.menuRow} onPress={() => Linking.openURL('https://birthdaybud.vercel.app/privacy')}>
                        <Text style={styles.menuRowIcon}>🔒</Text>
                        <Text style={styles.menuRowLabel}>Privacy policy</Text>
                        <Text style={styles.menuRowChevron}>›</Text>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
                    <Text style={styles.signOutText}>Sign out</Text>
                </TouchableOpacity>
                <Text style={styles.version}>Birthday Buddy v1.0 · {isPremium ? 'Premium' : 'Free'}</Text>
            </ScrollView>

            {/* Invite modal */}
            <Modal visible={showInvite} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowInvite(false)}>
                <View style={styles.modalHeader}>
                    <TouchableOpacity onPress={() => setShowInvite(false)} style={styles.modalClose}>
                        <Text style={styles.modalCloseText}>✕</Text>
                    </TouchableOpacity>
                    <Text style={styles.modalTitle}>Invite a friend</Text>
                    <View style={{ width: 36 }} />
                </View>
                <InviteScreen onClose={() => setShowInvite(false)} />
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    content: { paddingBottom: 60 },
    birthdayBanner: {
        backgroundColor: '#ec4899', paddingVertical: 14, paddingHorizontal: 20,
        alignItems: 'center',
    },
    birthdayBannerText: { color: '#fff', fontSize: 18, fontWeight: '800' },
    birthdayBannerSub: { color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 2 },
    hero: { alignItems: 'center', paddingTop: 32, paddingBottom: 24, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    avatar: {
        width: 72, height: 72, borderRadius: 36, backgroundColor: '#fce7f3',
        alignItems: 'center', justifyContent: 'center', marginBottom: 12,
    },
    avatarPremium: { backgroundColor: '#fef3c7', borderWidth: 2, borderColor: '#f59e0b' },
    avatarBirthday: { backgroundColor: '#fce7f3', borderWidth: 3, borderColor: '#ec4899' },
    avatarText: { fontSize: 28, fontWeight: '800', color: '#be185d' },
    name: { fontSize: 20, fontWeight: '700', color: '#0f172a', marginBottom: 2 },
    email: { fontSize: 14, color: '#94a3b8', marginBottom: 10 },
    planBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999, backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#e2e8f0' },
    planBadgePremium: { backgroundColor: '#fef3c7', borderColor: '#fde68a' },
    planBadgeText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
    planBadgeTextPremium: { color: '#92400e' },
    statsRow: { flexDirection: 'row', backgroundColor: '#fff', marginHorizontal: 16, marginTop: 16, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#f1f5f9' },
    statBox: { flex: 1, alignItems: 'center' },
    statNumber: { fontSize: 28, fontWeight: '800', color: '#0f172a' },
    statLabel: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
    statDivider: { width: 1, backgroundColor: '#e2e8f0' },
    // Birthday edit
    bdayEdit: { backgroundColor: '#fff', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#f1f5f9' },
    bdayEditLabel: { fontSize: 14, fontWeight: '600', color: '#475569', marginBottom: 10 },
    monthScroll: { maxHeight: 46, marginBottom: 12 },
    monthChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1.5, borderColor: '#e2e8f0', backgroundColor: '#f8fafc' },
    monthChipActive: { borderColor: '#ec4899', backgroundColor: '#fdf2f8' },
    monthChipText: { fontSize: 12, fontWeight: '600', color: '#64748b' },
    monthChipTextActive: { color: '#ec4899' },
    dayRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
    dayLabel: { fontSize: 14, fontWeight: '600', color: '#475569' },
    dayInput: { width: 72, borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, fontSize: 16, fontWeight: '700', textAlign: 'center', color: '#0f172a' },
    bdayActions: { flexDirection: 'row', gap: 8 },
    bdaySaveBtn: { flex: 1, backgroundColor: '#ec4899', borderRadius: 10, padding: 12, alignItems: 'center' },
    bdaySaveBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
    bdayCancelBtn: { paddingHorizontal: 16, padding: 12, alignItems: 'center' },
    bdayCancelBtnText: { color: '#94a3b8', fontSize: 14 },
    // Upgrade
    upgradeBanner: { marginHorizontal: 16, marginTop: 16, borderRadius: 20, overflow: 'hidden', backgroundColor: '#1e1b4b' },
    upgradeContent: { padding: 20 },
    upgradeTitle: { fontSize: 18, fontWeight: '800', color: '#fff', marginBottom: 4 },
    upgradeSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 16 },
    featureList: { gap: 8, marginBottom: 20 },
    featureRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    featureIcon: { fontSize: 16, width: 22 },
    featureText: { fontSize: 14, color: 'rgba(255,255,255,0.9)', flex: 1 },
    upgradeBtn: { backgroundColor: '#ec4899', borderRadius: 12, padding: 14, alignItems: 'center' },
    upgradeBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
    // Sections
    section: { marginTop: 24, paddingHorizontal: 16 },
    sectionTitle: { fontSize: 11, fontWeight: '800', color: '#94a3b8', letterSpacing: 1.2, marginBottom: 8 },
    settingRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#f1f5f9' },
    settingInfo: { flex: 1 },
    settingLabel: { fontSize: 15, fontWeight: '600', color: '#1e293b' },
    settingHint: { fontSize: 12, color: '#94a3b8', marginTop: 1 },
    menuRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 8, borderWidth: 1, borderColor: '#f1f5f9', gap: 12 },
    menuRowInvite: { borderColor: '#fce7f3' },
    menuRowIcon: { fontSize: 18, width: 24 },
    menuRowLabel: { fontSize: 15, color: '#1e293b', fontWeight: '600' },
    menuRowHint: { fontSize: 12, color: '#94a3b8', marginTop: 1 },
    menuRowChevron: { fontSize: 20, color: '#cbd5e1' },
    signOutBtn: { marginHorizontal: 16, marginTop: 24, padding: 16, borderRadius: 14, backgroundColor: '#fff1f2', borderWidth: 1, borderColor: '#fecdd3', alignItems: 'center' },
    signOutText: { color: '#dc2626', fontWeight: '700', fontSize: 15 },
    version: { textAlign: 'center', fontSize: 12, color: '#cbd5e1', marginTop: 20 },
    // Modal
    modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', backgroundColor: '#fff' },
    modalTitle: { fontSize: 17, fontWeight: '700', color: '#1e293b' },
    modalClose: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
    modalCloseText: { fontSize: 14, color: '#64748b' },
});
