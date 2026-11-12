import type { TicketStatus } from "./types";

export function isValidTicketTransition(current: TicketStatus, next: TicketStatus) {
  if (current === "WAITING") return next === "CALLED" || next === "CANCELLED";
  if (current === "CALLED") return next === "READY" || next === "SERVED" || next === "NO_SHOW";
  if (current === "READY") return next === "SERVED" || next === "NO_SHOW";
  return false;
}
