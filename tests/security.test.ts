import { describe, expect, it } from "vitest";
import { checkRateLimit, ticketTokenSchema } from "../src/lib/security";
import { isValidTicketTransition } from "../src/lib/queue-rules";

describe("ticketTokenSchema", () => {
  it("accepts generated 48-character hexadecimal tokens", () => {
    expect(ticketTokenSchema.safeParse("a".repeat(48)).success).toBe(true);
  });

  it("rejects malformed or incorrectly sized tokens", () => {
    expect(ticketTokenSchema.safeParse("a".repeat(47)).success).toBe(false);
    expect(ticketTokenSchema.safeParse("g".repeat(48)).success).toBe(false);
    expect(ticketTokenSchema.safeParse("not-a-ticket").success).toBe(false);
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
});

describe("isValidTicketTransition", () => {
  it("allows only valid staff transitions", () => {
    expect(isValidTicketTransition("WAITING", "CALLED")).toBe(true);
    expect(isValidTicketTransition("CALLED", "READY")).toBe(true);
    expect(isValidTicketTransition("READY", "SERVED")).toBe(true);
    expect(isValidTicketTransition("WAITING", "SERVED")).toBe(false);
    expect(isValidTicketTransition("SERVED", "CALLED")).toBe(false);
  });
});
