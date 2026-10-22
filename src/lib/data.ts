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
  date: string;
};

export const fees = {
  publish: 0,
  featured: 1000,
  dealTenant: 1000,
  dealOwner: 1000,
};

export const formatDA = (n: number) => `${n.toLocaleString("ar-DZ")} د.ج`;
