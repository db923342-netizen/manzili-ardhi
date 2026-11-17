import {
  wilayasRecord,
  wilayasList,
  getCommunesForWilaya,
  findWilaya,
  normalizeWilayaName,
} from "./algeria";

export const wilayas = wilayasRecord;
export { wilayasList, getCommunesForWilaya, findWilaya, normalizeWilayaName };

export const propertyTypes = ["شقة", "فيلا", "منزل", "أرض", "محل تجاري", "مكتب", "استوديو"];

export type Property = {
  id: string;
  title: string;
  type: string;
  purpose?: "كراء" | "بيع";
  legalStatus?: string; // عقد توثيقي، دفتر عقاري، في الشيوع...
  wilaya: string;
  commune: string;
  price: number;
  rooms: number;
  area: number;
  description: string;
  owner: string;
  ownerPhone?: string;
  status: "نشط" | "قيد المراجعة" | "مؤجر" | "تم البيع";
  image: string;
  publishedAt?: string;
  createdAt?: string;
};

export type RentalRequest = {
  id: string;
  title: string;
  type: string;
  purpose?: "كراء" | "شراء";
  wilaya: string;
  commune: string;
  budget: number;
  rooms: number;
  details: string;
  author: string;
  contactPhone?: string;
  date: string;
  createdAt?: string;
};

export function formatPublishTime(dateStr?: string): string {
  if (!dateStr) return "نُشر حديثاً";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;

    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    if (diffMs < 0) return "الآن";

    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 2) return "الآن";
    if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
    if (diffHours < 24) {
      const timeStr = d.toLocaleTimeString("ar-DZ", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
      return `اليوم (${timeStr})`;
    }
    if (diffDays === 1) {
      const timeStr = d.toLocaleTimeString("ar-DZ", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
      return `أمس (${timeStr})`;
    }
    if (diffDays < 7) return `منذ ${diffDays} أيام`;

    return d.toLocaleDateString("ar-DZ", {
      year: "numeric",
      month: "numeric",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export const fees = {
  publish: 0,
  featured: 1000,
  dealTenant: 1000,
  dealOwner: 1000,
  temporaryBookingFee: 500, // رسوم خدمة رمزية لتأكيد حجز الكراء المؤقت
};

export const formatDA = (n: number) => `${n.toLocaleString("ar-DZ")} د.ج`;

export type TemporaryRental = {
  id: string;
  title: string;
  type: "شقة" | "استوديو" | "فيلا" | "دوبلكس";
  wilaya: string;
  commune: string;
  address?: string;
  nightlyPrice: number; // السعر بالليلة الواحدة د.ج
  minStayDays: number; // أدنى مدة للكراء بالأيام (مثلاً 1 لـ 24 ساعة)
  maxGuests: number; // أقصى عدد أشخاص
  rooms: number;
  beds: number;
  bathrooms: number;
  area: number;
  furnished: boolean;
  rating: number;
  reviewsCount: number;
  is24hAvailable: boolean; // متوفر للكراء الفوري 24 ساعة
  amenities: string[]; // مكيف, واي فاي, مطبخ مجهز, موقف سيارات, إطلالة على البحر, مصعد, تلفاز ذكي, غسالة
  description: string;
  rules: string[]; // عائلات فقط، دفتر عائلي إلزامي، ممنوع التدخين...
  owner: string;
  ownerPhone?: string;
  status: "نشط" | "قيد المراجعة" | "محجوز";
  image: string;
  images?: string[];
  checkInTime?: string;
  checkOutTime?: string;
};

export type TemporaryBooking = {
  id: string;
  rentalId: string;
  rentalTitle: string;
  wilaya: string;
  commune: string;
  guestName: string;
  guestPhone: string;
  guestEmail?: string;
  checkInDate: string;
  checkOutDate: string;
  totalNights: number;
  guestsCount: number;
  nightlyPrice: number;
  totalPrice: number;
  serviceFee: number;
  grandTotal: number;
  status: "قيد التأكيد" | "مؤكد" | "مكتمل" | "ملغى";
  specialNotes?: string;
  createdAt: string;
};

export type TemporaryRentalRequest = {
  id: string;
  title: string;
  type: "شقة" | "استوديو" | "فيلا" | "دوبلكس";
  wilaya: string;
  commune: string;
  checkInDate: string;
  durationDays: number; // مدة الإقامة بالأيام (1 لـ 24 ساعة، 3 أيام، 7 أيام...)
  guestsCount: number;
  budgetPerNight: number; // السعر لليلة الواحدة د.ج
  author: string;
  contactPhone: string;
  details: string;
  createdAt: string;
  status: "منشور" | "تم التلبية" | "ملغى";
};

export const defaultTemporaryBookings: TemporaryBooking[] = [];

export const defaultTemporaryRentals: TemporaryRental[] = [];

export const defaultTemporaryRequests: TemporaryRentalRequest[] = [
  {
    id: "treq-1",
    title: "مطلوب شقة F3 مفروشة ومكيفة لعائلة لمدة 4 أيام",
    type: "شقة",
    wilaya: "وهران",
    commune: "وهران",
    checkInDate: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10),
    durationDays: 4,
    guestsCount: 4,
    budgetPerNight: 8500,
    author: "كريم م.",
    contactPhone: "",
    details:
      "عائلة من 4 أفراد قادمة في عطلة قصيرة، نشترط النظافة ووجود مكيف هواء ودفتر عائلي متوفر، يفضل بالقرب من الكورنيش أو حي العقيد لطفي.",
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    status: "منشور",
  },
  {
    id: "treq-2",
    title: "مطلوب استوديو هادئ أو F2 لمهمة عمل 48 ساعة (ليلتين)",
    type: "استوديو",
    wilaya: "الجزائر",
    commune: "باب الزوار",
    checkInDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
    durationDays: 2,
    guestsCount: 1,
    budgetPerNight: 6000,
    author: "ياسين ب.",
    contactPhone: "",
    details:
      "مهندس قادم في مهمة عمل قرب المطار ومنطقة الأعمال بباب الزوار، أحتاج إنترنت واي فاي سريع ومكان آمن لركن السيارة.",
    createdAt: new Date(Date.now() - 3600000 * 18).toISOString(),
    status: "منشور",
  },
  {
    id: "treq-3",
    title: "مطلوب فيلا صغيرة أو دوبلكس مطل على البحر لمدة أسبوع",
    type: "فيلا",
    wilaya: "بجاية",
    commune: "تيشي",
    checkInDate: new Date(Date.now() + 86400000 * 5).toISOString().slice(0, 10),
    durationDays: 7,
    guestsCount: 6,
    budgetPerNight: 15000,
    author: "أمين س.",
    contactPhone: "",
    details:
      "إقامة عائلية لمدة أسبوع بتيشي أو تيشي الشاطئ، يشترط موقف سيارات مغلق وتجهيزات مطبخ كاملة.",
    createdAt: new Date(Date.now() - 86400000 * 1.5).toISOString(),
    status: "منشور",
  },
];
