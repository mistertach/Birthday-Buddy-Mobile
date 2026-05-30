import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../auth/AuthContext';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import ContactsScreen from '../screens/ContactsScreen';
import ContactFormScreen from '../screens/ContactFormScreen';
import EventsScreen from '../screens/EventsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import type {
    AuthStackParamList,
    BirthdaysStackParamList,
    EventsStackParamList,
    ProfileStackParamList,
    AppTabParamList,
} from './types';
import { colors } from '../theme';

const ONBOARDING_KEY = 'bb_onboarding_done';

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const BirthdaysStack = createNativeStackNavigator<BirthdaysStackParamList>();
const EventsStack = createNativeStackNavigator<EventsStackParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();
const Tab = createBottomTabNavigator<AppTabParamList>();

function AuthNavigator({ onOnboardingDone }: { onOnboardingDone: (birthday?: { day: number; month: number }) => void }) {
    return (
        <AuthStack.Navigator screenOptions={{ headerShown: false }}>
            <AuthStack.Screen name="Onboarding">
                {() => <OnboardingScreen onDone={onOnboardingDone} />}
            </AuthStack.Screen>
            <AuthStack.Screen name="Login" component={LoginScreen} />
            <AuthStack.Screen name="Register" component={RegisterScreen} />
        </AuthStack.Navigator>
    );
}

function BirthdaysNavigator() {
    return (
        <BirthdaysStack.Navigator
            screenOptions={{
                headerStyle: { backgroundColor: colors.surface },
                headerTintColor: colors.primary,
                headerTitleStyle: { fontWeight: '700', color: colors.text },
                headerShadowVisible: false,
                headerBackTitle: 'Back',
            }}
        >
            <BirthdaysStack.Screen
                name="Contacts"
                component={ContactsScreen}
                options={{ headerShown: false }}
            />
            <BirthdaysStack.Screen
                name="ContactForm"
                component={ContactFormScreen}
                options={({ route }) => ({
                    title: route.params?.id ? 'Edit contact' : 'New buddy',
                })}
            />
        </BirthdaysStack.Navigator>
    );
}

function EventsNavigator() {
    return (
        <EventsStack.Navigator
            screenOptions={{
                headerStyle: { backgroundColor: colors.surface },
                headerTintColor: '#7c3aed',
                headerTitleStyle: { fontWeight: '700', color: colors.text },
                headerShadowVisible: false,
            }}
        >
            <EventsStack.Screen
                name="Events"
                component={EventsScreen}
                options={{ title: 'Parties & Events' }}
            />
        </EventsStack.Navigator>
    );
}

function ProfileNavigator() {
    return (
        <ProfileStack.Navigator
            screenOptions={{
                headerStyle: { backgroundColor: colors.surface },
                headerTintColor: colors.primary,
                headerTitleStyle: { fontWeight: '700', color: colors.text },
                headerShadowVisible: false,
            }}
        >
            <ProfileStack.Screen
                name="Profile"
                component={ProfileScreen}
                options={{ title: 'Your account' }}
            />
        </ProfileStack.Navigator>
    );
}

function TabIcon({ emoji, label, focused }: { emoji: string; label: string; focused: boolean }) {
    return (
        <View style={tabStyles.iconWrap}>
            <Text style={tabStyles.iconEmoji}>{emoji}</Text>
            <Text style={[tabStyles.iconLabel, focused && tabStyles.iconLabelActive]}>{label}</Text>
        </View>
    );
}

function AppNavigator() {
    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarShowLabel: false,
                tabBarStyle: {
                    backgroundColor: '#fff',
                    borderTopColor: '#f1f5f9',
                    borderTopWidth: 1,
                    height: 72,
                    paddingBottom: 12,
                },
            }}
        >
            <Tab.Screen
                name="BirthdaysTab"
                component={BirthdaysNavigator}
                options={{
                    tabBarIcon: ({ focused }) => <TabIcon emoji="🎂" label="Birthdays" focused={focused} />,
                }}
            />
            <Tab.Screen
                name="EventsTab"
                component={EventsNavigator}
                options={{
                    tabBarIcon: ({ focused }) => <TabIcon emoji="🎉" label="Events" focused={focused} />,
                }}
            />
            <Tab.Screen
                name="ProfileTab"
                component={ProfileNavigator}
                options={{
                    tabBarIcon: ({ focused }) => <TabIcon emoji="👤" label="You" focused={focused} />,
                }}
            />
        </Tab.Navigator>
    );
}

export default function RootNavigator() {
    const { user, loading, updateProfile } = useAuth();
    const [checkingOnboarding, setCheckingOnboarding] = useState(true);
    const [onboardingDone, setOnboardingDone] = useState(false);

    useEffect(() => {
        AsyncStorage.getItem(ONBOARDING_KEY).then(val => {
            setOnboardingDone(val === 'true');
            setCheckingOnboarding(false);
        });
    }, []);

    const handleOnboardingDone = async (birthday?: { day: number; month: number }) => {
        await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
        setOnboardingDone(true);
        // Birthday is saved after the user logs in; we store it temporarily
        if (birthday) {
            await AsyncStorage.setItem('bb_pending_birthday', JSON.stringify(birthday));
        }
    };

    // After login/register, save any birthday collected during onboarding
    useEffect(() => {
        if (!user) return;
        AsyncStorage.getItem('bb_pending_birthday').then(async raw => {
            if (!raw) return;
            await AsyncStorage.removeItem('bb_pending_birthday');
            const bday = JSON.parse(raw);
            if (bday?.day && bday?.month && !user.birthdayDay) {
                updateProfile({ birthdayDay: bday.day, birthdayMonth: bday.month }).catch(() => {});
            }
        });
    }, [user?.id]);

    if (loading || checkingOnboarding) {
        return (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator size="large" color="#ec4899" />
            </View>
        );
    }

    return (
        <NavigationContainer>
            {user
                ? <AppNavigator />
                : <AuthNavigator onOnboardingDone={handleOnboardingDone} />
            }
        </NavigationContainer>
    );
}

const tabStyles = StyleSheet.create({
    iconWrap: { alignItems: 'center', justifyContent: 'center', gap: 2 },
    iconEmoji: { fontSize: 22 },
    // Shorter labels fit on all screen sizes
    iconLabel: { fontSize: 10, fontWeight: '600', color: '#94a3b8' },
    iconLabelActive: { color: '#ec4899' },
});
