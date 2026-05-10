import os
import json
from datetime import datetime
from telegram import Update, ReplyKeyboardMarkup, KeyboardButton
from telegram.ext import Updater, CommandHandler, MessageHandler, Filters, CallbackContext, ConversationHandler
from github import Github, GithubException

# ==================== الإعدادات ====================
TOKEN = os.environ.get("BOT_TOKEN")
GITHUB_TOKEN = os.environ.get("GITHUB_TOKEN", "")
REPO_NAME = "bassamibrahim249/bassam-portfolio"
DATA_PATH = "data.json"

# ==================== مراحل المحادثة ====================
TITLE, CATEGORY, CONTENT, IMAGE, CONFIRM = range(5)

# ==================== الأقسام ====================
CATEGORIES = [
    ["علوم المواد", "ابتكار إنشائي", "مختبر هندسي"],
    ["تاريخ السودان", "تحليل استراتيجي", "رؤى فكرية"],
    ["تاريخ", "آثار", "هوية"],
    ["كتابة مشاريع", "قيادة", "تدريب تنموي"],
    ["صحة شاملة", "تغذية علمية", "تميز بدني"]
]

user_data = {}

# ==================== بداية المحادثة ====================
def start(update: Update, context: CallbackContext) -> int:
    update.message.reply_text("🎉 أهلاً بك في بوت Bassam Ibrahim!\n\nلنبدأ بإضافة مقال جديد. أرسل عنوان المقال:")
    return TITLE

def new_article(update: Update, context: CallbackContext) -> int:
    update.message.reply_text("📝 أرسل عنوان المقال:")
    return TITLE

# ==================== استلام العنوان ====================
def receive_title(update: Update, context: CallbackContext) -> int:
    user_id = update.message.from_user.id
    user_data[user_id] = {"title": update.message.text}
    
    keyboard = []
    for group in CATEGORIES:
        row = [KeyboardButton(cat) for cat in group]
        keyboard.append(row)
    
    reply_markup = ReplyKeyboardMarkup(keyboard, one_time_keyboard=True, resize_keyboard=True)
    update.message.reply_text("📂 اختر القسم:", reply_markup=reply_markup)
    return CATEGORY

# ==================== استلام القسم ====================
def receive_category(update: Update, context: CallbackContext) -> int:
    user_id = update.message.from_user.id
    user_data[user_id]["category"] = update.message.text
    update.message.reply_text("✍️ اكتب محتوى المقال (Markdown):")
    return CONTENT

# ==================== استلام المحتوى ====================
def receive_content(update: Update, context: CallbackContext) -> int:
    user_id = update.message.from_user.id
    user_data[user_id]["content"] = update.message.text
    
    keyboard = [
        [KeyboardButton("✅ نعم، أضف صورة"), KeyboardButton("⏭ تخطي")],
    ]
    reply_markup = ReplyKeyboardMarkup(keyboard, one_time_keyboard=True, resize_keyboard=True)
    update.message.reply_text("🖼 هل تريد إضافة صورة للمقال؟", reply_markup=reply_markup)
    return IMAGE

# ==================== استلام الصورة ====================
def receive_image_decision(update: Update, context: CallbackContext) -> int:
    text = update.message.text
    if text == "⏭ تخطي":
        return confirm_article(update, context)
    else:
        update.message.reply_text("📸 أرسل الصورة:")
        return IMAGE

def receive_image(update: Update, context: CallbackContext) -> int:
    user_id = update.message.from_user.id
    photo = update.message.photo[-1]
    file = photo.get_file()
    
    # رفع الصورة لـ GitHub
    try:
        g = Github(GITHUB_TOKEN)
        repo = g.get_repo(REPO_NAME)
        
        image_name = f"image_{datetime.now().strftime('%Y%m%d_%H%M%S')}.jpg"
        image_path = f"content/articles/{image_name}"
        
        repo.create_file(image_path, "إضافة صورة مقال", file.download_as_bytearray())
        
        image_url = f"https://raw.githubusercontent.com/{REPO_NAME}/main/{image_path}"
        user_data[user_id]["image"] = image_url
        update.message.reply_text("✅ تم رفع الصورة بنجاح!")
    except Exception as e:
        update.message.reply_text(f"⚠️ فشل رفع الصورة: {str(e)}\nسيتم إكمال المقال بدون صورة.")
    
    return confirm_article(update, context)

# ==================== تأكيد النشر ====================
def confirm_article(update: Update, context: CallbackContext) -> int:
    user_id = update.message.from_user.id
    data = user_data[user_id]
    
    summary = (
        "📋 **ملخص المقال:**\n\n"
        f"📌 **العنوان:** {data.get('title', '')}\n"
        f"📂 **القسم:** {data.get('category', '')}\n"
        f"🖼 **صورة:** {'يوجد' if data.get('image') else 'لا يوجد'}\n\n"
        "هل تريد نشر المقال؟"
    )
    
    keyboard = [[KeyboardButton("✅ نشر"), KeyboardButton("❌ إلغاء")]]
    reply_markup = ReplyKeyboardMarkup(keyboard, one_time_keyboard=True, resize_keyboard=True)
    update.message.reply_text(summary, parse_mode="Markdown", reply_markup=reply_markup)
    return CONFIRM

# ==================== نشر المقال ====================
def publish_article(update: Update, context: CallbackContext) -> int:
    user_id = update.message.from_user.id
    data = user_data[user_id]
    
    if update.message.text == "❌ إلغاء":
        user_data.pop(user_id, None)
        update.message.reply_text("❌ تم إلغاء المقال.")
        return ConversationHandler.END
    
    try:
        g = Github(GITHUB_TOKEN)
        repo = g.get_repo(REPO_NAME)
        
        # قراءة data.json
        contents = repo.get_contents(DATA_PATH)
        existing_data = json.loads(contents.decoded_content.decode())
        
        # إضافة المقال الجديد
        new_article = {
            "title": data["title"],
            "date": datetime.now().strftime("%Y-%m-%d"),
            "category": data["category"],
            "tags": [],
            "body": data["content"].replace("\n", "\\n")
        }
        
        if data.get("image"):
            new_article["headerImage"] = data["image"]
        
        existing_data.append(new_article)
        
        # حفظ الملف
        repo.update_file(
            contents.path,
            f"إضافة مقال: {data['title']}",
            json.dumps(existing_data, ensure_ascii=False, indent=2),
            contents.sha
        )
        
        user_data.pop(user_id, None)
        update.message.reply_text("✅ تم نشر المقال بنجاح!\n\nسيظهر في موقعك خلال دقائق. 🚀")
    except GithubException as e:
        update.message.reply_text(f"❌ خطأ في GitHub: {str(e)}")
    except Exception as e:
        update.message.reply_text(f"❌ خطأ غير متوقع: {str(e)}")
    
    return ConversationHandler.END

# ==================== إلغاء ====================
def cancel(update: Update, context: CallbackContext) -> int:
    user_id = update.message.from_user.id
    user_data.pop(user_id, None)
    update.message.reply_text("❌ تم إلغاء العملية.")
    return ConversationHandler.END

# ==================== تشغيل البوت ====================
def main():
    if not TOKEN:
        print("❌ خطأ: BOT_TOKEN غير موجود!")
        return
    
    updater = Updater(TOKEN)
    dp = updater.dispatcher
    
    conv_handler = ConversationHandler(
        entry_points=[
            CommandHandler("start", start),
            CommandHandler("new", new_article),
        ],
        states={
            TITLE: [MessageHandler(Filters.text & ~Filters.command, receive_title)],
            CATEGORY: [MessageHandler(Filters.text & ~Filters.command, receive_category)],
            CONTENT: [MessageHandler(Filters.text & ~Filters.command, receive_content)],
            IMAGE: [
                MessageHandler(Filters.regex("^(✅|⏭)"), receive_image_decision),
                MessageHandler(Filters.photo, receive_image),
            ],
            CONFIRM: [MessageHandler(Filters.regex("^(✅|❌)"), publish_article)],
        },
        fallbacks=[CommandHandler("cancel", cancel)],
    )
    
    dp.add_handler(conv_handler)
    dp.add_handler(CommandHandler("start", start))
    
    print("✅ البوت يعمل...")
    updater.start_polling()
    updater.idle()

if __name__ == "__main__":
    main()
