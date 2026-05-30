import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setAuthToken, api } from '../api/client';
import { authApi } from '../api/auth';
import { User } from '../types';

const TOKEN_KEY = 'bb_mobile_token';

type AuthState = {
    user: User | null;
    token: string | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (name: string, email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    updateProfile: (data: { name?: string; birthdayDay?: number | null; birthdayMonth?: number | null }) => Promise<void>;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

function normalizeUser(raw: any): User {
    return {
        id: raw.id,
        email: raw.email,
        name: raw.name,
        isAdmin: raw.isAdmin ?? false,
        plan: raw.plan ?? 'free',
        wishesDelivered: raw.wishesDelivered,
        streak: raw.streak,
        birthdayDay: raw.birthdayDay ?? null,
        birthdayMonth: raw.birthdayMonth ?? null,
    };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const stored = await AsyncStorage.getItem(TOKEN_KEY);
                if (stored) {
                    setAuthToken(stored);
                    setToken(stored);
                    const me = await authApi.me();
                    setUser(normalizeUser(me));
                }
            } catch {
                await AsyncStorage.removeItem(TOKEN_KEY);
                setAuthToken(null);
                setToken(null);
                setUser(null);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const persist = useCallback(async (t: string, u: User) => {
        await AsyncStorage.setItem(TOKEN_KEY, t);
        setAuthToken(t);
        setToken(t);
        setUser(u);
    }, []);

    const login = useCallback(async (email: string, password: string) => {
        const res = await authApi.login(email, password);
        await persist(res.token, normalizeUser(res.user));
    }, [persist]);

    const register = useCallback(async (name: string, email: string, password: string) => {
        const res = await authApi.register(name, email, password);
        await persist(res.token, normalizeUser(res.user));
    }, [persist]);

    const logout = useCallback(async () => {
        await AsyncStorage.removeItem(TOKEN_KEY);
        setAuthToken(null);
        setToken(null);
        setUser(null);
    }, []);

    const updateProfile = useCallback(async (data: {
        name?: string;
        birthdayDay?: number | null;
        birthdayMonth?: number | null;
    }) => {
        const updated = await api<User>('/api/v1/me', {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
        setUser(prev => prev ? { ...prev, ...normalizeUser({ ...prev, ...updated }) } : null);
    }, []);

    const value = useMemo(
        () => ({ user, token, loading, login, register, logout, updateProfile }),
        [user, token, loading, login, register, logout, updateProfile]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
