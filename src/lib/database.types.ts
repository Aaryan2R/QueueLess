export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      businesses: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          slug: string;
          logo_url: string | null;
          primary_color: string;
          welcome_message: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          name: string;
          slug: string;
          logo_url?: string | null;
          primary_color?: string;
          welcome_message?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          name?: string;
          slug?: string;
          logo_url?: string | null;
          primary_color?: string;
          welcome_message?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      staff_assignments: {
        Row: {
          id: string;
          business_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          user_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      queues: {
        Row: {
          id: string;
          business_id: string;
          name: string;
          slug: string;
          description: string | null;
          max_size: number;
          average_service_minutes: number;
          allow_customer_cancel: boolean;
          status: Database["public"]["Enums"]["queue_status"];
          created_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          name: string;
          slug: string;
          description?: string | null;
          max_size?: number;
          average_service_minutes?: number;
          allow_customer_cancel?: boolean;
          status?: Database["public"]["Enums"]["queue_status"];
          created_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          max_size?: number;
          average_service_minutes?: number;
          allow_customer_cancel?: boolean;
          status?: Database["public"]["Enums"]["queue_status"];
          created_at?: string;
        };
        Relationships: [];
      };
      tickets: {
        Row: {
          id: string;
          queue_id: string;
          access_token: string;
          token: string;
          sequence_number: number;
          customer_name: string;
          customer_phone: string | null;
          party_size: number;
          status: Database["public"]["Enums"]["ticket_status"];
          joined_at: string;
          called_at: string | null;
          ready_at: string | null;
          served_at: string | null;
          completed_at: string | null;
          missed_turn_count: number;
          arrival_deadline_at: string | null;
        };
        Insert: {
          id?: string;
          queue_id: string;
          access_token?: string;
          token: string;
          sequence_number: number;
          customer_name: string;
          customer_phone?: string | null;
          party_size?: number;
          status?: Database["public"]["Enums"]["ticket_status"];
          joined_at?: string;
          called_at?: string | null;
          ready_at?: string | null;
          served_at?: string | null;
          completed_at?: string | null;
          missed_turn_count?: number;
          arrival_deadline_at?: string | null;
        };
        Update: {
          id?: string;
          queue_id?: string;
          access_token?: string;
          token?: string;
          sequence_number?: number;
          customer_name?: string;
          customer_phone?: string | null;
          party_size?: number;
          status?: Database["public"]["Enums"]["ticket_status"];
          joined_at?: string;
          called_at?: string | null;
          ready_at?: string | null;
          served_at?: string | null;
          completed_at?: string | null;
          missed_turn_count?: number;
          arrival_deadline_at?: string | null;
        };
        Relationships: [];
      };
      push_subscriptions: {
        Row: {
          id: string;
          ticket_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
          created_at: string;
          last_seen_at: string;
        };
        Insert: {
          id?: string;
          ticket_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
          created_at?: string;
          last_seen_at?: string;
        };
        Update: {
          id?: string;
          ticket_id?: string;
          endpoint?: string;
          p256dh?: string;
          auth?: string;
          created_at?: string;
          last_seen_at?: string;
        };
        Relationships: [];
      };
      ticket_alerts: {
        Row: {
          id: string;
          ticket_id: string;
          alert_level: Database["public"]["Enums"]["ticket_alert_level"];
          sent_at: string;
        };
        Insert: {
          id?: string;
          ticket_id: string;
          alert_level: Database["public"]["Enums"]["ticket_alert_level"];
          sent_at?: string;
        };
        Update: {
          id?: string;
          ticket_id?: string;
          alert_level?: Database["public"]["Enums"]["ticket_alert_level"];
          sent_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      create_business_with_queue: {
        Args: { input_name: string; input_slug: string };
        Returns: Database["public"]["Tables"]["businesses"]["Row"];
      };
      call_next: {
        Args: { target_queue_id: string };
        Returns: Database["public"]["Tables"]["tickets"]["Row"];
      };
      change_ticket_status: {
        Args: {
          target_ticket_id: string;
          next_status: Database["public"]["Enums"]["ticket_status"];
        };
        Returns: Database["public"]["Tables"]["tickets"]["Row"];
      };
      join_queue: {
        Args: {
          target_queue_id: string;
          input_name: string;
          input_phone?: string | null;
          input_party_size?: number;
        };
        Returns: Database["public"]["Tables"]["tickets"]["Row"];
      };
      get_public_ticket: {
        Args: { input_token: string };
        Returns: Json;
      };
      leave_queue: {
        Args: { input_token: string };
        Returns: Database["public"]["Tables"]["tickets"]["Row"];
      };
      save_push_subscription: {
        Args: {
          input_token: string;
          input_endpoint: string;
          input_p256dh: string;
          input_auth: string;
        };
        Returns: undefined;
      };
      expire_ticket_if_needed: {
        Args: { input_token: string };
        Returns: Database["public"]["Tables"]["tickets"]["Row"];
      };
      confirm_ticket_arrival: {
        Args: { input_token: string };
        Returns: Database["public"]["Tables"]["tickets"]["Row"];
      };
      add_staff_member: {
        Args: { input_business_id: string; input_email: string };
        Returns: {
          id: string;
          user_id: string;
          email: string;
          created_at: string;
        }[];
      };
      list_business_staff: {
        Args: { input_business_id: string };
        Returns: {
          id: string;
          user_id: string;
          email: string;
          created_at: string;
        }[];
      };
      remove_staff_member: {
        Args: { input_assignment_id: string };
        Returns: undefined;
      };
    };
    Enums: {
      app_role: "OWNER" | "STAFF" | "PLATFORM_ADMIN";
      queue_status: "ACTIVE" | "PAUSED" | "CLOSED";
      ticket_status: "WAITING" | "CALLED" | "READY" | "SERVED" | "NO_SHOW" | "CANCELLED";
      ticket_alert_level: "AHEAD_3" | "AHEAD_2" | "AHEAD_1" | "CALLED";
    };
    CompositeTypes: Record<string, never>;
  };
};
