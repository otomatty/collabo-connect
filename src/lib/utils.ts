import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatJoinedDate(value: string | null | undefined): string {
  if (!value) {
    return "";
  }

  const match = value.match(/^(\d{4})-(\d{2})/);
  if (match) {
    const [, year, month] = match;
    return `${year}年${Number(month)}月`;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return `${date.getUTCFullYear()}年${date.getUTCMonth() + 1}月`;
}

/**
 * Format a full ISO timestamp (timestamptz) as a JST calendar date
 * (YYYY年M月D日). Activity timestamps come back as UTC ISO strings, so taking
 * the `YYYY-MM-DD` prefix directly (as formatJapaneseDate does) would show the
 * previous day for events created between 00:00–09:00 JST. We shift by +9h and
 * read the UTC parts, which avoids depending on the host's ICU timezone data.
 */
export function formatJstDate(value: string | null | undefined): string {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  const jst = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  return `${jst.getUTCFullYear()}年${jst.getUTCMonth() + 1}月${jst.getUTCDate()}日`;
}

export function formatJapaneseDate(value: string | null | undefined): string {
  if (!value) {
    return "";
  }

  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const [, year, month, day] = match;
    return `${year}年${Number(month)}月${Number(day)}日`;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return `${date.getUTCFullYear()}年${date.getUTCMonth() + 1}月${date.getUTCDate()}日`;
}
