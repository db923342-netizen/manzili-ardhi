import { describe, it, expect } from "vitest";
import { handleRevealContact } from "@/server/contacts";
import {
  defaultProperties,
  defaultRentalRequests,
  defaultSaleProperties,
  defaultSaleRequests,
} from "@/lib/listings";

describe("Phone Privacy and Server-Side Contact Revelation", () => {
  it("ensures all public default properties have redacted phone numbers", () => {
    for (const p of defaultProperties) {
      expect(p.ownerPhone).toBe("");
    }
    for (const sp of defaultSaleProperties) {
      expect(sp.ownerPhone).toBe("");
    }
  });

  it("ensures all public default requests have redacted contact phone numbers", () => {
    for (const r of defaultRentalRequests) {
      expect(r.contactPhone).toBe("");
    }
    for (const sr of defaultSaleRequests) {
      expect(sr.contactPhone).toBe("");
    }
  });

  it("rejects unauthorized callers without a Bearer token with 401", async () => {
    const req = new Request("http://localhost:3000/api/contacts/reveal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId: "sale-1", listingType: "property" }),
    });

    const res = await handleRevealContact(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toContain("تسجيل الدخول");
  });

  it("rejects unauthorized callers with an invalid Bearer token with 401", async () => {
    const req = new Request("http://localhost:3000/api/contacts/reveal", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer invalid.fake.token",
      },
      body: JSON.stringify({ listingId: "sale-1", listingType: "property" }),
    });

    const res = await handleRevealContact(req);
    expect(res.status).toBe(401);
  });
});
