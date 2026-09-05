export type MemoryType = "photo" | "video" | "audio" | "document" | "text" | "other";

export interface MemorySummary {
  id: string;
  title: string;
  description: string | null;
  type: MemoryType;
  thumbnail_path: string | null;
  thumbUrl?: string | null;
  storage_path?: string | null;
  is_favorite: boolean;
  date_taken: string | null;
  created_at: string;
  location: string | null;
}

export interface MemoryDetail extends MemorySummary {
  original_filename: string | null;
  mime_type: string | null;
  file_size: number | null;
  text_content: string | null;
  people: string[] | null;
  tags: string[];
  signedUrl: string | null;
  thumbnailUrl: string | null;
  updated_at: string;
}

export type EventCategory =
  | "birthday"
  | "anniversary"
  | "first_meeting"
  | "special_day"
  | "trip"
  | "celebration"
  | "reminder"
  | "custom";

export interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  start_datetime: string;
  end_datetime: string | null;
  all_day: boolean;
  category: EventCategory;
  color: string | null;
  recurrence_rule: string | null;
  reminder: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface DashboardStats {
  counts: {
    total: number;
    photo: number;
    video: number;
    audio: number;
    document: number;
    text: number;
    other: number;
  };
  upcoming: Pick<CalendarEvent, "id" | "title" | "category" | "start_datetime" | "color">[];
  recent: MemorySummary[];
}

export interface AppSettings {
  site_subtitle: string;
  default_theme: "light" | "dark" | "system";
  default_gallery_layout: "masonry" | "grid" | "list";
  default_sort: "newest" | "oldest" | "recently_updated" | "alphabetical";
  date_format: string;
  time_format: "12h" | "24h";
}
