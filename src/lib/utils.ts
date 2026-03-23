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
