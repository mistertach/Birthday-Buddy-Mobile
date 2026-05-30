const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_FULL = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

export function formatBirthday(day: number, month: number, year?: number | null): string {
    const m = MONTHS[Math.max(0, Math.min(11, month - 1))];
    return year ? `${m} ${day}, ${year}` : `${m} ${day}`;
}

export function monthName(month: number): string {
    return MONTHS_FULL[Math.max(0, Math.min(11, month - 1))];
}

/** Days until next occurrence of this birthday (0 = today, negative = already passed this year) */
export function daysUntilBirthday(day: number, month: number, today = new Date()): number {
    const y = today.getFullYear();
    const todayMidnight = new Date(y, today.getMonth(), today.getDate());
    const next = new Date(y, month - 1, day);
    if (next < todayMidnight) next.setFullYear(y + 1);
    return Math.round((next.getTime() - todayMidnight.getTime()) / (1000 * 60 * 60 * 24));
}

/** Days since birthday (positive = passed, 0 = today). Returns null if birthday is in the future this year. */
export function daysSinceBirthday(day: number, month: number, today = new Date()): number | null {
    const y = today.getFullYear();
    const todayMidnight = new Date(y, today.getMonth(), today.getDate());
    const bday = new Date(y, month - 1, day);

    // Also check last year's birthday (year-wrap: e.g. Dec 31 birthday, today is Jan 2)
    const bdayLastYear = new Date(y - 1, month - 1, day);
    const daysThisYear = Math.round((todayMidnight.getTime() - bday.getTime()) / (1000 * 60 * 60 * 24));
    const daysLastYear = Math.round((todayMidnight.getTime() - bdayLastYear.getTime()) / (1000 * 60 * 60 * 24));

    if (daysThisYear >= 0) return daysThisYear;
    if (daysLastYear >= 0 && daysLastYear <= 7) return daysLastYear;
    return null;
}

/** Visual sort date — missed-this-week stays visible; everything else sorted by next occurrence */
export function visualSortDate(day: number, month: number): Date {
    const today = new Date();
    const y = today.getFullYear();
    const todayMidnight = new Date(y, today.getMonth(), today.getDate());
    const d = new Date(y, month - 1, day);

    // Keep recently-passed birthdays (within 7 days) in current position
    const msPerDay = 1000 * 60 * 60 * 24;
    const daysAgo = Math.round((todayMidnight.getTime() - d.getTime()) / msPerDay);
    if (daysAgo > 0 && daysAgo <= 7) return d; // Show near the top

    // Push past birthdays (older than 7 days) to next year
    if (d < todayMidnight) d.setFullYear(y + 1);
    return d;
}

export type BirthdayStatus = 'today' | 'missed' | 'wished' | 'upcoming';

/**
 * Returns birthday status.
 * 'missed' = birthday passed in the last 7 days and not yet wished.
 *   Covers year-wrap (e.g. Dec 31 birthday, today is Jan 3).
 */
export function getBirthdayStatus(
    day: number, month: number, lastWishedYear: number | null
): BirthdayStatus {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const year = today.getFullYear();
    const bday = new Date(year, month - 1, day);
    const msPerDay = 1000 * 60 * 60 * 24;

    // Today always shows — even if already wished (user may want to re-send)
    if (bday.getTime() === today.getTime()) return 'today';

    // Wished this year
    if (lastWishedYear === year) return 'wished';

    // Missed = birthday passed in last 7 days (this year)
    const daysAgoThisYear = Math.round((today.getTime() - bday.getTime()) / msPerDay);
    if (daysAgoThisYear > 0 && daysAgoThisYear <= 7) return 'missed';

    // Year-wrap case: birthday in December, today is early January (last year's bday)
    if (lastWishedYear !== year - 1) {
        const bdayLastYear = new Date(year - 1, month - 1, day);
        const daysAgoLastYear = Math.round((today.getTime() - bdayLastYear.getTime()) / msPerDay);
        if (daysAgoLastYear > 0 && daysAgoLastYear <= 7) return 'missed';
    }

    return 'upcoming';
}

export function relativeLabel(days: number): string {
    if (days === 0) return 'Today! 🎉';
    if (days === 1) return 'Tomorrow';
    if (days <= 7) return `In ${days} days`;
    if (days <= 14) return `In ${days} days`;
    return `${days}d`;
}

export function ageturning(day: number, month: number, birthYear: number | null): number | null {
    if (!birthYear) return null;
    const today = new Date();
    let age = today.getFullYear() - birthYear;
    const hadBirthday =
        today.getMonth() + 1 > month ||
        (today.getMonth() + 1 === month && today.getDate() >= day);
    if (!hadBirthday) age--;
    return age + 1; // turning age
}
