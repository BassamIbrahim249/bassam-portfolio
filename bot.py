import os
import logging
import asyncio
import json
from datetime import datetime
from telegram import Update
from telegram.ext import ApplicationBuilder, ContextTypes, CommandHandler, MessageHandler, filters
from github import Github
from PIL import Image
from io import BytesIO

# إعداد السجلات لمراقبة الأداء
logging.basicConfig(format='%(asctime)s - %(name)s - %(levelname)s - %(message)s', level=logging.INFO)

TOKEN = os.getenv("BOT_TOKEN")
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
REPO_NAME = "bassamibrahim249/bassam-portfolio"

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text("أهلاً بك يا بسام! 🚀 البوت يعمل الآن على Koyeb. أرسل لي صورة مع وصف للنشر.")

async def handle_photo(update: Update, context: ContextTypes.DEFAULT_TYPE):
    try:
        photo = update.message.photo[-1]
        caption = update.message.caption or "مقال بدون عنوان"
        await update.message.reply_text("جاري النشر على GitHub... ⏳")
        
        file = await context.bot.get_file(photo.file_id)
        photo_bytes = await file.download_as_bytearray()
        
        # معالجة الصورة
        img = Image.open(BytesIO(photo_bytes))
        img_format = img.format.lower() if img.format else "jpg"

        # الاتصال بـ GitHub
        g = Github(GITHUB_TOKEN)
        repo = g.get_repo(REPO_NAME)
        
        # 1. رفع الصورة
        image_path = f"assets/images/{photo.file_id}.{img_format}"
        repo.create_file(path=image_path, message=f"Upload image: {caption}", content=bytes(photo_bytes), branch="main")

        # 2. تحديث data.json
        new_article = {
            "title": caption,
            "date": datetime.now().strftime("%Y-%m-%d"),
            "category": "innovation",
            "headerImage": f"./{image_path}",
            "body": f"<p>{caption}</p>"
        }

        file_content = repo.get_contents("data.json", ref="main")
        current_data = json.loads(file_content.decoded_content.decode('utf-8'))
        
        # التعامل مع شكل البيانات (سواء كانت مصفوفة أو كائن يحتوي مصفوفة)
        if isinstance(current_data, list):
            current_data.insert(0, new_article)
        elif isinstance(current_data, dict) and "articles" in current_data:
            current_data["articles"].insert(0, new_article)
        else:
            current_data = [new_article] # إذا كان الملف فارغاً

        repo.update_file(
            path="data.json", 
            message=f"Add article: {caption}", 
            content=json.dumps(current_data, indent=2, ensure_ascii=False), 
            sha=file_content.sha, 
            branch="main"
        )
        
        await update.message.reply_text("✅ تم النشر بنجاح على موقعك!")
    except Exception as e:
        logging.error(f"Error: {str(e)}")
        await update.message.reply_text(f"❌ حدث خطأ: {str(e)}")

async def main():
    if not TOKEN or not GITHUB_TOKEN:
        print("Error: Tokens not found in environment variables!")
        return

    application = ApplicationBuilder().token(TOKEN).build()
    application.add_handler(CommandHandler('start', start))
    application.add_handler(MessageHandler(filters.PHOTO, handle_photo))
    
    print("Bot is starting...")
    await application.initialize()
    await application.start()
    await application.updater.start_polling()
    
    # إبقاء البوت يعمل
    while True:
        await asyncio.sleep(3600)

if __name__ == '__main__':
    asyncio.run(main())
