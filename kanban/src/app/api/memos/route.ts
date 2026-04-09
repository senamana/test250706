import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET /api/memos?year_month=2026-04 - メモ一覧取得
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const yearMonth = searchParams.get("year_month");

  let query = supabase
    .from("memos")
    .select("*")
    .order("created_at", { ascending: false });

  if (yearMonth) {
    query = query.eq("year_month", yearMonth);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

// POST /api/memos - メモ保存
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { title = "無題", content, year_month, tags = [] } = body;

  if (!content) {
    return NextResponse.json({ error: "content is required" }, { status: 400 });
  }

  const ym = year_month || new Date().toISOString().slice(0, 7);

  const { data, error } = await supabase
    .from("memos")
    .insert({ title, content, year_month: ym, tags })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data, { status: 201 });
}
