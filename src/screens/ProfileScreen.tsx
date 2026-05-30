import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, ScrollView,
    Switch, Alert, Linking,
} from 'react-native';
import { useAuth } from '../auth/AuthContext';

const PREMIUM_FEATURES = [
    { icon: '🔔', label: 'Push notifications for every birthday' },
    { icon: '🤖', label: 'Unlimited AI-generated wish messages' },
    { icon: '📋', label: 'Import contacts from your phone' },
    { icon: '🔗', label: 'Share birthday lists with family' },
    { icon: '📊', label: 'Birthday stats & streaks' },
];

export default function ProfileScreen() {
    const { user, logout } = useAuth();
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const isPremium = user?.plan === 'premium';

    const initials = (user?.name ?? user?.email ?? '?')
        .split(' ')
        .map(w => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

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
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>

            {/* Avatar + name */}
            <View style={styles.hero}>
                <View style={[styles.avatar, isPremium && styles.avatarPremium]}>
                    <Text style={styles.avatarText}>{initials}</Text>
                </View>
                <Text style={styles.name}>{user?.name ?? 'Birthday Buddy User'}</Text>
                <Text style={styles.email}>{user?.email}</Text>

                {/* Plan badge */}
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

            {/* Upgrade banner (free users only) */}
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

            {/* Settings section */}
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

            {/* Account section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>ACCOUNT</Text>

                <TouchableOpacity style={styles.menuRow} onPress={() => Alert.alert('Coming soon', 'Edit profile will be available soon.')}>
                    <Text style={styles.menuRowIcon}>✏️</Text>
                    <Text style={styles.menuRowLabel}>Edit profile</Text>
                    <Text style={styles.menuRowChevron}>›</Text>
                </TouchableOpacity>

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

            {/* Sign out */}
            <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
                <Text style={styles.signOutText}>Sign out</Text>
            </TouchableOpacity>

            <Text style={styles.version}>Birthday Buddy v1.0 · {isPremium ? 'Premium' : 'Free'}</Text>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    content: { paddingBottom: 60 },

    hero: { alignItems: 'center', paddingTop: 32, paddingBottom: 24, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    avatar: {
        width: 72, height: 72, borderRadius: 36, backgroundColor: '#fce7f3',
        alignItems: 'center', justifyContent: 'center', marginBottom: 12,
    },
    avatarPremium: { backgroundColor: '#fef3c7', borderWidth: 2, borderColor: '#f59e0b' },
    avatarText: { fontSize: 28, fontWeight: '800', color: '#be185d' },
    name: { fontSize: 20, fontWeight: '700', color: '#0f172a', marginBottom: 2 },
    email: { fontSize: 14, color: '#94a3b8', marginBottom: 10 },
    planBadge: {
        paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999,
        backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#e2e8f0',
    },
    planBadgePremium: { backgroundColor: '#fef3c7', borderColor: '#fde68a' },
    planBadgeText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
    planBadgeTextPremium: { color: '#92400e' },

    statsRow: {
        flexDirection: 'row', backgroundColor: '#fff', marginHorizontal: 16, marginTop: 16,
        borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#f1f5f9',
    },
    statBox: { flex: 1, alignItems: 'center' },
    statNumber: { fontSize: 28, fontWeight: '800', color: '#0f172a' },
    statLabel: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
    statDivider: { width: 1, backgroundColor: '#e2e8f0' },

    upgradeBanner: {
        marginHorizontal: 16, marginTop: 16, borderRadius: 20, overflow: 'hidden',
        backgroundColor: '#1e1b4b',
    },
    upgradeContent: { padding: 20 },
    upgradeTitle: { fontSize: 18, fontWeight: '800', color: '#fff', marginBottom: 4 },
    upgradeSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 16 },
    featureList: { gap: 8, marginBottom: 20 },
    featureRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    featureIcon: { fontSize: 16, width: 22 },
    featureText: { fontSize: 14, color: 'rgba(255,255,255,0.9)', flex: 1 },
    upgradeBtn: {
        backgroundColor: '#ec4899', borderRadius: 12, padding: 14, alignItems: 'center',
    },
    upgradeBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },

    section: { marginTop: 24, paddingHorizontal: 16 },
    sectionTitle: { fontSize: 11, fontWeight: '800', color: '#94a3b8', letterSpacing: 1.2, marginBottom: 8 },

    settingRow: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
        borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#f1f5f9',
    },
    settingInfo: { flex: 1 },
    settingLabel: { fontSize: 15, fontWeight: '600', color: '#1e293b' },
    settingHint: { fontSize: 12, color: '#94a3b8', marginTop: 1 },

    menuRow: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
        borderRadius: 14, padding: 16, marginBottom: 8,
        borderWidth: 1, borderColor: '#f1f5f9', gap: 12,
    },
    menuRowIcon: { fontSize: 18, width: 24 },
    menuRowLabel: { flex: 1, fontSize: 15, color: '#1e293b' },
    menuRowChevron: { fontSize: 20, color: '#cbd5e1' },

    signOutBtn: {
        marginHorizontal: 16, marginTop: 24, padding: 16, borderRadius: 14,
        backgroundColor: '#fff1f2', borderWidth: 1, borderColor: '#fecdd3', alignItems: 'center',
    },
    signOutText: { color: '#dc2626', fontWeight: '700', fontSize: 15 },
    version: { textAlign: 'center', fontSize: 12, color: '#cbd5e1', marginTop: 20 },
});
