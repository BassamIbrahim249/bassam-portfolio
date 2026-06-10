#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
توليد صفحات HTML ثابتة لكل مقالة في منصة BassamIbrahim
يشغّل من Pydroid 3 أو GitHub Actions
"""

import json
import os
import re
import html
from datetime import datetime

BASE_URL = "https://bassamibrahim249.github.io/bassam-portfolio"

def strip_markdown(text):
    """تحويل Markdown بسيط إلى HTML آمن"""
    if not text:
        return ""
    
    # حماية من XSS
    text = html.escape(text)
    
    # معالجة العناوين (## عنوان)
    text = re.sub(r'^### (.*?)$', r'<h3>\1</h3>', text, flags=re.MULTILINE)
    text = re.sub(r'^## (.*?)$', r'<h2>\1</h2>', text, flags=re.MULTILINE)
    text = re.sub(r'^# (.*?)$', r'<h1>\1</h1>', text, flags=re.MULTILINE)
    
    # معالجة النص العريض (**نص** أو __نص__)
    text = re.sub(r'\*\*(.*?)\*\*', r'<strong>\1</strong>', text)
    text = re.sub(r'__(.*?)__', r'<strong>\1</strong>', text)
    
    # معالجة النص المائل (*نص* أو _نص_)
    text = re.sub(r'\*(.*?)\*', r'<em>\1</em>', text)
    text = re.sub(r'_(.*?)_', r'<em>\1</em>', text)
    
    # معالجة الروابط [نص](url)
    text = re.sub(r'\[(.*?)\]\((.*?)\)', r'<a href="\2" target="_blank" rel="noopener">\1</a>', text)
    
    # معالجة القوائم (* عنصر أو - عنصر)
    text = re.sub(r'^\* (.*?)$', r'<li>\1</li>', text, flags=re.MULTILINE)
    text = re.sub(r'^- (.*?)$', r'<li>\1</li>', text, flags=re.MULTILINE)
    
    # تجميع العناصر في قوائم
    text = re.sub(r'(<li>.*?</li>\n?)+', lambda m: '<ul>' + m.group(0) + '</ul>', text, flags=re.DOTALL)
    
    # معالجة الفقرات (سطرين فارغين = فقرة جديدة)
    paragraphs = text.split('\n\n')
    processed = []
    for p in paragraphs:
        p = p.strip()
        if not p:
            continue
        # إذا لم يكن عنوان أو قائمة، اجعله فقرة
        if not p.startswith('<h') and not p.startswith('<ul') and not p.startswith('<ol'):
            p = '<p>' + p.replace('\n', '<br>') + '</p>'
        processed.append(p)
    
    return '\n'.join(processed)

def extract_description(content, max_len=160):
    """استخراج وصف مختصر من المحتوى"""
    if not content:
        return ""
    
    # حذف HTML و Markdown
    clean = re.sub(r'[#*_~`>\[\]\(\)!\n]+', ' ', content)
    clean = re.sub(r'\s+', ' ', clean).strip()
    
    if len(clean) <= max_len:
        return clean
    
    # قص عند آخر نقطة
    truncated = clean[:max_len]
    last_period = truncated.rfind('.')
    if last_period > max_len // 2:
        return truncated[:last_period + 1]
    
    return truncated.rstrip() + '...'

def fix_image_paths(content_html):
    """تحويل المسارات النسبية للصور إلى مسارات كاملة"""
    def replace_src(match):
        src = match.group(1)
        if src.startswith('http') or src.startswith('data:'):
            return match.group(0)
        # إزالة / من البداية إذا وجدت
        src = src.lstrip('/')
        return f'src="{BASE_URL}/{src}"'
    
    return re.sub(r'src="([^"]+)"', replace_src, content_html)

def generate_article_html(article, tab):
    """توليد HTML كامل لمقالة واحدة"""
    
    article_id = article.get('id', '')
    title = article.get('title_ar') or article.get('title', 'بدون عنوان')
    content = article.get('content_ar') or article.get('content', '')
    image = article.get('image') or 'preview.jpg'
    date = article.get('date', '')
    author = article.get('author', 'بسام إبراهيم أحمد')
    tags = article.get('tags', [])
    
    # معالجة المسارات
    if image and not image.startswith('http'):
        image = f"{BASE_URL}/{image.lstrip('/')}"
    if not image:
        image = f"{BASE_URL}/preview.jpg"
    
    # تحويل المحتوى إلى HTML
    content_html = strip_markdown(content)
    content_html = fix_image_paths(content_html)
    
    # استخراج الوصف
    description = extract_description(content)
    
    # أسماء الأقسام
    tab_names = {
        'engineering': 'المنصة الهندسية',
        'political': 'الأرشيف السياسي',
        'nubian': 'نوبيان',
        'academy': 'الأكاديمية',
        'lifestyle': 'نمط الحياة والصحة'
    }
    tab_name = tab_names.get(tab, tab)
    
    # بناء HTML
    html_template = f"""<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    
    <!-- Primary Meta Tags -->
    <title>{html.escape(title)} | BassamIbrahim</title>
    <meta name="title" content="{html.escape(title)} | BassamIbrahim">
    <meta name="description" content="{html.escape(description)}">
    <meta name="author" content="{html.escape(author)}">
    <meta name="keywords" content="{html.escape(', '.join(tags))}">
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="article">
    <meta property="og:url" content="{BASE_URL}/articles/{article_id}.html">
    <meta property="og:title" content="{html.escape(title)}">
    <meta property="og:description" content="{html.escape(description)}">
    <meta property="og:image" content="{image}">
    <meta property="og:site_name" content="BassamIbrahim">
    <meta property="og:locale" content="ar_AR">
    <meta property="article:published_time" content="{date}">
    <meta property="article:author" content="{html.escape(author)}">
    <meta property="article:section" content="{html.escape(tab_name)}">
    
    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:url" content="{BASE_URL}/articles/{article_id}.html">
    <meta name="twitter:title" content="{html.escape(title)}">
    <meta name="twitter:description" content="{html.escape(description)}">
    <meta name="twitter:image" content="{image}">
    
    <!-- Canonical URL -->
    <link rel="canonical" href="{BASE_URL}/articles/{article_id}.html">
    
    <!-- Structured Data (Schema.org) -->
    <script type="application/ld+json">
    {{
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": "{html.escape(title)}",
        "description": "{html.escape(description)}",
        "image": "{image}",
        "datePublished": "{date}",
        "author": {{
            "@type": "Person",
            "name": "{html.escape(author)}",
            "jobTitle": "مهندس مدني"
        }},
        "publisher": {{
            "@type": "Person",
            "name": "BassamIbrahim",
            "logo": {{
                "@type": "ImageObject",
                "url": "{BASE_URL}/icon_512.png"
            }}
        }},
        "mainEntityOfPage": {{
            "@type": "WebPage",
            "@id": "{BASE_URL}/articles/{article_id}.html"
        }}
    }}
    </script>
    
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #080c12 0%, #1a1f2e 100%);
            color: #e0e0e0;
            line-height: 1.8;
            min-height: 100vh;
            padding: 20px;
        }}
        .container {{
            max-width: 800px;
            margin: 0 auto;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 16px;
            padding: 30px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }}
        .back-link {{
            display: inline-block;
            padding: 10px 20px;
            background: linear-gradient(135deg, #3B9EFF, #60CFFF);
            color: white;
            text-decoration: none;
            border-radius: 20px;
            margin-bottom: 20px;
            font-weight: 600;
            transition: transform 0.2s;
        }}
        .back-link:hover {{ transform: scale(1.05); }}
        .article-header {{
            border-bottom: 2px solid rgba(59, 158, 255, 0.3);
            padding-bottom: 20px;
            margin-bottom: 30px;
        }}
        .article-title {{
            font-size: 2em;
            color: #60CFFF;
            margin-bottom: 15px;
            line-height: 1.3;
        }}
        .article-meta {{
            display: flex;
            gap: 15px;
            flex-wrap: wrap;
            font-size: 0.9em;
            color: #8899bb;
        }}
        .meta-item {{
            display: flex;
            align-items: center;
            gap: 5px;
        }}
        .article-content {{
            font-size: 1.1em;
        }}
        .article-content h1, .article-content h2, .article-content h3 {{
            color: #60CFFF;
            margin: 25px 0 15px 0;
        }}
        .article-content p {{
            margin-bottom: 15px;
        }}
        .article-content ul, .article-content ol {{
            margin: 15px 0;
            padding-right: 30px;
        }}
        .article-content li {{
            margin-bottom: 8px;
        }}
        .article-content a {{
            color: #60CFFF;
            text-decoration: underline;
        }}
        .article-content img {{
            max-width: 100%;
            height: auto;
            border-radius: 8px;
            margin: 20px 0;
        }}
        .article-content strong {{
            color: #EAB308;
        }}
        .tags {{
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
        }}
        .tag {{
            display: inline-block;
            padding: 5px 12px;
            background: rgba(59, 158, 255, 0.2);
            color: #60CFFF;
            border-radius: 12px;
            font-size: 0.85em;
            margin: 5px 5px 5px 0;
        }}
        @media (max-width: 600px) {{
            .container {{ padding: 20px; }}
            .article-title {{ font-size: 1.5em; }}
        }}
    </style>
</head>
<body>
    <div class="container">
        <a href="{BASE_URL}" class="back-link">← العودة إلى المنصة الرئيسية</a>
        
        <header class="article-header">
            <h1 class="article-title">{html.escape(title)}</h1>
            <div class="article-meta">
                <div class="meta-item">
                    <span>📅</span>
                    <span>{date}</span>
                </div>
                <div class="meta-item">
                    <span>👤</span>
                    <span>{html.escape(author)}</span>
                </div>
                <div class="meta-item">
                    <span>📂</span>
                    <span>{html.escape(tab_name)}</span>
                </div>
            </div>
        </header>
        
        <article class="article-content">
            {content_html}
        </article>
        
        {f'<div class="tags">{" ".join(f"<span class=\"tag\">{html.escape(tag)}</span>" for tag in tags)}</div>' if tags else ''}
    </div>
</body>
</html>"""
    
    return html_template

def main():
    print("🚀 بدء توليد صفحات HTML للمقالات...")
    print("=" * 60)
    
    tabs = ['engineering', 'political', 'nubian', 'academy', 'lifestyle']
    
    # إنشاء مجلد articles/
    if not os.path.exists('articles'):
        os.makedirs('articles')
        print("✅ تم إنشاء مجلد articles/")
    
    total = 0
    errors = []
    
    for tab in tabs:
        filepath = f"data/{tab}.json"
        
        if not os.path.exists(filepath):
            print(f"⚠️  لم يتم العثور على: {filepath}")
            continue
        
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            articles = data if isinstance(data, list) else data.get('articles', [])
            
            for article in articles:
                article_id = article.get('id')
                if not article_id:
                    continue
                
                try:
                    # توليد HTML
                    html_content = generate_article_html(article, tab)
                    
                    # حفظ الملف
                    output_path = f"articles/{article_id}.html"
                    with open(output_path, 'w', encoding='utf-8') as f:
                        f.write(html_content)
                    
                    total += 1
                except Exception as e:
                    errors.append(f"{article_id}: {str(e)}")
            
            print(f"✅ {tab}: {len(articles)} مقالة")
        
        except Exception as e:
            errors.append(f"{tab}: {str(e)}")
    
    print("=" * 60)
    print(f"🎉 تم توليد {total} صفحة HTML بنجاح!")
    
    if errors:
        print(f"\n⚠️  أخطاء ({len(errors)}):")
        for error in errors[:5]:  # عرض أول 5 أخطاء فقط
            print(f"  - {error}")
        if len(errors) > 5:
            print(f"  ... و {len(errors) - 5} أخطاء أخرى")
    
    print(f"\n📁 الملفات موجودة في: articles/")
    print(f"🌐 URLs: {BASE_URL}/articles/[ID].html")

if __name__ == "__main__":
    main()
