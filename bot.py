import os
import logging
import asyncio
from telegram import Update
from telegram.ext import ApplicationBuilder, ContextTypes, CommandHandler, MessageHandler, filters
from github import Github
import requests
from io import BytesIO
from PIL import Image

# إعداد السجلات (Logs)
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)

# الحصول على المتغيرات من البيئة (Environment Variables)
TOKEN = os.getenv("BOT_TOKEN")
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
REPO_NAME = "bassamibrahim249/bassam-portfolio" # تأكد من اسم المستودع

# دالة الترحيب
async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        "أهلاً بك يا بسام! 🚀\n"
        "أنا بوت النشر الخاص بموقعك.\n"
        "أرسل لي أي صورة مع وصف (Caption) وسأقوم بنشرها كمقال فوراً."
    )

# دالة معالجة الصور والنشر
async def handle_photo(update: Update, context: ContextTypes.DEFAULT_TYPE):
    try:
        # 1. الحصول على الصورة والوصف
        photo = update.message.photo[-1]
        caption = update.message.caption or "مقال بدون عنوان"
        
        await update.message.reply_text("جاري معالجة الصورة والنشر على GitHub... ⏳")

        # 2. تحميل الصورة
        file = await context.bot.get_file(photo.file_id)
        photo_bytes = await file.download_as_bytearray()
        
        # التأكد من صيغة الصورة باستخدام Pillow بدلاً من imghdr
        img = Image.open(BytesIO(photo_bytes))
        img_format = img.format.lower() # سيعطيك 'jpeg' أو 'png'

        # 3. إعداد الاتصال بـ GitHub
        g = Github(GITHUB_TOKEN)
        repo = g.get_repo(REPO_NAME)

        # 4. رفع الصورة إلى مجلد assets/images
        image_path = f"assets/images/{photo.file_id}.{img_format}"
        repo.create_file(
            path=image_path,
            message=f"Upload image for: {caption}",
            content=bytes(photo_bytes),
            branch="main"
        )

        # 5. إعداد بيانات المقال (JSON)
        import json
        from datetime import datetime
        
        new_article = {
            "title": caption,
            "date": datetime.now().strftime("%Y-%m-%d"),
            "category": "innovation", # يمكنك تعديلها لتكون ديناميكية لاحقاً
            "headerImage": f"./{image_path}",
            "body": f"<p>{caption}</p>"
        }

        # 6. تحديث ملف data.json
        file_content = repo.get_contents("data.json", ref="main")
        current_data = json.loads(file_content.decoded_content.decode())
        
        if "articles" not in current_data:
            current_data["articles"] = []
            
        current_data["articles"].insert(0, new_article) # إضافة المقال في البداية

        repo.update_file(
            path="data.json",
            message=f"Add new article: {caption}",
            content=json.dumps(current_data, indent=2, ensure_ascii=False),
            sha=file_content.sha,
            branch="main"
        )

        await update.message.reply_text("✅ تم النشر بنجاح! سيظهر المقال على موقعك خلال دقيقتين.")

    except Exception as e:
        logging.error(f"Error: {e}")
        await update.message.reply_text(f"❌ حدث خطأ أثناء النشر: {str(e)}")

if __name__ == '__main__':
    if not TOKEN or not GITHUB_TOKEN:
        print("Error: BOT_TOKEN or GITHUB_TOKEN not found in environment variables.")
    else:
        application = ApplicationBuilder().token(TOKEN).build()
        
        start_handler = CommandHandler('start', start)
        photo_handler = MessageHandler(filters.PHOTO, handle_photo)
        
        application.add_handler(start_handler)
        application.add_handler(photo_handler)
        
        print("Bot is running...")
        application.run_polling()
