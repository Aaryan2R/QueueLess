import type { Database } from "./database.types";

export type QueueStatus = Database["public"]["Enums"]["queue_status"];
export type TicketStatus = Database["public"]["Enums"]["ticket_status"];
export type Queue = Database["public"]["Tables"]["queues"]["Row"];
export type Ticket = Database["public"]["Tables"]["tickets"]["Row"];
