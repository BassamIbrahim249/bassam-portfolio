// =============== محرك البحث الذكي - BassamIbrahim (v9.1 - بحث محسَّن) ===============
(function() {
  const WHATSAPP_NUMBER = '249967238251';
  const APP_VERSION = '1.0.99';
  // رابط دالة Vercel الوسيطة
  const AI_PROXY_URL = 'https://bassam-portfolio-6hrn5z61b-bassamibrahim0129-1565s-projects.vercel.app/api/gemini';

  // ========== قاعدة المعرفة الموسَّعة ==========
  const knowledgeBase = [
    {
      keywords: ['من أنت','من انت','مين انت','انت مين','من هو بسام','نبذة عنك','عنك','عن بسام','صاحب الموقع','مطور الموقع','بسام','bassam','من يكون','عرف بنفسك','تعريف','سيرتك','خلفيتك'],
      answer: '👷‍♂️ <b>بسام إبراهيم أحمد</b> — مهندس مدني سوداني، باحث في الشأن السوداني، ناشط مجتمعي ومهتم بالابتكار الهندسي. مؤمن بأن التخصص الحقيقي لا يقيد صاحبه، بل يمنحه مفاتيح لفهم العالم بطرق متعددة. هذه المنصة هي نافذته الرقمية لنشر العلم والمعرفة في خمسة مجالات رئيسية.'
    },
    {
      keywords: ['ما هذا الموقع','عن الموقع','موقع ايه','الموقع ده','تعريف بالموقع','ما هو الموقع','نبذة عن الموقع','عن المنصة','المنصة','هدف الموقع','هدف المنصة','غرض الموقع','فكرة الموقع'],
      answer: '🌐 <b>منصة BassamIbrahim الرقمية</b> — منصة سودانية متخصصة تهدف إلى نشر العلم والمعرفة في خمسة مجالات رئيسية:<br><br>🏗️ <b>المنصة الهندسية</b> — علوم المواد، ابتكار إنشائي، مختبر هندسي<br>🏛️ <b>الأرشيف السياسي</b> — تاريخ السودان، تحليل استراتيجي، رؤى فكرية<br>🏺 <b>نوبيان</b> — الحضارة النوبية، التاريخ، الآثار، الهوية<br>📚 <b>الأكاديمية</b> — كتابة المشاريع، القيادة، التدريب التنموي<br>🌿 <b>نمط الحياة</b> — الصحة الشاملة، التغذية، التميز البدني'
    },
    {
      keywords: ['كيف أستخدم','طريقة الاستخدام','ازاي استخدم','شرح الموقع','كيفية التصفح','التنقل','كيف أبحث','البحث عن مقال','شرح','دليل الاستخدام','تعليمات','كيف'],
      answer: '💡 <b>كيف تستخدم المنصة:</b><br><br>1️⃣ تصفح الأقسام الخمسة من القائمة العلوية أو الجانبية (☰)<br>2️⃣ داخل كل قسم، اختر الزر المناسب (مثل "علوم المواد" أو "تاريخ السودان")<br>3️⃣ استخدم خانة البحث داخل كل قسم للعثور على مقال معين<br>4️⃣ لتحميل الملفات، اضغط على زر 📚 المكتبة في أي قسم<br>5️⃣ استخدمني أنا (زر 💬) للبحث عن أي موضوع في كل المقالات والمكتبة دفعة واحدة'
    },
    {
      keywords: ['هندسة','هندسي','engineering','علوم المواد','مواد','materials','ابتكار إنشائي','إنشاء','بناء','مختبر هندسي','مختبر','lab','خرسانة','إسمنت','حديد','تصميم إنشائي','مقاومة المواد'],
      answer: '🏗️ <b>المنصة الهندسية</b> — تضم ثلاثة أقسام متخصصة:<br><br>🔬 <b>علوم المواد</b> — خصائص المواد الإنشائية، الخرسانة، حديد التسليح، المواد الحديثة<br>🏛️ <b>ابتكار إنشائي</b> — حلول هندسية مبتكرة، تقنيات البناء الحديثة<br>⚗️ <b>المختبر الهندسي</b> — اختبارات المواد، التحليل المعملي<br><br>💡 اضغط على بطاقة <b>المنصة الهندسية</b> في الصفحة الرئيسية للاستكشاف.'
    },
    {
      keywords: ['خرسانة','إسمنت','خلطة','نسب','مقاومة','ضغط','شد','اختبار','عمر','معالجة','curing','slump','workability','كسر','عينة','مكعب'],
      answer: '🧱 <b>مقالات الخرسانة والمواد الإنشائية</b><br><br>في قسم <b>المنصة الهندسية ← علوم المواد</b> تجد:<br>✅ تأثير الإضافات على خواص الخرسانة<br>✅ طرق تحسين مقاومة الضغط والشد<br>✅ بروتوكولات الاختبارات المعملية<br>✅ دراسات حالة من مشاريع حقيقية<br><br>💡 ابحث بكلمة "خرسانة" في شريط البحث داخل القسم.'
    },
    {
      keywords: ['سياسة','سياسي','political','تاريخ السودان','سودان','sudan','تحليل استراتيجي','استراتيجي','رؤى فكرية','فكر','ثورة','انقلاب','حركة مسلحة','حرب السودان','اتفاقية','حكومة سودانية'],
      answer: '🏛️ <b>الأرشيف السياسي</b> — توثيق وتحليل الشأن السوداني:<br><br>📜 <b>تاريخ السودان</b> — المراحل التاريخية، الثورات، الأحداث الكبرى<br>📊 <b>تحليل استراتيجي</b> — قراءات في المشهد السياسي الراهن<br>💡 <b>رؤى فكرية</b> — مقالات تحليلية ونقدية<br><br>💡 اضغط على بطاقة <b>الأرشيف السياسي</b> للاستكشاف.'
    },
    {
      keywords: ['نوبة','نوبيان','nubian','نوبي','حضارة نوبية','حضارة','تاريخ نوبة','مروي','كوش','آثار','archaeology','هوية نوبية','هوية','لغة نوبية','عمارة نوبية','مملكة كوش','نبتة','فراعنة السودان','بجراوية'],
      answer: '🏺 <b>نوبيان — الحضارة النوبية</b> — نافذة متخصصة على إرث إنساني عريق:<br><br>📜 <b>التاريخ</b> — مملكتا كوش ومروي، الفراعنة السود، امتداد الحضارة<br>🏛️ <b>الآثار</b> — الأهرامات النوبية، المعابد، الاكتشافات الأثرية<br>🎭 <b>الهوية</b> — اللغة النوبية، التراث، الحفاظ على الهوية الثقافية<br><br>💡 اضغط على بطاقة <b>نوبيان</b> للاستكشاف.'
    },
    {
      keywords: ['أكاديمية','تطوير','منظمات','كتابة مشاريع','مشاريع','منح','grants','قيادة','leadership','تدريب','تنمية','مهارات','capacity building','project writing','ngo','مجتمع مدني','منظمة'],
      answer: '📚 <b>أكاديمية التطوير والمنظمات</b> — بوابة التميز المؤسسي:<br><br>📝 <b>كتابة المشاريع والمنح</b> — أساسيات كتابة المقترحات، قوالب جاهزة<br>🌟 <b>القيادة</b> — مهارات القيادة الفعالة، إدارة الفرق<br>🎓 <b>التدريب التنموي</b> — برامج بناء القدرات، التطوير المهني<br><br>💡 اضغط على بطاقة <b>الأكاديمية</b> للاستكشاف.'
    },
    {
      keywords: ['صحة','health','تغذية','nutrition','رياضة','fitness','لياقة','نمط حياة','lifestyle','صحة شاملة','holistic','تميز بدني','physical','وزن','دايت','diet','بروتين','سعرات','تمرين','أكل صحي'],
      answer: '🌿 <b>نمط الحياة والصحة</b> — بوابة العافية الكاملة:<br><br>❤️ <b>الصحة الشاملة</b> — مفهوم الصحة الكاملة جسداً وعقلاً وروحاً<br>🥗 <b>التغذية العلمية</b> — أسس التغذية الصحيحة، الوجبات المتوازنة<br>💪 <b>التميز البدني</b> — برامج التمرين، الأداء الرياضي، العادات اليومية<br><br>💡 اضغط على بطاقة <b>نمط الحياة والصحة</b> للاستكشاف.'
    },
    {
      keywords: ['مكتبة','library','تحميل','download','ملفات','pdf','كتاب','كتب','books','ملف','موارد','مصادر','منهج','دليل','تقرير','بحث','دراسة'],
      answer: '📚 <b>المكتبة الرقمية</b> — ملفات قابلة للتحميل في جميع الأقسام:<br><br>📕 كتب ودلائل تخصصية<br>📄 أبحاث ودراسات علمية<br>📊 عروض تقديمية<br>📝 نماذج وقوالب جاهزة<br><br>💡 للوصول: اضغط على أي بطاقة ← ثم اضغط <b>📚 المكتبة</b>.'
    },
    {
      keywords: ['تواصل','contact','واتساب','whatsapp','رقم','email','اتصال','تواصل مع بسام','رأي','اقتراح','شكوى','مقترح'],
      answer: '📲 <b>التواصل مع بسام إبراهيم:</b><br><br>يمكنك التواصل المباشر عبر واتساب:<br><a href="https://wa.me/249967238251" target="_blank" style="color:#25D366;font-weight:700;">💬 اضغط هنا للتواصل عبر واتساب</a><br><br>أو من خلال أزرار التواصل الاجتماعي في أسفل الصفحة.'
    },
    {
      keywords: ['شكرا','شكراً','thanks','thank','مشكور','تسلم','يعطيك العافية','ممتاز','رائع','جميل','احسنت'],
      answer: 'العفو! 🥰 أنا في خدمتك دائماً. إذا احتجت مساعدة في البحث فقط اسألني.'
    },
    {
      keywords: ['مرحبا','اهلا','هلا','السلام','hello','hi','صباح','مساء','أهلاً','ازيك','كيف حالك'],
      answer: 'أهلاً بك! 😊 أنا مساعد البحث في منصة BassamIbrahim.<br>اسألني عن أي موضوع وسأبحث في المقالات والمكتبة، أو اسألني عن أي قسم.'
    }
  ];

  // ========== دوال معالجة النصوص ==========
  function normalize(str) {
    return (str || '').toLowerCase()
      .replace(/[\u064B-\u065F\u0670]/g, '')
      .replace(/[أإآٱ]/g, 'ا')
      .replace(/ة/g, 'ه')
      .replace(/ى/g, 'ي')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function fuzzyMatch(text, query) {
    const t = normalize(text);
    const q = normalize(query);
    if (!t || !q) return 0;
    if (t.includes(q)) return 1;
    const words = q.split(' ').filter(w => w.length > 2);
    if (!words.length) return 0;
    let matched = 0;
    words.forEach(w => { if (t.includes(w)) matched++; });
    return matched / words.length;
  }

  // ========== تاريخ البحث ==========
  const HISTORY_KEY = 'bassam_search_history';
  function saveToHistory(question) {
    try {
      const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
      const updated = [question, ...history.filter(q => q !== question)].slice(0, 5);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    } catch(e) {}
  }
  function getHistory() {
    try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); }
    catch(e) { return []; }
  }

  // ========== واجهة المستخدم ==========
  const style = document.createElement('style');
  style.textContent = `
    #smart-assistant-btn{position:fixed;bottom:24px;right:24px;width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg,#3B9EFF,#60CFFF);border:none;color:white;font-size:24px;cursor:pointer;z-index:1000;box-shadow:0 4px 15px rgba(59,158,255,0.5);transition:all 0.3s ease;display:flex;align-items:center;justify-content:center;}
    #smart-assistant-btn:hover{transform:scale(1.1);box-shadow:0 6px 25px rgba(59,158,255,0.8);}
    @media(max-width:480px){ #smart-assistant-btn{ bottom:80px; } }
    #smart-chat-box{position:fixed;bottom:90px;right:24px;width:360px;max-width:90vw;height:500px;max-height:70vh;background:#080c12;border:1px solid rgba(59,158,255,0.3);border-radius:16px;z-index:1000;display:none;flex-direction:column;overflow:hidden;box-shadow:0 10px 40px rgba(0,0,0,0.7);}
    @media(max-width:480px){ #smart-chat-box{ bottom:146px;right:12px;width:calc(100vw - 24px); } }
    #smart-chat-box.open{display:flex;}
    #smart-chat-header{padding:12px 16px;background:linear-gradient(135deg,#3B9EFF,#60CFFF);color:white;font-weight:700;font-size:14px;font-family:'Cairo',sans-serif;display:flex;justify-content:space-between;align-items:center;flex-shrink:0;}
    #smart-chat-messages{flex:1;padding:12px;overflow-y:auto;font-family:'Cairo',sans-serif;font-size:13px;color:#ccc;display:flex;flex-direction:column;gap:8px;scroll-behavior:smooth;}
    #smart-chat-input-area{display:flex;border-top:1px solid rgba(255,255,255,0.1);padding:8px;gap:8px;flex-shrink:0;}
    #smart-chat-input{flex:1;padding:10px 12px;border-radius:20px;border:1px solid rgba(255,255,255,0.15);background:rgba(255,255,255,0.05);color:white;font-family:'Cairo',sans-serif;font-size:12px;outline:none;}
    #smart-chat-input:focus{border-color:rgba(59,158,255,0.5);}
    #smart-chat-send{padding:8px 16px;border-radius:20px;background:#3B9EFF;color:white;border:none;font-family:'Cairo',sans-serif;font-weight:700;font-size:12px;cursor:pointer;transition:background 0.2s;}
    #smart-chat-send:hover{background:#2280dd;}
    .smart-msg-bot{align-self:flex-start;background:rgba(59,158,255,0.12);border:1px solid rgba(59,158,255,0.2);padding:10px 14px;border-radius:12px;max-width:88%;line-height:1.7;}
    .smart-msg-user{align-self:flex-end;background:rgba(234,179,8,0.15);border:1px solid rgba(234,179,8,0.3);padding:10px 14px;border-radius:12px;max-width:88%;}
    .smart-result{background:rgba(255,255,255,0.04);border:1px solid rgba(59,158,255,0.25);border-radius:10px;padding:10px 12px;margin-bottom:8px;line-height:1.7;}
    .smart-result b{color:#fff;}
    .whatsapp-link{color:#25D366!important;font-weight:700;text-decoration:none;display:inline-block;margin-top:6px;padding:6px 14px;background:rgba(37,211,102,0.15);border:1px solid rgba(37,211,102,0.4);border-radius:20px;}
    .expert-btn{color:#EAB308!important;font-weight:700;text-decoration:none;display:inline-block;margin-top:6px;padding:6px 14px;background:rgba(234,179,8,0.15);border:1px solid rgba(234,179,8,0.4);border-radius:20px;cursor:pointer;}
    .suggestion-chips{display:flex;flex-wrap:wrap;gap:6px;padding:4px 0 8px;}
    .suggestion-chip{font-size:11px;padding:6px 12px;border-radius:16px;background:rgba(59,158,255,0.15);color:#3B9EFF;border:1px solid rgba(59,158,255,0.35);cursor:pointer;font-family:'Cairo',sans-serif;transition:all 0.2s;}
    .suggestion-chip:hover{background:rgba(59,158,255,0.35);color:#fff;}
    .section-badge{display:inline-block;padding:2px 8px;border-radius:10px;font-size:10px;font-weight:700;margin-left:4px;background:rgba(59,158,255,0.2);color:#3B9EFF;border:1px solid rgba(59,158,255,0.3);}
    .history-hint{font-size:11px;color:#8899bb;padding:4px 0;border-top:1px solid rgba(255,255,255,0.06);margin-top:4px;}
  `;
  document.head.appendChild(style);

  const btn = document.createElement('button');
  btn.id = 'smart-assistant-btn';
  btn.title = 'ابحث في المنصة';
  btn.textContent = '💬';
  document.body.appendChild(btn);

  const ALL_SUGGESTED_QUESTIONS = [
    'ما هي علوم المواد؟','كيف أكتب مشروعاً ناجحاً؟','ما هي مملكة مروي؟',
    'كيف أحسن تغذيتي؟','ما هي الحضارة النوبية؟','كيف أبحث في المنصة؟',
    'ما هي المكتبة الرقمية؟','كيف أطور مهارات القيادة؟',
    'من هو بسام إبراهيم؟','ما هي أقسام الموقع؟','كيف أتواصل مع بسام؟',
    'ما هو الابتكار الإنشائي؟','كيف أحقق التميز البدني؟',
    'ما هي الآثار النوبية؟','كيف أكتب منحة دراسية؟','ما هي الصحة الشاملة؟',
    'ما هو التحليل الاستراتيجي؟','ما هي فراعنة السودان؟',
    'ما أقسام الأكاديمية؟','كيف أستخدم المنصة؟'
  ];

  function getRandomSuggestions(count = 3) {
    return [...ALL_SUGGESTED_QUESTIONS].sort(() => Math.random() - 0.5).slice(0, count);
  }

  function buildSuggestionChips() {
    const qs = getRandomSuggestions();
    return `<div class="suggestion-chips">${qs.map(q => `<button class="suggestion-chip" data-question="${q}">${q}</button>`).join('')}</div>`;
  }

  function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'صباح الخير! 🌅';
    if (hour < 18) return 'مساء النور! 🌤️';
    return 'مساء الخير! 🌙';
  }

  function buildWelcomeHTML() {
    const greeting = getGreeting();
    const history = getHistory();
    const historyHint = history.length > 0 ? `<div class="history-hint">🕐 آخر بحث: <b>${history[0]}</b></div>` : '';
    return `
      <div class="smart-msg-bot">
        ${greeting} أنا مساعد البحث في منصة BassamIbrahim.<br>
        اسألني عن أي موضوع، أو اختر من الاقتراحات:
        ${historyHint}
      </div>
    `;
  }

  function resetChat() {
    messagesEl.innerHTML = buildWelcomeHTML() + buildSuggestionChips();
    bindChips();
    messagesEl.scrollTop = 0;
  }

  const box = document.createElement('div');
  box.id = 'smart-chat-box';
  box.innerHTML = `
    <div id="smart-chat-header">
      <span>🤖 مساعد BassamIbrahim</span>
      <div style="display:flex;align-items:center;gap:8px;">
        <button id="smart-chat-clear" title="محادثة جديدة" style="background:none;border:none;color:white;font-size:16px;cursor:pointer;opacity:0.85;">🔄</button>
        <button id="smart-chat-close" style="background:none;border:none;color:white;font-size:18px;cursor:pointer;">✕</button>
      </div>
    </div>
    <div id="smart-chat-messages">${buildWelcomeHTML()}${buildSuggestionChips()}</div>
    <div id="smart-chat-input-area">
      <input type="text" id="smart-chat-input" placeholder="ابحث في المنصة..." />
      <button id="smart-chat-send">بحث</button>
    </div>
  `;
  document.body.appendChild(box);

  const closeBtn = document.getElementById('smart-chat-close');
  const clearBtn = document.getElementById('smart-chat-clear');
  const inputEl = document.getElementById('smart-chat-input');
  const sendBtn = document.getElementById('smart-chat-send');
  const messagesEl = document.getElementById('smart-chat-messages');

  function bindChips() {
    messagesEl.querySelectorAll('.suggestion-chip').forEach(chip => {
      chip.addEventListener('click', function() {
        handleQuestion(this.dataset.question);
      });
    });
  }
  bindChips();

  btn.addEventListener('click', () => {
    box.classList.toggle('open');
    if (box.classList.contains('open')) inputEl?.focus();
  });
  closeBtn.addEventListener('click', () => box.classList.remove('open'));
  clearBtn.addEventListener('click', resetChat);

  // ========== تحميل البيانات ==========
  let allArticles = [], allLibraryFiles = [];
  let articlesLoaded = false, libraryLoaded = false;

  const TAB_NAMES = {
    engineering:'المنصة الهندسية', political:'الأرشيف السياسي',
    nubian:'نوبيان', academy:'الأكاديمية', lifestyle:'نمط الحياة والصحة'
  };

  async function loadAllArticles() {
    if (articlesLoaded) return;
    const tabs = ['engineering','political','nubian','academy','lifestyle'];
    const results = await Promise.all(
      tabs.map(tab =>
        fetch(`data/${tab}.json?v=${APP_VERSION}`)
          .then(r => r.ok ? r.json() : []).catch(() => [])
          .then(arr => arr.map(a => ({ ...a, _tab: tab })))
      )
    );
    allArticles = results.flat();
    articlesLoaded = true;
  }

  async function loadLibrary() {
    if (libraryLoaded) return;
    try {
      const r = await fetch(`library_index.json?v=${APP_VERSION}`);
      if (r.ok) { const d = await r.json(); allLibraryFiles = d.files || []; }
    } catch(e) {}
    libraryLoaded = true;
  }

  // ========== ✅ دالة البحث المحسَّنة ==========
  function searchArticles(query) {
    const q = normalize(query);
    if (!q || q.length < 2) return [];

    return allArticles
      .map(article => {
        let score = 0;
        const titleAr = normalize(article.title_ar || article.title || '');
        const titleEn = normalize(article.title_en || '');
        const contentAr = normalize(article.content_ar || article.content || '');
        const contentEn = normalize(article.content_en || '');
        const tags = (article.tags || []).map(t => normalize(t));

        // وزن كبير للتطابق في العنوان
        if (titleAr.includes(q)) score += 100;
        if (titleEn.includes(q)) score += 90;

        // وزن كبير للتطابق في التاجات
        tags.forEach(tag => {
          if (tag === q || tag.includes(q) || q.includes(tag)) score += 80;
        });

        // وزن أقل للتطابق في المحتوى
        if (contentAr.includes(q)) score += 15;
        if (contentEn.includes(q)) score += 10;

        return { ...article, score };
      })
      .filter(a => a.score > 0)
      .sort((a, b) => b.score - a.score);
  }

  function searchLibrary(query) {
    return allLibraryFiles.map(f => {
      let score = 0;
      score += fuzzyMatch(f.title_ar || f.title || '', query) * 10;
      score += fuzzyMatch(f.title_en || '', query) * 8;
      (f.tags || []).forEach(tag => { score += fuzzyMatch(tag, query) * 6; });
      score += fuzzyMatch(f.description_ar || f.description || '', query) * 3;
      return { ...f, score };
    }).filter(f => f.score > 0).sort((a, b) => b.score - a.score);
  }

  const BUTTON_NAMES = {
    materials_science:'علوم المواد', construction_innovation:'ابتكار إنشائي',
    engineering_lab:'مختبر هندسي', sudan_history:'تاريخ السودان',
    strategic_analysis:'تحليل استراتيجي', intellectual_visions:'رؤى فكرية',
    history:'تاريخ', archaeology:'آثار', identity:'هوية',
    project_writing:'كتابة مشاريع', leadership:'قيادة',
    developmental_training:'تدريب تنموي', holistic_health:'صحة شاملة',
    scientific_nutrition:'تغذية علمية', physical_excellence:'تميز بدني'
  };

  function addMsg(html, isUser = false) {
    const div = document.createElement('div');
    div.className = isUser ? 'smart-msg-user' : 'smart-msg-bot';
    div.innerHTML = html;
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return div;
  }

  function searchKB(query) {
    const q = normalize(query);
    for (const item of knowledgeBase) {
      if (item.keywords.some(k => q.includes(normalize(k)))) return item.answer;
    }
    return null;
  }

  // ========== دالة سؤال الخبير (Gemini) ==========
  async function askExpert(question, context) {
    try {
      const response = await fetch(AI_PROXY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, context })
      });
      const data = await response.json();
      return data.reply || 'عذراً، لم أستطع الحصول على إجابة من الخبير.';
    } catch (error) {
      return 'عذراً، حدث خطأ في الاتصال بالخبير. حاول مرة أخرى لاحقاً.';
    }
  }

  // ========== المعالج الرئيسي ==========
  async function handleQuestion(question) {
    saveToHistory(question);
    addMsg(question, true);
    const typing = addMsg('⏳ جاري البحث...');

    const kbAns = searchKB(question);
    if (kbAns) {
      setTimeout(() => { typing.remove(); addMsg(kbAns); }, 350);
      return;
    }

    await Promise.all([loadAllArticles(), loadLibrary()]);

    setTimeout(() => {
      typing.remove();
      const articles = searchArticles(question).slice(0, 3);
      const files = searchLibrary(question).slice(0, 3);

      if (!articles.length && !files.length) {
        const enc = encodeURIComponent(question);
        // عرض رسالة عدم وجود نتائج مع زر "اسأل الخبير" وزر "واتساب"
        const noResultMsg = `
          🤔 لم أجد نتيجة عن "<b>${question}</b>" في المقالات أو المكتبة.<br><br>
          💡 <b>ماذا تريد أن تفعل؟</b><br>
          • <span class="expert-btn" onclick="window.smartAssistant.askExpertQuestion('${question.replace(/'/g, "\\'")}')">🤖 اسأل الخبير (AI)</span><br>
          • <a href="https://wa.me/${WHATSAPP_NUMBER}?text=${enc}" target="_blank" class="whatsapp-link">💬 تواصل مع بسام</a>
        `;
        addMsg(noResultMsg);
        return;
      }

      let reply = '';

      if (articles.length) {
        reply += `<b>📰 مقالات (${articles.length}):</b><br><br>`;
        articles.forEach(a => {
          const title = a.title_ar || a.title_en || a.title || 'بدون عنوان';
          const tab = TAB_NAMES[a._tab] || a._tab;
          const btnName = BUTTON_NAMES[a.button] || '';
          reply += `<div class="smart-result">
            📰 <b>${title}</b><br>
            📂 <span class="section-badge">${tab}</span>${btnName ? ` ← <b>${btnName}</b>` : ''}
          </div>`;
        });
      }

      if (files.length) {
        reply += `<b>📚 مكتبة (${files.length}):</b><br><br>`;
        files.forEach(f => {
          const title = f.title_ar || f.title_en || f.title || 'بدون عنوان';
          const tab = TAB_NAMES[f.category] || f.category;
          const url = `https://github.com/bassamibrahim249/bassam-portfolio/raw/main/${f.filePath}`;
          reply += `<div class="smart-result">
            📁 <b>${title}</b><br>
            📂 <span class="section-badge">${tab}</span>${f.fileSize ? ` 📦 ${f.fileSize}` : ''}<br>
            <a href="${url}" target="_blank" rel="noopener noreferrer">⬇️ تحميل الملف</a>
          </div>`;
        });
      }

      addMsg(reply);
    }, 500);
  }

  // تعريض دالة سؤال الخبير للعامة
  window.smartAssistant = {
    askExpertQuestion: async function(question) {
      addMsg('⏳ جاري سؤال الخبير...');
      const context = '';
      const reply = await askExpert(question, context);
      addMsg(reply);
    }
  };

  sendBtn.addEventListener('click', () => {
    const q = inputEl.value.trim();
    if (q) { handleQuestion(q); inputEl.value = ''; }
  });
  inputEl.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      const q = inputEl.value.trim();
      if (q) { handleQuestion(q); inputEl.value = ''; }
    }
  });
})();