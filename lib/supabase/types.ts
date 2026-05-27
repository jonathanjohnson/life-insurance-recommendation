export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Lead = {
  id: string;
  created_at: string;
  zip: string;
  city_slug: string;
  state_slug: string;
  service_type: string | null;
  urgency: string | null;
  property_type: string | null;
  system_details: Json | null;
  first_name: string | null;
  last_name: string | null;
  phone: string;
  email: string;
  tcpa_consent: boolean;
  tcpa_consent_text: string;
  tcpa_consent_ip: string | null;
  tcpa_consent_user_agent: string | null;
  source_url: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_term: string | null;
  utm_content: string | null;
  routing_status: string | null;
  routing_destination: string | null;
  routing_response: Json | null;
  partial: boolean | null;
};

export type LeadInsert = {
  id?: string;
  created_at?: string;
  zip: string;
  city_slug: string;
  state_slug: string;
  service_type?: string | null;
  urgency?: string | null;
  property_type?: string | null;
  system_details?: Json | null;
  first_name?: string | null;
  last_name?: string | null;
  phone: string;
  email: string;
  tcpa_consent?: boolean;
  tcpa_consent_text: string;
  tcpa_consent_ip?: string | null;
  tcpa_consent_user_agent?: string | null;
  source_url?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_term?: string | null;
  utm_content?: string | null;
  routing_status?: string | null;
  routing_destination?: string | null;
  routing_response?: Json | null;
  partial?: boolean | null;
};

export type LeadUpdate = {
  zip?: string;
  city_slug?: string;
  state_slug?: string;
  service_type?: string | null;
  urgency?: string | null;
  property_type?: string | null;
  system_details?: Json | null;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string;
  email?: string;
  tcpa_consent?: boolean;
  tcpa_consent_text?: string;
  tcpa_consent_ip?: string | null;
  tcpa_consent_user_agent?: string | null;
  source_url?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_term?: string | null;
  utm_content?: string | null;
  routing_status?: string | null;
  routing_destination?: string | null;
  routing_response?: Json | null;
  partial?: boolean | null;
};

export type Contractor = {
  id: string;
  created_at: string;
  business_name: string;
  contact_email: string | null;
  contact_phone: string | null;
  service_types: string[] | null;
  service_zips: string[] | null;
  service_states: string[] | null;
  webhook_url: string | null;
  max_leads_per_day: number | null;
  status: string | null;
};

export type ContractorInsert = {
  id?: string;
  created_at?: string;
  business_name: string;
  contact_email?: string | null;
  contact_phone?: string | null;
  service_types?: string[] | null;
  service_zips?: string[] | null;
  service_states?: string[] | null;
  webhook_url?: string | null;
  max_leads_per_day?: number | null;
  status?: string | null;
};

export type ContractorUpdate = {
  business_name?: string;
  contact_email?: string | null;
  contact_phone?: string | null;
  service_types?: string[] | null;
  service_zips?: string[] | null;
  service_states?: string[] | null;
  webhook_url?: string | null;
  max_leads_per_day?: number | null;
  status?: string | null;
};

export type LeadRoutingLog = {
  id: string;
  created_at: string;
  lead_id: string | null;
  destination_type: string | null;
  destination_id: string | null;
  endpoint: string | null;
  request_payload: Json | null;
  response_status: number | null;
  response_body: string | null;
  duration_ms: number | null;
};

export type LeadRoutingLogInsert = {
  id?: string;
  created_at?: string;
  lead_id?: string | null;
  destination_type?: string | null;
  destination_id?: string | null;
  endpoint?: string | null;
  request_payload?: Json | null;
  response_status?: number | null;
  response_body?: string | null;
  duration_ms?: number | null;
};

export type ContentOverride = {
  id: string;
  created_at: string;
  city_slug: string | null;
  state_slug: string | null;
  custom_intro: string | null;
  custom_data_block: Json | null;
  notes: string | null;
};

export type ContentOverrideInsert = {
  id?: string;
  created_at?: string;
  city_slug?: string | null;
  state_slug?: string | null;
  custom_intro?: string | null;
  custom_data_block?: Json | null;
  notes?: string | null;
};

export type ContentOverrideUpdate = {
  city_slug?: string | null;
  state_slug?: string | null;
  custom_intro?: string | null;
  custom_data_block?: Json | null;
  notes?: string | null;
};

export type Database = {
  public: {
    Tables: {
      leads: {
        Row: Lead;
        Insert: LeadInsert;
        Update: LeadUpdate;
        Relationships: [];
      };
      contractors: {
        Row: Contractor;
        Insert: ContractorInsert;
        Update: ContractorUpdate;
        Relationships: [];
      };
      lead_routing_log: {
        Row: LeadRoutingLog;
        Insert: LeadRoutingLogInsert;
        Update: Partial<LeadRoutingLogInsert>;
        Relationships: [
          {
            foreignKeyName: "lead_routing_log_lead_id_fkey";
            columns: ["lead_id"];
            referencedRelation: "leads";
            referencedColumns: ["id"];
          },
        ];
      };
      content_overrides: {
        Row: ContentOverride;
        Insert: ContentOverrideInsert;
        Update: ContentOverrideUpdate;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
