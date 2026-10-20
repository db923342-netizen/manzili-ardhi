export const wilayas: Record<string, string[]> = {
  "الجزائر": ["باب الزوار", "حيدرة", "بئر مراد رايس", "الدار البيضاء", "القبة"],
  "وهران": ["وهران", "بئر الجير", "السانيا", "عين الترك"],
  "قسنطينة": ["قسنطينة", "الخروب", "علي منجلي", "حامة بوزيان"],
  "البليدة": ["البليدة", "بوفاريك", "العفرون"],
  "سطيف": ["سطيف", "العلمة", "عين ولمان"],
  "عنابة": ["عنابة", "البوني", "سيدي عمار"],
  "تيزي وزو": ["تيزي وزو", "عزازقة", "ذراع بن خدة"],
  "تلمسان": ["تلمسان", "مغنية", "الرمشي"],
  "بجاية": ["بجاية", "أقبو", "تيشي"],
  "ورقلة": ["ورقلة", "حاسي مسعود", "تقرت"],
};

export const propertyTypes = ["شقة", "فيلا", "منزل", "أرض", "محل تجاري", "مكتب", "استوديو"];

export type Property = {
  id: string; title: string; type: string; wilaya: string; commune: string;
  price: number; rooms: number; area: number; description: string; owner: string;
  status: "نشط" | "قيد المراجعة" | "مؤجر"; image: string;
};


export type RentalRequest = {
  id: string; title: string; type: string; wilaya: string; commune: string;
  budget: number; rooms: number; details: string; author: string; date: string;
};


export const fees = {
  publish: 0,
  featured: 1000,
  dealTenant: 1000,
  dealOwner: 1000,
};

export const formatDA = (n: number) => `${n.toLocaleString("ar-DZ")} د.ج`;
