import { queryOptions, type QueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import hero from "@/assets/hero.jpg";
import type { Property, RentalRequest } from "@/lib/data";

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

  return {
    id: idStr,
    title: `${type} للإيجار`,
    type,
    wilaya: String(row.wilaya ?? ""),
    commune: String(row.municipality ?? ""),
    price: Number(row.monthly_rent ?? 0),
    rooms: Number(row.rooms ?? 0),
    area: Number(row.area_m2 ?? 0),
    description: String(row.description ?? ""),
    owner: ownerName,
    ownerPhone,
    status: statusLabel(row.status),
    image: hero,
  };
}

function toRequest(row: Row): RentalRequest {
  const type = label(row.property_type);
  const idStr = String(row.id ?? "1");
  const rawPhone = String(row.contact_phone ?? row.phone ?? "").trim();
  const contactPhone = rawPhone || getDeterministicPhone(idStr, "0661");
  const authorName = String(
    row.profiles?.full_name ?? (row.author && row.author !== "مخفي" ? row.author : "صاحب الطلب"),
  );

  return {
    id: idStr,
    title: `مطلوب ${type}`,
    type,
    wilaya: String(row.wilaya ?? ""),
    commune: String(row.municipality ?? ""),
    budget: Number(row.budget ?? 0),
    rooms: Number(row.rooms ?? 0),
    details: String(row.specifications ?? ""),
    author: authorName,
    contactPhone,
    date: String(row.created_at ?? "").slice(0, 10) || new Date().toISOString().slice(0, 10),
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

export function getDeletedPropertyIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(DELETED_PROPS_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

export function markPropertyDeleted(id: string) {
  if (typeof window === "undefined") return;
  try {
    const current = getDeletedPropertyIds();
    current.add(id);
    localStorage.setItem(DELETED_PROPS_KEY, JSON.stringify(Array.from(current)));
  } catch (err) {
    console.warn("Storage error:", err);
  }
}

export function getDeletedRequestIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(DELETED_REQS_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

export function markRequestDeleted(id: string) {
  if (typeof window === "undefined") return;
  try {
    const current = getDeletedRequestIds();
    current.add(id);
    localStorage.setItem(DELETED_REQS_KEY, JSON.stringify(Array.from(current)));
  } catch (err) {
    console.warn("Storage error:", err);
  }
}

export function getDeletedUserIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(DELETED_USERS_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

export function markUserDeleted(id: string) {
  if (typeof window === "undefined") return;
  try {
    const current = getDeletedUserIds();
    current.add(id);
    localStorage.setItem(DELETED_USERS_KEY, JSON.stringify(Array.from(current)));
  } catch (err) {
    console.warn("Storage error:", err);
  }
}

export function getDeletedDealIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(DELETED_DEALS_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

export function markDealDeleted(id: string) {
  if (typeof window === "undefined") return;
  try {
    const current = getDeletedDealIds();
    current.add(id);
    localStorage.setItem(DELETED_DEALS_KEY, JSON.stringify(Array.from(current)));
  } catch (err) {
    console.warn("Storage error:", err);
  }
}

export function getDeletedBookingIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(DELETED_BOOKINGS_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

export function markBookingDeleted(id: string) {
  if (typeof window === "undefined") return;
  try {
    const current = getDeletedBookingIds();
    current.add(id);
    localStorage.setItem(DELETED_BOOKINGS_KEY, JSON.stringify(Array.from(current)));
  } catch (err) {
    console.warn("Storage error:", err);
  }
}

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
    ownerPhone: "0550 41 82 93",
    status: "نشط",
    image:
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80",
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
    ownerPhone: "0770 19 38 47",
    status: "نشط",
    image:
      "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80",
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
    ownerPhone: "0661 74 29 11",
    status: "نشط",
    image:
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80",
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
    ownerPhone: "0658 91 02 43",
    status: "قيد المراجعة",
    image:
      "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80",
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
    ownerPhone: "0560 33 22 11",
    status: "نشط",
    image:
      "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80",
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
    contactPhone: "0554 99 88 77",
    date: new Date().toISOString().slice(0, 10),
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
    contactPhone: "0662 33 44 55",
    date: new Date().toISOString().slice(0, 10),
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
    contactPhone: "0770 12 34 56",
    date: new Date().toISOString().slice(0, 10),
  },
];

// ==========================================
// TanStack Query Definitions
// ==========================================
export const propertiesQuery = queryOptions({
  queryKey: ["public_properties"],
  queryFn: async (): Promise<Property[]> => {
    const deleted = getDeletedPropertyIds();

    try {
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("status", "approved")
        .order("created_at", { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map((r) => toProperty(r as Row)).filter((p) => !deleted.has(p.id));
      }
    } catch {
      // Supabase is optional/mock
    }

    // Try Firestore
    try {
      const { getPropertiesFromFirestore } = await import("./firebase");
      const fbProps = await getPropertiesFromFirestore();
      if (fbProps && fbProps.length > 0) {
        return fbProps
          .filter((p) => p.status === "approved")
          .map((p) => ({
            id: p.id,
            title: p.title,
            type: p.type,
            wilaya: p.wilaya,
            commune: p.commune,
            price: p.price,
            rooms: p.rooms,
            area: p.area,
            description: p.description,
            owner: p.userName || "صاحب العقار",
            ownerPhone: p.phone,
            status: "نشط" as const,
            image: p.images || hero,
          }))
          .filter((p) => !deleted.has(p.id));
      }
    } catch {
      // Ignore
    }

    // Default fallback
    return defaultProperties.filter((p) => !deleted.has(p.id));
  },
});

export const requestsQuery = queryOptions({
  queryKey: ["public_rental_requests"],
  queryFn: async (): Promise<RentalRequest[]> => {
    const deleted = getDeletedRequestIds();

    try {
      const { data, error } = await supabase
        .from("rental_requests")
        .select("*")
        .eq("status", "open")
        .order("created_at", { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map((r) => toRequest(r as Row)).filter((r) => !deleted.has(r.id));
      }
    } catch {
      // Supabase is optional/mock
    }

    return defaultRentalRequests.filter((r) => !deleted.has(r.id));
  },
});

export const adminPropertiesQuery = queryOptions({
  queryKey: ["admin_properties"],
  queryFn: async (): Promise<Property[]> => {
    const deleted = getDeletedPropertyIds();
    let result: Property[] = [];

    try {
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data && data.length > 0) {
        result = data.map((r) => toProperty(r as Row));
      }
    } catch {
      // Supabase is optional/mock
    }

    if (result.length === 0) {
      try {
        const { getPropertiesFromFirestore } = await import("./firebase");
        const fbProps = await getPropertiesFromFirestore();
        if (fbProps && fbProps.length > 0) {
          result = fbProps.map((p) => ({
            id: p.id,
            title: p.title,
            type: p.type,
            wilaya: p.wilaya,
            commune: p.commune,
            price: p.price,
            rooms: p.rooms,
            area: p.area,
            description: p.description,
            owner: p.userName || "صاحب العقار",
            ownerPhone: p.phone,
            status:
              p.status === "approved" ? "نشط" : p.status === "pending" ? "قيد المراجعة" : "مؤجر",
            image: p.images || hero,
          }));
        }
      } catch {
        // Ignore
      }
    }

    if (result.length === 0) {
      result = defaultProperties;
    }

    return result.filter((p) => !deleted.has(p.id));
  },
});

export const adminRequestsQuery = queryOptions({
  queryKey: ["admin_rental_requests"],
  queryFn: async (): Promise<RentalRequest[]> => {
    const deleted = getDeletedRequestIds();
    let result: RentalRequest[] = [];

    try {
      const { data, error } = await supabase
        .from("rental_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data && data.length > 0) {
        result = data.map((r) => toRequest(r as Row));
      }
    } catch {
      // Supabase is optional/mock
    }

    if (result.length === 0) {
      result = defaultRentalRequests;
    }

    return result.filter((r) => !deleted.has(r.id));
  },
});

export type AdminUser = {
  id: string;
  n: string;
  e: string;
  phone: string;
  role: string;
  s: string;
};

const defaultAdminUsers: AdminUser[] = [
  {
    id: "u-1",
    n: "أحمد بن علي",
    e: "ahmed.benali@gmail.com",
    phone: "0550 41 82 93",
    role: "مستخدم",
    s: "نشط",
  },
  {
    id: "u-2",
    n: "سمير قادري",
    e: "samir.kadri@gmail.com",
    phone: "0661 74 29 11",
    role: "مستخدم",
    s: "نشط",
  },
  {
    id: "u-3",
    n: "كريم منصوري",
    e: "karim.mansouri@yahoo.fr",
    phone: "0770 19 38 47",
    role: "مستخدم",
    s: "نشط",
  },
  {
    id: "u-4",
    n: "فاطمة الزهراء بلقاسم",
    e: "f.belkacem@gmail.com",
    phone: "0560 33 22 11",
    role: "مستخدم",
    s: "نشط",
  },
];

export const adminUsersQuery = queryOptions({
  queryKey: ["admin_users"],
  queryFn: async (): Promise<AdminUser[]> => {
    const deleted = getDeletedUserIds();

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data && data.length > 0) {
        return data
          .map((u, i) => ({
            id: u.id,
            n: u.full_name || `مستخدم ${i + 1}`,
            e: `${u.id.slice(0, 8)}@user.dz`,
            phone: u.phone || getDeterministicPhone(u.id, "0770"),
            role: "مستخدم",
            s: "نشط",
          }))
          .filter((u) => !deleted.has(u.id));
      }
    } catch {
      // Ignore
    }

    return defaultAdminUsers.filter((u) => !deleted.has(u.id));
  },
});

export const defaultDealsWithPhones = [
  {
    id: "deal-101",
    p: "شقة F3 بحيدرة، الجزائر العاصمة",
    a: "أحمد بن علي",
    ownerPhone: "0550 41 82 93",
    b: "سمير قادري",
    renterPhone: "0661 74 29 11",
    paid: false,
    s: "بانتظار الموافقة",
  },
  {
    id: "deal-102",
    p: "فيلا حي النرجس، بئر الجير، وهران",
    a: "كريم منصوري",
    ownerPhone: "0770 19 38 47",
    b: "ياسين بن عودة",
    renterPhone: "0658 91 02 43",
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

  // 2. Attempt Supabase delete safely
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
