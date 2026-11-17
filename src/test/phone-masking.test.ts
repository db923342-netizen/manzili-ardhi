import { describe, it, expect } from "vitest";
import { maskPhoneNumbers, containsPhoneNumber } from "@/lib/utils";

describe("Phone number automatic privacy masking", () => {
  it("masks standard Algerian mobile numbers", () => {
    expect(maskPhoneNumbers("للتواصل اتصل على 0550123456")).toContain(
      "[رقم هاتف مشفر ومحمي تلقائياً]",
    );
    expect(maskPhoneNumbers("هاتف 0661223344 متوفر دائما")).toContain(
      "[رقم هاتف مشفر ومحمي تلقائياً]",
    );
    expect(maskPhoneNumbers("رقمي 0770998877")).toContain("[رقم هاتف مشفر ومحمي تلقائياً]");
  });

  it("masks phone numbers formatted with spaces or punctuation", () => {
    expect(maskPhoneNumbers("اتصل على 05 50 12 34 56")).toContain("[رقم هاتف مشفر ومحمي تلقائياً]");
    expect(maskPhoneNumbers("هاتف: 06-61-22-33-44")).toContain("[رقم هاتف مشفر ومحمي تلقائياً]");
    expect(maskPhoneNumbers("رقم 07.70.99.88.77")).toContain("[رقم هاتف مشفر ومحمي تلقائياً]");
  });

  it("masks single-spaced spaced numbers (e.g. 0 5 5 0 1 2 3 4 5 6)", () => {
    expect(maskPhoneNumbers("تواصل 0 5 5 0 1 2 3 4 5 6 شكرا")).toContain(
      "[رقم هاتف مشفر ومحمي تلقائياً]",
    );
  });

  it("masks international formats (+213 / 00213)", () => {
    expect(maskPhoneNumbers("واتساب +213550123456")).toContain("[رقم هاتف مشفر ومحمي تلقائياً]");
    expect(maskPhoneNumbers("اتصال 00213661223344")).toContain("[رقم هاتف مشفر ومحمي تلقائياً]");
  });

  it("masks Arabic-Indic numerals", () => {
    expect(maskPhoneNumbers("اتصل بي على ٠٥٥٠١٢٣٤٥٦")).toContain("[رقم هاتف مشفر ومحمي تلقائياً]");
  });

  it("does NOT mask genuine prices, surface areas, or room counts", () => {
    const text = "شقة F3 بمساحة 120 م² وسعر 18000000 د.ج قابلة للتفاوض الطابق 4";
    expect(maskPhoneNumbers(text)).toBe(text);
    expect(containsPhoneNumber(text)).toBe(false);
  });

  it("masks phone numbers embedded inside a description while keeping other details", () => {
    const desc = "فيلا للبيع في درارية بسعر 45000000 د.ج للاتصال 0555123456 مرحبا بكم";
    const masked = maskPhoneNumbers(desc);
    expect(masked).toContain("45000000 د.ج");
    expect(masked).toContain("[رقم هاتف مشفر ومحمي تلقائياً]");
    expect(masked).not.toContain("0555123456");
  });
});
