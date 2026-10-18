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

const img = (q: string) => `https://images.unsplash.com/${q}?auto=format&fit=crop&w=900&q=70`;

export const properties: Property[] = [
  { id: "1", title: "شقة F3 مطلة على البحر", type: "شقة", wilaya: "الجزائر", commune: "باب الزوار", price: 55000, rooms: 3, area: 85, description: "شقة مجهزة بالكامل في الطابق الرابع مع مصعد، قريبة من الترامواي والمرافق.", owner: "كريم بن علي", status: "نشط", image: img("photo-1502672260266-1c1ef2d93688") },
  { id: "2", title: "فيلا عصرية مع حديقة", type: "فيلا", wilaya: "وهران", commune: "عين الترك", price: 180000, rooms: 5, area: 320, description: "فيلا من طابقين مع حديقة ومرآب لسيارتين، حي هادئ وآمن.", owner: "سارة مداني", status: "نشط", image: img("photo-1600596542815-ffad4c1539a9") },
  { id: "3", title: "استوديو قرب الجامعة", type: "استوديو", wilaya: "قسنطينة", commune: "علي منجلي", price: 25000, rooms: 1, area: 35, description: "استوديو مثالي للطلبة، مفروش مع إنترنت.", owner: "يوسف عمراني", status: "نشط", image: img("photo-1522708323590-d24dbb6b0267") },
  { id: "4", title: "محل تجاري في شارع رئيسي", type: "محل تجاري", wilaya: "سطيف", commune: "العلمة", price: 70000, rooms: 1, area: 60, description: "محل بواجهة زجاجية في شارع تجاري حيوي.", owner: "نبيل حداد", status: "قيد المراجعة", image: img("photo-1441986300917-64674bd600d8") },
  { id: "5", title: "منزل تقليدي مرمم", type: "منزل", wilaya: "تلمسان", commune: "تلمسان", price: 45000, rooms: 4, area: 140, description: "منزل بطابع أندلسي مع فناء داخلي.", owner: "أمينة بلقاسم", status: "نشط", image: img("photo-1568605114967-8130f3a36994") },
  { id: "6", title: "شقة F4 في حيدرة", type: "شقة", wilaya: "الجزائر", commune: "حيدرة", price: 120000, rooms: 4, area: 130, description: "شقة راقية مع شرفة واسعة وموقف سيارات.", owner: "رضا شريف", status: "مؤجر", image: img("photo-1560448204-e02f11c3d0e2") },
];

export type RentalRequest = {
  id: string; title: string; type: string; wilaya: string; commune: string;
  budget: number; rooms: number; details: string; author: string; date: string;
};

export const requests: RentalRequest[] = [
  { id: "1", title: "أبحث عن شقة F3 لعائلة صغيرة", type: "شقة", wilaya: "الجزائر", commune: "القبة", budget: 50000, rooms: 3, details: "عائلة من 4 أفراد، نفضل قرب المدارس.", author: "محمد ب.", date: "2026-10-15" },
  { id: "2", title: "مطلوب محل للإيجار", type: "محل تجاري", wilaya: "وهران", commune: "وهران", budget: 80000, rooms: 1, details: "لنشاط ملابس، مساحة 50م² على الأقل.", author: "ليلى ك.", date: "2026-10-14" },
  { id: "3", title: "استوديو لطالب", type: "استوديو", wilaya: "قسنطينة", commune: "الخروب", budget: 20000, rooms: 1, details: "قريب من المواصلات.", author: "أنيس ر.", date: "2026-10-12" },
  { id: "4", title: "فيلا لموسم الصيف", type: "فيلا", wilaya: "بجاية", commune: "تيشي", budget: 150000, rooms: 4, details: "لمدة شهرين، قرب الشاطئ.", author: "حسين م.", date: "2026-10-10" },
];

export const fees = {
  publish: 0,
  featured: 1500,
  dealTenant: 3000,
  dealOwner: 5000,
};

export const formatDA = (n: number) => `${n.toLocaleString("ar-DZ")} د.ج`;
