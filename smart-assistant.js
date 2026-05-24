// =============== محرك البحث الذكي - BassamIbrahim (v7 - توجيه ثم تواصل) ===============
(function() {
  const WHATSAPP_NUMBER = '249967238251';

  // ---- قاعدة معرفة للإجابة عن أسئلة عامة ----
  const knowledgeBase = [
    {
      keywords: ['من أنت', 'من انت', 'مين انت', 'انت مين', 'من هو بسام', 'نبذة عنك', 'عنك', 'عن بسام', 'صاحب الموقع', 'مطور الموقع', 'بسام', 'bassam', 'من يكون', 'عرف بنفسك', 'تعريف'],
      answer: '👷‍♂️ <b>بسام إبراهيم أحمد</b> — مهندس مدني سوداني، باحث في الشأن السوداني، ناشط مجتمعي ومهتم بالابتكار الهندسي. مؤمن بأن التخصص لا يقيد صاحبه بل يمنحه مفاتيح لفهم العالم بطرق متعددة. هذه المنصة هي نافذته الرقمية لنشر العلم والمعرفة في خمسة مجالات رئيسية.'
    },
    {
      keywords: ['ما هذا الموقع', 'عن الموقع', 'موقع ايه', 'الموقع ده', 'تعريف بالموقع', 'ما هو الموقع', 'نبذة عن الموقع', 'عن المنصة', 'المنصة', 'هدف الموقع', 'هدف المنصة', 'غرض الموقع'],
      answer: '🌐 <b>منصة BassamIbrahim</b> — منصة رقمية سودانية متخصصة، تهدف إلى نشر العلم والمعرفة في خمسة مجالات رئيسية:<br>🏗️ المنصة الهندسية<br>🏛️ الأرشيف السياسي<br>🏺 نوبيان (الحضارة النوبية)<br>📚 أكاديمية التطوير والمنظمات<br>🌿 نمط الحياة والصحة<br><br>تحتوي كل بوابة على مقالات متعمقة ومكتبة رقمية للتحميل. يمكنك تصفح الأقسام من القائمة العلوية أو الجانبية.'
    },
    {
      keywords: ['كيف أستخدم', 'طريقة الاستخدام', 'ازاي استخدم', 'شرح الموقع', 'كيفية التصفح', 'التنقل', 'كيف أبحث', 'البحث عن مقال', 'شرح'],
      answer: '💡 <b>كيف تستخدم المنصة:</b><br>1️⃣ تصفح الأقسام الخمسة من القائمة العلوية أو الجانبية (☰).<br>2️⃣ داخل كل قسم، اختر الزر المناسب (مثل "علوم المواد" أو "تاريخ السودان").<br>3️⃣ يمكنك البحث داخل القسم عن أي كلمة.<br>4️⃣ للتحميل، اضغط على زر 📚 المكتبة في كل قسم.<br>5️⃣ استخدمني أنا (زر 💬) للبحث عن أي موضوع في كل المقالات والمكتبة.'
    },
    {
      keywords: ['شكرا', 'شكراً', 'thanks', 'thank', 'مشكور', 'تسلم', 'يعطيك العافية'],
      answer: 'العفو! 🥰 أنا في خدمتك دائماً. إذا احتجت أي مساعدة في البحث عن مقالات أو تصفح الموقع، فقط اسألني.'
    },
    {
      keywords: ['مرحبا', 'اهلا', 'هلا', 'السلام', 'hello', 'hi', 'صباح', 'مساء'],
      answer: 'أهلاً بك! 😊 أنا مساعد البحث في منصة BassamIbrahim. اسألني عن أي موضوع، وسأبحث لك في جميع المقالات والمكتبة.'
    }
  ];

  // ---- واجهة المستخدم (UI) ----
  const style = document.createElement('style');
  style.textContent = `
    #smart-assistant-btn { position:fixed; bottom:24px; right:24px; width:56px; height:56px; border-radius:50%; background:linear-gradient(135deg,#3B9EFF,#60CFFF); border:none; color:white; font-size:24px; cursor:pointer; z-index:1000; box-shadow:0 4px 15px rgba(59,158,255,0.5); transition:all 0.3s ease; display:flex; align-items:center; justify-content:center; }
    #smart-assistant-btn:hover { transform:scale(1.1); box-shadow:0 6px 25px rgba(59,158,255,0.8); }
    #smart-chat-box { position:fixed; bottom:90px; right:24px; width:360px; max-width:90vw; height:480px; max-height:65vh; background:#080c12; border:1px solid rgba(59,158,255,0.3); border-radius:16px; z-index:1000; display:none; flex-direction:column; overflow:hidden; box-shadow:0 10px 40px rgba(0,0,0,0.7); }
    #smart-chat-box.open { display:flex; }
    #smart-chat-header { padding:12px 16px; background:linear-gradient(135deg,#3B9EFF,#60CFFF); color:white; font-weight:700; font-size:14px; font-family:'Cairo',sans-serif; display:flex; justify-content:space-between; align-items:center; }
    #smart-chat-messages { flex:1; padding:12px; overflow-y:auto; font-family:'Cairo',sans-serif; font-size:13px; color:#ccc; display:flex; flex-direction:column; gap:8px; }
    #smart-chat-input-area { display:flex; border-top:1px solid rgba(255,255,255,0.1); padding:8px; gap:8px; }
    #smart-chat-input { flex:1; padding:10px 12px; border-radius:20px; border:1px solid rgba(255,255,255,0.15); background:rgba(255,255,255,0.05); color:white; font-family:'Cairo',sans-serif; font-size:12px; outline:none; }
    #smart-chat-send { padding:8px 16px; border-radius:20px; background:#3B9EFF; color:white; border:none; font-family:'Cairo',sans-serif; font-weight:700; font-size:12px; cursor:pointer; }
    .smart-result { background:rgba(59,158,255,0.1); border:1px solid rgba(59,158,255,0.3); border-radius:12px; padding:10px 12px; margin-bottom:6px; }
    .smart-result b { color:#fff; }
    .whatsapp-link { color:#25D366; font-weight:700; text-decoration:none; display:inline-block; margin-top:6px; padding:6px 12px; background:rgba(37,211,102,0.15); border:1px solid rgba(37,211,102,0.4); border-radius:20px; }
  `;
  document.head.appendChild(style);

  const btn = document.createElement('button');
  btn.id = 'smart-assistant-btn';
  btn.title = 'ابحث في المنصة';
  btn.textContent = '💬';
  document.body.appendChild(btn);

  const box = document.createElement('div');
  box.id = 'smart-chat-box';
  box.innerHTML = `
    <div id="smart-chat-header"><span>🤖 مساعد BassamIbrahim</span><button id="smart-chat-close" style="background:none;border:none;color:white;font-size:18px;cursor:pointer;">✕</button></div>
    <div id="smart-chat-messages"><div style="align-self:flex-start;background:rgba(59,158,255,0.15);padding:8px 12px;border-radius:12px;max-width:85%;">أهلاً! أنا مساعد البحث في منصة BassamIbrahim. اسألني عن أي موضوع، وسأبحث لك في المقالات والمكتبة الرقمية.</div></div>
    <div id="smart-chat-input-area"><input type="text" id="smart-chat-input" placeholder="ابحث في المنصة..." /><button id="smart-chat-send">بحث</button></div>
  `;
  document.body.appendChild(box);

  const closeBtn = document.getElementById('smart-chat-close');
  const input = document.getElementById('smart-chat-input');
  const send = document.getElementById('smart-chat-send');
  const messages = document.getElementById('smart-chat-messages');

  btn.addEventListener('click', () => {
    box.classList.toggle('open');
    if (box.classList.contains('open') && input) input.focus();
  });
  closeBtn.addEventListener('click', () => box.classList.remove('open'));

  // ---- ذاكرة تخزين مؤقت للمقالات والمكتبة ----
  let allArticles = [];
  let allLibraryFiles = [];
  let articlesLoaded = false;
  let libraryLoaded = false;

  const TAB_NAMES = {
    engineering: 'المنصة الهندسية',
    political: 'الأرشيف السياسي',
    nubian: 'نوبيان (الحضارة النوبية)',
    academy: 'أكاديمية التطوير والمنظمات',
    lifestyle: 'نمط الحياة والصحة'
  };

  const TYPE_NAMES = {
    book: '📕 كتاب/دليل',
    research: '📄 بحث/دراسة',
    presentation: '📊 عرض تقديمي',
    template: '📝 نموذج/قالب'
  };

  async function loadAllArticles() {
    if (articlesLoaded) return;
    const tabs = ['engineering', 'political', 'nubian', 'academy', 'lifestyle'];
    const promises = tabs.map(tab =>
      fetch(`data/${tab}.json?v=1.0.99`)
        .then(r => r.ok ? r.json() : [])
        .catch(() => [])
        .then(articles => articles.map(a => ({ ...a, _tab: tab })))
    );
    const results = await Promise.all(promises);
    allArticles = results.flat();
    articlesLoaded = true;
  }

  async function loadLibrary() {
    if (libraryLoaded) return;
    try {
      const resp = await fetch('library_index.json?v=1.0.99');
      if (resp.ok) {
        const data = await resp.json();
        allLibraryFiles = data.files || [];
      }
    } catch(e) {}
    libraryLoaded = true;
  }

  function searchArticles(query) {
    const q = query.toLowerCase().trim();
    if (!q) return [];
    return allArticles
      .map(article => {
        let score = 0;
        const titleAr = (article.title_ar || '').toLowerCase();
        const titleEn = (article.title_en || '').toLowerCase();
        const contentAr = (article.content_ar || '').toLowerCase();
        const contentEn = (article.content_en || '').toLowerCase();
        const tags = (article.tags || []).map(t => t.toLowerCase());
        if (titleAr.includes(q)) score += 10;
        if (titleEn.includes(q)) score += 8;
        tags.forEach(tag => { if (tag.includes(q) || q.includes(tag)) score += 6; });
        if (contentAr.includes(q)) score += 3;
        if (contentEn.includes(q)) score += 2;
        return { ...article, score };
      })
      .filter(a => a.score > 0)
      .sort((a, b) => b.score - a.score);
  }

  function searchLibrary(query) {
    const q = query.toLowerCase().trim();
    if (!q) return [];
    return allLibraryFiles
      .map(file => {
        let score = 0;
        const titleAr = (file.title_ar || '').toLowerCase();
        const titleEn = (file.title_en || '').toLowerCase();
        const descAr = (file.description_ar || '').toLowerCase();
        const descEn = (file.description_en || '').toLowerCase();
        const tags = (file.tags || []).map(t => t.toLowerCase());
        if (titleAr.includes(q)) score += 10;
        if (titleEn.includes(q)) score += 8;
        tags.forEach(tag => { if (tag.includes(q) || q.includes(tag)) score += 6; });
        if (descAr.includes(q)) score += 3;
        if (descEn.includes(q)) score += 2;
        return { ...file, score };
      })
      .filter(f => f.score > 0)
      .sort((a, b) => b.score - a.score);
  }

  function getTabName(tab) { return TAB_NAMES[tab] || tab; }

  function getButtonName(article) {
    const btn = article.button || '';
    const translations = {
      'materials_science': 'علوم المواد', 'construction_innovation': 'ابتكار إنشائي', 'engineering_lab': 'مختبر هندسي',
      'sudan_history': 'تاريخ السودان', 'strategic_analysis': 'تحليل استراتيجي', 'intellectual_visions': 'رؤى فكرية',
      'history': 'تاريخ', 'archaeology': 'آثار', 'identity': 'هوية',
      'project_writing': 'كتابة مشاريع', 'leadership': 'قيادة', 'developmental_training': 'تدريب تنموي',
      'holistic_health': 'صحة شاملة', 'scientific_nutrition': 'تغذية علمية', 'physical_excellence': 'تميز بدني',
      'library': '📚 المكتبة'
    };
    return translations[btn] || btn;
  }

  function addMessage(text, isUser = false) {
    const div = document.createElement('div');
    div.style.cssText = isUser
      ? 'align-self:flex-end;background:rgba(234,179,8,0.15);padding:8px 12px;border-radius:12px;max-width:85%;'
      : 'align-self:flex-start;background:rgba(255,255,255,0.05);padding:8px 12px;border-radius:12px;max-width:85%;';
    div.innerHTML = text;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
  }

  function searchKnowledgeBase(query) {
    const q = query.toLowerCase().trim();
    for (const item of knowledgeBase) {
      if (item.keywords.some(k => q.includes(k))) {
        return item.answer;
      }
    }
    return null;
  }

  async function handleQuestion(question) {
    addMessage(question, true);
    const typing = document.createElement('div');
    typing.style.cssText = 'align-self:flex-start;background:rgba(255,255,255,0.05);padding:8px 12px;border-radius:12px;';
    typing.innerHTML = '⏳ جاري البحث في المنصة...';
    messages.appendChild(typing);
    messages.scrollTop = messages.scrollHeight;

    // 1. قاعدة المعرفة
    const kbAnswer = searchKnowledgeBase(question);
    if (kbAnswer) {
      setTimeout(() => {
        typing.remove();
        addMessage(kbAnswer);
      }, 400);
      return;
    }

    // 2. تحميل المقالات والمكتبة معاً
    await Promise.all([loadAllArticles(), loadLibrary()]);

    setTimeout(() => {
      typing.remove();

      // 3. البحث في المقالات
      const articleResults = searchArticles(question);

      // 4. البحث في المكتبة
      const libraryResults = searchLibrary(question);

      if (articleResults.length === 0 && libraryResults.length === 0) {
        const encodedQuestion = encodeURIComponent(question);
        const whatsappLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedQuestion}`;
        // توجيه ثم تواصل
        const noResultMsg = `🤔 لم أجد نتيجة عن "<b>${question}</b>" حالياً في المقالات أو المكتبة.<br><br>
        💡 <b>جرب:</b><br>
        • صياغة السؤال بشكل مختلف<br>
        • تصفح الأقسام من القائمة الجانبية<br><br>
        📲 إذا كان لديك اقتراح أو ملاحظة، تواصل معي مباشرة:<br>
        <a href="${whatsappLink}" target="_blank" class="whatsapp-link">💬 تواصل عبر واتساب</a>`;
        addMessage(noResultMsg);
        return;
      }

      let reply = '';

      // عرض نتائج المقالات
      if (articleResults.length > 0) {
        const count = Math.min(articleResults.length, 3);
        reply += `📰 **مقالات (${count}):**\n\n`;
        for (let i = 0; i < count; i++) {
          const article = articleResults[i];
          const title = article.title_ar || article.title_en || 'بدون عنوان';
          const tabName = getTabName(article._tab);
          const btnName = getButtonName(article);
          reply += `<div class="smart-result">`;
          reply += `📰 <b>${title}</b><br>`;
          reply += `📂 اذهب إلى: <b>${tabName}</b> ← ثم اضغط على زر <b>${btnName}</b><br>`;
          reply += `</div>`;
        }
      }

      // عرض نتائج المكتبة
      if (libraryResults.length > 0) {
        const count = Math.min(libraryResults.length, 3);
        reply += `\n📚 **مكتبة (${count}):**\n\n`;
        for (let i = 0; i < count; i++) {
          const file = libraryResults[i];
          const title = file.title_ar || file.title_en || 'بدون عنوان';
          const tabName = getTabName(file.category);
          const typeName = TYPE_NAMES[file.type] || file.type;
          const fileSize = file.fileSize || 'غير معروف';
          const downloadUrl = `https://github.com/bassamibrahim249/bassam-portfolio/raw/main/${file.filePath}`;
          reply += `<div class="smart-result">`;
          reply += `📁 <b>${title}</b><br>`;
          reply += `📂 القسم: <b>${tabName}</b> | ${typeName}<br>`;
          reply += `📦 الحجم: ${fileSize}<br>`;
          reply += `<a href="${downloadUrl}" target="_blank" rel="noopener noreferrer">⬇️ تحميل الملف</a>`;
          reply += `</div>`;
        }
      }

      addMessage(reply);
    }, 600);
  }

  send.addEventListener('click', () => {
    const q = input.value.trim();
    if (q) { handleQuestion(q); input.value = ''; }
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const q = input.value.trim();
      if (q) { handleQuestion(q); input.value = ''; }
    }
  });
})();