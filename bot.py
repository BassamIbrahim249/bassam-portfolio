"""
بوت BassamIbrahim Portfolio — الإصدار 5.2.0 (النسخة الاحترافية النهائية)
الميزات:
- متغيرات البيئة فقط (لا تظهر أي توكنات في الكود)
- نظام تسجيل متقدم (RotatingFileHandler)
- تنظيف تلقائي لحالات المحادثة بعد إعادة التشغيل
- أمر /welcome مع رسالة ترحيبية مثبتة وأزرار تفاعلية
- أمر /status لعرض حالة البوت وإحصائيات سريعة
- أمر /stats محسَّن (تفاصيل كل تبويب)
- نظام إشعارات للمشرف عند النشر (يدوي أو مجدول)
- خادم HTTP صحي لمنع نوم الخدمة على Render (يدعم GET و HEAD)
"""
import os, json, time, base64, hashlib, logging, requests, re, asyncio, threading, uuid, html
from io import BytesIO
from PIL import Image, ImageDraw, ImageFont
import textwrap
from datetime import datetime
from logging.handlers import RotatingFileHandler
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes, ConversationHandler, CallbackQueryHandler, JobQueue
from http.server import HTTPServer, BaseHTTPRequestHandler

# ========== نظام التسجيل المتقدم ==========
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO,
    handlers=[
        RotatingFileHandler('bot.log', maxBytes=5*1024*1024, backupCount=3, encoding='utf-8'),
        logging.StreamHandler()
    ]
)
logging.getLogger("telegram.ext").setLevel(logging.ERROR)
logging.getLogger("httpx").setLevel(logging.WARNING)
logger = logging.getLogger(__name__)

# ========== ثوابت التهيئة (من متغيرات البيئة فقط) ==========
BOT_TOKEN = os.getenv("BOT_TOKEN")
GITHUB_PAT = os.getenv("GITHUB_PAT")
CHANNEL_ID = os.getenv("CHANNEL_ID")
ADMIN_USER_ID = os.getenv("ADMIN_USER_ID")

if not BOT_TOKEN or not GITHUB_PAT or not CHANNEL_ID or not ADMIN_USER_ID:
    logger.critical("متغيرات البيئة مفقودة: BOT_TOKEN, GITHUB_PAT, CHANNEL_ID, ADMIN_USER_ID")
    raise RuntimeError("يجب تعيين جميع متغيرات البيئة المطلوبة قبل التشغيل")

ADMIN_USER_ID = int(ADMIN_USER_ID)
CHANNEL_USERNAME = "BassamIbrahimPortfolio"
REPO = "bassamibrahim249/bassam-portfolio"

SITE_IDENTITY = {
    "author_ar": "بسام إبراهيم أحمد",
    "author_en": "Bassam Ibrahim Ahmed",
}

def escape_html(text):
    if not text:
        return ""
    return html.escape(str(text))

# ========== التبويبات والأزرار ==========
TABS = {
    "1": {"name": "المنصة الهندسية", "slug": "engineering"},
    "2": {"name": "الأرشيف السياسي", "slug": "political"},
    "3": {"name": "نوبيان (الحضارة النوبية)", "slug": "nubian"},
    "4": {"name": "أكاديمية التدريب والتطوير", "slug": "academy"},
    "5": {"name": "نمط الحياة والصحة", "slug": "lifestyle"}
}

BUTTONS = {
    "engineering": {"1": "علوم المواد", "2": "ابتكار إنشائي", "3": "مختبر هندسي", "4": "📚 المكتبة"},
    "political":   {"1": "تاريخ السودان", "2": "تحليل استراتيجي", "3": "رؤى فكرية", "4": "📚 المكتبة"},
    "nubian":      {"1": "تاريخ", "2": "آثار", "3": "هوية", "4": "📚 المكتبة"},
    "academy":     {"1": "المشاريع", "2": "القيادة والإدارة", "3": "تدريب تنموي", "4": "📚 المكتبة"},
    "lifestyle":   {"1": "صحة شاملة", "2": "تغذية علمية", "3": "تميز بدني", "4": "📚 المكتبة"}
}

BTN_SLUGS = {
    "engineering": ["materials_science", "construction_innovation", "engineering_lab", "library"],
    "political":   ["sudan_history", "strategic_analysis", "intellectual_visions", "library"],
    "nubian":      ["history", "archaeology", "identity", "library"],
    "academy":     ["project_writing", "leadership", "developmental_training", "library"],
    "lifestyle":   ["holistic_health", "scientific_nutrition", "physical_excellence", "library"]
}

TABS_WORK = ["engineering", "political", "nubian", "academy", "lifestyle"]
TAB_HASHTAGS = {
    "engineering": "#هندسة", "political": "#سياسة", "nubian": "#نوبيان",
    "academy": "#تطوير", "lifestyle": "#صحة"
}
BTN_HASHTAGS = {
    "materials_science": "#علوم_المواد", "construction_innovation": "#ابتكار_إنشائي",
    "engineering_lab": "#مختبر_هندسي", "sudan_history": "#تاريخ_السودان",
    "strategic_analysis": "#تحليل_استراتيجي", "intellectual_visions": "#رؤى_فكرية",
    "history": "#تاريخ", "archaeology": "#آثار", "identity": "#هوية",
    "project_writing": "#مشاريع", "leadership": "#قيادة_وإدارة",
    "developmental_training": "#تدريب_تنموي", "holistic_health": "#صحة_شاملة",
    "scientific_nutrition": "#تغذية_علمية", "physical_excellence": "#تميز_بدني"
}

LIBRARY_INDEX_PATH = "library_index.json"
MAX_FILE_SIZE_MB = 100
MAX_RETRIES = 3
RETRY_DELAY = 3
SKIP_WORDS = {"تخطي", "لا", "skip", "اعمل رايح"}

# حالات المحادثة
(ADD_LIB_TAB, ADD_LIB_FILE, ADD_LIB_TITLE, ADD_LIB_DESC, ADD_LIB_TAGS, ADD_LIB_CONFIRM) = range(30, 36)
(SELECT_TAB, SELECT_BTN, GET_TITLE_AR, GET_TITLE_EN, GET_CONTENT_AR, GET_CONTENT_EN,
 GET_TAGS, GET_LINK, GET_DATE, GET_IMAGE, GET_INTERNAL_IMAGES, GET_CONFIRMATION) = range(10, 22)
(EDIT_FIELD, EDIT_VALUE, EDIT_IMAGE_SELECT, EDIT_IMAGE_UPLOAD) = range(22, 26)
(SCHEDULE_GET_DATE, SCHEDULE_CONFIRM) = range(26, 28)

user_state = {}
operation_logs = []
logs_lock = threading.Lock()
application = None

def log_operation(op, details):
    with logs_lock:
        entry = f"[{datetime.now().strftime('%H:%M:%S')}] {op}: {details}"
        operation_logs.append(entry)
        logger.info(entry)
        if len(operation_logs) > 50:
            operation_logs.pop(0)

# ========== دوال مساعدة ==========
async def notify_admin(context, message, parse_mode="HTML"):
    """إرسال إشعار إلى المسؤول"""
    try:
        await context.bot.send_message(
            chat_id=ADMIN_USER_ID,
            text=f"🔔 {message}",
            parse_mode=parse_mode
        )
    except Exception as e:
        logger.error(f"فشل إرسال إشعار للمسؤول: {e}")

# ========== دوال الصور والغطاء ==========
def compress_image(img_bytes, max_kb=800):
    try:
        img = Image.open(BytesIO(img_bytes))
        if img.mode in ('RGBA', 'LA', 'P'):
            img = img.convert('RGB')
        if len(img_bytes) / 1024 <= max_kb:
            return img_bytes
        q = 85
        while q > 10:
            o = BytesIO()
            img.save(o, format='JPEG', quality=q, optimize=True)
            if len(o.getvalue()) / 1024 <= max_kb:
                return o.getvalue()
            q -= 10
        img = img.resize((img.width // 2, img.height // 2), Image.Resampling.LANCZOS)
        o = BytesIO()
        img.save(o, format='JPEG', quality=75, optimize=True)
        return o.getvalue()
    except Exception:
        return img_bytes

def upload_image(img_bytes, name):
    url = f"https://api.github.com/repos/{REPO}/contents/assets/images/{name}"
    headers = {"Authorization": f"token {GITHUB_PAT}", "Accept": "application/vnd.github+json"}
    for attempt in range(MAX_RETRIES):
        try:
            r = requests.put(url, json={
                "message": f"Upload: {name}",
                "content": base64.b64encode(img_bytes).decode(),
                "branch": "main"
            }, headers=headers, timeout=30)
            if r.status_code in [200, 201]:
                return f"assets/images/{name}"
            elif r.status_code == 403 and "rate limit" in r.text.lower():
                reset_time = r.headers.get('X-RateLimit-Reset')
                wait = min(max(int(reset_time) - time.time(), 0) + 2, 30) if reset_time else 10
                time.sleep(wait)
        except Exception:
            pass
        time.sleep(RETRY_DELAY)
    return None

def generate_cover(title_ar, title_en="", tab_name=""):
    width, height = 1200, 630
    bg, accent = (8, 12, 18), (59, 158, 255)
    img = Image.new('RGB', (width, height), bg)
    draw = ImageDraw.Draw(img)
    font_ar = font_en = None
    font_candidates = [
        ("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 60,
         "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 40),
        ("Cairo-Bold.ttf", 60, "Cairo-Regular.ttf", 40),
    ]
    for ar_path, ar_size, en_path, en_size in font_candidates:
        try:
            font_ar = ImageFont.truetype(ar_path, ar_size)
            font_en = ImageFont.truetype(en_path, en_size)
            break
        except Exception:
            continue
    if font_ar is None:
        font_ar = font_en = ImageFont.load_default()
    draw.rectangle([50, 50, width - 50, 55], fill=accent)
    if tab_name:
        draw.text((60, 80), tab_name, fill=accent, font=font_en)
    lines = textwrap.wrap(title_ar, width=25)
    y_text = 200
    for line in lines[:4]:
        draw.text((60, y_text), line, fill=(255, 255, 255), font=font_ar)
        y_text += 70
    if title_en:
        draw.text((60, y_text + 20), title_en[:80], fill=(136, 153, 187), font=font_en)
    draw.rectangle([50, height - 55, width - 50, height - 50], fill=accent)
    o = BytesIO()
    img.save(o, format='JPEG', quality=90)
    return o.getvalue()

# ========== دوال GitHub ==========
async def async_get_data(tab=None):
    return await asyncio.to_thread(get_data, tab)

def get_data(tab=None):
    all_articles = []
    tabs_to_fetch = [tab] if tab else TABS_WORK
    for t in tabs_to_fetch:
        try:
            url = f"https://raw.githubusercontent.com/{REPO}/main/data/{t}.json"
            r = requests.get(url, timeout=15)
            if r.status_code == 200:
                articles = r.json()
                for a in articles:
                    if "tab" not in a:
                        a["tab"] = t
                all_articles.extend(articles)
        except Exception:
            continue
    return all_articles

def save_data(tab, data, msg="تحديث"):
    for attempt in range(MAX_RETRIES):
        try:
            url = f"https://api.github.com/repos/{REPO}/contents/data/{tab}.json"
            h = {"Authorization": f"token {GITHUB_PAT}", "Accept": "application/vnd.github+json"}
            r = requests.get(url, headers=h, timeout=15)
            sha = r.json().get("sha", "") if r.status_code == 200 else ""
            body = {"message": msg, "content": base64.b64encode(json.dumps(data, ensure_ascii=False, indent=2).encode()).decode(), "branch": "main"}
            if sha: body["sha"] = sha
            resp = requests.put(url, json=body, headers=h, timeout=30)
            if resp.status_code in [200, 201]: return True
        except Exception:
            time.sleep(RETRY_DELAY)
    return False

async def async_save_data(tab, data, msg="تحديث"):
    return await asyncio.to_thread(save_data, tab, data, msg)

async def async_push_data_directly(tab, data_dict):
    return await asyncio.to_thread(push_data_directly, tab, data_dict)

def push_data_directly(tab, data_dict):
    for attempt in range(MAX_RETRIES):
        try:
            url = f"https://api.github.com/repos/{REPO}/contents/data/{tab}.json"
            h = {"Authorization": f"token {GITHUB_PAT}", "Accept": "application/vnd.github.v3+json"}
            content_bytes = json.dumps(data_dict, ensure_ascii=False, indent=2).encode()
            content_b64 = base64.b64encode(content_bytes).decode()
            sha = None
            try:
                resp = requests.get(url, headers=h, timeout=10)
                if resp.status_code == 200:
                    sha = resp.json().get("sha")
            except Exception:
                pass
            payload = {"message": "🗑️ حذف مقال", "content": content_b64, "branch": "main"}
            if sha: payload["sha"] = sha
            r = requests.put(url, json=payload, headers=h, timeout=15)
            if r.status_code in [200, 201]: return True
        except Exception:
            time.sleep(RETRY_DELAY)
    return False

async def async_get_library_index():
    return await asyncio.to_thread(get_library_index)

def get_library_index():
    try:
        url = f"https://raw.githubusercontent.com/{REPO}/main/{LIBRARY_INDEX_PATH}"
        r = requests.get(url, timeout=15)
        if r.status_code == 200: return r.json()
    except Exception:
        pass
    return None

async def async_save_library_index(index):
    return await asyncio.to_thread(save_library_index, index)

def save_library_index(index):
    try:
        url = f"https://api.github.com/repos/{REPO}/contents/{LIBRARY_INDEX_PATH}"
        headers = {"Authorization": f"token {GITHUB_PAT}", "Accept": "application/vnd.github+json"}
        r = requests.get(url, headers=headers, timeout=15)
        sha = r.json().get("sha") if r.status_code == 200 else None
        content = json.dumps(index, ensure_ascii=False, indent=2).encode()
        body = {"message": "📚 تحديث الفهرس", "content": base64.b64encode(content).decode(), "branch": "main"}
        if sha: body["sha"] = sha
        resp = requests.put(url, json=body, headers=headers, timeout=30)
        return resp.status_code in [200, 201]
    except Exception:
        return False

def cleanup_user_state(uid):
    if uid in user_state:
        del user_state[uid]

async def cancel_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    uid = update.effective_user.id
    cleanup_user_state(uid)
    await update.message.reply_text("❌ تم الإلغاء.")
    return ConversationHandler.END

# ========== دوال القناة ==========
async def upload_file_to_channel(context, file_bytes, file_name, title, description=""):
    caption = f"📚 <b>{escape_html(title)}</b>"
    if description:
        caption += f"\n{escape_html(description)}"
    try:
        msg = await context.bot.send_document(
            chat_id=CHANNEL_ID,
            document=BytesIO(file_bytes),
            filename=file_name,
            caption=caption,
            parse_mode="HTML"
        )
        return f"https://t.me/{CHANNEL_USERNAME}/{msg.message_id}"
    except Exception as e:
        logger.error(f"فشل رفع الملف للقناة: {e}")
        return None

async def send_article_to_channel(context, article):
    title = article.get("title_ar", "بدون عنوان")
    content = article.get("content_ar", "")
    date = article.get("date", "")
    tab = article.get("tab", "engineering")
    button = article.get("button", "")
    image = article.get("image", "")
    article_id = article.get("id", "")
    tab_hashtag = TAB_HASHTAGS.get(tab, "")
    btn_hashtag = BTN_HASHTAGS.get(button, "")
    article_url = f"https://bassamibrahim249.github.io/bassam-portfolio/articles/{article_id}.html"
    text = f"📰 <b>{escape_html(title)}</b>\n📅 {date} | 📂 {tab}\n\n{escape_html(content)}"
    text += f"\n\n{tab_hashtag} {btn_hashtag} #أرشيف"
    text += f"\n\n🔗 <a href=\"{article_url}\">اقرأ المقال كاملاً</a>"
    if image:
        try:
            await context.bot.send_photo(
                chat_id=CHANNEL_ID,
                photo=image,
                caption=text[:1024],
                parse_mode="HTML"
            )
            if len(text) > 1024:
                await send_long_to_channel(context, text[1024:])
            return True
        except Exception as e:
            logger.warning(f"فشل إرسال المقال مع صورة للقناة: {e}")
    return await send_long_to_channel(context, text)

async def send_long_to_channel(context, text, parse_mode="HTML"):
    MAX_LEN = 4096
    for i in range(0, len(text), MAX_LEN):
        await context.bot.send_message(
            chat_id=CHANNEL_ID,
            text=text[i:i+MAX_LEN],
            parse_mode=parse_mode
        )
    return True

async def send_long_message(chat_id, text, parse_mode="HTML", bot=None):
    MAX_LEN = 4096
    for i in range(0, len(text), MAX_LEN):
        await bot.send_message(chat_id=chat_id, text=text[i:i+MAX_LEN], parse_mode=parse_mode)

# ========== أوامر الإدارة والواجهة ==========
async def cmd_pin(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if update.effective_user.id != ADMIN_USER_ID:
        await update.message.reply_text("⛔ غير مصرح لك.")
        return
    deep_link = f"https://t.me/{context.bot.username}?start=open_archive"
    keyboard = [[InlineKeyboardButton("🚀 تصفح الأرشيف", url=deep_link)]]
    msg = await context.bot.send_message(chat_id=CHANNEL_ID, text="👋 أهلاً بك في أرشيف BassamIbrahim...", reply_markup=InlineKeyboardMarkup(keyboard))
    await msg.pin()
    await update.message.reply_text("✅ تم تثبيت الرسالة.")

async def cmd_welcome(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """إرسال رسالة ترحيبية مثبتة مع أزرار تفاعلية وزر ينقل للمستخدم للبوت"""
    if update.effective_user.id != ADMIN_USER_ID:
        await update.message.reply_text("⛔ غير مصرح لك.")
        return
    deep_link = f"https://t.me/{context.bot.username}?start=open_archive"
    bot_username = context.bot.username
    keyboard = [
        [InlineKeyboardButton("🚀 تصفح الأرشيف", url=deep_link)],
        [
            InlineKeyboardButton("📰 المقالات", callback_data="browse_articles"),
            InlineKeyboardButton("📚 المكتبة", callback_data="browse_library")
        ],
        [InlineKeyboardButton("ℹ️ عن المنصة", callback_data="about_platform")],
        [InlineKeyboardButton("💬 استخدام البوت التفاعلي", url=f"https://t.me/{bot_username}")]
    ]
    welcome_text = (
        "🌟 <b>مرحباً بك في قناة BassamIbrahim Portfolio</b>\n\n"
        "الذراع الرقمية لمنصة معرفية سودانية مستقلة، تؤمن بأن المعرفة ليست رفاهية — بل ضرورة لبناء إنسان واعٍ ومجتمع قوي.\n\n"
        "👤 <b>من نحن؟</b>\n"
        "بسام إبراهيم أحمد — مهندس مدني، باحث في الشأن السوداني، ناشط مجتمعي.\n\n"
        "📂 <b>محتوى القناة</b>\n"
        "🏗️ المنصة الهندسية — علوم المواد · ابتكار إنشائي · مختبر هندسي\n"
        "🏛️ الأرشيف السياسي — تاريخ السودان · تحليل استراتيجي · رؤى فكرية\n"
        "🏺 نوبيان — الحضارة النوبية · التاريخ · الآثار · الهوية\n"
        "📚 أكاديمية التدريب — المشاريع · القيادة والإدارة · تدريب تنموي\n"
        "🌿 نمط الحياة والصحة — صحة شاملة · تغذية علمية · تميز بدني\n\n"
        "🎯 <b>رسالتنا</b>\n"
        "تقديم معرفة رصينة ومتاحة، تُسهم في صياغة الوعي وتوثيق التاريخ وتمكين الإنسان.\n\n"
        "🤖 <b>المساعد الذكي</b>\n"
        "تحدث مع البوت للبحث في كل المحتوى فوراً.\n"
        f"👇 ابدأ هنا: @{bot_username}\n\n"
        "🔗 <a href='https://bassamibrahim249.github.io/bassam-portfolio/'>زيارة المنصة الكاملة</a>\n\n"
        "#BassamIbrahim #السودان #هندسة #نوبيان #معرفة"
    )
    msg = await context.bot.send_message(
        chat_id=CHANNEL_ID,
        text=welcome_text,
        reply_markup=InlineKeyboardMarkup(keyboard),
        parse_mode="HTML"
    )
    await msg.pin()
    logger.info("تم إرسال الرسالة الترحيبية وتثبيتها.")
    await update.message.reply_text("✅ تم إرسال الرسالة الترحيبية وتثبيتها.")

async def start_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if context.args and len(context.args) > 0 and context.args[0] == "open_archive":
        keyboard = [
            [InlineKeyboardButton("📰 تصفح المقالات", callback_data="browse_articles")],
            [InlineKeyboardButton("📚 المكتبة الرقمية", callback_data="browse_library")],
            [InlineKeyboardButton("ℹ️ عن المنصة", callback_data="about_platform")],
        ]
        await update.message.reply_text("🚀 <b>مرحباً بك في الأرشيف!</b>", reply_markup=InlineKeyboardMarkup(keyboard), parse_mode="HTML")
        return
    keyboard = [
        [InlineKeyboardButton("📰 تصفح المقالات", callback_data="browse_articles")],
        [InlineKeyboardButton("📚 المكتبة الرقمية", callback_data="browse_library")],
        [InlineKeyboardButton("ℹ️ عن المنصة", callback_data="about_platform")],
    ]
    await update.message.reply_text("👋 أهلاً بك في منصة <b>BassamIbrahim</b>!", reply_markup=InlineKeyboardMarkup(keyboard), parse_mode="HTML")

# ========== معالج الأزرار الشامل ==========
async def button_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    data = query.data
    uid = query.from_user.id

    if data.startswith(("tab_", "btn_", "read_", "lib_", "browse_")):
        if uid in user_state and any(k in user_state[uid] for k in ("edit_article", "tab", "pending_entry")):
            await query.answer("⚠️ أنهِ العملية الحالية أولاً (/cancel)", show_alert=True)
            return

    if data == "browse_articles":
        keyboard = [[InlineKeyboardButton(f"{k}️⃣ {v['name']}", callback_data=f"tab_{v['slug']}")] for k,v in TABS.items()]
        keyboard.append([InlineKeyboardButton("🔙 رجوع", callback_data="main_menu")])
        await query.edit_message_text("📂 اختر القسم:", reply_markup=InlineKeyboardMarkup(keyboard))
    elif data == "main_menu":
        keyboard = [
            [InlineKeyboardButton("📰 تصفح المقالات", callback_data="browse_articles")],
            [InlineKeyboardButton("📚 المكتبة الرقمية", callback_data="browse_library")],
            [InlineKeyboardButton("ℹ️ عن المنصة", callback_data="about_platform")],
        ]
        await query.edit_message_text("القائمة الرئيسية:", reply_markup=InlineKeyboardMarkup(keyboard))
    elif data.startswith("tab_"):
        tab_slug = data[4:]
        tab_name = tab_slug
        for key, value in TABS.items():
            if value["slug"] == tab_slug:
                tab_name = value["name"]
                break
        keyboard = [[InlineKeyboardButton(v, callback_data=f"btn_{BTN_SLUGS[tab_slug][int(k)-1]}")] for k,v in BUTTONS[tab_slug].items() if k != "4"]
        keyboard.append([InlineKeyboardButton("🔙 رجوع للأقسام", callback_data="browse_articles")])
        await query.edit_message_text(f"📂 {tab_name}\nاختر الموضوع:", reply_markup=InlineKeyboardMarkup(keyboard))
    elif data.startswith("btn_"):
        btn_slug = data[4:]
        tab_slug = None
        for t, slugs in BTN_SLUGS.items():
            if btn_slug in slugs:
                tab_slug = t
                break
        if tab_slug:
            articles = await async_get_data(tab_slug)
        else:
            articles = await async_get_data()
        matching = [a for a in articles if a.get("button") == btn_slug]
        if matching:
            user_state[uid] = {"search_results": matching, "current_btn": btn_slug}
            keyboard = [[InlineKeyboardButton(f"📄 {a['title_ar'][:50]}", callback_data=f"read_{i}")] for i,a in enumerate(matching[:10])]
            keyboard.append([InlineKeyboardButton("🔙 رجوع للمواضيع", callback_data=f"back_to_tab_{btn_slug}")])
            await query.edit_message_text(f"📋 {len(matching)} مقالة:", reply_markup=InlineKeyboardMarkup(keyboard))
        else:
            await query.edit_message_text("📝 لا مقالات.", reply_markup=InlineKeyboardMarkup([[InlineKeyboardButton("🔙 رجوع", callback_data="browse_articles")]]))
    elif data.startswith("back_to_tab_"):
        btn_slug = data[12:]
        tab_slug = None
        for t, slugs in BTN_SLUGS.items():
            if btn_slug in slugs:
                tab_slug = t
                break
        if tab_slug:
            tab_name = tab_slug
            for key, value in TABS.items():
                if value["slug"] == tab_slug:
                    tab_name = value["name"]
                    break
            keyboard = [[InlineKeyboardButton(v, callback_data=f"btn_{BTN_SLUGS[tab_slug][int(k)-1]}")] for k,v in BUTTONS[tab_slug].items() if k != "4"]
            keyboard.append([InlineKeyboardButton("🔙 رجوع للأقسام", callback_data="browse_articles")])
            await query.edit_message_text(f"📂 {tab_name}\nاختر الموضوع:", reply_markup=InlineKeyboardMarkup(keyboard))
        else:
            await query.edit_message_text("❌ خطأ.", reply_markup=InlineKeyboardMarkup([[InlineKeyboardButton("رجوع", callback_data="browse_articles")]]))
    elif data.startswith("read_"):
        idx = int(data[5:])
        if uid in user_state and "search_results" in user_state[uid]:
            results = user_state[uid]["search_results"]
            if 0 <= idx < len(results):
                a = results[idx]
                text = f"📰 <b>{escape_html(a.get('title_ar',''))}</b>\n\n{escape_html(a.get('content_ar',''))}"
                MAX_LEN = 4096
                for i in range(0, len(text), MAX_LEN):
                    await query.message.reply_text(text[i:i+MAX_LEN], parse_mode="HTML")
                btn_slug = user_state[uid].get("current_btn", "")
                keyboard = [[InlineKeyboardButton("🔙 رجوع للمقالات", callback_data=f"btn_{btn_slug}" if btn_slug else "browse_articles")]]
                await query.edit_message_text("✅ تم عرض المقالة.", reply_markup=InlineKeyboardMarkup(keyboard))
                return
        await query.edit_message_text("⚠️ انتهت الجلسة.", reply_markup=InlineKeyboardMarkup([[InlineKeyboardButton("رجوع", callback_data="browse_articles")]]))
    elif data == "browse_library":
        keyboard = [[InlineKeyboardButton(f"{k}️⃣ {v['name']}", callback_data=f"lib_{v['slug']}")] for k,v in TABS.items()]
        keyboard.append([InlineKeyboardButton("🔙 رجوع", callback_data="main_menu")])
        await query.edit_message_text("📚 المكتبة الرقمية\nاختر القسم:", reply_markup=InlineKeyboardMarkup(keyboard))
    elif data.startswith("lib_"):
        tab_slug = data[4:]
        lib = await async_get_library_index()
        files = lib.get("files", []) if lib else []
        matching = [f for f in files if f.get("category") == tab_slug]
        if matching:
            msg = f"📚 <b>ملفات المكتبة ({len(matching)}):</b>\n\n"
            for f in matching[:10]:
                title = escape_html(f.get('title_ar', '?'))
                desc = escape_html(f.get('description_ar', '') or '')
                size = f.get('fileSize', '?')
                file_type = f.get('fileType', 'file').upper()
                download_url = f.get('downloadUrl', '')
                file_path = f.get('filePath', '')
                icon = "📕" if file_type == "PDF" else "📊" if file_type in ["PPT", "PPTX"] else "📄"
                msg += f"{icon} <b>{title}</b>\n"
                if desc:
                    msg += f"   📝 {desc[:80]}{'...' if len(desc)>80 else ''}\n"
                msg += f"   📦 {size} • {file_type}\n"
                if download_url:
                    msg += f"   ⬇️ <a href='{download_url}'>تحميل من الأرشيف</a>\n"
                elif file_path:
                    if file_path.startswith("http"):
                        msg += f"   ⬇️ <a href='{file_path}'>تحميل</a>\n"
                    else:
                        github_url = f"https://raw.githubusercontent.com/{REPO}/main/{file_path}"
                        msg += f"   ⬇️ <a href='{github_url}'>تحميل</a>\n"
                else:
                    msg += f"   ⚠️ الرابط غير متاح\n"
                msg += "\n" + "─" * 25 + "\n\n"
            if len(matching) > 10:
                msg += f"\n<i>... و {len(matching) - 10} ملف آخر</i>"
            await query.edit_message_text("⏳ جاري عرض الملفات...", reply_markup=InlineKeyboardMarkup([[InlineKeyboardButton("🔙 رجوع لأقسام المكتبة", callback_data="browse_library")]]))
            await send_long_message(chat_id=query.message.chat_id, text=msg, parse_mode="HTML", bot=context.bot)
        else:
            msg = "📭 لا توجد ملفات في هذا القسم بعد."
            await query.edit_message_text(msg, reply_markup=InlineKeyboardMarkup([[InlineKeyboardButton("🔙 رجوع لأقسام المكتبة", callback_data="browse_library")]]), parse_mode="HTML")
    elif data == "about_platform":
        msg = "🌐 <b>BassamIbrahim Portfolio</b>\n\n🏗️ هندسة | 🏛️ سياسة | 🏺 نوبيان | 📚 تطوير | 🌿 صحة\n🔗 <a href='https://bassamibrahim249.github.io/bassam-portfolio/'>زيارة المنصة</a>"
        await query.edit_message_text(msg, reply_markup=InlineKeyboardMarkup([[InlineKeyboardButton("🔙 رجوع", callback_data="main_menu")]]), parse_mode="HTML")

# ========== محادثة /add_file ==========
async def add_file_start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if update.effective_user.id != ADMIN_USER_ID:
        await update.message.reply_text("⛔ غير مصرح لك.")
        return ConversationHandler.END
    user_state[update.effective_user.id] = {}
    msg = "📚 أضف ملفاً إلى المكتبة.\nاختر القسم:\n"
    for k, v in TABS.items():
        msg += f"{k}️⃣ {v['name']}\n"
    await update.message.reply_text(msg)
    return ADD_LIB_TAB

async def add_lib_tab(update: Update, context: ContextTypes.DEFAULT_TYPE):
    uid = update.effective_user.id
    c = update.message.text.strip()
    if c not in TABS:
        await update.message.reply_text("❌ اختر من 1 إلى 5:")
        return ADD_LIB_TAB
    user_state[uid]["category"] = TABS[c]["slug"]
    await update.message.reply_text("📎 أرسل الملف الآن (PDF, DOCX, TXT...):")
    return ADD_LIB_FILE

async def add_lib_file(update: Update, context: ContextTypes.DEFAULT_TYPE):
    uid = update.effective_user.id
    doc = update.message.document
    if not doc:
        await update.message.reply_text("❌ أرسل ملفاً (مستند).")
        return ADD_LIB_FILE
    if doc.file_size and doc.file_size > MAX_FILE_SIZE_MB * 1024 * 1024:
        await update.message.reply_text(f"❌ حجم الملف يتجاوز {MAX_FILE_SIZE_MB}MB.")
        return ADD_LIB_FILE
    file = await context.bot.get_file(doc.file_id)
    file_bytes = await file.download_as_bytearray()
    user_state[uid]["file_bytes"] = file_bytes
    user_state[uid]["file_name"] = doc.file_name or "file"
    await update.message.reply_text("📝 أرسل عنوان الملف:")
    return ADD_LIB_TITLE

async def add_lib_title(update: Update, context: ContextTypes.DEFAULT_TYPE):
    uid = update.effective_user.id
    title = update.message.text.strip()
    if not title:
        await update.message.reply_text("❌ لا تتركه فارغاً.")
        return ADD_LIB_TITLE
    user_state[uid]["title"] = title
    await update.message.reply_text("📄 أرسل وصفاً مختصراً (أو تخطي):")
    return ADD_LIB_DESC

async def add_lib_desc(update: Update, context: ContextTypes.DEFAULT_TYPE):
    uid = update.effective_user.id
    txt = update.message.text.strip()
    user_state[uid]["description"] = "" if txt.lower() in SKIP_WORDS else txt
    await update.message.reply_text("🏷️ أرسل كلمات مفتاحية (بفواصل):")
    return ADD_LIB_TAGS

async def add_lib_tags(update: Update, context: ContextTypes.DEFAULT_TYPE):
    uid = update.effective_user.id
    tags = [t.strip() for t in update.message.text.strip().split(",") if t.strip()]
    user_state[uid]["tags"] = tags
    user_state[uid]["pending_entry"] = {
        "id": f"lib_{int(time.time())}",
        "title_ar": user_state[uid]["title"],
        "title_en": user_state[uid]["title"],
        "description_ar": user_state[uid].get("description", ""),
        "description_en": "",
        "category": user_state[uid]["category"],
        "type": "book",
        "fileType": user_state[uid]["file_name"].split(".")[-1] if "." in user_state[uid]["file_name"] else "",
        "fileName": user_state[uid]["file_name"],
        "fileSize": f"{len(user_state[uid]['file_bytes'])/1024:.1f} KB",
        "downloadUrl": "",
        "filePath": "",
        "tags": tags,
        "uploadDate": datetime.now().isoformat(),
        "downloads": 0,
        "storage": "telegram"
    }
    await update.message.reply_text(
        f"✅ تأكيد:\n📁 {user_state[uid]['title']}\n🏷️ {', '.join(tags) if tags else 'بدون'}\n\nاكتب 'نعم' للتأكيد:",
        parse_mode="HTML"
    )
    return ADD_LIB_CONFIRM

async def add_lib_confirm(update: Update, context: ContextTypes.DEFAULT_TYPE):
    uid = update.effective_user.id
    if update.message.text.strip().lower() not in ["نعم", "yes"]:
        await update.message.reply_text("تم الإلغاء.")
        cleanup_user_state(uid)
        return ConversationHandler.END

    await update.message.reply_text("⏳ جاري رفع الملف إلى القناة...")
    download_url = await upload_file_to_channel(
        context,
        user_state[uid]["file_bytes"],
        user_state[uid]["file_name"],
        user_state[uid]["title"],
        user_state[uid].get("description", "")
    )
    if not download_url:
        await update.message.reply_text("❌ فشل رفع الملف للقناة.")
        cleanup_user_state(uid)
        return ConversationHandler.END

    entry = user_state[uid].get("pending_entry", {})
    entry["downloadUrl"] = download_url

    index = await async_get_library_index() or {"files": []}
    index.setdefault("files", []).append(entry)

    if await async_save_library_index(index):
        await update.message.reply_text(
            f"🎉 تمت إضافة الملف إلى المكتبة!\n📁 {entry['title_ar']}\n📥 <a href='{download_url}'>رابط التحميل</a>",
            parse_mode="HTML"
        )
        log_operation("مكتبة", f"أُضيف {entry['title_ar']}")
    else:
        await update.message.reply_text(
            f"⚠️ رُفع الملف ولكن فشل تحديث الفهرس.\n"
            f"📥 الرابط المؤقت: <a href='{download_url}'>تحميل</a>",
            parse_mode="HTML"
        )
    cleanup_user_state(uid)
    return ConversationHandler.END

# ========== النشر (مع إشعار للمسؤول) ==========
async def publish_start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if update.effective_user.id != ADMIN_USER_ID:
        await update.message.reply_text("⛔ غير مصرح لك.")
        return ConversationHandler.END
    uid = update.effective_user.id
    cleanup_user_state(uid)
    user_state[uid] = {"chat_id": update.effective_chat.id}
    msg = "👋 مرحباً!\nاختر التبويب:\n"
    for k,v in TABS.items():
        msg += f"{k}️⃣ {v['name']}\n"
    await update.message.reply_text(msg)
    return SELECT_TAB

async def select_tab(update: Update, context: ContextTypes.DEFAULT_TYPE):
    uid = update.effective_user.id
    if uid != ADMIN_USER_ID: return ConversationHandler.END
    c = update.message.text.strip()
    if c not in TABS: return SELECT_TAB
    user_state[uid]["tab"] = TABS[c]["slug"]
    msg = f"✅ {TABS[c]['name']}\nاختر الزر:\n"
    for k,v in BUTTONS[TABS[c]["slug"]].items():
        msg += f"{k}️⃣ {v}\n"
    await update.message.reply_text(msg)
    return SELECT_BTN

async def select_btn(update: Update, context: ContextTypes.DEFAULT_TYPE):
    uid = update.effective_user.id
    c = update.message.text.strip()
    tab = user_state[uid]["tab"]
    if c not in BUTTONS[tab]: return SELECT_BTN
    user_state[uid]["button"] = BTN_SLUGS[tab][int(c)-1]
    await update.message.reply_text("📝 أرسل العنوان العربي:")
    return GET_TITLE_AR

async def get_title_ar(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_state[update.effective_user.id]["title_ar"] = update.message.text.strip()
    await update.message.reply_text("📝 أرسل العنوان الإنجليزي:")
    return GET_TITLE_EN

async def get_title_en(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_state[update.effective_user.id]["title_en"] = update.message.text.strip()
    await update.message.reply_text("📄 أرسل المحتوى العربي (أو ملف txt):")
    return GET_CONTENT_AR

async def get_content_ar(update: Update, context: ContextTypes.DEFAULT_TYPE):
    uid = update.effective_user.id
    if update.message.document and update.message.document.mime_type == 'text/plain':
        f = await context.bot.get_file(update.message.document.file_id)
        ib = await f.download_as_bytearray()
        user_state[uid]["content_ar"] = ib.decode('utf-8')
        await update.message.reply_text("✅ تم استلام الملف.\n📄 أرسل المحتوى الإنجليزي (أو تخطي):")
        return GET_CONTENT_EN
    if update.message.text:
        user_state[uid]["content_ar"] = update.message.text.strip()
        await update.message.reply_text("📄 أرسل المحتوى الإنجليزي (أو تخطي):")
        return GET_CONTENT_EN
    return GET_CONTENT_AR

async def get_content_en(update: Update, context: ContextTypes.DEFAULT_TYPE):
    uid = update.effective_user.id
    txt = update.message.text.strip() if update.message.text else ""
    user_state[uid]["content_en"] = "" if txt.lower() in SKIP_WORDS else txt
    await update.message.reply_text("🏷️ أرسل الكلمات المفتاحية (مفصولة بفواصل):")
    return GET_TAGS

async def get_tags(update: Update, context: ContextTypes.DEFAULT_TYPE):
    uid = update.effective_user.id
    user_state[uid]["tags"] = [t.strip() for t in update.message.text.strip().split(",") if t.strip()]
    await update.message.reply_text("🔗 أرسل رابط خارجي (أو تخطي):")
    return GET_LINK

async def get_link(update: Update, context: ContextTypes.DEFAULT_TYPE):
    uid = update.effective_user.id
    link = update.message.text.strip()
    user_state[uid]["link"] = "" if link.lower() in SKIP_WORDS else link
    await update.message.reply_text("📅 أرسل التاريخ (YYYY-MM-DD) أو 'اليوم':")
    return GET_DATE

async def get_date(update: Update, context: ContextTypes.DEFAULT_TYPE):
    uid = update.effective_user.id
    txt = update.message.text.strip()
    user_state[uid]["date"] = datetime.now().strftime("%Y-%m-%d") if txt == "اليوم" else txt
    await update.message.reply_text("🖼️ أرسل رابط صورة الغلاف، أو اكتب 'توليد'، أو 'تخطي':")
    return GET_IMAGE

async def get_image(update: Update, context: ContextTypes.DEFAULT_TYPE):
    uid = update.effective_user.id
    if update.message.photo:
        f = await context.bot.get_file(update.message.photo[-1].file_id)
        ib = await f.download_as_bytearray()
        compressed = compress_image(ib)
        cover_name = f"cover_{int(time.time())}.jpg"
        path = await asyncio.to_thread(upload_image, compressed, cover_name)
        if path:
            user_state[uid]["image"] = path
            await update.message.reply_text("✅ تم استلام الغلاف ورفعه بنجاح. الآن ننتقل للصور الداخلية...")
        else:
            await update.message.reply_text("❌ فشل رفع صورة الغلاف. أرسل رابطاً أو تخطي.")
            return GET_IMAGE
        return await get_internal_images(update, context, skip_photo=True)
    else:
        img = update.message.text.strip() if update.message.text else ""
        if img.lower() in SKIP_WORDS:
            user_state[uid]["image"] = ""
        elif img.lower() == "توليد":
            try:
                title_ar = user_state[uid].get("title_ar", "")
                title_en = user_state[uid].get("title_en", "")
                tab_slug = user_state[uid].get("tab", "")
                tab_name = next((t["name"] for t in TABS.values() if t["slug"] == tab_slug), "")
                cover_bytes = generate_cover(title_ar, title_en, tab_name)
                compressed = compress_image(cover_bytes, max_kb=800)
                cover_name = f"cover_auto_{int(time.time())}.jpg"
                path = await asyncio.to_thread(upload_image, compressed, cover_name)
                if path:
                    user_state[uid]["image"] = path
                    await update.message.reply_text("🎨 تم توليد الغلاف تلقائياً ورفعه بنجاح.")
                else:
                    await update.message.reply_text("❌ فشل رفع الغلاف المولَّد. أرسل رابطاً يدوياً أو تخطي.")
                    return GET_IMAGE
            except Exception as e:
                logger.error(f"خطأ في توليد الغلاف: {e}")
                await update.message.reply_text("❌ حدث خطأ أثناء التوليد. أرسل رابطاً يدوياً أو تخطي.")
                return GET_IMAGE
        else:
            user_state[uid]["image"] = img
        return await get_internal_images(update, context)

async def get_internal_images(update: Update, context: ContextTypes.DEFAULT_TYPE, skip_photo=False):
    uid = update.effective_user.id
    if skip_photo and update.message.photo:
        pass

    content = user_state[uid].get("content_ar", "")
    image_markers = re.findall(r'\[([^\[\]]+)\]', content)
    image_markers = [m for m in image_markers if 'صورة' in m or 'image' in m.lower()]

    if not image_markers:
        keyboard = [
            [InlineKeyboardButton("🚀 نشر الآن", callback_data="publish_now")],
            [InlineKeyboardButton("💾 حفظ كمسودة", callback_data="save_draft")],
            [InlineKeyboardButton("❌ إلغاء", callback_data="cancel_publish")]
        ]
        await update.message.reply_text("✅ اكتملت البيانات!\n\nماذا تريد أن تفعل؟", reply_markup=InlineKeyboardMarkup(keyboard))
        return GET_CONFIRMATION

    user_state[uid]["image_markers"] = image_markers
    user_state[uid]["image_uploads"] = []
    user_state[uid]["current_image_idx"] = 0

    await update.message.reply_text(
        f"📸 تم اكتشاف <b>{len(image_markers)}</b> صورة داخل المحتوى:\n"
        f"{', '.join(image_markers)}\n\n"
        f"🖼️ أرسل الصورة رقم <b>1</b> ({image_markers[0]}) أو اكتب 'تخطي':",
        parse_mode="HTML"
    )
    return GET_INTERNAL_IMAGES

async def handle_internal_image_upload(update: Update, context: ContextTypes.DEFAULT_TYPE):
    uid = update.effective_user.id
    markers = user_state[uid].get("image_markers", [])
    uploads = user_state[uid].get("image_uploads", [])
    idx = user_state[uid].get("current_image_idx", 0)

    if update.message.text and update.message.text.strip().lower() in SKIP_WORDS:
        uploads.append(None)
        user_state[uid]["current_image_idx"] = idx + 1
        if idx + 1 >= len(markers):
            await show_confirmation(update, uid)
            return GET_CONFIRMATION
        await update.message.reply_text(f"⏭️ تم التخطي.\n🖼️ أرسل الصورة رقم <b>{idx+2}</b> ({markers[idx+1]}) أو 'تخطي':", parse_mode="HTML")
        return GET_INTERNAL_IMAGES

    if not update.message.photo:
        await update.message.reply_text("❌ أرسل صورة أو اكتب 'تخطي'.")
        return GET_INTERNAL_IMAGES

    f = await context.bot.get_file(update.message.photo[-1].file_id)
    ib = await f.download_as_bytearray()
    compressed = compress_image(ib)
    name = f"img_{int(time.time())}_{idx+1}.jpg"
    path = await asyncio.to_thread(upload_image, compressed, name)

    if path:
        uploads.append({"marker": markers[idx], "path": path})
        await update.message.reply_text(f"✅ تم رفع الصورة ({markers[idx]}).")
    else:
        uploads.append(None)
        await update.message.reply_text(f"❌ فشل رفع الصورة ({markers[idx]}). تم التخطي.")

    user_state[uid]["image_uploads"] = uploads
    user_state[uid]["current_image_idx"] = idx + 1

    if idx + 1 >= len(markers):
        await show_confirmation(update, uid)
        return GET_CONFIRMATION

    await update.message.reply_text(f"🖼️ أرسل الصورة رقم <b>{idx+2}</b> ({markers[idx+1]}) أو 'تخطي':", parse_mode="HTML")
    return GET_INTERNAL_IMAGES

async def show_confirmation(update: Update, uid):
    uploads = user_state[uid].get("image_uploads", [])
    content_ar = user_state[uid].get("content_ar", "")
    content_en = user_state[uid].get("content_en", "")

    for upload in uploads:
        if upload is not None:
            marker = f"[{upload['marker']}]"
            replacement = f"![{upload['marker']}]({upload['path']})"
            content_ar = content_ar.replace(marker, replacement)
            content_en = content_en.replace(marker, replacement)

    user_state[uid]["content_ar"] = content_ar
    user_state[uid]["content_en"] = content_en

    uploaded_count = len([u for u in uploads if u is not None])
    skipped_count = len(uploads) - uploaded_count

    keyboard = [
        [InlineKeyboardButton("🚀 نشر الآن", callback_data="publish_now")],
        [InlineKeyboardButton("💾 حفظ كمسودة", callback_data="save_draft")],
        [InlineKeyboardButton("❌ إلغاء", callback_data="cancel_publish")]
    ]

    summary = "✅ اكتملت البيانات!\n\n"
    if uploads:
        summary += f"🖼️ تم رفع {uploaded_count} صورة داخلية"
        if skipped_count > 0:
            summary += f" (وتخطي {skipped_count})"
        summary += "\n\n"
    summary += "ماذا تريد أن تفعل؟"

    await update.message.reply_text(summary, reply_markup=InlineKeyboardMarkup(keyboard))

async def publish_confirmation(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    uid = query.from_user.id
    data = query.data

    if data == "publish_now":
        await publish_final(query, uid, context)
        return ConversationHandler.END
    elif data == "save_draft":
        await query.edit_message_text(f"💾 تم حفظ المسودة!\n📰 {user_state[uid].get('title_ar','?')}\n\nاستخدم /schedule لجدولتها لاحقاً.")
        return ConversationHandler.END
    elif data == "cancel_publish":
        cleanup_user_state(uid)
        await query.edit_message_text("❌ تم الإلغاء.")
        return ConversationHandler.END
    return GET_CONFIRMATION

async def publish_final(update, uid, context):
    d = user_state[uid]
    tab = d.get("tab", "engineering")
    article = {
        "id": str(int(datetime.now().timestamp())),
        "title_ar": d["title_ar"], "title_en": d["title_en"],
        "content_ar": d["content_ar"], "content_en": d["content_en"],
        "tab": tab, "button": d["button"], "tags": d["tags"],
        "link": d["link"], "date": d.get("date", datetime.now().strftime("%Y-%m-%d")),
        "image": d["image"], "author": SITE_IDENTITY["author_ar"]
    }
    data = await async_get_data(tab)
    data.append(article)
    if await async_save_data(tab, data):
        article_url = f"https://bassamibrahim249.github.io/bassam-portfolio/articles/{article['id']}.html"
        if hasattr(update, 'edit_message_text'):
            await update.edit_message_text(f"🎉 تم النشر!\n📰 {d['title_ar']}\n🔗 <a href='{article_url}'>اقرأ المقال</a>", parse_mode="HTML")
        else:
            await update.message.reply_text(f"🎉 تم النشر!\n📰 {d['title_ar']}\n🔗 <a href='{article_url}'>اقرأ المقال</a>", parse_mode="HTML")
        log_operation("نشر", d.get('title_ar','?')[:50])

        async def update_search_index():
            try:
                all_articles = await async_get_data()
                search_index = [{"id": a.get("id",""), "title_ar": a.get("title_ar",""), "title_en": a.get("title_en",""), "tab": a.get("tab",""), "button": a.get("button",""), "content_ar": (a.get("content_ar","") or "")[:200], "content_en": (a.get("content_en","") or "")[:200], "tags": a.get("tags",[])} for a in all_articles]
                url = f"https://api.github.com/repos/{REPO}/contents/search_index.json"
                headers = {"Authorization": f"token {GITHUB_PAT}", "Accept": "application/vnd.github+json"}
                r = await asyncio.to_thread(requests.get, url, headers=headers, timeout=15)
                sha = r.json().get("sha") if r.status_code == 200 else None
                content = json.dumps(search_index, ensure_ascii=False, indent=2).encode()
                body = {"message": "🔍 تحديث فهرس البحث", "content": base64.b64encode(content).decode(), "branch": "main"}
                if sha: body["sha"] = sha
                await asyncio.to_thread(requests.put, url, json=body, headers=headers, timeout=30)
            except: pass

        await asyncio.gather(
            update_search_index(),
            send_article_to_channel(context, article),
            return_exceptions=True
        )
        await notify_admin(context, f"✅ نُشر المقال: <b>{escape_html(d.get('title_ar','?'))}</b>\n📂 {tab}")
    else:
        if hasattr(update, 'edit_message_text'):
            await update.edit_message_text("❌ فشل النشر.")
        else:
            await update.message.reply_text("❌ فشل النشر.")
    cleanup_user_state(uid)

# ========== التعديل ==========
async def cmd_edit(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if update.effective_user.id != ADMIN_USER_ID:
        await update.message.reply_text("⛔ غير مصرح لك.")
        return ConversationHandler.END
    args = context.args
    if not args:
        d = await async_get_data()
        if not d: return
        msg = "✏️ تعديل مقال\nاختر الرقم:\n\n"
        for i,a in enumerate(d,1): msg += f"{i}. {a.get('title_ar','?')[:50]}\n"
        msg += "\nاكتب: /edit <رقم>"
        await update.message.reply_text(msg)
        return
    try: idx = int(args[0])-1
    except: return ConversationHandler.END
    d = await async_get_data()
    if idx<0 or idx>=len(d):
        await update.message.reply_text("❌ رقم غير صحيح.")
        return ConversationHandler.END
    article = d[idx]
    tab_slug = article.get("tab", "engineering")
    tab_articles = await async_get_data(tab_slug)
    user_state[update.effective_user.id] = {"edit_article": article, "tab_slug": tab_slug, "tab_articles": tab_articles}
    await show_edit_menu(update, article, idx)
    return EDIT_FIELD

async def show_edit_menu(update: Update, article, idx):
    msg = f"✏️ تعديل: {article.get('title_ar','?')[:50]}\n\n1. العنوان العربي\n2. العنوان الإنجليزي\n3. المحتوى العربي\n4. المحتوى الإنجليزي\n5. الكلمات\n6. الرابط\n7. الغلاف\n8. صورة داخلية\n9. ✅ إنهاء التعديل"
    await update.message.reply_text(msg)

async def edit_field(update: Update, context: ContextTypes.DEFAULT_TYPE):
    uid = update.effective_user.id
    try: num = int(update.message.text.strip())
    except: return EDIT_FIELD
    if num == 9:
        await update.message.reply_text("هل تريد حفظ التغييرات؟ (نعم/لا)")
        user_state[uid]["confirm_exit"] = True
        return EDIT_VALUE
    fields = {1:"title_ar",2:"title_en",3:"content_ar",4:"content_en",5:"tags",6:"link",7:"image",8:"internal_images"}
    if num not in fields: return EDIT_FIELD
    user_state[uid]["edit_field"] = fields[num]
    if num == 7:
        await update.message.reply_text("🖼️ أرسل صورة الغلاف الجديدة:")
        return EDIT_VALUE
    elif num == 8:
        article = user_state[uid]["edit_article"]
        imgs = re.findall(r'!\[([^\]]*)\]\(([^)]+)\)', article.get('content_ar',''))
        if not imgs:
            await update.message.reply_text("لا صور داخلية.")
            return EDIT_FIELD
        msg = "اختر رقم الصورة:\n"
        for i, img in enumerate(imgs,1): msg += f"{i}. {img[0]}\n"
        user_state[uid]["internal_images"] = imgs
        await update.message.reply_text(msg)
        return EDIT_IMAGE_SELECT
    else:
        await update.message.reply_text("📝 أرسل القيمة الجديدة:")
        return EDIT_VALUE

async def edit_value(update: Update, context: ContextTypes.DEFAULT_TYPE):
    uid = update.effective_user.id
    if user_state[uid].get("confirm_exit"):
        if not update.message.text:
            await update.message.reply_text("الرجاء كتابة 'نعم' أو 'لا' للتأكيد.")
            return EDIT_VALUE
        ans = update.message.text.strip().lower()
        user_state[uid]["confirm_exit"] = False
        if ans in ["نعم", "yes"]:
            tab_slug = user_state[uid]["tab_slug"]
            tab_articles = user_state[uid]["tab_articles"]
            article = user_state[uid]["edit_article"]
            for i, a in enumerate(tab_articles):
                if a.get("id") == article.get("id"):
                    tab_articles[i] = article
                    break
            if await async_save_data(tab_slug, tab_articles, f"تعديل {article.get('title_ar','?')}"):
                await update.message.reply_text("✅ تم حفظ التعديلات وإنهاء الجلسة.")
                log_operation("تعديل", article.get('title_ar','?')[:50])
            else:
                await update.message.reply_text("❌ فشل حفظ التعديلات.")
            cleanup_user_state(uid)
            return ConversationHandler.END
        else:
            await update.message.reply_text("تم الخروج دون حفظ.")
            cleanup_user_state(uid)
            return ConversationHandler.END

    field = user_state[uid]["edit_field"]
    article = user_state[uid]["edit_article"]
    if field == "image":
        if update.message.text and update.message.text.strip().lower() in SKIP_WORDS:
            return await back_to_edit_menu(update, uid)
        if not update.message.photo:
            await update.message.reply_text("أرسل الصورة أو اكتب تخطي.")
            return EDIT_VALUE
        f = await context.bot.get_file(update.message.photo[-1].file_id)
        ib = await f.download_as_bytearray()
        c = compress_image(ib)
        n = f"cover_{int(time.time())}.jpg"
        if await asyncio.to_thread(upload_image, c, n):
            article["image"] = f"assets/images/{n}"
            await update.message.reply_text("✅ تم تحديث الغلاف.")
        else:
            await update.message.reply_text("❌ فشل الرفع.")
        return await back_to_edit_menu(update, uid)
    else:
        val = update.message.text.strip()
        if field == "tags": val = [t.strip() for t in val.split(",") if t.strip()]
        article[field] = val
        await update.message.reply_text("✅ تم التحديث.")
        return await back_to_edit_menu(update, uid)

async def back_to_edit_menu(update: Update, uid):
    article = user_state[uid]["edit_article"]
    await show_edit_menu(update, article, 0)
    return EDIT_FIELD

async def edit_image_select(update: Update, context: ContextTypes.DEFAULT_TYPE):
    uid = update.effective_user.id
    try: num = int(update.message.text.strip())-1
    except: return EDIT_IMAGE_SELECT
    imgs = user_state[uid].get("internal_images",[])
    if num<0 or num>=len(imgs): return EDIT_IMAGE_SELECT
    user_state[uid]["edit_image_index"] = num
    await update.message.reply_text(f"🖼️ الصورة: {imgs[num][0]}\nأرسل الصورة الجديدة:")
    return EDIT_IMAGE_UPLOAD

async def edit_image_upload(update: Update, context: ContextTypes.DEFAULT_TYPE):
    uid = update.effective_user.id
    if not update.message.photo: return EDIT_IMAGE_UPLOAD
    article = user_state[uid]["edit_article"]
    img_idx = user_state[uid]["edit_image_index"]
    f = await context.bot.get_file(update.message.photo[-1].file_id)
    ib = await f.download_as_bytearray()
    c = compress_image(ib)
    n = f"edit_{int(time.time())}.jpg"
    path = await asyncio.to_thread(upload_image, c, n)
    if path:
        content = article.get("content_ar","")
        matches = list(re.finditer(r'!\[([^\]]*)\]\(([^)]+)\)', content))
        if img_idx < len(matches):
            alt = matches[img_idx].group(1)
            content = content[:matches[img_idx].start()] + f"![{alt}]({path})" + content[matches[img_idx].end():]
            article["content_ar"] = content
            await update.message.reply_text("✅ تم تحديث الصورة.")
    return await back_to_edit_menu(update, uid)

# ========== الحذف ==========
async def cmd_delete(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if update.effective_user.id != ADMIN_USER_ID:
        await update.message.reply_text("⛔ غير مصرح لك.")
        return
    args = context.args
    if not args:
        d = await async_get_data()
        if not d: return
        msg = "🗑️ حذف مقال\nاختر الرقم:\n\n"
        for i, a in enumerate(d, 1):
            msg += f"{i}. {a.get('title_ar', '?')[:50]}\n"
        msg += "\nاكتب: /delete <رقم>"
        await update.message.reply_text(msg)
        return
    try:
        idx = int(args[0]) - 1
    except:
        return
    d = await async_get_data()
    if idx < 0 or idx >= len(d):
        await update.message.reply_text("❌ رقم غير صحيح.")
        return
    a = d[idx]
    user_state[update.effective_user.id] = {"delete_article_id": a.get("id")}
    confirm_text = (
        f"⚠️ تأكيد الحذف\n\n"
        f"📰 {a.get('title_ar', '?')}\n"
        f"📂 {a.get('tab', '?')}\n"
        f"📅 {a.get('date', '?')}\n\n"
        f"/confirm_delete للتأكيد\n/cancel للإلغاء"
    )
    if a.get('image'):
        try:
            await update.message.reply_photo(
                photo=f"https://raw.githubusercontent.com/{REPO}/main/{a['image']}",
                caption=confirm_text
            )
            return
        except:
            pass
    await update.message.reply_text(confirm_text)

async def cmd_confirm_delete(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if update.effective_user.id != ADMIN_USER_ID:
        return
    uid = update.effective_user.id
    if uid not in user_state or "delete_article_id" not in user_state[uid]:
        await update.message.reply_text("❌ لا توجد عملية حذف نشطة.")
        return

    article_id = user_state[uid]["delete_article_id"]
    fresh_articles = await async_get_data()
    deleted = next((a for a in fresh_articles if a.get("id") == article_id), None)

    if not deleted:
        await update.message.reply_text("❌ المقال لم يعد موجوداً.")
        cleanup_user_state(uid)
        return

    tab = deleted.get("tab", "engineering")
    section = [a for a in fresh_articles if a.get("tab") == tab and a.get("id") != article_id]

    if await async_push_data_directly(tab, section):
        await update.message.reply_text(f"✅ تم حذف: {deleted.get('title_ar','?')}")
        log_operation("حذف", deleted.get('title_ar','?')[:50])
    else:
        await update.message.reply_text("❌ فشل الحذف.")

    cleanup_user_state(uid)

# ========== الجدولة ==========
async def cmd_schedule(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if update.effective_user.id != ADMIN_USER_ID:
        await update.message.reply_text("⛔ غير مصرح لك.")
        return ConversationHandler.END
    uid = update.effective_user.id
    if uid not in user_state or "content_ar" not in user_state[uid]:
        await update.message.reply_text("❌ لا توجد مسودة. استخدم /publish ثم اختر 'حفظ كمسودة'.")
        return ConversationHandler.END
    user_state[uid]["chat_id"] = update.effective_chat.id
    await update.message.reply_text(
        f"📝 المسودة الحالية:\n<b>{escape_html(user_state[uid].get('title_ar','?'))}</b>\n\n"
        f"⏰ أرسل تاريخ ووقت النشر:\n<code>YYYY-MM-DD HH:MM</code>",
        parse_mode="HTML"
    )
    return SCHEDULE_GET_DATE

async def schedule_get_date(update: Update, context: ContextTypes.DEFAULT_TYPE):
    uid = update.effective_user.id
    try:
        dt = datetime.strptime(update.message.text.strip(), "%Y-%m-%d %H:%M")
        if dt <= datetime.now():
            await update.message.reply_text("❌ التاريخ في الماضي.")
            return SCHEDULE_GET_DATE
        job_id = str(uuid.uuid4())[:8]
        context.job_queue.run_once(
            publish_scheduled_job,
            when=dt,
            data={"uid": uid, "job_id": job_id},
            name=job_id
        )
        await update.message.reply_text(
            f"✅ تمت جدولة النشر:\n📰 {escape_html(user_state[uid].get('title_ar','?'))}\n⏰ {dt}\n🆔 <code>{job_id}</code>",
            parse_mode="HTML"
        )
        return ConversationHandler.END
    except ValueError:
        await update.message.reply_text("❌ صيغة غير صحيحة.")
        return SCHEDULE_GET_DATE

async def publish_scheduled_job(context: ContextTypes.DEFAULT_TYPE):
    job_data = context.job.data
    uid = job_data["uid"]
    job_id = job_data["job_id"]
    if uid not in user_state:
        logger.warning(f"حالة المستخدم {uid} غير موجودة للنشر المجدول.")
        return
    d = user_state[uid]
    tab = d.get("tab", "engineering")
    article = {
        "id": str(int(datetime.now().timestamp())),
        "title_ar": d["title_ar"], "title_en": d["title_en"],
        "content_ar": d["content_ar"], "content_en": d["content_en"],
        "tab": tab, "button": d["button"], "tags": d["tags"],
        "link": d["link"], "date": datetime.now().strftime("%Y-%m-%d"),
        "image": d["image"], "author": SITE_IDENTITY["author_ar"]
    }
    try:
        data = await async_get_data(tab)
        data.append(article)
        if await async_save_data(tab, data):
            log_operation("نشر مجدول", d.get('title_ar','?')[:50])
            await send_article_to_channel(context, article)
            all_articles = await async_get_data()
            search_index = [{"id": a.get("id",""), "title_ar": a.get("title_ar",""), "title_en": a.get("title_en",""), "tab": a.get("tab",""), "button": a.get("button",""), "content_ar": (a.get("content_ar","") or "")[:200], "content_en": (a.get("content_en","") or "")[:200], "tags": a.get("tags",[])} for a in all_articles]
            url = f"https://api.github.com/repos/{REPO}/contents/search_index.json"
            headers = {"Authorization": f"token {GITHUB_PAT}", "Accept": "application/vnd.github+json"}
            r = await asyncio.to_thread(requests.get, url, headers=headers, timeout=15)
            sha = r.json().get("sha") if r.status_code == 200 else None
            content = json.dumps(search_index, ensure_ascii=False, indent=2).encode()
            body = {"message": "🔍 تحديث فهرس البحث (مجدول)", "content": base64.b64encode(content).decode(), "branch": "main"}
            if sha: body["sha"] = sha
            await asyncio.to_thread(requests.put, url, json=body, headers=headers, timeout=30)
            if context.application and context.application.bot:
                await context.application.bot.send_message(chat_id=d.get("chat_id"), text=f"⏰ تم النشر المجدول!\n📰 {d.get('title_ar','?')}")
            await notify_admin(context, f"⏰ نُشر المقال المجدول: <b>{escape_html(d.get('title_ar','?'))}</b>\n📂 {tab}")
    except Exception as e:
        logger.error(f"فشل النشر المجدول: {e}")
    finally:
        cleanup_user_state(uid)

async def cmd_list_jobs(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if update.effective_user.id != ADMIN_USER_ID:
        await update.message.reply_text("⛔ غير مصرح لك.")
        return
    current_jobs = context.job_queue.jobs()
    if not current_jobs:
        await update.message.reply_text("📭 لا توجد مهام مجدولة.")
        return
    msg = "⏰ المهام المجدولة:\n\n"
    for job in current_jobs:
        msg += f"• <code>{job.name}</code> → {job.data.get('uid','?')} | ⏳ {job.next_t}\n"
    await update.message.reply_text(msg, parse_mode="HTML")

async def cmd_cancel_job(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if update.effective_user.id != ADMIN_USER_ID:
        await update.message.reply_text("⛔ غير مصرح لك.")
        return
    args = context.args
    if not args:
        await update.message.reply_text("❌ استخدم: /cancel_job <job_id>")
        return
    job_id = args[0]
    jobs = context.job_queue.get_jobs_by_name(job_id)
    if jobs:
        for job in jobs:
            job_uid = job.data.get("uid") if job.data else None
            job.schedule_removal()
            if job_uid:
                cleanup_user_state(job_uid)
        await update.message.reply_text(f"✅ تم إلغاء المهمة {job_id}")
    else:
        await update.message.reply_text("❌ لم يتم العثور على المهمة.")

# ========== أوامر عامة (مع التحسينات الجديدة) ==========
async def cmd_help(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        "🤖 <b>بوت BassamIbrahim</b>\n\n"
        "📝 /publish – نشر مقال جديد\n"
        "📚 /add_file – إضافة ملف للمكتبة\n"
        "⏰ /schedule – جدولة مقال (من مسودة)\n"
        "📋 /list_jobs – المهام المجدولة\n"
        "❌ /cancel_job &lt;id&gt; – إلغاء مهمة\n"
        "✏️ /edit – تعديل مقال\n"
        "🗑️ /delete – حذف مقال\n"
        "📊 /stats – إحصائيات تفصيلية\n"
        "📈 /status – حالة البوت\n"
        "🔍 /search – بحث\n"
        "📦 /backup – نسخ احتياطي\n"
        "📄 /template &lt;نوع&gt; – قالب (research/news/analysis)\n"
        "👁️ /preview – معاينة المسودة\n"
        "📜 /logs – سجل العمليات\n"
        "🖼️ /images – إدارة الصور\n"
        "🔧 /fix_orders – ترتيب المقالات\n"
        "📊 /analyze – تحليل نص\n"
        "📌 /pin – تثبيت رسالة التصفح\n"
        "📢 /welcome – رسالة ترحيبية للقناة",
        parse_mode="HTML"
    )

async def cmd_stats(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """إحصائيات تفصيلية لكل تبويب"""
    if update.effective_user.id != ADMIN_USER_ID: return
    d = await async_get_data()
    counts = {tab: len([a for a in d if a.get("tab") == tab]) for tab in TABS_WORK}
    last_article = max(d, key=lambda x: x.get("date", "")) if d else None
    last_title = last_article.get("title_ar", "?")[:40] if last_article else "لا يوجد"
    last_date = last_article.get("date", "?") if last_article else "?"

    msg = (
        f"📊 <b>إحصائيات المكتبة</b>\n\n"
        f"📰 إجمالي المقالات: <b>{len(d)}</b>\n\n"
        f"🏗️ الهندسة: <b>{counts['engineering']}</b>\n"
        f"🏛️ السياسة: <b>{counts['political']}</b>\n"
        f"🏺 نوبيان: <b>{counts['nubian']}</b>\n"
        f"📚 الأكاديمية: <b>{counts['academy']}</b>\n"
        f"🌿 الصحة: <b>{counts['lifestyle']}</b>\n\n"
        f"🆕 آخر مقال: {last_title}\n"
        f"📅 تاريخه: {last_date}"
    )
    await update.message.reply_text(msg, parse_mode="HTML")

async def cmd_status(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """عرض حالة البوت وإحصائيات سريعة"""
    if update.effective_user.id != ADMIN_USER_ID:
        await update.message.reply_text("⛔ غير مصرح لك.")
        return
    d = await async_get_data()
    jobs = context.job_queue.jobs() if context.job_queue else []
    status_msg = (
        f"📈 <b>حالة البوت</b>\n\n"
        f"📰 المقالات: <b>{len(d)}</b>\n"
        f"⏰ المهام المجدولة: <b>{len(jobs)}</b>\n"
        f"🟢 الحالة: <b>يعمل</b>\n"
        f"🖥️ الخادم: <b>Render</b>"
    )
    await update.message.reply_text(status_msg, parse_mode="HTML")

async def cmd_logs(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if update.effective_user.id != ADMIN_USER_ID:
        await update.message.reply_text("⛔ غير مصرح لك.")
        return
    with logs_lock:
        logs = operation_logs[-20:]
    if not logs:
        await update.message.reply_text("📭 لا توجد سجلات بعد.")
        return
    msg = "📜 <b>آخر 20 عملية:</b>\n\n" + "\n".join(logs)
    if len(operation_logs) > 20:
        msg += f"\n\n<i>(إجمالي {len(operation_logs)} عملية)</i>"
    await update.message.reply_text(msg, parse_mode="HTML")

async def cmd_fix_orders(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if update.effective_user.id != ADMIN_USER_ID:
        await update.message.reply_text("⛔ غير مصرح لك.")
        return
    await update.message.reply_text("⏳ جاري ترتيب المقالات...")
    fixed_count = 0
    for tab in TABS_WORK:
        data = await async_get_data(tab)
        if data:
            sorted_data = sorted(data, key=lambda x: x.get("date", ""), reverse=True)
            if await async_save_data(tab, sorted_data, "ترتيب"):
                fixed_count += len(sorted_data)
    await update.message.reply_text(f"✅ تم ترتيب {fixed_count} مقال في {len(TABS_WORK)} تبويب.")
    log_operation("ترتيب", f"{fixed_count} مقال")

async def cmd_images(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if update.effective_user.id != ADMIN_USER_ID:
        await update.message.reply_text("⛔ غير مصرح لك.")
        return
    await update.message.reply_text("⏳ جاري جلب الصور...")
    try:
        def _fetch():
            url = f"https://api.github.com/repos/{REPO}/contents/assets/images"
            headers = {"Authorization": f"token {GITHUB_PAT}"}
            return requests.get(url, headers=headers, timeout=15)
        r = await asyncio.to_thread(_fetch)
        if r.status_code == 200:
            files = [f["name"] for f in r.json() if f["name"] != ".gitkeep"]
            if not files:
                await update.message.reply_text("📭 لا توجد صور.")
                return
            msg = f"🖼️ <b>الصور ({len(files)}):</b>\n\n"
            for f in files[:30]:
                msg += f"• <code>{f}</code>\n"
            if len(files) > 30:
                msg += f"\n<i>... و {len(files)-30} صورة أخرى</i>"
            await update.message.reply_text(msg, parse_mode="HTML")
        else:
            await update.message.reply_text(f"❌ فشل الجلب: {r.status_code}")
    except Exception as e:
        await update.message.reply_text(f"❌ خطأ: {e}")

async def cmd_analyze(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if update.effective_user.id != ADMIN_USER_ID:
        await update.message.reply_text("⛔ غير مصرح لك.")
        return
    txt = " ".join(context.args) if context.args else ""
    if not txt:
        await update.message.reply_text("📊 <b>استخدام:</b>\n<code>/analyze النص</code>", parse_mode="HTML")
        return
    words = len(txt.split())
    chars = len(txt)
    paragraphs = len([p for p in txt.split("\n\n") if p.strip()])
    headings = len(re.findall(r'^#+\s', txt, re.MULTILINE))
    images = len(re.findall(r'!\[([^\]]*)\]\(([^)]+)\)', txt))
    bold = len(re.findall(r'\*\*[^*]+\*\*', txt))
    read_time = max(1, round(words / 200))
    rating = "✅ ممتاز" if words >= 300 else ("⚠️ جيد" if words >= 150 else "❌ قصير")
    msg = (
        f"📊 <b>تحليل النص:</b>\n\n"
        f"📝 الكلمات: <b>{words}</b>\n"
        f"🔤 الحروف: {chars}\n"
        f"📖 الفقرات: {paragraphs}\n"
        f"📌 العناوين: {headings}\n"
        f"🖼️ الصور: {images}\n"
        f"<b>النص الغامق:</b> {bold}\n"
        f"⏱️ وقت القراءة: ~{read_time} دقيقة\n\n"
        f"<b>التقييم:</b> {rating}"
    )
    await update.message.reply_text(msg, parse_mode="HTML")

async def cmd_search(update: Update, context: ContextTypes.DEFAULT_TYPE):
    q = " ".join(context.args) if context.args else ""
    if not q: return
    q_lower = q.lower()
    articles = await async_get_data()
    results = [a for a in articles
               if q_lower in a.get("title_ar","").lower()
               or q_lower in a.get("title_en","").lower()
               or any(q_lower in tag.lower() for tag in a.get("tags",[]))
               or q_lower in (a.get("content_ar","") or "")[:500]]
    if not results:
        await update.message.reply_text("🔍 لا نتائج.")
        return
    msg = f"🔍 نتائج ({len(results)}):\n"
    for i,a in enumerate(results[:10],1): msg += f"{i}. {a.get('title_ar','?')[:60]}\n"
    await update.message.reply_text(msg)

async def cmd_backup(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if update.effective_user.id != ADMIN_USER_ID: return
    all_data = {}
    for tab in TABS_WORK:
        all_data[tab] = await async_get_data(tab)
    await update.message.reply_document(
        document=BytesIO(json.dumps(all_data, ensure_ascii=False, indent=2).encode()),
        filename=f"backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json",
        caption=f"📦 نسخة احتياطية ({sum(len(v) for v in all_data.values())} مقال)"
    )

async def cmd_template(update: Update, context: ContextTypes.DEFAULT_TYPE):
    t = context.args[0].lower() if context.args else ""
    templates = {
        "research": {"title_ar":"عنوان البحث","title_en":"Research Title","content_ar":"# المقدمة\n\n## المنهجية\n\n## النتائج\n\n## الخاتمة","content_en":"# Introduction\n\n## Methodology\n\n## Results\n\n## Conclusion","tags":["بحث","دراسة"]},
        "news": {"title_ar":"عنوان الخبر","title_en":"News Title","content_ar":"## التفاصيل\n\n## التأثير","content_en":"## Details\n\n## Impact","tags":["خبر","عاجل"]},
        "analysis": {"title_ar":"عنوان التحليل","title_en":"Analysis Title","content_ar":"## الخلفية\n\n## التحليل\n\n## التوقعات","content_en":"## Background\n\n## Analysis\n\n## Expectations","tags":["تحليل","رؤية"]}
    }
    if t not in templates:
        await update.message.reply_text("📝 استخدم: research, news, analysis")
        return
    await update.message.reply_text(f"📄 قالب {t}:\n<pre>{json.dumps(templates[t], ensure_ascii=False, indent=2)}</pre>", parse_mode="HTML")

async def cmd_preview(update: Update, context: ContextTypes.DEFAULT_TYPE):
    uid = update.effective_user.id
    if uid not in user_state or not user_state[uid].get("content_ar"):
        await update.message.reply_text("📝 لا توجد مسودة.")
        return
    d = user_state[uid]
    msg = f"📰 <b>معاينة</b>\nالعنوان: {escape_html(d.get('title_ar','?'))}\nالتبويب: {d.get('tab','?')}\nالزر: {d.get('button','?')}\nالمحتوى:\n{escape_html(d.get('content_ar','')[:400])}..."
    await update.message.reply_text(msg, parse_mode="HTML")

# ========== Health Server (مُحسَّن لدعم UptimeRobot) ==========
class HealthHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        self._send_ok()
    
    def do_HEAD(self):
        """دعم طلبات HEAD التي تستخدمها خدمات المراقبة مثل UptimeRobot"""
        self._send_ok()
    
    def _send_ok(self):
        self.send_response(200)
        self.send_header("Content-type", "text/plain")
        self.end_headers()
        self.wfile.write(b"OK")
    
    def log_message(self, format, *args):
        pass

def run_health_server():
    port = int(os.getenv("PORT", "8000"))
    server = HTTPServer(("0.0.0.0", port), HealthHandler)
    logger.info(f"🟢 Health Server يعمل على المنفذ {port}")
    server.serve_forever()

# ========== التشغيل الرئيسي ==========
def main():
    global application
    app = Application.builder().token(BOT_TOKEN).build()
    application = app

    app.add_handler(CallbackQueryHandler(
        button_callback,
        pattern=r'^(browse_articles|main_menu|tab_|btn_|back_to_tab_|read_|browse_library|lib_|about_platform)'
    ))

    pub_conv = ConversationHandler(
        entry_points=[CommandHandler("publish", publish_start)],
        states={
            SELECT_TAB: [MessageHandler(filters.TEXT & ~filters.COMMAND, select_tab)],
            SELECT_BTN: [MessageHandler(filters.TEXT & ~filters.COMMAND, select_btn)],
            GET_TITLE_AR: [MessageHandler(filters.TEXT & ~filters.COMMAND, get_title_ar)],
            GET_TITLE_EN: [MessageHandler(filters.TEXT & ~filters.COMMAND, get_title_en)],
            GET_CONTENT_AR: [MessageHandler((filters.TEXT | filters.Document.ALL) & ~filters.COMMAND, get_content_ar)],
            GET_CONTENT_EN: [MessageHandler(filters.TEXT & ~filters.COMMAND, get_content_en)],
            GET_TAGS: [MessageHandler(filters.TEXT & ~filters.COMMAND, get_tags)],
            GET_LINK: [MessageHandler(filters.TEXT & ~filters.COMMAND, get_link)],
            GET_DATE: [MessageHandler(filters.TEXT & ~filters.COMMAND, get_date)],
            GET_IMAGE: [MessageHandler((filters.TEXT | filters.PHOTO) & ~filters.COMMAND, get_image)],
            GET_INTERNAL_IMAGES: [MessageHandler((filters.TEXT | filters.PHOTO) & ~filters.COMMAND, handle_internal_image_upload)],
            GET_CONFIRMATION: [CallbackQueryHandler(publish_confirmation)],
        },
        fallbacks=[CommandHandler("cancel", cancel_handler)],
    )
    app.add_handler(pub_conv)

    edit_conv = ConversationHandler(
        entry_points=[CommandHandler("edit", cmd_edit)],
        states={
            EDIT_FIELD: [MessageHandler(filters.TEXT & ~filters.COMMAND, edit_field)],
            EDIT_VALUE: [MessageHandler((filters.TEXT | filters.PHOTO) & ~filters.COMMAND, edit_value)],
            EDIT_IMAGE_SELECT: [MessageHandler(filters.TEXT & ~filters.COMMAND, edit_image_select)],
            EDIT_IMAGE_UPLOAD: [MessageHandler(filters.PHOTO & ~filters.COMMAND, edit_image_upload)],
        },
        fallbacks=[CommandHandler("cancel", cancel_handler)],
    )
    app.add_handler(edit_conv)

    sched_conv = ConversationHandler(
        entry_points=[CommandHandler("schedule", cmd_schedule)],
        states={
            SCHEDULE_GET_DATE: [MessageHandler(filters.TEXT & ~filters.COMMAND, schedule_get_date)],
        },
        fallbacks=[CommandHandler("cancel", cancel_handler)],
    )
    app.add_handler(sched_conv)

    lib_conv = ConversationHandler(
        entry_points=[CommandHandler("add_file", add_file_start)],
        states={
            ADD_LIB_TAB: [MessageHandler(filters.TEXT & ~filters.COMMAND, add_lib_tab)],
            ADD_LIB_FILE: [MessageHandler(filters.Document.ALL, add_lib_file)],
            ADD_LIB_TITLE: [MessageHandler(filters.TEXT & ~filters.COMMAND, add_lib_title)],
            ADD_LIB_DESC: [MessageHandler(filters.TEXT & ~filters.COMMAND, add_lib_desc)],
            ADD_LIB_TAGS: [MessageHandler(filters.TEXT & ~filters.COMMAND, add_lib_tags)],
            ADD_LIB_CONFIRM: [MessageHandler(filters.TEXT & ~filters.COMMAND, add_lib_confirm)],
        },
        fallbacks=[CommandHandler("cancel", cancel_handler)],
    )
    app.add_handler(lib_conv)

    commands = [
        ("start", start_command), ("pin", cmd_pin), ("welcome", cmd_welcome), ("help", cmd_help),
        ("stats", cmd_stats), ("status", cmd_status), ("search", cmd_search), ("backup", cmd_backup),
        ("delete", cmd_delete), ("confirm_delete", cmd_confirm_delete),
        ("list_jobs", cmd_list_jobs), ("cancel_job", cmd_cancel_job),
        ("template", cmd_template), ("preview", cmd_preview),
        ("logs", cmd_logs), ("images", cmd_images),
        ("fix_orders", cmd_fix_orders), ("analyze", cmd_analyze),
    ]
    for cmd, fn in commands:
        app.add_handler(CommandHandler(cmd, fn))

    threading.Thread(target=run_health_server, daemon=True).start()

    logger.info("🤖 البوت v5.2.0 الاحترافي يعمل!")
    app.run_polling(drop_pending_updates=True, allowed_updates=Update.ALL_TYPES)

if __name__ == "__main__":
    main()