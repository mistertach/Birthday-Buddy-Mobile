import React, { useEffect, useState } from 'react';
import {
    ScrollView, View, Text, TextInput, TouchableOpacity,
    StyleSheet, ActivityIndicator, Alert, Platform,
    KeyboardAvoidingView, Keyboard,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { contactsApi } from '../api/contacts';
import type { AppStackParamList } from '../navigation/types';
import Picker from '../components/Picker';
import { colors, radius, shadow, font } from '../theme';

type Props = NativeStackScreenProps<AppStackParamList, 'ContactForm'>;

const RELATIONSHIPS = [
    { label: '👨‍👩‍👧 Family', value: 'Family' },
    { label: '💛 Friend', value: 'Friend' },
    { label: '💼 Work', value: 'Work' },
    { label: '💕 Partner', value: 'Partner' },
    { label: '🎓 School', value: 'School' },
    { label: '✨ Other', value: 'Other' },
];


export default function ContactFormScreen({ route, navigation }: Props) {
    const id = route.params?.id;
    const isEdit = !!id;

    const [name, setName] = useState('');
    const [birthday, setBirthday] = useState<Date | null>(null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [relationship, setRelationship] = useState('Friend');
    const [showRelPicker, setShowRelPicker] = useState(false);
    const [givesGifts, setGivesGifts] = useState(false);
    const [phone, setPhone] = useState('');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(isEdit);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!id) return;
        (async () => {
            try {
                const c = await contactsApi.get(id);
                setName(c.name);
                const yr = c.year || new Date().getFullYear();
                setBirthday(new Date(yr, c.month - 1, c.day));
                setRelationship(c.relationship || 'Friend');
                setGivesGifts(c.givesGifts ?? false);
                setPhone(c.phone || '');
                setNotes(c.notes || '');
            } catch {
                Alert.alert('Error', 'Could not load contact');
                navigation.goBack();
            } finally {
                setLoading(false);
            }
        })();
    }, [id, navigation]);

    const friendlyDate = () => {
        if (!birthday) return 'Select birthday';
        const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long' };
        if (birthday.getFullYear() !== new Date().getFullYear()) opts.year = 'numeric';
        return birthday.toLocaleDateString('en-GB', opts);
    };

    const relLabel = RELATIONSHIPS.find(r => r.value === relationship)?.label ?? relationship;

    const onSave = async () => {
        if (!name.trim()) {
            Alert.alert('Name required', 'Please enter the person\'s name.');
            return;
        }
        if (!birthday) {
            Alert.alert('Birthday required', 'Please select a birthday date.');
            return;
        }
        const payload = {
            name: name.trim(),
            day: birthday.getDate(),
            month: birthday.getMonth() + 1,
            year: birthday.getFullYear() !== new Date().getFullYear() ? birthday.getFullYear() : null,
            relationship,
            givesGifts,
            phone: phone.trim() || null,
            notes: notes.trim() || null,
        };
        setSaving(true);
        try {
            if (isEdit) {
                await contactsApi.update(id!, payload);
            } else {
                await contactsApi.create(payload);
            }
            navigation.goBack();
        } catch (e: any) {
            Alert.alert('Save failed', e?.error || 'Network error');
        } finally {
            setSaving(false);
        }
    };

    const onDelete = () => {
        Alert.alert(`Delete ${name}?`, 'This cannot be undone.', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete', style: 'destructive', onPress: async () => {
                    try {
                        await contactsApi.remove(id!);
                        navigation.goBack();
                    } catch {
                        Alert.alert('Error', 'Could not delete');
                    }
                },
            },
        ]);
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.content}
                keyboardShouldPersistTaps="handled"
                onScrollBeginDrag={Keyboard.dismiss}
            >
                {/* Name */}
                <View style={styles.card}>
                    <Text style={styles.label}>Full name</Text>
                    <TextInput
                        style={styles.input}
                        value={name}
                        onChangeText={setName}
                        placeholder="e.g. Sarah Johnson"
                        placeholderTextColor={colors.textMuted}
                        autoCapitalize="words"
                        returnKeyType="done"
                        onSubmitEditing={Keyboard.dismiss}
                    />
                </View>

                {/* Birthday */}
                <View style={styles.card}>
                    <Text style={styles.label}>Birthday</Text>
                    <TouchableOpacity style={styles.selectRow} onPress={() => setShowDatePicker(true)}>
                        <Text style={styles.calIcon}>🎂</Text>
                        <Text style={[styles.selectText, !birthday && styles.placeholderText]}>
                            {friendlyDate()}
                        </Text>
                        <Text style={styles.chevron}>›</Text>
                    </TouchableOpacity>
                    <Text style={styles.hint}>
                        {birthday && birthday.getFullYear() === new Date().getFullYear()
                            ? 'Year not recorded — scroll back to add birth year'
                            : birthday ? '' : 'Select day, month and optionally birth year'}
                    </Text>
                </View>

                {/* Relationship */}
                <View style={styles.card}>
                    <Text style={styles.label}>Relationship</Text>
                    <TouchableOpacity style={styles.selectRow} onPress={() => setShowRelPicker(true)}>
                        <Text style={[styles.selectText, { flex: 1 }]}>{relLabel}</Text>
                        <Text style={styles.chevron}>›</Text>
                    </TouchableOpacity>
                </View>

                {/* Gift toggle */}
                <TouchableOpacity
                    style={[styles.card, styles.giftToggleCard, givesGifts && styles.giftToggleCardActive]}
                    onPress={() => setGivesGifts(g => !g)}
                    activeOpacity={0.8}
                >
                    <View style={styles.giftToggleRow}>
                        <View style={styles.giftToggleLeft}>
                            <Text style={styles.giftToggleTitle}>🎁 I usually give them a gift</Text>
                            <Text style={styles.giftToggleHint}>We'll remind you 2 weeks before their birthday</Text>
                        </View>
                        <View style={[styles.toggleTrack, givesGifts && styles.toggleTrackActive]}>
                            <View style={[styles.toggleThumb, givesGifts && styles.toggleThumbActive]} />
                        </View>
                    </View>
                </TouchableOpacity>

                {/* Phone */}
                <View style={styles.card}>
                    <Text style={styles.label}>WhatsApp number <Text style={styles.optional}>(optional)</Text></Text>
                    <TextInput
                        style={styles.input}
                        value={phone}
                        onChangeText={setPhone}
                        placeholder="+44 7700 900000"
                        placeholderTextColor={colors.textMuted}
                        keyboardType="phone-pad"
                        returnKeyType="done"
                        onSubmitEditing={Keyboard.dismiss}
                    />
                    <Text style={styles.hint}>Include country code for WhatsApp to work</Text>
                </View>

                {/* Notes */}
                <View style={styles.card}>
                    <Text style={styles.label}>Notes <Text style={styles.optional}>(optional)</Text></Text>
                    <TextInput
                        style={[styles.input, styles.multiline]}
                        value={notes}
                        onChangeText={setNotes}
                        placeholder="Gift ideas, favourite things, preferences…"
                        placeholderTextColor={colors.textMuted}
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                        returnKeyType="done"
                        blurOnSubmit
                    />
                </View>

                {/* Save */}
                <TouchableOpacity style={styles.saveBtn} onPress={onSave} disabled={saving}>
                    {saving
                        ? <ActivityIndicator color="#fff" />
                        : <Text style={styles.saveBtnText}>{isEdit ? 'Save changes' : '+ Add birthday buddy'}</Text>
                    }
                </TouchableOpacity>

                {isEdit && (
                    <TouchableOpacity style={styles.deleteBtn} onPress={onDelete}>
                        <Text style={styles.deleteBtnText}>Delete contact</Text>
                    </TouchableOpacity>
                )}

                <View style={{ height: 40 }} />
            </ScrollView>
            </KeyboardAvoidingView>

            {/* iOS date picker */}
            {showDatePicker && (
                <View style={styles.datePickerContainer}>
                    <View style={styles.datePickerHeader}>
                        <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                            <Text style={styles.datePickerCancel}>Cancel</Text>
                        </TouchableOpacity>
                        <Text style={styles.datePickerTitle}>Select Birthday</Text>
                        <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                            <Text style={styles.datePickerDone}>Done</Text>
                        </TouchableOpacity>
                    </View>
                    <DateTimePicker
                        value={birthday || new Date(2000, 0, 1)}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={(_, date) => { if (date) setBirthday(date); }}
                        maximumDate={new Date()}
                        minimumDate={new Date(1900, 0, 1)}
                        style={styles.datePicker}
                    />
                </View>
            )}

            {/* Pickers */}
            <Picker
                visible={showRelPicker}
                title="Relationship"
                options={RELATIONSHIPS}
                selected={relationship}
                onSelect={setRelationship}
                onClose={() => setShowRelPicker(false)}
            />
        </>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    content: { padding: 16 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
    card: {
        backgroundColor: colors.surface, borderRadius: radius.lg,
        padding: 16, marginBottom: 12, ...shadow.sm,
    },
    label: { fontSize: font.sm, fontWeight: '700', color: colors.textSecondary, marginBottom: 8, letterSpacing: 0.3 },
    optional: { fontWeight: '400', color: colors.textMuted },
    input: {
        fontSize: font.base, color: colors.text,
        paddingVertical: 2,
    },
    multiline: { minHeight: 80, paddingTop: 4 },
    selectRow: {
        flexDirection: 'row', alignItems: 'center', paddingVertical: 2,
    },
    calIcon: { fontSize: 18, marginRight: 10 },
    selectText: { fontSize: font.base, color: colors.text },
    placeholderText: { color: colors.textMuted },
    chevron: { fontSize: 20, color: colors.textMuted, marginLeft: 4 },
    hint: { fontSize: font.xs, color: colors.textMuted, marginTop: 6 },
    saveBtn: {
        backgroundColor: colors.primary, borderRadius: radius.lg,
        padding: 16, alignItems: 'center', marginTop: 8, ...shadow.primary,
    },
    saveBtnText: { color: '#fff', fontSize: font.md, fontWeight: '700' },
    deleteBtn: { padding: 16, alignItems: 'center', marginTop: 4 },
    deleteBtnText: { color: colors.danger, fontSize: font.base },
    // Gift toggle
    giftToggleCard: { borderWidth: 1.5, borderColor: colors.border },
    giftToggleCardActive: { borderColor: colors.primary, backgroundColor: '#fdf2f8' },
    giftToggleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    giftToggleLeft: { flex: 1 },
    giftToggleTitle: { fontSize: font.base, fontWeight: '700', color: colors.text },
    giftToggleHint: { fontSize: font.xs, color: colors.textMuted, marginTop: 3 },
    toggleTrack: {
        width: 44, height: 26, borderRadius: 13, backgroundColor: colors.border,
        justifyContent: 'center', paddingHorizontal: 2,
    },
    toggleTrackActive: { backgroundColor: colors.primary },
    toggleThumb: {
        width: 22, height: 22, borderRadius: 11, backgroundColor: '#fff',
        shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 2, elevation: 2,
    },
    toggleThumbActive: { transform: [{ translateX: 18 }] },
    // Date picker overlay
    datePickerContainer: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24,
        ...shadow.md, paddingBottom: 40,
    },
    datePickerHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 20, paddingVertical: 14,
        borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    datePickerTitle: { fontSize: font.base, fontWeight: '700', color: colors.text },
    datePickerCancel: { fontSize: font.base, color: colors.textSecondary },
    datePickerDone: { fontSize: font.base, color: colors.primary, fontWeight: '700' },
    datePicker: { backgroundColor: colors.surface },
});
