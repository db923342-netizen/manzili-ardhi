import { queryOptions, type QueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import hero from "@/assets/hero.jpg";
import type { Property, RentalRequest, TemporaryRental } from "@/lib/data";

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

function toPropertyFromFirestore(p: {
  id: string;
  title: string;
  type: string;
  wilaya: string;
  commune: string;
  price: number;
  rooms: number;
  area: number;
  description: string;
  userName?: string;
  phone: string;
  status: string;
  images?: string;
}): Property {
  return {
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
    status: p.status === "approved" ? "نشط" : p.status === "pending" ? "قيد المراجعة" : "مؤجر",
    image: p.images || hero,
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
    let remoteProps: Property[] = [];

    // 1. Fetch real properties from Supabase
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

    // 2. Fetch locally published properties by users
    let localProps: Property[] = [];
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("manzili_local_properties");
        if (raw) localProps = JSON.parse(raw);
      } catch {
        // ignore
      }
    }

    // 3. Fallback to Firestore if needed
    let firestoreProps: Property[] = [];
    if (remoteProps.length === 0 && localProps.length === 0) {
      try {
        const { getPropertiesFromFirestore } = await import("./firebase");
        const fbProps = await getPropertiesFromFirestore();
        if (fbProps && fbProps.length > 0) {
          firestoreProps = fbProps.map(toPropertyFromFirestore);
        }
      } catch {
        // ignore
      }
    }

    // Combine: local + remote + firestore + defaults (avoid duplicate IDs & deleted items)
    const combined: Property[] = [];
    const seen = new Set<string>();

    for (const p of [...localProps, ...remoteProps, ...firestoreProps, ...defaultProperties]) {
      if (!seen.has(p.id) && !deleted.has(p.id)) {
        seen.add(p.id);
        combined.push(p);
      }
    }

    return combined;
  },
});

export const requestsQuery = queryOptions({
  queryKey: ["public_rental_requests"],
  queryFn: async (): Promise<RentalRequest[]> => {
    const deleted = getDeletedRequestIds();
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

    for (const r of [...localReqs, ...remoteReqs, ...defaultRentalRequests]) {
      if (!seen.has(r.id) && !deleted.has(r.id)) {
        seen.add(r.id);
        combined.push(r);
      }
    }

    return combined;
  },
});

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
            role: u.role === "admin" ? "مدير" : "مستخدم",
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
    title,
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
    description: rawDesc || "شقة مجهزة بكل الضروريات للكراء المؤقت اليومي، نظيفة وعصرية.",
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
        description: `${input.title}\n\n${input.description}`,
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
    title: input.title,
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
    description: input.description,
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
  try {
    const { data: authData } = await supabase.auth.getUser();
    if (authData?.user) authUserId = authData.user.id;
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

  let createdId: string | null = null;
  let insertError: string | null = null;

  // 1. Insert into Supabase properties table
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
        description: `${input.title}\n\n${input.description}`,
        status: "approved", // نشر مباشر وتلقائي بدون مراجعة
      })
      .select("id")
      .single();

    if (error) {
      console.warn("Supabase property insert error:", error);
      insertError = error.message;
    } else if (data) {
      createdId = data.id;
    }
  } catch (err) {
    insertError = err instanceof Error ? err.message : String(err);
  }

  // 2. Prepare full Property object
  const finalId = createdId || `prop-local-${Date.now()}`;
  const newProp: Property = {
    id: finalId,
    title: input.title,
    type: input.propertyType,
    wilaya: input.wilaya,
    commune: input.commune,
    price: input.price,
    rooms: input.rooms,
    area: input.area,
    description: input.description,
    owner: authUserId ? "مستخدم مسجل" : "صاحب العقار",
    ownerPhone: input.phone,
    status: "نشط",
    image: hero,
  };

  // 3. Save to local storage for instant multi-user view
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

  // 4. Update React Query Cache immediately
  if (queryClient) {
    queryClient.setQueryData<Property[]>(propertiesQuery.queryKey, (old = []) => [
      newProp,
      ...old.filter((p) => p.id !== newProp.id),
    ]);
    queryClient.setQueryData<Property[]>(adminPropertiesQuery.queryKey, (old = []) => [
      newProp,
      ...old.filter((p) => p.id !== newProp.id),
    ]);
  }

  return {
    success: !insertError || Boolean(createdId),
    id: finalId,
    error: insertError || undefined,
  };
}

// ==========================================
// Rental Request Creation (Real Supabase + Local Sync)
// ==========================================
export type NewRequestInput = {
  title: string;
  propertyType: string;
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
  try {
    const { data: authData } = await supabase.auth.getUser();
    if (authData?.user) authUserId = authData.user.id;
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

  let createdId: string | null = null;
  let insertError: string | null = null;

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
        specifications: `${input.title}\n\n${input.details}`,
        status: "approved",
      })
      .select("id")
      .single();

    if (error) {
      console.warn("Supabase rental request insert error:", error);
      insertError = error.message;
    } else if (data) {
      createdId = data.id;
    }
  } catch (err) {
    insertError = err instanceof Error ? err.message : String(err);
  }

  const finalId = createdId || `req-local-${Date.now()}`;
  const newReq: RentalRequest = {
    id: finalId,
    title: input.title,
    type: input.propertyType,
    wilaya: input.wilaya,
    commune: input.commune,
    budget: input.budget,
    rooms: input.rooms,
    details: input.details,
    author: authUserId ? "مستخدم مسجل" : "صاحب الطلب",
    contactPhone: input.phone,
    date: new Date().toISOString().slice(0, 10),
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
    queryClient.setQueryData<RentalRequest[]>(requestsQuery.queryKey, (old = []) => [
      newReq,
      ...old.filter((r) => r.id !== newReq.id),
    ]);
    queryClient.setQueryData<RentalRequest[]>(adminRequestsQuery.queryKey, (old = []) => [
      newReq,
      ...old.filter((r) => r.id !== newReq.id),
    ]);
  }

  return {
    success: !insertError || Boolean(createdId),
    id: finalId,
    error: insertError || undefined,
  };
}
