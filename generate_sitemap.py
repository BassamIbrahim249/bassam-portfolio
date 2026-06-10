#!/usr/bin/env python3
import json
import os
from datetime import date

BASE_URL = "https://bassamibrahim249.github.io/bassam-portfolio"
TABS = ["engineering", "political", "nubian", "academy", "lifestyle"]
TODAY = str(date.today())

urls = []

urls.append({
    "loc": f"{BASE_URL}/",
    "lastmod": TODAY,
    "changefreq": "daily",
    "priority": "1.0"
})

for tab in TABS:
    urls.append({
        "loc": f"{BASE_URL}/?tab={tab}",
        "lastmod": TODAY,
        "changefreq": "weekly",
        "priority": "0.9"
    })

total_articles = 0
for tab in TABS:
    path = f"data/{tab}.json"
    if not os.path.exists(path):
        print(f"⚠️ ملف غير موجود: {path}")
        continue
    try:
        with open(path, encoding="utf-8") as f:
            articles = json.load(f)
        if isinstance(articles, dict):
            articles = articles.get("articles", [])
        for a in articles:
            article_id = a.get("id")
            article_date = a.get("date", TODAY)
            if not article_id:
                continue
            urls.append({
                "loc": f"{BASE_URL}/articles/{article_id}.html",
                "lastmod": article_date,
                "changefreq": "monthly",
                "priority": "0.8"
            })
            total_articles += 1
    except Exception as e:
        print(f"❌ خطأ في {path}: {e}")

lines = ['<?xml version="1.0" encoding="UTF-8"?>']
lines.append('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')
for u in urls:
    lines.append("  <url>")
    lines.append(f"    <loc>{u['loc']}</loc>")
    lines.append(f"    <lastmod>{u['lastmod']}</lastmod>")
    lines.append(f"    <changefreq>{u['changefreq']}</changefreq>")
    lines.append(f"    <priority>{u['priority']}</priority>")
    lines.append("  </url>")
lines.append("</urlset>")
xml = "\n".join(lines)

with open("sitemap.xml", "w", encoding="utf-8") as f:
    f.write(xml)

print(f"✅ sitemap.xml تم إنشاؤه بنجاح!")
print(f"📊 إجمالي URLs: {len(urls)}")
print(f"   ├── صفحة رئيسية: 1")
print(f"   ├── أقسام: {len(TABS)}")
print(f"   └── مقالات: {total_articles}")
