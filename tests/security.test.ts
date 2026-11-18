import { describe, expect, it } from "vitest";
import { checkRateLimit, isTrustedMutation, publicError, ticketTokenSchema } from "../src/lib/security";
import { isValidTicketTransition } from "../src/lib/queue-rules";
import { getAppUrl } from "../src/lib/app-url";

describe("ticketTokenSchema", () => {
  it("accepts generated 48-character hexadecimal tokens", () => {
    expect(ticketTokenSchema.safeParse("a".repeat(48)).success).toBe(true);
    expect(ticketTokenSchema.safeParse("0123456789abcdef0123456789abcdef0123456789abcdef").success).toBe(true);
  });

  it("rejects malformed or incorrectly sized tokens", () => {
    expect(ticketTokenSchema.safeParse("a".repeat(47)).success).toBe(false);
    expect(ticketTokenSchema.safeParse("a".repeat(49)).success).toBe(false);
    expect(ticketTokenSchema.safeParse("g".repeat(48)).success).toBe(false);
    expect(ticketTokenSchema.safeParse("A".repeat(48)).success).toBe(false);
    expect(ticketTokenSchema.safeParse("not-a-ticket").success).toBe(false);
    expect(ticketTokenSchema.safeParse("").success).toBe(false);
  });
});

describe("checkRateLimit", () => {
  it("blocks requests after the configured limit and resets after the window", async () => {
    const key = `test-rate-limit-${crypto.randomUUID()}`;
    expect(checkRateLimit(key, 1, 20)).toBe(true);
    expect(checkRateLimit(key, 1, 20)).toBe(false);
    await new Promise((resolve) => setTimeout(resolve, 30));
    expect(checkRateLimit(key, 1, 20)).toBe(true);
  });

  it("allows multiple requests within limit", () => {
    const key = `test-rate-limit-multi-${crypto.randomUUID()}`;
    expect(checkRateLimit(key, 3, 1000)).toBe(true);
    expect(checkRateLimit(key, 3, 1000)).toBe(true);
    expect(checkRateLimit(key, 3, 1000)).toBe(true);
    expect(checkRateLimit(key, 3, 1000)).toBe(false);
  });
});

describe("publicError", () => {
  it("passes through recognized safe domain errors", () => {
    const safeMsg = "There are no waiting customers.";
    expect(publicError(new Error(safeMsg), "Fallback")).toBe(safeMsg);
  });

  it("redacts raw database or internal errors with fallback", () => {
    const rawSql = "relation \"public.tickets\" does not exist at character 15";
    expect(publicError(new Error(rawSql), "Fallback error.")).toBe("Fallback error.");
  });

  it("handles non-Error objects safely", () => {
    expect(publicError(null, "Fallback error.")).toBe("Fallback error.");
    expect(publicError(undefined, "Fallback error.")).toBe("Fallback error.");
    expect(publicError({ foo: "bar" }, "Fallback error.")).toBe("Fallback error.");
  });
});

describe("isTrustedMutation", () => {
  it("permits mutations without an origin header (e.g. server-to-server)", () => {
    const req = new Request("http://localhost:3000/api/public/join", { method: "POST" });
    expect(isTrustedMutation(req)).toBe(true);
  });

  it("rejects untrusted external origins", () => {
    const req = new Request("http://localhost:3000/api/public/join", {
      method: "POST",
      headers: { origin: "https://attacker-domain.evil" }
    });
    expect(isTrustedMutation(req)).toBe(false);
  });

  it("accepts matching request origin", () => {
    const req = new Request("http://localhost:3000/api/public/join", {
      method: "POST",
      headers: { origin: "http://localhost:3000" }
    });
    expect(isTrustedMutation(req)).toBe(true);
  });
});

describe("getAppUrl", () => {
  it("uses the configured public URL", () => {
    const previous = process.env.NEXT_PUBLIC_APP_URL;
    const previousVercelUrl = process.env.VERCEL_URL;
    process.env.NEXT_PUBLIC_APP_URL = "https://demo.example.com";
    delete process.env.VERCEL_URL;

    expect(getAppUrl("https://request.example.com")).toBe("https://demo.example.com");

    if (previous === undefined) delete process.env.NEXT_PUBLIC_APP_URL;
    else process.env.NEXT_PUBLIC_APP_URL = previous;
    if (previousVercelUrl === undefined) delete process.env.VERCEL_URL;
    else process.env.VERCEL_URL = previousVercelUrl;
  });

  it("uses the Vercel URL when local configuration is deployed", () => {
    const previous = process.env.NEXT_PUBLIC_APP_URL;
    const previousVercelUrl = process.env.VERCEL_URL;
    process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
    process.env.VERCEL_URL = "queueless-demo.vercel.app";

    expect(getAppUrl()).toBe("https://queueless-demo.vercel.app");

    if (previous === undefined) delete process.env.NEXT_PUBLIC_APP_URL;
    else process.env.NEXT_PUBLIC_APP_URL = previous;
    if (previousVercelUrl === undefined) delete process.env.VERCEL_URL;
    else process.env.VERCEL_URL = previousVercelUrl;
  });
});

describe("isValidTicketTransition", () => {
  it("allows only valid staff transitions", () => {
    expect(isValidTicketTransition("WAITING", "CALLED")).toBe(true);
    expect(isValidTicketTransition("WAITING", "CANCELLED")).toBe(true);
    expect(isValidTicketTransition("CALLED", "READY")).toBe(true);
    expect(isValidTicketTransition("CALLED", "SERVED")).toBe(true);
    expect(isValidTicketTransition("CALLED", "NO_SHOW")).toBe(true);
    expect(isValidTicketTransition("READY", "SERVED")).toBe(true);
    expect(isValidTicketTransition("READY", "NO_SHOW")).toBe(true);
  });

  it("blocks illegal transitions", () => {
    expect(isValidTicketTransition("WAITING", "SERVED")).toBe(false);
    expect(isValidTicketTransition("WAITING", "READY")).toBe(false);
    expect(isValidTicketTransition("WAITING", "NO_SHOW")).toBe(false);
    expect(isValidTicketTransition("SERVED", "CALLED")).toBe(false);
    expect(isValidTicketTransition("SERVED", "WAITING")).toBe(false);
    expect(isValidTicketTransition("NO_SHOW", "WAITING")).toBe(false);
    expect(isValidTicketTransition("CANCELLED", "WAITING")).toBe(false);
  });
});
