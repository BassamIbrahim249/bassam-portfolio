// =============== مساعد البحث الذكي - BassamIbrahim (v8.0) ===============
(function() {
  const WHATSAPP_NUMBER = '249967238251';

  // ======= قاعدة المعرفة الموسَّعة =======
  const knowledgeBase = [

    // ── الهوية والتعريف ──
    {
      keywords:['من أنت','من انت','مين انت','انت مين','من هو بسام','نبذة','عنك','عن بسام','صاحب الموقع','بسام','bassam','عرف بنفسك','تعريف','من يكون'],
      answer:'👷‍♂️ <b>بسام إبراهيم أحمد</b> — مهندس مدني سوداني، باحث في الشأن السوداني، ناشط مجتمعي ومهتم بالابتكار الهندسي.<br>مؤمن بأن التخصص الحقيقي يمنح صاحبه مفاتيح لفهم العالم بطرق متعددة.<br>هذه المنصة هي نافذته الرقمية لنشر العلم والمعرفة في خمسة مجالات رئيسية.'
    },

    // ── الموقع والمنصة ──
    {
      keywords:['ما هذا الموقع','عن الموقع','موقع ايه','المنصة','هدف الموقع','غرض الموقع','نبذة عن الموقع','ما هو الموقع'],
      answer:'🌐 <b>منصة BassamIbrahim</b> — منصة رقمية سودانية متخصصة تضم خمسة مجالات رئيسية:<br><br>🏗️ <b>المنصة الهندسية</b> — علوم المواد، ابتكار إنشائي، مختبر هندسي<br>🏛️ <b>الأرشيف السياسي</b> — تاريخ السودان، تحليل استراتيجي، رؤى فكرية<br>🏺 <b>نوبيان</b> — الحضارة النوبية، التاريخ، الآثار، الهوية<br>📚 <b>الأكاديمية</b> — كتابة المشاريع، القيادة، التدريب التنموي<br>🌿 <b>نمط الحياة</b> — الصحة الشاملة، التغذية، التميز البدني'
    },

    // ── كيفية الاستخدام ──
    {
      keywords:['كيف أستخدم','طريقة الاستخدام','ازاي استخدم','شرح الموقع','كيفية التصفح','كيف أبحث','شرح','كيف'],
      answer:'💡 <b>كيف تستخدم المنصة:</b><br><br>1️⃣ اختر القسم من القائمة العلوية أو اضغط ☰ في الموبايل<br>2️⃣ داخل كل قسم اضغط على الزر المناسب (مثل "علوم المواد")<br>3️⃣ استخدم خانة البحث للعثور على مقال معين<br>4️⃣ لتحميل الملفات اضغط 📚 المكتبة في أي قسم<br>5️⃣ اسألني أنا (زر 💬) للبحث في كل المحتوى دفعة واحدة'
    },

    // ── المنصة الهندسية ──
    {
      keywords:['هندسة','هندسي','engineering','علوم المواد','مواد','materials','ابتكار إنشائي','إنشاء','بناء','مختبر هندسي','مختبر','lab','خرسانة','إسمنت','حديد','تصميم إنشائي','مقاومة المواد'],
      answer:'🏗️ <b>المنصة الهندسية</b> — تضم ثلاثة أقسام متخصصة:<br><br>🔬 <b>علوم المواد</b> — خصائص المواد الإنشائية، الخرسانة، حديد التسليح، المواد الحديثة<br>🏛️ <b>ابتكار إنشائي</b> — حلول هندسية مبتكرة، تقنيات البناء الحديثة<br>⚗️ <b>المختبر الهندسي</b> — اختبارات المواد، التحليل المعملي<br><br>💡 اضغط على بطاقة <b>المنصة الهندسية</b> في الصفحة الرئيسية للاستكشاف.'
    },

    // ── الأرشيف السياسي ──
    {
      keywords:['سياسة','سياسي','political','تاريخ السودان','سودان','sudan','تحليل استراتيجي','استراتيجي','رؤى فكرية','فكر','ثورة','انقلاب','حركة مسلحة','حرب السودان','اتفاقية','حكومة سودانية'],
      answer:'🏛️ <b>الأرشيف السياسي</b> — توثيق وتحليل الشأن السوداني:<br><br>📜 <b>تاريخ السودان</b> — المراحل التاريخية، الثورات، الأحداث الكبرى<br>📊 <b>تحليل استراتيجي</b> — قراءات في المشهد السياسي الراهن<br>💡 <b>رؤى فكرية</b> — مقالات تحليلية ونقدية<br><br>💡 اضغط على بطاقة <b>الأرشيف السياسي</b> للاستكشاف.'
    },

    // ── الحضارة النوبية ──
    {
      keywords:['نوبة','نوبيان','nubian','نوبي','حضارة نوبية','حضارة','تاريخ نوبة','مروي','كوش','آثار','archaeology','هوية نوبية','هوية','لغة نوبية','عمارة نوبية','مملكة كوش','نبتة','فراعنة السودان','بجراوية'],
      answer:'🏺 <b>نوبيان — الحضارة النوبية</b> — نافذة متخصصة على إرث إنساني عريق:<br><br>📜 <b>التاريخ</b> — مملكتا كوش ومروي، الفراعنة السود، امتداد الحضارة<br>🏛️ <b>الآثار</b> — الأهرامات النوبية، المعابد، الاكتشافات الأثرية<br>🎭 <b>الهوية</b> — اللغة النوبية، التراث، الحفاظ على الهوية الثقافية<br><br>💡 اضغط على بطاقة <b>نوبيان</b> للاستكشاف.'
    },

    // ── الأكاديمية ──
    {
      keywords:['أكاديمية','تطوير','منظمات','كتابة مشاريع','مشاريع','منح','grants','قيادة','leadership','تدريب','تنمية','مهارات','capacity building','project writing','نجو','ngo','مجتمع مدني'],
      answer:'📚 <b>أكاديمية التطوير والمنظمات</b> — بوابة التميز المؤسسي:<br><br>📝 <b>كتابة المشاريع والمنح</b> — أساسيات كتابة المقترحات، قوالب جاهزة، نصائح عملية<br>🌟 <b>القيادة</b> — مهارات القيادة الفعالة، إدارة الفرق<br>🎓 <b>التدريب التنموي</b> — برامج بناء القدرات، التطوير المهني<br><br>💡 اضغط على بطاقة <b>الأكاديمية</b> للاستكشاف.'
    },

    // ── نمط الحياة والصحة ──
    {
      keywords:['صحة','health','تغذية','nutrition','رياضة','fitness','لياقة','نمط حياة','lifestyle','صحة شاملة','holistic','تميز بدني','physical','وزن','دايت','diet','بروتين','سعرات','تمرين','أكل صحي'],
      answer:'🌿 <b>نمط الحياة والصحة</b> — بوابة العافية الكاملة:<br><br>❤️ <b>الصحة الشاملة</b> — مفهوم الصحة الكاملة جسداً وعقلاً<br>🥗 <b>التغذية العلمية</b> — أسس التغذية الصحيحة، الوجبات المتوازنة<br>💪 <b>التميز البدني</b> — برامج التمرين، الأداء الرياضي<br><br>💡 اضغط على بطاقة <b>نمط الحياة والصحة</b> للاستكشاف.'
    },

    // ── المكتبة ──
    {
      keywords:['مكتبة','library','تحميل','download','ملفات','pdf','كتاب','كتب','books','ملف','موارد','مصادر','منهج','دليل','تقرير','بحث','دراسة'],
      answer:'📚 <b>المكتبة الرقمية</b> — تحتوي على ملفات قابلة للتحميل في جميع الأقسام:<br><br>📕 كتب ودلائل تخصصية<br>📄 أبحاث ودراسات علمية<br>📊 عروض تقديمية<br>📝 نماذج وقوالب جاهزة<br><br>💡 للوصول إليها: اضغط على أي بطاقة من الصفحة الرئيسية ← ثم اضغط زر <b>📚 المكتبة</b>.'
    },

    // ── التواصل ──
    {
      keywords:['تواصل','contact','واتساب','whatsapp','رقم','email','اتصال','تواصل مع بسام','رأي','اقتراح','شكوى','مقترح'],
      answer:`📲 <b>التواصل مع بسام إبراهيم:</b><br><br>يمكنك التواصل المباشر عبر واتساب:<br><a href="https://wa.me/${WHATSAPP_NUMBER}" target="_blank" style="color:#25D366;font-weight:700;">💬 اضغط هنا للتواصل عبر واتساب</a><br><br>أو من خلال أزرار التواصل الاجتماعي في أسفل الصفحة الرئيسية.`
    },

    // ── ردود اجتماعية ──
    {
      keywords:['شكرا','شكراً','thanks','thank','مشكور','تسلم','يعطيك العافية','ممتاز','رائع','جميل'],
      answer:'العفو! 🥰 أنا في خدمتك دائماً. إذا احتجت مساعدة في البحث أو التصفح فقط اسألني.'
    },
    {
      keywords:['مرحبا','اهلا','هلا','السلام','hello','hi','صباح','مساء','أهلاً'],
      answer:'أهلاً بك! 😊 أنا مساعد البحث في منصة BassamIbrahim.<br>اسألني عن أي موضوع وسأبحث لك في المقالات والمكتبة الرقمية، أو اسألني عن أي قسم من أقسام المنصة.'
    },
    {
      keywords:['مافي شي','لا يوجد','فاضي','ما في مقالات'],
      answer:'📝 المنصة تتوسع باستمرار! المحتوى يُضاف بشكل منتظم.<br>يمكنك متابعة التحديثات أو التواصل مع بسام مباشرة لاقتراح موضوع معين.'
    }
  ];

  // ======= واجهة المستخدم =======
  const style = document.createElement('style');
  style.textContent = `
    #smart-assistant-btn{position:fixed;bottom:24px;right:24px;width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg,#3B9EFF,#60CFFF);border:none;color:white;font-size:24px;cursor:pointer;z-index:1000;box-shadow:0 4px 15px rgba(59,158,255,0.5);transition:all 0.3s ease;display:flex;align-items:center;justify-content:center;}
    #smart-assistant-btn:hover{transform:scale(1.1);box-shadow:0 6px 25px rgba(59,158,255,0.8);}
    #smart-chat-box{position:fixed;bottom:90px;right:24px;width:360px;max-width:90vw;height:500px;max-height:70vh;background:#080c12;border:1px solid rgba(59,158,255,0.3);border-radius:16px;z-index:1000;display:none;flex-direction:column;overflow:hidden;box-shadow:0 10px 40px rgba(0,0,0,0.7);}
    #smart-chat-box.open{display:flex;}
    #smart-chat-header{padding:12px 16px;background:linear-gradient(135deg,#3B9EFF,#60CFFF);color:white;font-weight:700;font-size:14px;font-family:'Cairo',sans-serif;display:flex;justify-content:space-between;align-items:center;}
    #smart-chat-messages{flex:1;padding:12px;overflow-y:auto;font-family:'Cairo',sans-serif;font-size:13px;color:#ccc;display:flex;flex-direction:column;gap:8px;}
    #smart-chat-input-area{display:flex;border-top:1px solid rgba(255,255,255,0.1);padding:8px;gap:8px;}
    #smart-chat-input{flex:1;padding:10px 12px;border-radius:20px;border:1px solid rgba(255,255,255,0.15);background:rgba(255,255,255,0.05);color:white;font-family:'Cairo',sans-serif;font-size:12px;outline:none;}
    #smart-chat-send{padding:8px 16px;border-radius:20px;background:#3B9EFF;color:white;border:none;font-family:'Cairo',sans-serif;font-weight:700;font-size:12px;cursor:pointer;transition:background 0.2s;}
    #smart-chat-send:hover{background:#2280dd;}
    .smart-msg-bot{align-self:flex-start;background:rgba(59,158,255,0.12);border:1px solid rgba(59,158,255,0.2);padding:10px 14px;border-radius:12px;max-width:88%;line-height:1.7;}
    .smart-msg-user{align-self:flex-end;background:rgba(234,179,8,0.15);border:1px solid rgba(234,179,8,0.3);padding:10px 14px;border-radius:12px;max-width:88%;}
    .smart-result{background:rgba(255,255,255,0.04);border:1px solid rgba(59,158,255,0.25);border-radius:10px;padding:10px 12px;margin-bottom:8px;line-height:1.7;}
    .smart-result b{color:#fff;}
    .smart-result a{color:#3B9EFF;text-decoration:none;}
    .smart-result a:hover{text-decoration:underline;}
    .whatsapp-link{color:#25D366!important;font-weight:700;text-decoration:none;display:inline-block;margin-top:6px;padding:6px 14px;background:rgba(37,211,102,0.15);border:1px solid rgba(37,211,102,0.4);border-radius:20px;}
    .suggestion-chips{display:flex;flex-wrap:wrap;gap:6px;padding:4px 0 8px;}
    .suggestion-chip{font-size:11px;padding:6px 12px;border-radius:16px;background:rgba(59,158,255,0.15);color:#3B9EFF;border:1px solid rgba(59,158,255,0.35);cursor:pointer;font-family:'Cairo',sans-serif;transition:all 0.2s;}
    .suggestion-chip:hover{background:rgba(59,158,255,0.35);color:#fff;}
    .section-badge{display:inline-block;padding:2px 8px;border-radius:10px;font-size:10px;font-weight:700;margin-right:4px;background:rgba(59,158,255,0.2);color:#3B9EFF;border:1px solid rgba(59,158,255,0.3);}
  `;
  document.head.appendChild(style);

  // ======= إنشاء الأزرار =======
  const btn = document.createElement('button');
  btn.id = 'smart-assistant-btn';
  btn.title = 'ابحث في المنصة';
  btn.textContent = '💬';
  document.body.appendChild(btn);

  // ======= الأسئلة المقترحة =======
  const ALL_SUGGESTED_QUESTIONS = [
    'ما هي علوم المواد؟','كيف أكتب مشروعاً ناجحاً؟','ما هي مملكة مروي؟',
    'كيف أحسن تغذيتي؟','ما هي الحضارة النوبية؟','كيف أبحث في المنصة؟',
    'ما هي المكتبة الرقمية؟','ما أحدث المقالات الهندسية؟','كيف أطور مهارات القيادة؟',
    'من هو بسام إبراهيم؟','ما هي أقسام الموقع؟','كيف أتواصل مع بسام؟',
    'ما هو الابتكار الإنشائي؟','ما هي اتفاقيات السودان؟','كيف أحقق التميز البدني؟',
    'ما هي الآثار النوبية؟','كيف أكتب منحة دراسية؟','ما هي الصحة الشاملة؟',
    'ما هو التحليل الاستراتيجي؟','ما هي فراعنة السودان؟'
  ];

  function getRandomSuggestions(count = 3) {
    return [...ALL_SUGGESTED_QUESTIONS].sort(() => Math.random() - 0.5).slice(0, count);
  }

  function buildSuggestionChips() {
    const qs = getRandomSuggestions();
    return `<div class="suggestion-chips">${qs.map(q => `<button class="suggestion-chip" data-question="${q}">${q}</button>`).join('')}</div>`;
  }

  const WELCOME_HTML = `
    <div class="smart-msg-bot">
      أهلاً! 👋 أنا مساعد البحث في منصة BassamIbrahim.<br>
      اسألني عن أي موضوع، أو اختر من الاقتراحات:
    </div>
  `;

  function resetChat() {
    messagesEl.innerHTML = WELCOME_HTML + buildSuggestionChips();
    bindChips();
  }

  const box = document.createElement('div');
  box.id = 'smart-chat-box';
  box.innerHTML = `
    <div id="smart-chat-header">
      <span>🤖 مساعد BassamIbrahim</span>
      <div style="display:flex;align-items:center;gap:8px;">
        <button id="smart-chat-clear" title="محادثة جديدة" style="background:none;border:none;color:white;font-size:16px;cursor:pointer;opacity:0.8;" title="محادثة جديدة">🔄</button>
        <button id="smart-chat-close" style="background:none;border:none;color:white;font-size:18px;cursor:pointer;">✕</button>
      </div>
    </div>
    <div id="smart-chat-messages">${WELCOME_HTML}${buildSuggestionChips()}</div>
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

  // ======= تحميل البيانات =======
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
        fetch(`data/${tab}.json?v=${APP_VERSION || '1.0'}`)
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
      const r = await fetch(`library_index.json?v=${APP_VERSION || '1.0'}`);
      if (r.ok) { const d = await r.json(); allLibraryFiles = d.files || []; }
    } catch(e) {}
    libraryLoaded = true;
  }

  // ======= ✅ بحث محسَّن مع دعم جذور الكلمات =======
  function normalize(str) {
    return (str || '').toLowerCase()
      .replace(/[أإآ]/g, 'ا')
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
    // بحث بكلمات منفردة
    const words = q.split(' ');
    let matched = 0;
    words.forEach(w => { if (w.length > 2 && t.includes(w)) matched++; });
    return matched / words.length;
  }

  function searchArticles(query) {
    return allArticles.map(a => {
      let score = 0;
      score += fuzzyMatch(a.title_ar || a.title || '', query) * 10;
      score += fuzzyMatch(a.title_en || '', query) * 8;
      (a.tags || []).forEach(tag => { score += fuzzyMatch(tag, query) * 6; });
      score += fuzzyMatch(a.content_ar || a.content || '', query) * 2;
      score += fuzzyMatch(a.content_en || '', query) * 1.5;
      return { ...a, score };
    }).filter(a => a.score > 0).sort((a, b) => b.score - a.score);
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

  // ======= إضافة وعرض الرسائل =======
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

  // ======= المعالج الرئيسي =======
  async function handleQuestion(question) {
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
        addMsg(`🤔 لم أجد نتيجة عن "<b>${question}</b>" حالياً.<br><br>
        💡 <b>جرّب:</b> صياغة مختلفة أو تصفح الأقسام من القائمة<br><br>
        📲 أو تواصل مباشرة:<br>
        <a href="https://wa.me/${WHATSAPP_NUMBER}?text=${enc}" target="_blank" class="whatsapp-link">💬 واتساب</a>`);
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
            📂 <span class="section-badge">${tab}</span>${btnName ? `← <b>${btnName}</b>` : ''}
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
            📂 <span class="section-badge">${tab}</span>${f.fileSize ? `📦 ${f.fileSize}` : ''}<br>
            <a href="${url}" target="_blank" rel="noopener noreferrer">⬇️ تحميل الملف</a>
          </div>`;
        });
      }

      addMsg(reply);
    }, 500);
  }

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