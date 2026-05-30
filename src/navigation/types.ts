export type AuthStackParamList = {
    Onboarding: undefined;
    Login: undefined;
    Register: undefined;
};

// Nested stacks inside each tab
export type BirthdaysStackParamList = {
    Contacts: undefined;
    ContactForm: { id?: string };
};

export type EventsStackParamList = {
    Events: undefined;
};

export type ProfileStackParamList = {
    Profile: undefined;
};

// Bottom tab param list — 3 tabs: Birthdays, Events, You
export type AppTabParamList = {
    BirthdaysTab: undefined;
    EventsTab: undefined;
    ProfileTab: undefined;
};

// Keep legacy alias so ContactCard/ContactsScreen don't need changes
export type AppStackParamList = BirthdaysStackParamList;
