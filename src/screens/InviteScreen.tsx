import React, { useCallback, useState } from 'react';
import {
    View, Text, StyleSheet, TextInput, TouchableOpacity,
    ScrollView, Alert, ActivityIndicator, Share,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { contactsApi } from '../api/contacts';
import { invitesApi } from '../api/invites';
import { Contact } from '../types';
import { useAuth } from '../auth/AuthContext';

const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

type Props = {
    onClose: () => void;
};

export default function InviteScreen({ onClose }: Props) {
    const { user } = useAuth();
    const [email, setEmail] = useState('');
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [loadingContacts, setLoadingContacts] = useState(true);
    const [sending, setSending] = useState(false);
    const [step, setStep] = useState<'email' | 'contacts'>('email');
    const [shareSelfBirthday, setShareSelfBirthday] = useState(!!(user?.birthdayDay && user?.birthdayMonth));

    const hasSelfBirthday = !!(user?.birthdayDay && user?.birthdayMonth);
    const selfBdayLabel = hasSelfBirthday
        ? `${MONTHS_SHORT[user!.birthdayMonth! - 1]} ${user!.birthdayDay}`
        : '';

    useFocusEffect(useCallback(() => {
        contactsApi.list()
            .then(setContacts)
            .catch(() => {})
            .finally(() => setLoadingContacts(false));
    }, []));

    const toggleContact = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const handleSend = async () => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
        if (!emailRegex.test(email.trim())) {
            Alert.alert('Invalid email', 'Please enter a valid email address.');
            return;
        }
        setSending(true);
        try {
            const ids = Array.from(selectedIds);
            if (shareSelfBirthday) ids.push('__SENDER_BIRTHDAY__'); // sentinel
            const result = await invitesApi.create(email.trim().toLowerCase(), ids);
            Alert.alert(
                '🎉 Invitation sent!',
                `${result.emailSent
                    ? `An invite was sent to ${email}.`
                    : `Invite created — email may take a moment to arrive.`
                }\n\nYou can also share the link directly:`,
                [
                    {
                        text: 'Share link',
                        onPress: () => Share.share({
                            message: `Join me on Birthday Buddy! ${result.inviteLink}`,
                            url: result.inviteLink,
                        }),
                    },
                    { text: 'Done', onPress: onClose },
                ]
            );
        } catch (e: any) {
            Alert.alert('Error', e?.error || 'Could not send invitation. Try again.');
        } finally {
            setSending(false);
        }
    };

    const handleShareOnly = () => {
        Share.share({
            message: 'Join me on Birthday Buddy — the best way to never miss a birthday! https://birthdaybud.vercel.app',
        });
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <Text style={styles.title}>Invite a friend 🎉</Text>
            <Text style={styles.subtitle}>
                Send them a link to join Birthday Buddy. You can also share some birthdays to help them get started.
            </Text>

            {/* Email input */}
            <View style={styles.section}>
                <Text style={styles.label}>Friend's email</Text>
                <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="friend@example.com"
                    placeholderTextColor="#94a3b8"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                />
            </View>

            {/* Optional: share contacts */}
            <TouchableOpacity
                style={styles.toggleContacts}
                onPress={() => setStep(s => s === 'email' ? 'contacts' : 'email')}
            >
                <Text style={styles.toggleContactsText}>
                    {step === 'contacts'
                        ? `▲ Hide contact picker (${selectedIds.size} selected)`
                        : `▼ Optionally share some birthdays (${selectedIds.size} selected)`
                    }
                </Text>
            </TouchableOpacity>

            {step === 'contacts' && (
                <View style={styles.contactsSection}>
                    <Text style={styles.contactsHint}>
                        Pick birthdays to share — like family members or mutual friends. They'll be added to your friend's Birthday Buddy when they join.
                    </Text>
                    {loadingContacts ? (
                        <ActivityIndicator color="#ec4899" style={{ marginTop: 12 }} />
                    ) : contacts.length === 0 ? (
                        <Text style={styles.noContacts}>No contacts yet — add some first!</Text>
                    ) : (
                        contacts.map(c => (
                            <TouchableOpacity
                                key={c.id}
                                style={[styles.contactRow, selectedIds.has(c.id) && styles.contactRowSelected]}
                                onPress={() => toggleContact(c.id)}
                                activeOpacity={0.7}
                            >
                                <View style={[styles.checkbox, selectedIds.has(c.id) && styles.checkboxSelected]}>
                                    {selectedIds.has(c.id) && <Text style={styles.checkmark}>✓</Text>}
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.contactName}>{c.name}</Text>
                                    <Text style={styles.contactMeta}>
                                        {c.day}/{c.month}{c.relationship ? ` · ${c.relationship}` : ''}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        ))
                    )}
                </View>
            )}

            {/* Share own birthday toggle */}
            {hasSelfBirthday && (
                <TouchableOpacity
                    style={[styles.selfBdayRow, shareSelfBirthday && styles.selfBdayRowActive]}
                    onPress={() => setShareSelfBirthday(p => !p)}
                    activeOpacity={0.8}
                >
                    <View style={[styles.selfBdayCheck, shareSelfBirthday && styles.selfBdayCheckActive]}>
                        {shareSelfBirthday && <Text style={styles.selfBdayCheckmark}>✓</Text>}
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.selfBdayLabel}>Share my birthday too</Text>
                        <Text style={styles.selfBdayHint}>Your birthday ({selfBdayLabel}) will be added to their Birthday Buddy</Text>
                    </View>
                </TouchableOpacity>
            )}

            {/* Send button */}
            <TouchableOpacity
                style={[styles.sendBtn, sending && styles.sendBtnDisabled]}
                onPress={handleSend}
                disabled={sending || !email.trim()}
                activeOpacity={0.85}
            >
                {sending
                    ? <ActivityIndicator color="#fff" />
                    : <Text style={styles.sendBtnText}>
                        Send invite{selectedIds.size > 0 ? ` + ${selectedIds.size} contacts` : ''}
                    </Text>
                }
            </TouchableOpacity>

            {/* Share app link only */}
            <TouchableOpacity style={styles.shareLinkBtn} onPress={handleShareOnly}>
                <Text style={styles.shareLinkText}>↑ Share app link only</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    content: { padding: 20, paddingBottom: 60 },
    title: { fontSize: 22, fontWeight: '800', color: '#0f172a', marginBottom: 6 },
    subtitle: { fontSize: 14, color: '#64748b', lineHeight: 20, marginBottom: 24 },
    section: { marginBottom: 16 },
    label: { fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 6 },
    input: {
        backgroundColor: '#fff', borderRadius: 12, borderWidth: 1.5, borderColor: '#e2e8f0',
        paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#1e293b',
    },
    toggleContacts: { paddingVertical: 10, marginBottom: 4 },
    toggleContactsText: { fontSize: 13, fontWeight: '600', color: '#6366f1' },
    contactsSection: { backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#f1f5f9', padding: 12, marginBottom: 20 },
    contactsHint: { fontSize: 12, color: '#94a3b8', marginBottom: 10, lineHeight: 18 },
    noContacts: { fontSize: 14, color: '#94a3b8', textAlign: 'center', paddingVertical: 12 },
    contactRow: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        paddingVertical: 10, paddingHorizontal: 4, borderRadius: 8,
    },
    contactRowSelected: { backgroundColor: '#fdf2f8' },
    checkbox: {
        width: 20, height: 20, borderRadius: 5, borderWidth: 2, borderColor: '#cbd5e1',
        alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff',
    },
    checkboxSelected: { backgroundColor: '#ec4899', borderColor: '#ec4899' },
    checkmark: { color: '#fff', fontSize: 12, fontWeight: '700' },
    contactName: { fontSize: 14, fontWeight: '600', color: '#1e293b' },
    contactMeta: { fontSize: 12, color: '#94a3b8' },
    sendBtn: {
        backgroundColor: '#ec4899', borderRadius: 14, paddingVertical: 15,
        alignItems: 'center', marginTop: 8,
        shadowColor: '#ec4899', shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
    },
    sendBtnDisabled: { opacity: 0.6 },
    sendBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
    shareLinkBtn: { paddingVertical: 14, alignItems: 'center', marginTop: 8 },
    shareLinkText: { color: '#6366f1', fontSize: 14, fontWeight: '600' },
    cancelBtn: { paddingVertical: 12, alignItems: 'center' },
    cancelText: { color: '#94a3b8', fontSize: 14 },
    selfBdayRow: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 12,
        padding: 12, backgroundColor: '#f8fafc', marginBottom: 12,
    },
    selfBdayRowActive: { borderColor: '#ec4899', backgroundColor: '#fdf2f8' },
    selfBdayCheck: {
        width: 20, height: 20, borderRadius: 5, borderWidth: 2, borderColor: '#cbd5e1',
        alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff',
    },
    selfBdayCheckActive: { backgroundColor: '#ec4899', borderColor: '#ec4899' },
    selfBdayCheckmark: { color: '#fff', fontSize: 11, fontWeight: '800' },
    selfBdayLabel: { fontSize: 14, fontWeight: '600', color: '#1e293b' },
    selfBdayHint: { fontSize: 12, color: '#94a3b8', marginTop: 1 },
});
