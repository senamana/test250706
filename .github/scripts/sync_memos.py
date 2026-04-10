"""
pushされたメモファイルの差分を解析してSupabaseに保存するスクリプト
"""
import re
import json
import os
import subprocess
import urllib.request
import urllib.error

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_ANON_KEY"]


def get_changed_memo_files():
    result = subprocess.run(
        ["git", "diff", "--name-only", "HEAD~1", "HEAD", "--", "memos/*.md"],
        capture_output=True, text=True
    )
    return [f for f in result.stdout.strip().splitlines() if f]


def get_added_lines(filepath):
    result = subprocess.run(
        ["git", "diff", "HEAD~1", "HEAD", "--", filepath],
        capture_output=True, text=True
    )
    lines = []
    for line in result.stdout.splitlines():
        if line.startswith("+") and not line.startswith("+++"):
            lines.append(line[1:])
    return "\n".join(lines)


def parse_memos(text):
    """## HH:MM - タイトル\n\n内容\n\n--- の形式でパース"""
    pattern = r"## (\d{2}:\d{2}) - (.+?)\n\n(.*?)\n\n---"
    matches = re.findall(pattern, text, re.DOTALL)
    return [{"time": t, "title": ti.strip(), "content": c.strip()} for t, ti, c in matches]


def save_to_supabase(title, content, year_month):
    data = json.dumps({
        "title": title,
        "content": content,
        "year_month": year_month
    }).encode()

    req = urllib.request.Request(
        f"{SUPABASE_URL}/rest/v1/memos",
        data=data,
        headers={
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req) as resp:
            print(f"✅ 保存: {title}")
    except urllib.error.HTTPError as e:
        print(f"❌ エラー ({title}): {e.code} {e.read().decode()}")


def main():
    files = get_changed_memo_files()
    if not files:
        print("変更されたメモファイルなし")
        return

    for filepath in files:
        year_month = os.path.basename(filepath).replace(".md", "")
        added = get_added_lines(filepath)
        memos = parse_memos(added)

        if not memos:
            print(f"{filepath}: 新しいメモなし")
            continue

        for memo in memos:
            save_to_supabase(memo["title"], memo["content"], year_month)


if __name__ == "__main__":
    main()
