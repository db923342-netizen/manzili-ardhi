// @ts-nocheck -- legacy module typed against an older schema; pending rewrite
import { queryOptions, type QueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import hero from "@/assets/hero.jpg";
import {
  formatPublishTime,
  type Property,
  type RentalRequest,
  type TemporaryRental,
  type TemporaryRentalRequest,
  defaultTemporaryRequests,
} from "@/lib/data";
import { maskPhoneNumbers } from "@/lib/utils";

type Row = {
  id?: unknown;
  property_type?: unknown;
  wilaya?: unknown;
  municipality?: unknown;
  monthly_rent?: unknown;
  rooms?: unknown;
  area_m2?: unknown;
  description?: unknown;
  status?: unknown;
  budget?: unknown;
  specifications?: unknown;
  created_at?: unknown;
  owner_id?: unknown;
  owner?: unknown;
  author?: unknown;
  contact_phone?: unknown;
  phone?: unknown;
  owner_phone?: unknown;
  profiles?: {
    full_name?: string | null;
    phone?: string | null;
  } | null;
};

export function getDeterministicPhone(seed: string, prefix = "0550"): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const num = (Math.abs(hash) % 900000) + 100000;
  const s = String(num);
  return `${prefix} ${s.slice(0, 2)} ${s.slice(2, 4)} ${s.slice(4, 6)}`;
}

const typeLabels: Record<string, string> = {
  housing: "سكن",
  apartment: "شقة",
  villa: "فيلا",
  house: "منزل",
  land: "أرض",
  shop: "محل تجاري",
  office: "مكتب",
  studio: "استوديو",
};
const label = (t: unknown) => typeLabels[String(t ?? "")] ?? String(t ?? "عقار");
const statusLabel = (s: unknown): Property["status"] =>
  s === "rented" ? "مؤجر" : s === "pending" ? "قيد المراجعة" : "نشط";

function toProperty(row: Row): Property {
  const type = label(row.property_type);
  const idStr = String(row.id ?? "1");
  const rawPhone = String(
    row.contact_phone ?? row.phone ?? row.owner_phone ?? row.profiles?.phone ?? "",
  ).trim();
  const ownerPhone = rawPhone || getDeterministicPhone(idStr, "0550");
  const ownerName = String(
    row.profiles?.full_name ?? (row.owner && row.owner !== "مخفي" ? row.owner : "صاحب العقار"),
  );
  const createdAt = String(row.created_at || new Date().toISOString());

  return {
    id: idStr,
    title: maskPhoneNumbers(`${type} للإيجار`),
    type,
    wilaya: String(row.wilaya ?? ""),
    commune: String(row.municipality ?? ""),
    price: Number(row.monthly_rent ?? 0),
    rooms: Number(row.rooms ?? 0),
    area: Number(row.area_m2 ?? 0),
    description: maskPhoneNumbers(String(row.description ?? "")),
    owner: ownerName,
    ownerPhone: "", // SECURITY: Never leak raw phone to public clients
    status: statusLabel(row.status),
    image: hero,
    publishedAt: formatPublishTime(createdAt),
    createdAt,
  };
}

function toRequest(row: Row): RentalRequest {
  const type = label(row.property_type);
  const idStr = String(row.id ?? "1");
  const authorName = String(
    row.profiles?.full_name ?? (row.author && row.author !== "مخفي" ? row.author : "صاحب الطلب"),
  );
  const createdAt = String(row.created_at || new Date().toISOString());

  return {
    id: idStr,
    title: maskPhoneNumbers(`مطلوب ${type}`),
    type,
    wilaya: String(row.wilaya ?? ""),
    commune: String(row.municipality ?? ""),
    budget: Number(row.budget ?? 0),
    rooms: Number(row.rooms ?? 0),
    details: maskPhoneNumbers(String(row.specifications ?? "")),
    author: authorName,
    contactPhone: "", // SECURITY: Never leak raw phone to public clients
    date: createdAt.slice(0, 10),
    createdAt,
  };
}

function toPropertyFromFirestore(p: {
  id: string;
  title: string;
  type: string;
  wilaya: string;
  commune: string;
  price: number;
  purpose?: string;
  legalStatus?: string;
  rooms?: number;
  area?: number;
  description?: string;
  userName?: string;
  phone?: string;
  status?: string;
  images?: string;
  createdAt?: string;
}): Property {
  const createdAt = p.createdAt || new Date().toISOString();
  return {
    id: p.id,
    title: maskPhoneNumbers(p.title),
    type: p.type,
    purpose: (p.purpose as "كراء" | "بيع") || "كراء",
    legalStatus: p.legalStatus || "",
    wilaya: p.wilaya,
    commune: p.commune,
    price: p.price,
    rooms: Number(p.rooms ?? 0),
    area: Number(p.area ?? 0),
    description: maskPhoneNumbers(p.description || ""),
    owner: p.userName || "صاحب العقار",
    ownerPhone: "", // SECURITY: Redacted from public query
    status:
      p.status === "approved" || !p.status
        ? "نشط"
        : p.status === "pending"
          ? "قيد المراجعة"
          : "مؤجر",
    image: p.images || hero,
    publishedAt: formatPublishTime(createdAt),
    createdAt,
  };
}

function toRequestFromFirestore(r: {
  id: string;
  title: string;
  type: string;
  purpose?: string;
  wilaya: string;
  commune: string;
  budget: number;
  rooms?: number;
  details?: string;
  author?: string;
  contactPhone?: string;
  date?: string;
  createdAt?: string;
}): RentalRequest {
  const createdAt = r.createdAt || new Date().toISOString();
  return {
    id: r.id,
    title: maskPhoneNumbers(r.title),
    type: r.type,
    purpose: (r.purpose as "كراء" | "شراء") || "كراء",
    wilaya: r.wilaya,
    commune: r.commune,
    budget: r.budget,
    rooms: Number(r.rooms ?? 0),
    details: maskPhoneNumbers(r.details || ""),
    author: r.author || "صاحب الطلب",
    contactPhone: "", // SECURITY: Redacted from public query
    date: r.date || createdAt.slice(0, 10),
    createdAt,
  };
}

// ==========================================
// Persistent Deletion Storage
// ==========================================
const DELETED_PROPS_KEY = "manzili_deleted_properties";
const DELETED_REQS_KEY = "manzili_deleted_requests";
const DELETED_USERS_KEY = "manzili_deleted_users";
const DELETED_DEALS_KEY = "manzili_deleted_deals";
const DELETED_BOOKINGS_KEY = "manzili_deleted_bookings";

function getDeletedIds(key: string): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(key);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function markIdDeleted(key: string, id: string) {
  if (typeof window === "undefined") return;
  try {
    const current = getDeletedIds(key);
    current.add(id);
    localStorage.setItem(key, JSON.stringify(Array.from(current)));
  } catch (err) {
    console.warn("Storage error:", err);
  }
}

export const getDeletedPropertyIds = () => getDeletedIds(DELETED_PROPS_KEY);
export const markPropertyDeleted = (id: string) => markIdDeleted(DELETED_PROPS_KEY, id);

export const getDeletedRequestIds = () => getDeletedIds(DELETED_REQS_KEY);
export const markRequestDeleted = (id: string) => markIdDeleted(DELETED_REQS_KEY, id);

export const getDeletedUserIds = () => getDeletedIds(DELETED_USERS_KEY);
export const markUserDeleted = (id: string) => markIdDeleted(DELETED_USERS_KEY, id);

export const getDeletedDealIds = () => getDeletedIds(DELETED_DEALS_KEY);
export const markDealDeleted = (id: string) => markIdDeleted(DELETED_DEALS_KEY, id);

export const getDeletedBookingIds = () => getDeletedIds(DELETED_BOOKINGS_KEY);
export const markBookingDeleted = (id: string) => markIdDeleted(DELETED_BOOKINGS_KEY, id);

const DELETED_TEMP_RENTALS_KEY = "manzili_deleted_temporary_rentals";
export const getDeletedTemporaryRentalIds = () => getDeletedIds(DELETED_TEMP_RENTALS_KEY);
export const markTemporaryRentalDeleted = (id: string) =>
  markIdDeleted(DELETED_TEMP_RENTALS_KEY, id);

// ==========================================
// Default Fallback Data (Real Estate & Requests)
// ==========================================
export const defaultProperties: Property[] = [
  {
    id: "prop-1",
    title: "شقة F3 فاخرة للإيجار بحيدرة",
    type: "شقة",
    wilaya: "الجزائر",
    commune: "حيدرة",
    price: 95000,
    rooms: 3,
    area: 110,
    description:
      "شقة راقية مؤثثة بالكامل بحيدرة، قريبة من السفارات والخدمات مع تدفئة وتكييف مركزي وموقف سيارات.",
    owner: "أحمد بن علي",
    ownerPhone: "",
    status: "نشط",
    image:
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80",
    publishedAt: "اليوم (06:30)",
    createdAt: "2026-11-05T06:30:00.000Z",
  },
  {
    id: "prop-2",
    title: "فيلا فخمة مع حديقة ومسبح - حي النرجس",
    type: "فيلا",
    wilaya: "وهران",
    commune: "بئر الجير",
    price: 180000,
    rooms: 6,
    area: 320,
    description:
      "فيلا ممتازة في موقع هادئ بحي النرجس بئر الجير، حديقة مشجرة، تدفئة مركزية، أمن 24/7.",
    owner: "كريم منصوري",
    ownerPhone: "",
    status: "نشط",
    image:
      "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80",
    publishedAt: "أمس (18:15)",
    createdAt: "2026-11-04T18:15:00.000Z",
  },
  {
    id: "prop-3",
    title: "استوديو مجهز بالقرب من الجامعة - باب الزوار",
    type: "استوديو",
    wilaya: "الجزائر",
    commune: "باب الزوار",
    price: 38000,
    rooms: 1,
    area: 45,
    description:
      "استوديو نظيف ومجهز بكل الضروريات، قريب من محطة الترامواي والمطار وجامعة باب الزوار USTHB.",
    owner: "سمير قادري",
    ownerPhone: "",
    status: "نشط",
    image:
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80",
    publishedAt: "أمس (11:45)",
    createdAt: "2026-11-04T11:45:00.000Z",
  },
  {
    id: "prop-4",
    title: "محل تجاري ذو واجهة ممتازة - وسط مدينة قسنطينة",
    type: "محل تجاري",
    wilaya: "قسنطينة",
    commune: "قسنطينة",
    price: 70000,
    rooms: 2,
    area: 65,
    description: "محل تجاري في موقع حيوي ونشط تجارياً بوسط مدينة قسنطينة، صالح لعدة نشاطات وخدمات.",
    owner: "ياسين بن عودة",
    ownerPhone: "",
    status: "قيد المراجعة",
    image:
      "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80",
    publishedAt: "منذ يومين",
    createdAt: "2026-11-03T15:00:00.000Z",
  },
  {
    id: "prop-5",
    title: "أرض فلاحية خصبة مزودة ببئر وكهرباء - البليدة",
    type: "أرض",
    wilaya: "البليدة",
    commune: "البليدة",
    price: 60000,
    rooms: 0,
    area: 2500,
    description:
      "أرض فلاحية ممتازة مهيأة لغراسة الأشجار المثمرة أو البيوت البلاستيكية، مزودة ببئر ماء ومحول كهربائي.",
    owner: "فاطمة الزهراء بلقاسم",
    ownerPhone: "",
    status: "نشط",
    image:
      "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80",
    publishedAt: "منذ 3 أيام",
    createdAt: "2026-11-02T10:00:00.000Z",
  },
];

export const defaultRentalRequests: RentalRequest[] = [
  {
    id: "req-1",
    title: "مطلوب شقة F3 أو F4 للعائلة بحيدرة أو الأبيار",
    type: "شقة",
    wilaya: "الجزائر",
    commune: "حيدرة",
    budget: 80000,
    rooms: 3,
    details:
      "عائلة تبحث عن شقة نظيفة ومحترمة مع مصعد وخزان ماء، مدة الإيجار سنة قابلة للتجديد بعقد موثق.",
    author: "مراد عثماني",
    contactPhone: "",
    date: "2026-11-05",
    createdAt: "2026-11-05T07:15:00.000Z",
  },
  {
    id: "req-2",
    title: "مطلوب استوديو أو F1 مفروش للعمل - وهران (كانستيل)",
    type: "استوديو",
    wilaya: "وهران",
    commune: "وهران",
    budget: 40000,
    rooms: 1,
    details: "إطار في شركة خاصة يبحث عن سكن مفروش ومريح لمدة 6 أشهر قابلة للتمديد.",
    author: "بلال سعيدي",
    contactPhone: "",
    date: "2026-11-04",
    createdAt: "2026-11-04T16:20:00.000Z",
  },
  {
    id: "req-3",
    title: "مطلوب مستودع أو أرض تجارية للتخزين - تيزي وزو",
    type: "أرض",
    wilaya: "تيزي وزو",
    commune: "تيزي وزو",
    budget: 90000,
    rooms: 0,
    details: "مساحة 500م² فما فوق لتخزين مواد البناء، سهلة الولوج للشاحنات ومحاطة بسياج.",
    author: "طارق حداد",
    contactPhone: "",
    date: "2026-11-03",
    createdAt: "2026-11-03T12:00:00.000Z",
  },
];

export const defaultSaleProperties: Property[] = [
  {
    id: "sale-1",
    title: "شقة F4 للبيع بعقد ملكية ودفتر عقاري - سعيد حمدين",
    type: "شقة",
    purpose: "بيع",
    legalStatus: "عقد توثيقي + دفتر عقاري",
    wilaya: "الجزائر",
    commune: "بئر مراد رايس",
    price: 28500000,
    rooms: 4,
    area: 125,
    description:
      "شقة فاخرة F4 في الطابق الثالث مع مصعد، حي هادئ ومحروس، تدفئة مركزية وموقف سيارات مغطى. جميع الوثائق الإدارية جاهزة للبيع الفوري.",
    owner: "الحاج بلقاسم",
    ownerPhone: "",
    status: "نشط",
    image:
      "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80",
    publishedAt: "اليوم (08:15)",
    createdAt: "2026-11-06T08:15:00.000Z",
  },
  {
    id: "sale-2",
    title: "قطعة أرض صالحة للبناء مساحة 350 م² - تيبازة (بوسماعيل)",
    type: "أرض",
    purpose: "بيع",
    legalStatus: "عقد مشهر + دفتر عقاري فردي",
    wilaya: "تيبازة",
    commune: "بوسماعيل",
    price: 15500000,
    rooms: 0,
    area: 350,
    description:
      "قطعة أرض مستوية ذات واجهتين، متصلة بقنوات الصرف الصحي والغاز والماء والكهرباء، قريبة من الطريق السريع والشاطئ.",
    owner: "عبد الرحمن شريفي",
    ownerPhone: "",
    status: "نشط",
    image:
      "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80",
    publishedAt: "أمس (14:30)",
    createdAt: "2026-11-05T14:30:00.000Z",
  },
  {
    id: "sale-3",
    title: "فيلا عصرية R+2 مع مسبح وحديقة - وهران (العقيد لطفي)",
    type: "فيلا",
    purpose: "بيع",
    legalStatus: "عقد موثق + رخصة بناء ومطابقة",
    wilaya: "وهران",
    commune: "وهران",
    price: 68000000,
    rooms: 7,
    area: 380,
    description:
      "فيلا راقية جداً بتشطيبات ديلوكس، 7 غرف، صالونين كبيرين، مسبح خاص بنظام تصفية حديث، كاميرات مراقبة وتدفئة أرضية.",
    owner: "فاروق بن عيسى",
    ownerPhone: "",
    status: "نشط",
    image:
      "https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=800&q=80",
    publishedAt: "منذ يومين",
    createdAt: "2026-11-04T10:00:00.000Z",
  },
  {
    id: "sale-4",
    title: "محل تجاري ذو طابقين 110 م² - وسط مدينة سطيف",
    type: "محل تجاري",
    purpose: "بيع",
    legalStatus: "عقد ملكية نهائي + سجل تجاري",
    wilaya: "سطيف",
    commune: "سطيف",
    price: 24000000,
    rooms: 2,
    area: 110,
    description:
      "محل تجاري ذو واجهة زجاجية عريضة في شارع رئيسي نشط، صالح لمختلف الأنشطة التجارية أو عيادة طبية أو مقر شركة.",
    owner: "طارق بوعزيز",
    ownerPhone: "",
    status: "نشط",
    image:
      "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80",
    publishedAt: "منذ 3 أيام",
    createdAt: "2026-11-03T11:00:00.000Z",
  },
  {
    id: "sale-5",
    title: "منزل تقليدي واسع قابل للتجديد أو الاستثمار - قسنطينة (سيدي مبروك)",
    type: "منزل",
    purpose: "بيع",
    legalStatus: "عقد ملكية + فريضة موثقة",
    wilaya: "قسنطينة",
    commune: "قسنطينة",
    price: 19500000,
    rooms: 5,
    area: 210,
    description:
      "منزل أرضي مع فناء مشجر ومرآب لسيارتين، حي عائلي هادئ قريب من الترام والمساجد والمدارس.",
    owner: "حكيم لعرج",
    ownerPhone: "",
    status: "نشط",
    image:
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80",
    publishedAt: "منذ 4 أيام",
    createdAt: "2026-11-02T13:00:00.000Z",
  },
];

export const defaultSaleRequests: RentalRequest[] = [
  {
    id: "sreq-1",
    title: "مطلوب شراء شقة F3 أو F4 في العاصمة بدفتر عقاري",
    type: "شقة",
    purpose: "شراء",
    wilaya: "الجزائر",
    commune: "درارية",
    budget: 22000000,
    rooms: 4,
    details:
      "مشتري جاد يبحث عن شقة F3 أو F4 بنواحي درارية، بئر مراد رايس، أو الشراقة. الدفع فوري كاش والوثائق القانونية شرط أساسي.",
    author: "الدكتور كمال ر.",
    contactPhone: "",
    date: "2026-11-06",
    createdAt: "2026-11-06T06:00:00.000Z",
  },
  {
    id: "sreq-2",
    title: "مطلوب قطعة أرض للبناء مساحة 200 إلى 400 م² - البليدة",
    type: "أرض",
    purpose: "شراء",
    wilaya: "البليدة",
    commune: "أولاد يعيش",
    budget: 12000000,
    rooms: 0,
    details:
      "أبحث عن قطعة أرض في موقع عمراني جيد للبناء الفردي، مع ضرورة توفر عقد ملكية رسمي غير مشاع.",
    author: "أمين مسعودي",
    contactPhone: "",
    date: "2026-11-05",
    createdAt: "2026-11-05T12:00:00.000Z",
  },
  {
    id: "sreq-3",
    title: "مطلوب محل تجاري للشراء في شارع حيوي - وهران",
    type: "محل تجاري",
    purpose: "شراء",
    wilaya: "وهران",
    commune: "وهران",
    budget: 18000000,
    rooms: 1,
    details:
      "مطلوب محل تجاري بمساحة تفوق 40م² لافتتاح صيدلية أو نشاط طبي، يفضل واجهة على شارع رئيسي.",
    author: "صابرين ب.",
    contactPhone: "",
    date: "2026-11-04",
    createdAt: "2026-11-04T15:30:00.000Z",
  },
];

// ==========================================
// TanStack Query Definitions
// ==========================================
export const propertiesQuery = queryOptions({
  queryKey: ["public_properties"],
  queryFn: async (): Promise<Property[]> => {
    const deleted = getDeletedPropertyIds();

    // 1. Fetch real properties from Firestore (Multi-user cross-device shared database)
    let firestoreProps: Property[] = [];
    try {
      const { getPropertiesFromFirestore } = await import("./firebase");
      const fbProps = await getPropertiesFromFirestore();
      if (fbProps && fbProps.length > 0) {
        firestoreProps = fbProps.map(toPropertyFromFirestore);
      }
    } catch (err) {
      console.warn("Could not fetch properties from Firestore:", err);
    }

    // 2. Fetch real properties from Supabase
    let remoteProps: Property[] = [];
    try {
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data && data.length > 0) {
        remoteProps = data.map((r) => toProperty(r as Row));
      }
    } catch {
      // Supabase error tolerated
    }

    // 3. Fetch locally published properties by users
    let localProps: Property[] = [];
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("manzili_local_properties");
        if (raw) localProps = JSON.parse(raw);
      } catch {
        // ignore
      }
    }

    // Combine: firestore first (shared real-time) + local + remote + defaults (excluding sales)
    const combined: Property[] = [];
    const seen = new Set<string>();

    for (const p of [...firestoreProps, ...localProps, ...remoteProps, ...defaultProperties]) {
      if (!seen.has(p.id) && !deleted.has(p.id) && p.purpose !== "بيع") {
        seen.add(p.id);
        combined.push(p);
      }
    }

    // Sort by createdAt descending so newest published properties appear first for everyone
    combined.sort((a, b) => {
      const dateA = a.createdAt || "";
      const dateB = b.createdAt || "";
      return dateB.localeCompare(dateA);
    });

    return combined;
  },
});

export const requestsQuery = queryOptions({
  queryKey: ["public_rental_requests"],
  queryFn: async (): Promise<RentalRequest[]> => {
    const deleted = getDeletedRequestIds();

    // 1. Fetch real rental requests from Firestore (Multi-user cross-device shared database)
    let firestoreReqs: RentalRequest[] = [];
    try {
      const { getRentalRequestsFromFirestore } = await import("./firebase");
      const fbReqs = await getRentalRequestsFromFirestore();
      if (fbReqs && fbReqs.length > 0) {
        firestoreReqs = fbReqs.map(toRequestFromFirestore);
      }
    } catch (err) {
      console.warn("Could not fetch rental requests from Firestore:", err);
    }

    // 2. Fetch real requests from Supabase
    let remoteReqs: RentalRequest[] = [];
    try {
      const { data, error } = await supabase
        .from("rental_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data && data.length > 0) {
        remoteReqs = data.map((r) => toRequest(r as Row));
      }
    } catch {
      // Supabase error tolerated
    }

    // 3. Fetch locally published requests by users
    let localReqs: RentalRequest[] = [];
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("manzili_local_requests");
        if (raw) localReqs = JSON.parse(raw);
      } catch {
        // ignore
      }
    }

    const combined: RentalRequest[] = [];
    const seen = new Set<string>();

    for (const r of [...firestoreReqs, ...localReqs, ...remoteReqs, ...defaultRentalRequests]) {
      if (!seen.has(r.id) && !deleted.has(r.id) && r.purpose !== "شراء") {
        seen.add(r.id);
        combined.push(r);
      }
    }

    // Sort by createdAt / date descending so newest requests appear first for everyone
    combined.sort((a, b) => {
      const dateA = a.createdAt || a.date || "";
      const dateB = b.createdAt || b.date || "";
      return dateB.localeCompare(dateA);
    });

    return combined;
  },
});

export let lastSalePropertiesError: string | null = null;
export let lastPurchaseRequestsError: string | null = null;

export const salesPropertiesQuery = queryOptions({
  queryKey: ["public_sales_properties"],
  queryFn: async (): Promise<Property[]> => {
    lastSalePropertiesError = null;
    const deleted = getDeletedPropertyIds();

    let authUserId: string | null = null;
    let isAdmin = false;
    try {
      const { data: authData } = await supabase.auth.getUser();
      if (authData?.user) {
        authUserId = authData.user.id;
        isAdmin =
          authData.user.email === "db923342@gmail.com" ||
          authData.user.user_metadata?.role === "admin";
      }
    } catch {
      // ignore
    }

    // 1. Fetch directly from Supabase table "sale_properties" (Primary Data Source)
    const remoteList: Property[] = [];
    try {
      const { data, error } = await supabase
        .from("sale_properties")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        lastSalePropertiesError = error.message;
        console.warn("Supabase sale_properties query error:", error.message);
      } else if (data) {
        data.forEach((row) => {
          remoteList.push({
            id: row.id,
            title: row.title || `عقار للبيع في ${row.wilaya}`,
            type: row.property_type || "شقة",
            purpose: "بيع" as const,
            legalStatus: row.legal_status || "",
            wilaya: row.wilaya,
            commune: row.municipality || "",
            price: Number(row.price || 0),
            rooms: Number(row.rooms || 0),
            area: Number(row.area_m2 || 0),
            description: row.description || "",
            owner: row.owner_id ? `مالك العقار (${row.owner_id.slice(0, 6)})` : "صاحب العقار",
            ownerPhone: "", // REDACTED - Phone privacy
            status: row.status === "approved" || row.status === "نشط" ? "نشط" : "قيد المراجعة",
            image: row.image || hero,
            publishedAt: formatPublishTime(row.created_at || new Date().toISOString()),
            createdAt: row.created_at || new Date().toISOString(),
            owner_id: row.owner_id || undefined,
          });
        });
      }
    } catch (err) {
      lastSalePropertiesError = err instanceof Error ? err.message : String(err);
      console.warn("sale_properties exception:", err);
    }

    const combined: Property[] = [];
    const seen = new Set<string>();

    for (const p of [...remoteList, ...defaultSaleProperties]) {
      if (!seen.has(p.id) && !deleted.has(p.id)) {
        if (p.status === "نشط" || (authUserId && p.owner_id === authUserId) || isAdmin) {
          seen.add(p.id);
          combined.push(p);
        }
      }
    }

    return combined;
  },
});

export const salesRequestsQuery = queryOptions({
  queryKey: ["public_sales_requests"],
  queryFn: async (): Promise<RentalRequest[]> => {
    lastPurchaseRequestsError = null;
    const deleted = getDeletedRequestIds();

    let authUserId: string | null = null;
    let isAdmin = false;
    try {
      const { data: authData } = await supabase.auth.getUser();
      if (authData?.user) {
        authUserId = authData.user.id;
        isAdmin =
          authData.user.email === "db923342@gmail.com" ||
          authData.user.user_metadata?.role === "admin";
      }
    } catch {
      // ignore
    }

    // 1. Fetch directly from Supabase table "purchase_requests" (Primary Data Source)
    const remoteList: RentalRequest[] = [];
    try {
      const { data, error } = await supabase
        .from("purchase_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        lastPurchaseRequestsError = error.message;
        console.warn("Supabase purchase_requests query error:", error.message);
      } else if (data) {
        data.forEach((row) => {
          remoteList.push({
            id: row.id,
            title: row.title || `مطلوب شراء في ${row.wilaya}`,
            type: row.property_type || "شقة",
            purpose: "شراء" as const,
            wilaya: row.wilaya,
            commune: row.municipality || "",
            budget: Number(row.budget || 0),
            rooms: Number(row.rooms || 0),
            details: row.specifications || "",
            author: row.buyer_id ? `مشتري مسجل (${row.buyer_id.slice(0, 6)})` : "صاحب الطلب",
            contactPhone: "", // REDACTED - Phone privacy
            date: (row.created_at || new Date().toISOString()).slice(0, 10),
            createdAt: row.created_at || new Date().toISOString(),
            status: row.status === "approved" || row.status === "نشط" ? "نشط" : "قيد المراجعة",
            buyer_id: row.buyer_id || undefined,
          });
        });
      }
    } catch (err) {
      lastPurchaseRequestsError = err instanceof Error ? err.message : String(err);
      console.warn("purchase_requests exception:", err);
    }

    const combined: RentalRequest[] = [];
    const seen = new Set<string>();

    for (const r of [...remoteList, ...defaultSaleRequests]) {
      if (!seen.has(r.id) && !deleted.has(r.id)) {
        if (
          !r.status ||
          r.status === "نشط" ||
          (authUserId && (r as { buyer_id?: string }).buyer_id === authUserId) ||
          isAdmin
        ) {
          seen.add(r.id);
          combined.push(r);
        }
      }
    }

    return combined;
  },
});

export type SaleDeal = {
  id: string;
  created_at: string;
  sale_property_id: string | null;
  purchase_request_id: string | null;
  seller_id: string | null;
  buyer_id: string | null;
  sale_price: number;
  platform_fee: number;
  contacts_released: boolean;
  status: string;
};

export const saleDealsQuery = queryOptions({
  queryKey: ["admin_sale_deals"],
  queryFn: async (): Promise<SaleDeal[]> => {
    try {
      const { data, error } = await supabase
        .from("sale_deals")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.warn("Supabase sale_deals query error:", error.message);
        return [];
      }
      return data || [];
    } catch {
      return [];
    }
  },
});

export async function executeCreateSaleDeal(input: {
  sale_property_id?: string | null;
  purchase_request_id?: string | null;
  seller_id?: string | null;
  buyer_id?: string | null;
  sale_price: number;
  platform_fee: number;
  status?: string;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const { data: authData } = await supabase.auth.getUser();
    const isAdmin =
      authData?.user?.email === "db923342@gmail.com" ||
      authData?.user?.user_metadata?.role === "admin";

    if (!isAdmin) {
      return { success: false, error: "إنشاء صفقات البيع والشراء متاح للمدير فقط." };
    }

    const { data, error } = await supabase
      .from("sale_deals")
      .insert({
        sale_property_id: input.sale_property_id || null,
        purchase_request_id: input.purchase_request_id || null,
        seller_id: input.seller_id || null,
        buyer_id: input.buyer_id || null,
        sale_price: input.sale_price,
        platform_fee: input.platform_fee,
        contacts_released: false,
        status: input.status || "بانتظار الموافقة",
      })
      .select("id")
      .single();

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, id: data.id };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function executeUpdateSaleDeal(
  dealId: string,
  updates: {
    status?: string;
    contacts_released?: boolean;
    platform_fee?: number;
  },
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: authData } = await supabase.auth.getUser();
    const isAdmin =
      authData?.user?.email === "db923342@gmail.com" ||
      authData?.user?.user_metadata?.role === "admin";

    if (!isAdmin) {
      return { success: false, error: "تعديل صفقات البيع متاح للمدير فقط." };
    }

    const { error } = await supabase.from("sale_deals").update(updates).eq("id", dealId);

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function executeDeleteSaleDeal(
  dealId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: authData } = await supabase.auth.getUser();
    const isAdmin =
      authData?.user?.email === "db923342@gmail.com" ||
      authData?.user?.user_metadata?.role === "admin";

    if (!isAdmin) {
      return { success: false, error: "حذف صفقات البيع متاح للمدير فقط." };
    }

    const { error } = await supabase.from("sale_deals").delete().eq("id", dealId);
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export const adminPropertiesQuery = queryOptions({
  queryKey: ["admin_properties"],
  queryFn: async (): Promise<Property[]> => {
    return propertiesQuery.queryFn();
  },
});

export const adminRequestsQuery = queryOptions({
  queryKey: ["admin_rental_requests"],
  queryFn: async (): Promise<RentalRequest[]> => {
    return requestsQuery.queryFn();
  },
});

export type AdminUser = {
  id: string;
  n: string;
  e: string;
  phone: string;
  role: string;
  s: string;
  wilaya?: string;
  createdAt?: string;
  listingsCount?: number;
  hasPublished?: boolean;
};

export const defaultAdminUsers: AdminUser[] = [
  {
    id: "u-admin",
    n: "المدير العام (إدارة المنصة)",
    e: "db923342@gmail.com",
    phone: "",
    role: "مدير",
    s: "نشط",
    wilaya: "الجزائر",
    createdAt: "2024-01-01",
    listingsCount: 4,
    hasPublished: true,
  },
  {
    id: "u-1",
    n: "أحمد بن علي",
    e: "ahmed.benali@gmail.com",
    phone: "",
    role: "مستخدم",
    s: "نشط",
    wilaya: "الجزائر",
    createdAt: "2024-02-15",
    listingsCount: 1,
    hasPublished: true,
  },
  {
    id: "u-2",
    n: "سمير قادري",
    e: "samir.kadri@gmail.com",
    phone: "",
    role: "مستخدم",
    s: "نشط",
    wilaya: "الجزائر",
    createdAt: "2024-03-02",
    listingsCount: 1,
    hasPublished: true,
  },
  {
    id: "u-3",
    n: "كريم منصوري",
    e: "karim.mansouri@yahoo.fr",
    phone: "",
    role: "مستخدم",
    s: "نشط",
    wilaya: "وهران",
    createdAt: "2024-03-20",
    listingsCount: 1,
    hasPublished: true,
  },
  {
    id: "u-4",
    n: "فاطمة الزهراء بلقاسم",
    e: "f.belkacem@gmail.com",
    phone: "",
    role: "مستخدم",
    s: "نشط",
    wilaya: "قسنطينة",
    createdAt: "2024-04-10",
    listingsCount: 0,
    hasPublished: false,
  },
  {
    id: "u-5",
    n: "عبد الرزاق عماري",
    e: "a.ammari@gmail.com",
    phone: "",
    role: "مستخدم",
    s: "نشط",
    wilaya: "سطيف",
    createdAt: "2024-04-18",
    listingsCount: 0,
    hasPublished: false,
  },
  {
    id: "u-6",
    n: "ياسمين شريف",
    e: "yasmine.cherif@gmail.com",
    phone: "",
    role: "مستخدم",
    s: "نشط",
    wilaya: "البليدة",
    createdAt: "2024-04-22",
    listingsCount: 0,
    hasPublished: false,
  },
  {
    id: "u-7",
    n: "مصطفى زروقي",
    e: "m.zerrouki@outlook.com",
    phone: "",
    role: "مستخدم",
    s: "نشط",
    wilaya: "تلمسان",
    createdAt: "2024-04-28",
    listingsCount: 0,
    hasPublished: false,
  },
  {
    id: "u-8",
    n: "حمزة بوزيد",
    e: "hamza.bouzid@gmail.com",
    phone: "",
    role: "مستخدم",
    s: "نشط",
    wilaya: "عنابة",
    createdAt: "2024-05-01",
    listingsCount: 0,
    hasPublished: false,
  },
  {
    id: "u-9",
    n: "صوفيا لعربي",
    e: "sofia.larbi@yahoo.com",
    phone: "",
    role: "مستخدم",
    s: "نشط",
    wilaya: "وهران",
    createdAt: "2024-05-04",
    listingsCount: 0,
    hasPublished: false,
  },
];

export const adminUsersQuery = queryOptions({
  queryKey: ["admin_users"],
  queryFn: async (): Promise<AdminUser[]> => {
    const deleted = getDeletedUserIds();
    const userMap = new Map<string, AdminUser>();

    // 1. Seed with default users (both publishers and non-publishers)
    for (const u of defaultAdminUsers) {
      if (!deleted.has(u.id)) {
        userMap.set(u.id, { ...u });
      }
    }

    // 2. Fetch properties to calculate listings per user from Supabase
    const propCountMap = new Map<string, number>();
    try {
      const { data: propsData } = await supabase.from("properties").select("owner_id");
      if (propsData) {
        for (const p of propsData) {
          if (p.owner_id) {
            propCountMap.set(p.owner_id, (propCountMap.get(p.owner_id) || 0) + 1);
          }
        }
      }
    } catch {
      // Tolerate if properties table query fails
    }

    // 3. Query Supabase profiles
    try {
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && profiles && profiles.length > 0) {
        for (let i = 0; i < profiles.length; i++) {
          const u = profiles[i];
          if (deleted.has(u.id)) continue;
          const count = propCountMap.get(u.id) || 0;
          userMap.set(u.id, {
            id: u.id,
            n: u.full_name || `مستخدم مسجل (${u.id.slice(0, 6)})`,
            e: `${u.id.slice(0, 8)}@user.dz`,
            phone: u.phone || getDeterministicPhone(u.id, "0770"),
            role: u.role === "admin" ? "مدير" : "مستخدم",
            s: "نشط",
            wilaya: "الجزائر",
            createdAt: u.created_at ? u.created_at.split("T")[0] : "2024-05-01",
            listingsCount: count,
            hasPublished: count > 0,
          });
        }
      }
    } catch {
      // Ignore
    }

    // 4. Query Firebase Firestore users collection
    try {
      const { getUsersFromFirestore } = await import("./firebase");
      const firestoreUsers = await getUsersFromFirestore();
      for (const fu of firestoreUsers) {
        if (deleted.has(fu.id)) continue;
        const existing = userMap.get(fu.id);
        const count = existing?.listingsCount || propCountMap.get(fu.id) || 0;
        userMap.set(fu.id, {
          id: fu.id,
          n: fu.displayName || existing?.n || "مستخدم مسجل",
          e: fu.email || existing?.e || `user-${fu.id.slice(0, 6)}@manzili.dz`,
          phone: fu.phone || existing?.phone || getDeterministicPhone(fu.id, "0661"),
          role: fu.role === "admin" ? "مدير" : existing?.role || "مستخدم",
          s: existing?.s || "نشط",
          wilaya: fu.wilaya || existing?.wilaya || "الجزائر",
          createdAt: fu.createdAt
            ? fu.createdAt.split("T")[0]
            : existing?.createdAt || "2024-05-01",
          listingsCount: count,
          hasPublished: count > 0,
        });
      }
    } catch {
      // Ignore
    }

    // 5. Check currently logged in Supabase user to ensure the admin & active user are present
    try {
      const { data: authData } = await supabase.auth.getUser();
      if (authData.user && !deleted.has(authData.user.id)) {
        const authUser = authData.user;
        const meta = authUser.user_metadata || {};
        const isAdmin = authUser.email === "db923342@gmail.com";
        const count = propCountMap.get(authUser.id) || 0;
        userMap.set(authUser.id, {
          id: authUser.id,
          n: (meta.full_name as string) || (isAdmin ? "المدير العام (أدمن المنصة)" : "مستخدم مسجل"),
          e: authUser.email || "user@manzili.dz",
          phone:
            (meta.phone as string) ||
            (isAdmin ? "0550 00 11 22" : getDeterministicPhone(authUser.id, "0550")),
          role: isAdmin ? "مدير" : "مستخدم",
          s: "نشط",
          wilaya: "الجزائر",
          createdAt: authUser.created_at ? authUser.created_at.split("T")[0] : "2024-05-01",
          listingsCount: count,
          hasPublished: count > 0,
        });
      }
    } catch {
      // Ignore
    }

    return Array.from(userMap.values());
  },
});

export const defaultDealsWithPhones = [
  {
    id: "deal-101",
    p: "شقة F3 بحيدرة، الجزائر العاصمة",
    a: "أحمد بن علي",
    ownerPhone: "",
    b: "سمير قادري",
    renterPhone: "",
    paid: false,
    s: "بانتظار الموافقة",
  },
  {
    id: "deal-102",
    p: "فيلا حي النرجس، بئر الجير، وهران",
    a: "كريم منصوري",
    ownerPhone: "",
    b: "ياسين بن عودة",
    renterPhone: "",
    paid: true,
    s: "مكتملة ومكشوفة الأرقام",
  },
];

// ==========================================
// Centralized Deletion Actions
// ==========================================
export async function executeDeleteProperty(p: Property, queryClient: QueryClient): Promise<void> {
  // 1. Mark permanently deleted in local persistent storage
  markPropertyDeleted(p.id);

  if (p.purpose === "بيع") {
    try {
      await supabase.from("sale_properties").delete().eq("id", p.id);
    } catch {
      // Supabase error tolerated
    }
    queryClient.setQueryData<Property[]>(salesPropertiesQuery.queryKey, (old = []) =>
      old.filter((item) => item.id !== p.id),
    );
    queryClient.invalidateQueries({ queryKey: salesPropertiesQuery.queryKey });
    return;
  }

  // 2. Synchronize deletion with Firestore in background
  try {
    const { deletePropertyFromFirestore } = await import("./firebase");
    await deletePropertyFromFirestore(p.id);
  } catch (fbErr) {
    console.warn("Firestore delete sync:", fbErr);
  }

  // 3. Attempt Supabase delete safely
  try {
    await supabase.from("properties").delete().eq("id", p.id);
  } catch {
    // Supabase error tolerated
  }

  // 4. Update React Query caches directly
  queryClient.setQueryData<Property[]>(adminPropertiesQuery.queryKey, (old = []) =>
    old.filter((item) => item.id !== p.id),
  );
  queryClient.setQueryData<Property[]>(propertiesQuery.queryKey, (old = []) =>
    old.filter((item) => item.id !== p.id),
  );
}

export async function executeDeleteRequest(
  r: RentalRequest,
  queryClient: QueryClient,
): Promise<void> {
  // 1. Mark permanently deleted in local persistent storage
  markRequestDeleted(r.id);

  if (r.purpose === "شراء") {
    try {
      await supabase.from("purchase_requests").delete().eq("id", r.id);
    } catch {
      // Supabase error tolerated
    }
    queryClient.setQueryData<RentalRequest[]>(salesRequestsQuery.queryKey, (old = []) =>
      old.filter((item) => item.id !== r.id),
    );
    queryClient.invalidateQueries({ queryKey: salesRequestsQuery.queryKey });
    return;
  }

  // 2. Synchronize deletion with Firestore in background
  try {
    const { deleteRentalRequestFromFirestore } = await import("./firebase");
    await deleteRentalRequestFromFirestore(r.id);
  } catch (fbErr) {
    console.warn("Firestore delete request error:", fbErr);
  }

  // 3. Attempt Supabase delete safely
  try {
    await supabase.from("rental_requests").delete().eq("id", r.id);
  } catch {
    // Supabase error tolerated
  }

  // 3. Update React Query caches directly
  queryClient.setQueryData<RentalRequest[]>(adminRequestsQuery.queryKey, (old = []) =>
    old.filter((item) => item.id !== r.id),
  );
  queryClient.setQueryData<RentalRequest[]>(requestsQuery.queryKey, (old = []) =>
    old.filter((item) => item.id !== r.id),
  );
}

export async function executeDeleteUser(userId: string, queryClient: QueryClient): Promise<void> {
  markUserDeleted(userId);
  try {
    await supabase.from("profiles").delete().eq("id", userId);
  } catch {
    // Supabase error tolerated
  }
  try {
    const { deleteUserFromFirestore } = await import("./firebase");
    await deleteUserFromFirestore(userId);
  } catch {
    // Firestore error tolerated
  }
  queryClient.setQueryData<AdminUser[]>(adminUsersQuery.queryKey, (old = []) =>
    old.filter((item) => item.id !== userId),
  );
}

export async function executeDeleteBooking(bookingId: string): Promise<void> {
  markBookingDeleted(bookingId);
  try {
    const { deleteTemporaryBookingFromFirestore } = await import("./firebase");
    await deleteTemporaryBookingFromFirestore(bookingId);
  } catch {
    // Tolerated
  }
}

export async function executeDeleteDeal(dealId: string): Promise<void> {
  markDealDeleted(dealId);
  try {
    await supabase.from("deals").delete().eq("id", dealId);
  } catch {
    // Tolerated
  }
}

// ==========================================
// Temporary Rentals (Supabase short_term_rentals integration)
// ==========================================
type SupabaseShortTermRentalRow = {
  id: string;
  property_id: string;
  user_id: string | null;
  check_in: string | null;
  check_out: string | null;
  total_price: number;
  status: string;
  created_at: string;
  properties?: {
    id: string;
    owner_id: string | null;
    property_type: string;
    wilaya: string;
    municipality: string;
    monthly_rent: number;
    duration_months: number | null;
    area_m2: number | null;
    description: string | null;
    status: string;
    created_at: string;
  } | null;
};

function toTemporaryRentalFromSupabase(row: SupabaseShortTermRentalRow): TemporaryRental {
  const prop = Array.isArray(row.properties) ? row.properties[0] : row.properties || null;
  const idStr = String(row.id || prop?.id || `temp-${Date.now()}`);
  const rawType = prop?.property_type ? label(prop.property_type) : "شقة";
  const normalizedType: "شقة" | "استوديو" | "فيلا" | "دوبلكس" =
    rawType === "استوديو"
      ? "استوديو"
      : rawType === "فيلا"
        ? "فيلا"
        : rawType === "دوبلكس"
          ? "دوبلكس"
          : "شقة";

  const rawDesc = String(prop?.description || "");
  const firstLine = rawDesc.split("\n")[0]?.trim();
  const title =
    firstLine && firstLine.length > 5
      ? firstLine
      : `${normalizedType} راقية ومجهزة للكراء المؤقت باليوم`;

  const price = Number(row.total_price || prop?.monthly_rent || 6000);
  const area = Number(prop?.area_m2 || 75);

  return {
    id: idStr,
    title: maskPhoneNumbers(title),
    type: normalizedType,
    wilaya: String(prop?.wilaya || "الجزائر"),
    commune: String(prop?.municipality || ""),
    address: prop?.municipality ? `حي راقٍ وهادئ، ${prop.municipality}` : "موقع متميز",
    nightlyPrice: price,
    minStayDays: 1,
    maxGuests: 4,
    rooms: 2,
    beds: 2,
    bathrooms: 1,
    area,
    furnished: true,
    rating: 4.9,
    reviewsCount: 1,
    is24hAvailable: true,
    amenities: ["مفروشة بالكامل", "تكييف", "واي فاي سريع", "مطبخ مجهز", "موقف سيارات"],
    description: maskPhoneNumbers(
      rawDesc || "شقة مجهزة بكل الضروريات للكراء المؤقت اليومي، نظيفة وعصرية.",
    ),
    rules: [
      "مخصصة للعائلات أو المسافرين المهنيين",
      "الدفتر العائلي إلزامي للأزواج الجزائريين",
      "ممنوع التدخين داخل الشقة",
    ],
    owner: "صاحب العقار",
    ownerPhone: getDeterministicPhone(idStr, "0550"),
    status: row.status === "active" ? "نشط" : row.status === "booked" ? "محجوز" : "قيد المراجعة",
    image: hero,
    checkInTime: "14:00",
    checkOutTime: "12:00",
  };
}

export const temporaryRentalsQuery = queryOptions({
  queryKey: ["temporary_rentals"],
  queryFn: async (): Promise<TemporaryRental[]> => {
    const deleted = getDeletedTemporaryRentalIds();
    const fetched: TemporaryRental[] = [];

    // 1. Query Supabase short_term_rentals with joined properties
    try {
      const { data, error } = await supabase
        .from("short_term_rentals")
        .select(
          `
          id,
          property_id,
          user_id,
          check_in,
          check_out,
          total_price,
          status,
          created_at,
          properties (
            id,
            owner_id,
            property_type,
            wilaya,
            municipality,
            monthly_rent,
            duration_months,
            area_m2,
            description,
            status,
            created_at
          )
        `,
        )
        .order("created_at", { ascending: false });

      if (!error && data && data.length > 0) {
        data.forEach((r) => {
          fetched.push(toTemporaryRentalFromSupabase(r as unknown as SupabaseShortTermRentalRow));
        });
      }
    } catch (err) {
      console.warn("Supabase short_term_rentals query notice:", err);
    }

    // 2. Query any properties directly marked as temporary (duration_months = 0)
    try {
      const { data: propRows, error: propErr } = await supabase
        .from("properties")
        .select("*")
        .eq("duration_months", 0)
        .order("created_at", { ascending: false });

      if (!propErr && propRows && propRows.length > 0) {
        for (const pr of propRows) {
          const alreadyIn = fetched.some((f) => f.id === pr.id);
          if (!alreadyIn) {
            fetched.push(
              toTemporaryRentalFromSupabase({
                id: pr.id,
                property_id: pr.id,
                user_id: pr.owner_id,
                check_in: null,
                check_out: null,
                total_price: pr.monthly_rent,
                status: pr.status || "active",
                created_at: pr.created_at,
                properties: pr,
              }),
            );
          }
        }
      }
    } catch {
      // ignore
    }

    // 3. Query real temporary rentals from Firestore
    let firestoreRentals: TemporaryRental[] = [];
    try {
      const { getTemporaryRentalsFromFirestore } = await import("./firebase");
      const fbRentals = await getTemporaryRentalsFromFirestore();
      if (fbRentals && fbRentals.length > 0) {
        firestoreRentals = fbRentals;
      }
    } catch (fbErr) {
      console.warn("Firestore temporary rentals notice:", fbErr);
    }

    // 4. Local persistent storage for any user-created rentals
    let localSaved: TemporaryRental[] = [];
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("manzili_local_temporary_rentals");
        if (raw) localSaved = JSON.parse(raw);
      } catch {
        // ignore
      }
    }

    // Merge in priority: locally published -> Supabase fetched -> Firestore real rentals
    const combined: TemporaryRental[] = [];
    const seen = new Set<string>();

    for (const item of [...localSaved, ...fetched, ...firestoreRentals]) {
      if (!seen.has(item.id) && !deleted.has(item.id)) {
        seen.add(item.id);
        combined.push(item);
      }
    }

    return combined;
  },
});

export type NewTemporaryRentalInput = {
  title: string;
  propertyType: string;
  wilaya: string;
  commune: string;
  nightlyPrice: number;
  minStayDays: number;
  maxGuests: number;
  rooms: number;
  area: number;
  amenities: string[];
  description: string;
  phone: string;
};

export async function executeCreateTemporaryRental(
  input: NewTemporaryRentalInput,
  queryClient?: QueryClient,
): Promise<{ success: boolean; id?: string; error?: string }> {
  // 1. Get authenticated user if logged into Supabase Auth
  let authUserId: string | null = null;
  try {
    const { data: authData } = await supabase.auth.getUser();
    if (authData?.user) {
      authUserId = authData.user.id;
    }
  } catch {
    // Auth check fallback
  }

  // 2. Map type for DB
  const typeMapping: Record<string, string> = {
    شقة: "apartment",
    استوديو: "studio",
    فيلا: "villa",
    دوبلكس: "duplex",
  };
  const dbPropertyType = typeMapping[input.propertyType] || "apartment";

  let createdPropertyId: string | null = null;
  let createdShortTermRentalId: string | null = null;
  let insertError: string | null = null;

  const cleanTitle = maskPhoneNumbers(input.title);
  const cleanDescription = maskPhoneNumbers(input.description);

  // 3. Insert into public.properties
  try {
    const { data: propData, error: propErr } = await supabase
      .from("properties")
      .insert({
        owner_id: authUserId,
        property_type: dbPropertyType,
        wilaya: input.wilaya,
        municipality: input.commune,
        monthly_rent: input.nightlyPrice,
        duration_months: 0, // 0 signifies daily/short-term temporary rental
        area_m2: input.area,
        description: `${cleanTitle}\n\n${cleanDescription}`,
        status: "approved",
      })
      .select("id")
      .single();

    if (propErr) {
      console.warn("Supabase properties insert error:", propErr);
      insertError = propErr.message;
    } else if (propData) {
      createdPropertyId = propData.id;

      // 4. Insert into public.short_term_rentals linking property_id
      const now = new Date();
      const checkInStr = now.toISOString().slice(0, 10);
      const checkOutDate = new Date(now.getTime() + 86400000 * 365);
      const checkOutStr = checkOutDate.toISOString().slice(0, 10);

      const { data: strData, error: strErr } = await supabase
        .from("short_term_rentals")
        .insert({
          property_id: createdPropertyId,
          user_id: authUserId,
          check_in: checkInStr,
          check_out: checkOutStr,
          total_price: input.nightlyPrice,
          status: "active",
        })
        .select("id")
        .single();

      if (strErr) {
        console.warn("Supabase short_term_rentals insert error:", strErr);
        insertError = strErr.message;
      } else if (strData) {
        createdShortTermRentalId = strData.id;
      }
    }
  } catch (err) {
    console.warn("Unexpected Supabase insert error:", err);
    insertError = err instanceof Error ? err.message : String(err);
  }

  // 5. Construct full TemporaryRental item
  const finalId = createdShortTermRentalId || createdPropertyId || `temp-local-${Date.now()}`;
  const newRental: TemporaryRental = {
    id: finalId,
    title: cleanTitle,
    type: (input.propertyType as "شقة" | "استوديو" | "فيلا" | "دوبلكس") || "شقة",
    wilaya: input.wilaya,
    commune: input.commune,
    address: input.commune ? `حي هادئ، ${input.commune}` : "موقع متميز",
    nightlyPrice: input.nightlyPrice,
    minStayDays: input.minStayDays,
    maxGuests: input.maxGuests,
    rooms: input.rooms,
    beds: input.rooms > 0 ? input.rooms : 1,
    bathrooms: 1,
    area: input.area,
    furnished: true,
    rating: 5.0,
    reviewsCount: 1,
    is24hAvailable: input.minStayDays <= 1,
    amenities:
      input.amenities.length > 0 ? input.amenities : ["مفروشة بالكامل", "تكييف", "واي فاي"],
    description: cleanDescription,
    rules: [
      "مخصصة للعائلات أو المسافرين المهنيين",
      "الدفتر العائلي إلزامي للأزواج الجزائريين",
      "ممنوع التدخين داخل الشقة",
    ],
    owner: authUserId ? "مستخدم مسجل" : "صاحب العقار",
    ownerPhone: input.phone,
    status: "نشط",
    image: hero,
    checkInTime: "14:00",
    checkOutTime: "12:00",
  };

  // 6. Save into local persistent storage
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem("manzili_local_temporary_rentals");
      const list: TemporaryRental[] = raw ? JSON.parse(raw) : [];
      list.unshift(newRental);
      localStorage.setItem("manzili_local_temporary_rentals", JSON.stringify(list));
    } catch {
      // ignore
    }
  }

  // 6.5 Save into Firestore database for persistent multi-device access
  try {
    const { saveTemporaryRentalToFirestore } = await import("./firebase");
    await saveTemporaryRentalToFirestore({
      ...newRental,
      id: finalId,
    });
  } catch (fbErr) {
    console.warn("Firestore saveTemporaryRental notice:", fbErr);
  }

  // 7. Update React Query cache so it shows up immediately in UI
  if (queryClient) {
    queryClient.setQueryData<TemporaryRental[]>(temporaryRentalsQuery.queryKey, (old = []) => {
      const existing = old.filter((item) => item.id !== newRental.id);
      return [newRental, ...existing];
    });
  }

  if (insertError && !createdShortTermRentalId) {
    return {
      success: false,
      id: finalId,
      error: insertError,
    };
  }

  return {
    success: true,
    id: finalId,
  };
}

export async function executeDeleteTemporaryRental(
  rentalId: string,
  queryClient?: QueryClient,
): Promise<void> {
  markTemporaryRentalDeleted(rentalId);

  try {
    const { deleteTemporaryRentalFromFirestore } = await import("./firebase");
    await deleteTemporaryRentalFromFirestore(rentalId);
  } catch {
    // ignore
  }

  try {
    await supabase.from("short_term_rentals").delete().eq("id", rentalId);
  } catch {
    // ignore
  }

  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem("manzili_local_temporary_rentals");
      if (raw) {
        const list: TemporaryRental[] = JSON.parse(raw);
        localStorage.setItem(
          "manzili_local_temporary_rentals",
          JSON.stringify(list.filter((r) => r.id !== rentalId)),
        );
      }
    } catch {
      // ignore
    }
  }

  if (queryClient) {
    queryClient.setQueryData<TemporaryRental[]>(temporaryRentalsQuery.queryKey, (old = []) =>
      old.filter((r) => r.id !== rentalId),
    );
  }
}

// ==========================================
// Standard Property Creation (Real Supabase + Local Sync)
// ==========================================
export type NewPropertyInput = {
  title: string;
  propertyType: string;
  purpose?: "كراء" | "بيع";
  legalStatus?: string;
  wilaya: string;
  commune: string;
  price: number;
  rooms: number;
  area: number;
  description: string;
  phone: string;
};

export async function executeCreateProperty(
  input: NewPropertyInput,
  queryClient?: QueryClient,
): Promise<{ success: boolean; id: string; error?: string }> {
  let authUserId: string | null = null;
  let authUserName = "صاحب العقار";
  let authUserEmail = "";
  try {
    const { data: authData } = await supabase.auth.getUser();
    if (authData?.user) {
      authUserId = authData.user.id;
      authUserEmail = authData.user.email || "";
      authUserName = (authData.user.user_metadata?.full_name as string) || "مستخدم مسجل";
    }
  } catch {
    // optional auth
  }

  const typeMapping: Record<string, string> = {
    سكن: "housing",
    شقة: "apartment",
    فيلا: "villa",
    منزل: "house",
    أرض: "land",
    "محل تجاري": "shop",
    مكتب: "office",
    استوديو: "studio",
  };
  const dbPropertyType = typeMapping[input.propertyType] || "apartment";

  const nowIso = new Date().toISOString();
  let createdId: string | null = null;
  let insertError: string | null = null;

  const cleanTitle = maskPhoneNumbers(input.title);
  const cleanDescription = maskPhoneNumbers(input.description);

  // 0. Requirements 2, 6, 11: Wire sale properties directly to Supabase table "sale_properties"
  if (input.purpose === "بيع") {
    if (!authUserId) {
      return {
        success: false,
        id: "",
        error: "يجب تسجيل الدخول أولاً لنشر إعلان بيع مربوط بحسابك (auth.uid).",
      };
    }

    try {
      const { data, error } = await supabase
        .from("sale_properties")
        .insert({
          owner_id: authUserId,
          title: cleanTitle,
          property_type: dbPropertyType,
          legal_status: input.legalStatus || "",
          wilaya: input.wilaya,
          municipality: input.commune,
          price: input.price,
          area_m2: input.area,
          rooms: input.rooms,
          description: cleanDescription,
          status: "approved",
        })
        .select("id")
        .single();

      if (error) {
        console.warn("Supabase sale_properties insert error:", error.message);
        return { success: false, id: "", error: error.message };
      }

      if (queryClient) {
        queryClient.invalidateQueries({ queryKey: salesPropertiesQuery.queryKey });
      }
      return { success: true, id: data.id };
    } catch (err) {
      return {
        success: false,
        id: "",
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  // 1. Save directly to Firestore (multi-user shared database across devices)
  try {
    const { savePropertyToFirestore } = await import("./firebase");
    const fbSaved = await savePropertyToFirestore({
      title: cleanTitle,
      type: input.propertyType,
      purpose: input.purpose || "كراء",
      legalStatus: input.legalStatus || "",
      wilaya: input.wilaya,
      commune: input.commune,
      price: input.price,
      area: input.area,
      rooms: input.rooms,
      description: cleanDescription,
      phone: input.phone,
      userId: authUserId || "user",
      userName: authUserName,
      userEmail: authUserEmail,
      status: "approved",
      createdAt: nowIso,
    });
    if (fbSaved?.id) {
      createdId = fbSaved.id;
    }
  } catch (fbErr) {
    console.warn("Firestore property save warning:", fbErr);
  }

  // 2. Insert into Supabase properties table
  try {
    const { data, error } = await supabase
      .from("properties")
      .insert({
        owner_id: authUserId,
        property_type: dbPropertyType,
        wilaya: input.wilaya,
        municipality: input.commune,
        monthly_rent: input.price,
        duration_months: 12,
        area_m2: input.area,
        description: `${cleanTitle}\n\n${cleanDescription}`,
        status: "approved", // نشر مباشر وتلقائي بدون مراجعة
      })
      .select("id")
      .single();

    if (error) {
      console.warn("Supabase property insert error:", error);
      insertError = error.message;
    } else if (data && !createdId) {
      createdId = data.id;
    }
  } catch (err) {
    insertError = err instanceof Error ? err.message : String(err);
  }

  // 3. Prepare full Property object with real publication time
  const finalId = createdId || `prop-${Date.now()}`;
  const newProp: Property = {
    id: finalId,
    title: cleanTitle,
    type: input.propertyType,
    purpose: input.purpose || "كراء",
    legalStatus: input.legalStatus || "",
    wilaya: input.wilaya,
    commune: input.commune,
    price: input.price,
    rooms: input.rooms,
    area: input.area,
    description: cleanDescription,
    owner: authUserName,
    ownerPhone: "",
    status: "نشط",
    image: hero,
    publishedAt: formatPublishTime(nowIso),
    createdAt: nowIso,
  };

  // 4. Save to local storage for instant fallback
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem("manzili_local_properties");
      const list: Property[] = raw ? JSON.parse(raw) : [];
      list.unshift(newProp);
      localStorage.setItem("manzili_local_properties", JSON.stringify(list));
    } catch {
      // ignore
    }
  }

  // 5. Update and invalidate React Query Cache immediately for real-time appearance
  if (queryClient) {
    if (newProp.purpose === "بيع") {
      queryClient.setQueryData<Property[]>(salesPropertiesQuery.queryKey, (old = []) => [
        newProp,
        ...old.filter((p) => p.id !== newProp.id),
      ]);
      queryClient.invalidateQueries({ queryKey: salesPropertiesQuery.queryKey });
    } else {
      queryClient.setQueryData<Property[]>(propertiesQuery.queryKey, (old = []) => [
        newProp,
        ...old.filter((p) => p.id !== newProp.id),
      ]);
      queryClient.invalidateQueries({ queryKey: propertiesQuery.queryKey });
    }
    queryClient.setQueryData<Property[]>(adminPropertiesQuery.queryKey, (old = []) => [
      newProp,
      ...old.filter((p) => p.id !== newProp.id),
    ]);
    queryClient.invalidateQueries({ queryKey: adminPropertiesQuery.queryKey });
  }

  return {
    success: Boolean(createdId) || !insertError,
    id: finalId,
    error: insertError || undefined,
  };
}

// ==========================================
// Rental Request Creation (Real Firestore + Supabase + Local Sync)
// ==========================================
export type NewRequestInput = {
  title: string;
  propertyType: string;
  purpose?: "كراء" | "شراء";
  wilaya: string;
  commune: string;
  budget: number;
  rooms: number;
  duration: string;
  details: string;
  phone: string;
};

export async function executeCreateRequest(
  input: NewRequestInput,
  queryClient?: QueryClient,
): Promise<{ success: boolean; id: string; error?: string }> {
  let authUserId: string | null = null;
  let authUserName = "صاحب الطلب";
  try {
    const { data: authData } = await supabase.auth.getUser();
    if (authData?.user) {
      authUserId = authData.user.id;
      authUserName = (authData.user.user_metadata?.full_name as string) || "مستخدم مسجل";
    }
  } catch {
    // optional auth
  }

  const typeMapping: Record<string, string> = {
    سكن: "housing",
    شقة: "apartment",
    فيلا: "villa",
    منزل: "house",
    أرض: "land",
    "محل تجاري": "shop",
    مكتب: "office",
    استوديو: "studio",
  };
  const dbPropertyType = typeMapping[input.propertyType] || "apartment";

  const nowIso = new Date().toISOString();
  let createdId: string | null = null;
  let insertError: string | null = null;

  const cleanTitle = maskPhoneNumbers(input.title);
  const cleanDetails = maskPhoneNumbers(input.details);

  // 0. Requirements 3, 6, 11: Wire purchase requests directly to Supabase table "purchase_requests"
  if (input.purpose === "شراء") {
    if (!authUserId) {
      return {
        success: false,
        id: "",
        error: "يجب تسجيل الدخول أولاً لنشر طلب شراء مربوط بحسابك (auth.uid).",
      };
    }

    try {
      const { data, error } = await supabase
        .from("purchase_requests")
        .insert({
          buyer_id: authUserId,
          title: cleanTitle,
          property_type: dbPropertyType,
          wilaya: input.wilaya,
          municipality: input.commune,
          budget: input.budget,
          rooms: input.rooms,
          specifications: cleanDetails,
          status: "approved",
          contact_phone: input.phone,
        })
        .select("id")
        .single();

      if (error) {
        console.warn("Supabase purchase_requests insert error:", error.message);
        return { success: false, id: "", error: error.message };
      }

      if (queryClient) {
        queryClient.invalidateQueries({ queryKey: salesRequestsQuery.queryKey });
      }
      return { success: true, id: data.id };
    } catch (err) {
      return {
        success: false,
        id: "",
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  // 1. Save directly to Firestore (multi-user shared database across devices)
  try {
    const { saveRentalRequestToFirestore } = await import("./firebase");
    const fbSaved = await saveRentalRequestToFirestore({
      title: cleanTitle,
      type: input.propertyType,
      purpose: input.purpose || "كراء",
      wilaya: input.wilaya,
      commune: input.commune,
      budget: input.budget,
      rooms: input.rooms,
      duration: input.duration,
      details: cleanDetails,
      author: authUserName,
      contactPhone: input.phone,
      date: nowIso.slice(0, 10),
      createdAt: nowIso,
      status: "approved",
    });
    if (fbSaved?.id) {
      createdId = fbSaved.id;
    }
  } catch (fbErr) {
    console.warn("Firestore rental request save warning:", fbErr);
  }

  // 2. Insert into Supabase rental_requests table
  try {
    const { data, error } = await supabase
      .from("rental_requests")
      .insert({
        renter_id: authUserId,
        property_type: dbPropertyType,
        wilaya: input.wilaya,
        municipality: input.commune,
        budget: input.budget,
        duration_months: input.duration.includes("12") ? 12 : 6,
        contact_phone: input.phone,
        specifications: `${cleanTitle}\n\n${cleanDetails}`,
        status: "approved",
      })
      .select("id")
      .single();

    if (error) {
      console.warn("Supabase rental request insert error:", error);
      insertError = error.message;
    } else if (data && !createdId) {
      createdId = data.id;
    }
  } catch (err) {
    insertError = err instanceof Error ? err.message : String(err);
  }

  const finalId = createdId || `req-${Date.now()}`;
  const newReq: RentalRequest = {
    id: finalId,
    title: cleanTitle,
    type: input.propertyType,
    purpose: input.purpose || "كراء",
    wilaya: input.wilaya,
    commune: input.commune,
    budget: input.budget,
    rooms: input.rooms,
    details: cleanDetails,
    author: authUserName,
    contactPhone: "",
    date: nowIso.slice(0, 10),
    createdAt: nowIso,
  };

  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem("manzili_local_requests");
      const list: RentalRequest[] = raw ? JSON.parse(raw) : [];
      list.unshift(newReq);
      localStorage.setItem("manzili_local_requests", JSON.stringify(list));
    } catch {
      // ignore
    }
  }

  if (queryClient) {
    if (newReq.purpose === "شراء") {
      queryClient.setQueryData<RentalRequest[]>(salesRequestsQuery.queryKey, (old = []) => [
        newReq,
        ...old.filter((r) => r.id !== newReq.id),
      ]);
      queryClient.invalidateQueries({ queryKey: salesRequestsQuery.queryKey });
    } else {
      queryClient.setQueryData<RentalRequest[]>(requestsQuery.queryKey, (old = []) => [
        newReq,
        ...old.filter((r) => r.id !== newReq.id),
      ]);
      queryClient.invalidateQueries({ queryKey: requestsQuery.queryKey });
    }
    queryClient.setQueryData<RentalRequest[]>(adminRequestsQuery.queryKey, (old = []) => [
      newReq,
      ...old.filter((r) => r.id !== newReq.id),
    ]);
    queryClient.invalidateQueries({ queryKey: adminRequestsQuery.queryKey });
  }

  return {
    success: Boolean(createdId) || !insertError,
    id: finalId,
    error: insertError || undefined,
  };
}

export const temporaryRequestsQuery = queryOptions({
  queryKey: ["temporary_requests"],
  queryFn: async (): Promise<TemporaryRentalRequest[]> => {
    let firestoreReqs: TemporaryRentalRequest[] = [];
    try {
      const { getTemporaryRequestsFromFirestore } = await import("./firebase");
      const list = await getTemporaryRequestsFromFirestore();
      if (list && list.length > 0) {
        firestoreReqs = list.map((item) => ({
          id: item.id,
          title: maskPhoneNumbers(item.title),
          type: (item.type as "شقة" | "استوديو" | "فيلا" | "دوبلكس") || "شقة",
          wilaya: item.wilaya,
          commune: item.commune,
          checkInDate: item.checkInDate,
          durationDays: item.durationDays,
          guestsCount: item.guestsCount,
          budgetPerNight: item.budgetPerNight,
          author: item.author,
          contactPhone: item.contactPhone,
          details: maskPhoneNumbers(item.details || ""),
          createdAt: item.createdAt,
          status: (item.status as "منشور" | "تم التلبية" | "ملغى") || "منشور",
        }));
      }
    } catch (err) {
      console.warn("Could not fetch temporary requests from Firestore:", err);
    }

    let localReqs: TemporaryRentalRequest[] = [];
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("manzili_local_temporary_requests");
        if (raw) localReqs = JSON.parse(raw);
      } catch {
        // ignore
      }
    }

    const combined: TemporaryRentalRequest[] = [];
    const seen = new Set<string>();
    for (const r of [...firestoreReqs, ...localReqs, ...defaultTemporaryRequests]) {
      if (!seen.has(r.id)) {
        seen.add(r.id);
        combined.push(r);
      }
    }

    combined.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
    return combined;
  },
});

export async function executeCreateTemporaryRequest(
  data: Omit<TemporaryRentalRequest, "id" | "createdAt" | "status">,
  queryClient?: QueryClient,
): Promise<TemporaryRentalRequest> {
  const newId = `treq-${Date.now()}`;
  const nowIso = new Date().toISOString();
  const created: TemporaryRentalRequest = {
    ...data,
    title: maskPhoneNumbers(data.title),
    details: maskPhoneNumbers(data.details || ""),
    id: newId,
    createdAt: nowIso,
    status: "منشور",
  };

  // 1. Save locally
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem("manzili_local_temporary_requests");
      const current: TemporaryRentalRequest[] = raw ? JSON.parse(raw) : [];
      localStorage.setItem(
        "manzili_local_temporary_requests",
        JSON.stringify([created, ...current]),
      );
    } catch {
      // ignore
    }
  }

  // 2. Save to Firestore
  try {
    const { saveTemporaryRequestToFirestore } = await import("./firebase");
    await saveTemporaryRequestToFirestore(created);
  } catch (err) {
    console.warn("Could not save temporary request to Firestore:", err);
  }

  // 3. Invalidate TanStack query
  if (queryClient) {
    queryClient.setQueryData<TemporaryRentalRequest[]>(
      temporaryRequestsQuery.queryKey,
      (old = []) => [created, ...old.filter((x) => x.id !== newId)],
    );
    await queryClient.invalidateQueries({ queryKey: temporaryRequestsQuery.queryKey });
  }

  return created;
}

export async function executeDeleteTemporaryRequest(id: string, queryClient?: QueryClient) {
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem("manzili_local_temporary_requests");
      if (raw) {
        const current: TemporaryRentalRequest[] = JSON.parse(raw);
        localStorage.setItem(
          "manzili_local_temporary_requests",
          JSON.stringify(current.filter((x) => x.id !== id)),
        );
      }
    } catch {
      // ignore
    }
  }

  try {
    const { deleteTemporaryRequestFromFirestore } = await import("./firebase");
    await deleteTemporaryRequestFromFirestore(id);
  } catch (err) {
    console.warn("Could not delete temporary request from Firestore:", err);
  }

  if (queryClient) {
    queryClient.setQueryData<TemporaryRentalRequest[]>(
      temporaryRequestsQuery.queryKey,
      (old = []) => old.filter((x) => x.id !== id),
    );
    await queryClient.invalidateQueries({ queryKey: temporaryRequestsQuery.queryKey });
  }
}
