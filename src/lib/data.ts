import { wilayasRecord, wilayasList, getCommunesForWilaya } from "./algeria";

export const wilayas = wilayasRecord;
export { wilayasList, getCommunesForWilaya };

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

export const defaultTemporaryRentals: TemporaryRental[] = [
  {
    id: "temp-101",
    title: "شقة فاخرة F3 مؤثثة بالكامل مع إطلالة بانورامية - حيدرة",
    type: "شقة",
    wilaya: "الجزائر",
    commune: "حيدرة",
    address: "شارع العربي بن مهيدي، حي راقٍ وهادئ",
    nightlyPrice: 8500,
    minStayDays: 1, // متاح كراء 24 ساعة
    maxGuests: 5,
    rooms: 3,
    beds: 3,
    bathrooms: 1,
    area: 95,
    furnished: true,
    rating: 4.9,
    reviewsCount: 38,
    is24hAvailable: true,
    amenities: [
      "تكييف مركزي",
      "واي فاي ألياف بصرية",
      "مطبخ مجهز بالكامل",
      "موقف سيارات محروس",
      "تلفاز 4K ذكي",
      "مصعد",
      "تدفئة مركزية",
      "غسالة ملابس",
    ],
    description:
      "شقة راقية جداً في قلب حيدرة العاصمة، مفروشة بأثاث عصري ممتاز. مناسبة لرجال الأعمال، الزوار، والعائلات. مجهزة بجميع وسائل الراحة والطبخ وقريبة من السفارات والمطاعم الشهيرة. كراء متاح باليوم (24 ساعة فما فوق) أو بالأسبوع.",
    rules: [
      "مخصصة للعائلات أو المسافرين المهنيين",
      "يطلب الدفتر العائلي للأزواج الجزائريين",
      "ممنوع التدخين داخل الشقة",
      "تسليم المفاتيح 24/24",
    ],
    owner: "أمين طاهر",
    ownerPhone: "0550 12 34 56",
    status: "نشط",
    image:
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80",
    ],
    checkInTime: "14:00",
    checkOutTime: "12:00",
  },
  {
    id: "temp-102",
    title: "استوديو عصري مجهز مطل على البحر - وهران (كانستيل)",
    type: "استوديو",
    wilaya: "وهران",
    commune: "وهران",
    address: "واجهة البحر كانستيل، إقامة مغلقة ومؤمنة",
    nightlyPrice: 5000,
    minStayDays: 1, // متاح 24 ساعة
    maxGuests: 2,
    rooms: 1,
    beds: 1,
    bathrooms: 1,
    area: 45,
    furnished: true,
    rating: 4.8,
    reviewsCount: 52,
    is24hAvailable: true,
    amenities: [
      "إطلالة مباشرة على البحر",
      "تكييف",
      "واي فاي سريع",
      "مطبخ أمريكي صغير",
      "موقف سيارات بالمرآب",
      "حراسة أمنية 24/7",
    ],
    description:
      "استوديو نظيف وعصري بديكور حديث وإطلالة ساحرة ومباشرة على زرقة البحر الأبيض المتوسط في كانستيل وهران. مثالي لشخصين أو زيارة عمل قصيرة. متوفر للكراء اليومي والمؤقت بأسعار تنافسية جداً.",
    rules: ["ممنوع الحفلات", "الهدوء بعد الساعة 22:00", "إبراز بطاقة التعريف الوطنية"],
    owner: "نوال بوخاري",
    ownerPhone: "0770 45 67 89",
    status: "نشط",
    image:
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80",
    ],
    checkInTime: "13:00",
    checkOutTime: "11:30",
  },
  {
    id: "temp-103",
    title: "شقة سياحية عائلية F4 بجوار الشاطئ - بجاية (تيشي)",
    type: "شقة",
    wilaya: "بجاية",
    commune: "تيشي",
    address: "شارع الشاطئ، على بعد دقيقتين مشياً للبحر",
    nightlyPrice: 9000,
    minStayDays: 2,
    maxGuests: 7,
    rooms: 4,
    beds: 5,
    bathrooms: 2,
    area: 120,
    furnished: true,
    rating: 4.95,
    reviewsCount: 64,
    is24hAvailable: false,
    amenities: [
      "شرفة واسعة على البحر",
      "تكييف في جميع الغرف",
      "مطبخ متكامل",
      "غسالة",
      "موقف سيارات خاص",
      "حديقة صغيرة للأطفال",
      "واي فاي",
    ],
    description:
      "شقة فسيحة ومجهزة لراحة العائلات الكبيرة والأصدقاء في قلب المنتجع السياحي تيشي ببجاية. مفروشة بأسرة مريحة، وأواني طبخ كاملة، وشرفة مطلة على الخليج. مثالية للعطلات الصيفية والشتوية.",
    rules: [
      "مخصصة للعائلات فقط مع إبراز الدفتر العائلي",
      "المحافظة على نظافة المكان",
      "ممنوع الحيوانات الأليفة",
    ],
    owner: "مراد قدور",
    ownerPhone: "0661 88 99 00",
    status: "نشط",
    image:
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80",
    ],
    checkInTime: "15:00",
    checkOutTime: "11:00",
  },
  {
    id: "temp-104",
    title: "شقة هادئة F3 في المدينة الجديدة - قسنطينة (علي منجلي)",
    type: "شقة",
    wilaya: "قسنطينة",
    commune: "قسنطينة",
    address: "الوحدة الجوارية 14، قرب الترامواي والمستشفى الجامعي",
    nightlyPrice: 4500,
    minStayDays: 1, // متاح 24 ساعة
    maxGuests: 4,
    rooms: 3,
    beds: 3,
    bathrooms: 1,
    area: 80,
    furnished: true,
    rating: 4.7,
    reviewsCount: 29,
    is24hAvailable: true,
    amenities: [
      "قرب محطة الترامواي",
      "تدفئة وتكييف",
      "تلفاز شاشة مسطحة",
      "واي فاي مجاني",
      "مطبخ مجهز",
      "مصعد بالعمارة",
    ],
    description:
      "شقة مريحة ونظيفة جداً في موقع استراتيجي بعلي منجلي قسنطينة. مناسبة للزوار والباحثين والمرضى القادمين للمستشفيات أو الجامعات. أسعار مدروسة للكراء باليوم أو الأسبوع.",
    rules: ["احترام الجيران", "عائلات أو أفراد بهوية رسمية", "ممنوع التدخين"],
    owner: "حمزة براهمي",
    ownerPhone: "0561 22 44 66",
    status: "نشط",
    image:
      "https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=800&q=80",
    ],
    checkInTime: "14:00",
    checkOutTime: "12:00",
  },
  {
    id: "temp-105",
    title: "فيلا دوبلكس شاطئية مع مسبح خاص - تيبازة (شنوة)",
    type: "فيلا",
    wilaya: "تيبازة",
    commune: "تيبازة",
    address: "جبل شنوة، إطلالة مباشرة على الخليج والغابة",
    nightlyPrice: 18000,
    minStayDays: 1,
    maxGuests: 8,
    rooms: 5,
    beds: 6,
    bathrooms: 3,
    area: 250,
    furnished: true,
    rating: 5.0,
    reviewsCount: 41,
    is24hAvailable: true,
    amenities: [
      "مسبح خاص",
      "إطلالة بانورامية بحر وجبل",
      "شواء باربيكيو",
      "حديقة خاصة",
      "تكييف كامل",
      "موقف لسيارتين",
      "أمن وحراسة",
    ],
    description:
      "فيلا ساحرة بتصميم عصري وفخم بشنوة تيبازة، تحتوي على مسبح خاص وحديقة بإطلالة ساحرة على البحر. تجربة إقامة استثنائية وراحة تامة للعائلات لقضاء العطلات ونهايات الأسبوع.",
    rules: [
      "عائلات فقط مع إبراز الدفتر العائلي",
      "الحفاظ على أمن وسلامة المسبح",
      "ممنوع الحفلات الصاخبة",
    ],
    owner: "رياض لعموري",
    ownerPhone: "0771 99 88 77",
    status: "نشط",
    image:
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80",
    ],
    checkInTime: "15:00",
    checkOutTime: "12:00",
  },
  {
    id: "temp-106",
    title: "شقة أنيقة F2 قريبة من الكورنيش - عنابة",
    type: "شقة",
    wilaya: "عنابة",
    commune: "عنابة",
    address: "شارع الكورنيش، قرب شاطئ شابوي",
    nightlyPrice: 5500,
    minStayDays: 1, // متاح 24 ساعة
    maxGuests: 3,
    rooms: 2,
    beds: 2,
    bathrooms: 1,
    area: 60,
    furnished: true,
    rating: 4.85,
    reviewsCount: 31,
    is24hAvailable: true,
    amenities: [
      "قريبة من البحر والكورنيش",
      "تكييف",
      "واي فاي عالي السرعة",
      "تلفاز ذكي",
      "مطبخ متكامل",
      "موقف سيارات مجاور",
    ],
    description:
      "شقة F2 مهيأة بأناقة تامة، تقع على بعد خطوات قليلة من كورنيش بونة وشاطئ شابوي في عنابة. مجهزة بكل ما تحتاجه لإقامة هادئة وقصيرة مع سهولة الوصول لكل المرافق السياحية.",
    rules: ["احترام الهدوء ونظافة المسكن", "دفتر عائلي للأزواج"],
    owner: "سفيان دريدي",
    ownerPhone: "0655 44 33 22",
    status: "نشط",
    image:
      "https://images.unsplash.com/photo-1502005229762-ae1b46b18536?auto=format&fit=crop&w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1502005229762-ae1b46b18536?auto=format&fit=crop&w=800&q=80",
    ],
    checkInTime: "14:00",
    checkOutTime: "12:00",
  },
];
