import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import 'dayjs/locale/fr';
import 'dayjs/locale/pl';
import 'dayjs/locale/es';
import 'dayjs/locale/de';
import 'dayjs/locale/ru';
import 'dayjs/locale/it';
import 'dayjs/locale/el';
import 'dayjs/locale/zh';
import 'dayjs/locale/ja';
import 'dayjs/locale/ko';
import 'dayjs/locale/hi';

dayjs.extend(relativeTime);
dayjs.extend(localizedFormat);

type TimeUnit = 'w' | 'd' | 'h' | 'm';
const _quantities: Record<TimeUnit, number> = {
  w: 7 * 24 * 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000,
  h: 60 * 60 * 1000,
  m: 60 * 1000,
} as const;

class TimeUtil {
  static minsToMeridian(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    const displayMinutes = mins.toString().padStart(2, '0');

    if (mins === 0) {
      return `${displayHour}:00 ${period}`;
    } else {
      return `${displayHour}:${displayMinutes} ${period}`;
    }
  }

	static meridianToMins(time: string): number {
		const [timeStr, meridian] = time.split(' ');
    const [hourStr, minuteStr] = timeStr.split(':');
    let hour = parseInt(hourStr, 10);
    const minute = parseInt(minuteStr, 10);

    // Convert to 24-hour format
    if (meridian === 'PM' && hour !== 12) {
      hour += 12;
    } else if (meridian === 'AM' && hour === 12) {
      hour = 0;
    }
		return hour * 60 + minute;
  }

  static rangeDuration(start: dayjs.Dayjs, end: dayjs.Dayjs): string {
    const quantitiesInMins = Object.entries(_quantities).map(
      ([unit, quantity]) => [unit, quantity / (60 * 1000)] as [TimeUnit, number]
    );

    const totalSeconds = end.diff(start, 'second');
    let totalMinutes = Math.ceil(totalSeconds / 60);

    const parts = quantitiesInMins
      .map(([unit, divisor]) => {
        const value = Math.floor(totalMinutes / divisor);
        if (value > 0) {
          totalMinutes -= value * divisor;
          return `${value}${unit}`;
        }
        return '';
      })
      .filter(Boolean);

    return parts.join(' ') || '0m';
  }

  static inMilliseconds(value: number, unit: TimeUnit): number {
    if (!(unit in _quantities)) {
      throw new Error(`Invalid time unit: ${unit}`);
    }
    return value * _quantities[unit];
  }

  static now(): number {
    return Date.now();
  }

  static nowDayjs(): dayjs.Dayjs {
    return dayjs();
  }

  static nowISO(): string {
    return new Date(TimeUtil.now()).toISOString();
  }

  static currentYear(): number {
    return new Date(TimeUtil.now()).getFullYear();
  }

  /**
   * Sets the dayjs locale to match the app's current language.
   * Call this when the user changes language.
   */
  static setLocale(locale: string): void {
    dayjs.locale(locale);
  }

  /**
   * Formats a timestamp (in ms) as a localized relative time string.
   * Uses dayjs relativeTime plugin — automatically handles i18n.
   * e.g. "a few seconds ago", "5 minutes ago", "3 hours ago", "2 days ago"
   */
  static relativeTime(timestampMs: number): string {
    return dayjs(timestampMs).fromNow();
  }
}

export default TimeUtil;
