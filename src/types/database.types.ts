// Hand-maintained to match supabase/migrations/. Keep in sync when the schema changes.
// (Supabase CLI `gen types` needs Docker, which isn't available here.)

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Anreise = "Auto" | "Flugzeug" | "Zug";
export type PersonCode = "C" | "M" | "P" | "N";

export interface Database {
  public: {
    Tables: {
      trips: {
        Row: {
          id: string;
          ort: string | null;
          land: string | null;
          land_iso3: string | null;
          lat: number | null;
          lon: number | null;
          art: string | null;
          anreise: Anreise | null;
          abflug_iata: string | null;
          abflug_lat: number | null;
          abflug_lon: number | null;
          ziel_iata: string | null;
          ziel_lat: number | null;
          ziel_lon: number | null;
          flug_stops: { iata: string; lat: number; lon: number }[];
          datum_start: string | null;
          datum_ende: string | null;
          tage: number | null;
          wer_von_uns: string[];
          wer_sonst: string | null;
          kommentar: string | null;
          cover_photo_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          ort?: string | null;
          land?: string | null;
          land_iso3?: string | null;
          lat?: number | null;
          lon?: number | null;
          art?: string | null;
          anreise?: Anreise | null;
          abflug_iata?: string | null;
          abflug_lat?: number | null;
          abflug_lon?: number | null;
          ziel_iata?: string | null;
          ziel_lat?: number | null;
          ziel_lon?: number | null;
          flug_stops?: { iata: string; lat: number; lon: number }[];
          datum_start?: string | null;
          datum_ende?: string | null;
          tage?: number | null;
          wer_von_uns?: string[];
          wer_sonst?: string | null;
          kommentar?: string | null;
          cover_photo_url?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["trips"]["Insert"]>;
        Relationships: [];
      };
      persons: {
        Row: { code: string; name: string; farbe: string };
        Insert: { code: string; name: string; farbe: string };
        Update: Partial<{ code: string; name: string; farbe: string }>;
        Relationships: [];
      };
      airports: {
        Row: { iata: string; name: string; city: string | null; lat: number; lon: number };
        Insert: { iata: string; name: string; city?: string | null; lat: number; lon: number };
        Update: Partial<{ iata: string; name: string; city: string | null; lat: number; lon: number }>;
        Relationships: [];
      };
      trip_photos: {
        Row: {
          id: string;
          trip_id: string;
          url: string;
          caption: string | null;
          sort: number;
        };
        Insert: {
          id?: string;
          trip_id: string;
          url: string;
          caption?: string | null;
          sort?: number;
        };
        Update: Partial<Database["public"]["Tables"]["trip_photos"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "trip_photos_trip_id_fkey";
            columns: ["trip_id"];
            referencedRelation: "trips";
            referencedColumns: ["id"];
          },
        ];
      };
      allowed_emails: {
        Row: { email: string };
        Insert: { email: string };
        Update: Partial<{ email: string }>;
        Relationships: [];
      };
      geocode_cache: {
        Row: { query: string; lat: number; lon: number; source: string; created_at: string };
        Insert: { query: string; lat: number; lon: number; source: string; created_at?: string };
        Update: Partial<{ query: string; lat: number; lon: number; source: string; created_at: string }>;
        Relationships: [];
      };
      wishlist: {
        Row: { iso3: string; land: string; created_at: string };
        Insert: { iso3: string; land: string; created_at?: string };
        Update: Partial<{ iso3: string; land: string; created_at: string }>;
        Relationships: [];
      };
      achievements: {
        Row: {
          id: string;
          icon: string;
          title: string;
          descr: string;
          metric: string;
          target: number;
          sort: number;
          enabled: boolean;
        };
        Insert: {
          id: string;
          icon: string;
          title: string;
          descr: string;
          metric: string;
          target: number;
          sort?: number;
          enabled?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["achievements"]["Insert"]>;
        Relationships: [];
      };
      app_settings: {
        Row: {
          id: number;
          home_lat: number | null;
          home_lon: number | null;
          home_label: string;
          default_airport: string | null;
          password_hash: string | null;
          updated_at: string;
        };
        Insert: {
          id?: number;
          home_lat?: number | null;
          home_lon?: number | null;
          home_label?: string;
          default_airport?: string | null;
          password_hash?: string | null;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["app_settings"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: {
      is_allowed: {
        Args: Record<string, never>;
        Returns: boolean;
      };
    };
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
}

// Convenience row aliases
export type Trip = Database["public"]["Tables"]["trips"]["Row"];
export type TripInsert = Database["public"]["Tables"]["trips"]["Insert"];
export type Person = Database["public"]["Tables"]["persons"]["Row"];
export type Airport = Database["public"]["Tables"]["airports"]["Row"];
export type TripPhoto = Database["public"]["Tables"]["trip_photos"]["Row"];
