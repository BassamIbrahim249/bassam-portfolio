import os
import logging
import asyncio
from telegram import Update
from telegram.ext import ApplicationBuilder, ContextTypes, CommandHandler, MessageHandler, filters
from github import Github
from PIL import Image
from io import BytesIO
from flask import Flask
from threading import Thread

# إعداد السجلات
logging.basicConfig(format='%(asctime)s - %(name)s - %(levelname)s - %(message)s', level=logging.INFO)

# --- جزء الموقع الوهمي لإرضاء Render ---
app = Flask(__name__)
@app.route('/')
def home(): return "Bot is alive!"
def run_web(): app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 8080)))
# ---------------------------------------

TOKEN = os.getenv("BOT_TOKEN")
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
REPO_NAME = "bassamibrahim249/bassam-portfolio"

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text("أهلاً بك يا بسام! 🚀 أرسل لي صورة مع وصف للنشر.")

async def handle_photo(update: Update, context: ContextTypes.DEFAULT_TYPE):
    try:
        photo = update.message.photo[-1]
        caption = update.message.caption or "مقال بدون عنوان"
        await update.message.reply_text("جاري النشر على GitHub... ⏳")
        
        file = await context.bot.get_file(photo.file_id)
        photo_bytes = await file.download_as_bytearray()
        img = Image.open(BytesIO(photo_bytes))
        img_format = img.format.lower()

        g = Github(GITHUB_TOKEN)
        repo = g.get_repo(REPO_NAME)
        image_path = f"assets/images/{photo.file_id}.{img_format}"
        repo.create_file(path=image_path, message=f"Upload: {caption}", content=bytes(photo_bytes), branch="main")

        import json
        from datetime import datetime
        new_article = {
            "title": caption,
            "date": datetime.now().strftime("%Y-%m-%d"),
            "category": "innovation",
            "headerImage": f"./{image_path}",
            "body": f"<p>{caption}</p>"
        }

        file_content = repo.get_contents("data.json", ref="main")
        current_data = json.loads(file_content.decoded_content.decode())
        if "articles" not in current_data: current_data["articles"] = []
        current_data["articles"].insert(0, new_article)

        repo.update_file(path="data.json", message=f"Add: {caption}", content=json.dumps(current_data, indent=2, ensure_ascii=False), sha=file_content.sha, branch="main")
        await update.message.reply_text("✅ تم النشر بنجاح!")
    except Exception as e:
        await update.message.reply_text(f"❌ خطأ: {str(e)}")

async def main():
    # تشغيل الموقع الوهمي في خيط منفصل
    Thread(target=run_web).start()
    
    application = ApplicationBuilder().token(TOKEN).build()
    application.add_handler(CommandHandler('start', start))
    application.add_handler(MessageHandler(filters.PHOTO, handle_photo))
    
    # استخدام polling بطريقة صحيحة مع asyncio
    async with application:
        await application.initialize()
        await application.start()
        await application.updater.start_polling()
        # إبقاء البوت يعمل للأبد
        while True: await asyncio.sleep(3600)

if __name__ == '__main__':
    try:
        asyncio.run(main())
    except (KeyboardInterrupt, SystemExit):
        pass
