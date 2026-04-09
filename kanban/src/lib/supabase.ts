import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type TaskStatus = "todo" | "in_progress" | "done";

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  memo_id: string | null;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface Memo {
  id: string;
  title: string;
  content: string;
  year_month: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}
