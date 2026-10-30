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
  wilaya: string;
  commune: string;
  price: number;
  rooms: number;
  area: number;
  description: string;
  owner: string;
  ownerPhone?: string;
  status: "نشط" | "قيد المراجعة" | "مؤجر";
  image: string;
};

export type RentalRequest = {
  id: string;
  title: string;
  type: string;
  wilaya: string;
  commune: string;
  budget: number;
  rooms: number;
  details: string;
  author: string;
  contactPhone?: string;
  date: string;
};

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

export const defaultTemporaryBookings: TemporaryBooking[] = [];

export const defaultTemporaryRentals: TemporaryRental[] = [];
