import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const arabicIndicMap: Record<string, string> = {
  "٠": "0",
  "١": "1",
  "٢": "2",
  "٣": "3",
  "٤": "4",
  "٥": "5",
  "٦": "6",
  "٧": "7",
  "٨": "8",
  "٩": "9",
};

/**
 * Normalizes Arabic-Indic numerals (٠-٩) to standard ASCII digits (0-9)
 */
export function toAsciiDigits(str: string): string {
  return str.replace(/[٠-٩]/g, (ch) => arabicIndicMap[ch] || ch);
}

/**
 * Checks if a text string contains a telephone sequence (Algerian or international).
 * Ignores real estate areas, prices, and standard short numbers.
 */
export function containsPhoneNumber(text: string): boolean {
  if (!text || typeof text !== "string") return false;
  const masked = maskPhoneNumbers(text);
  return masked !== text;
}

/**
 * Automatically masks any phone number sequence found in any text field (such as description,
 * title, details, comments, etc.) while preserving legitimate prices and areas.
 */
export function maskPhoneNumbers(text: string): string {
  if (!text || typeof text !== "string") return "";

  // Matches Algerian mobile (05, 06, 07), landline (02, 03, 04), international (+213, 00213),
  // and sequences of 9-11 digits with various delimiters (spaces, dots, hyphens, slashes).
  // Excludes prices with currency indicators or million suffix.
  const delim = "[\\s._\\-/,]";
  const phonePattern = new RegExp(
    `(?:(?:\\+|00)?213${delim}*\\(?0?\\)?${delim}*[2-7٢-٧]|[0٠]${delim}*[2-7٢-٧])(?:${delim}*[0-9٠-٩]){7,9}|(?<!(?:سعر|مبلغ|دينار|د\\.ج|da|dzd|million|ملايين|مليون|م²|متر)[\\s:]*)(?:[0٠]${delim}*[0-9٠-٩]|(?:\\+|00)213)?(?:[0-9٠-٩][\\s._\\-/]{1,2}){8,11}(?![0-9٠-٩])`,
    "gi",
  );

  return text.replace(phonePattern, (match) => {
    const rawDigits = toAsciiDigits(match).replace(/\D/g, "");

    const isAlgerianMobile = /^0[567]\d{8}$/.test(rawDigits);
    const isAlgerianLandline = /^0[234]\d{7,8}$/.test(rawDigits);
    const isAlgerianIntl = /^(?:213|00213)[2-7]\d{8}$/.test(rawDigits);
    const isGenericPhoneSequence =
      rawDigits.startsWith("0") && rawDigits.length >= 9 && rawDigits.length <= 11;
    const isNineToElevenDigits =
      rawDigits.length >= 9 && rawDigits.length <= 11 && !rawDigits.endsWith("000000");

    if (
      isAlgerianMobile ||
      isAlgerianLandline ||
      isAlgerianIntl ||
      isGenericPhoneSequence ||
      isNineToElevenDigits
    ) {
      return "[رقم هاتف مشفر ومحمي تلقائياً]";
    }
    return match;
  });
}
