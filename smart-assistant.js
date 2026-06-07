// =============== المساعد الهجين - BassamIbrahim (v14.6 - إنتاجي آمن) ===============
(function () {
  'use strict';

  const WHATSAPP_NUMBER = '249967238251';
  const APP_VERSION     = '1.0.100';
  const AI_PROXY_URL    = 'https://bassam-portfolio-eight.vercel.app/api/gemini';
  const ANALYTICS_URL   = 'https://bassam-portfolio-eight.vercel.app/api/log-analytics';

  // ========== تعقيم HTML ==========
  // ✅ SEC: escapeHTML للنصوص العامة
  function escapeHTML(str) {
    return (str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // ✅ SEC: escapeAttr لقيم data-attributes
  function escapeAttr(str) {
    return (str || '')
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  // للردود التي تأتي من الخبير الخارجي فقط
  function sanitizeHTML(str) {
    const tmp = document.createElement('div');
    tmp.textContent = str;
    let t = tmp.innerHTML;
    t = t.replace(/&lt;(\/?)(b|br|strong|em|a|ul|ol|li|p|div|span|small)&gt;/gi, '<$1$2>');
    t = t.replace(/&lt;a\s+([^&]*?)&gt;/gi, (_, attrs) => {
      const da = attrs.replace(/&amp;/g, '&').replace(/&quot;/g, '"');
      return /href\s*=\s*["']https?:\/\//i.test(da) ? '<a ' + da + '>' : '';
    });
    return t;
  }

  // ========== تحميل البيانات ==========
  let knowledgeBase   = [];
  let allArticles     = [];
  let allLibraryFiles = [];
  let kbLoaded        = false;
  let articlesLoaded  = false;
  let libraryLoaded   = false;

  async function loadKB() {
    if (kbLoaded) return;
    try {
      const r = await fetch(`data/knowledge-base.json?v=${APP_VERSION}`);
      if (r.ok) {
        const d = await r.json();
        knowledgeBase = Array.isArray(d) ? d : (d.items || []);
      }
    } catch(e) {} finally { kbLoaded = true; }
  }

  async function loadArticles() {
    if (articlesLoaded) return;
    try {
      const tabs = ['engineering','political','nubian','academy','lifestyle'];
      const res  = await Promise.all(
        tabs.map(tab =>
          fetch(`data/${tab}.json?v=${APP_VERSION}`)
            .then(r => r.ok ? r.json() : []).catch(() => [])
            .then(arr => (Array.isArray(arr) ? arr : (arr.articles || []))
              .map(a => ({ ...a, _tab: tab })))
        )
      );
      allArticles = res.flat();
    } catch(e) { allArticles = []; } finally { articlesLoaded = true; }
  }

  async function loadLibrary() {
    if (libraryLoaded) return;
    try {
      const r = await fetch(`library_index.json?v=${APP_VERSION}`);
      if (r.ok) { const d = await r.json(); allLibraryFiles = d.files || d || []; }
    } catch(e) {} finally { libraryLoaded = true; }
  }

  async function loadAllData() {
    await Promise.all([loadKB(), loadArticles(), loadLibrary()]);
  }

  // ========== معالجة النصوص ==========
  function normalize(str) {
    return (str || '').toLowerCase()
      .replace(/[\u064B-\u065F\u0670]/g, '')
      .replace(/[أإآٱ]/g, 'ا')
      .replace(/ة/g, 'ه')
      .replace(/ى/g, 'ي')
      .replace(/[؟?!.,،؛:]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function fuzzyMatch(text, query) {
    const t = normalize(text), q = normalize(query);
    if (!t || !q) return 0;
    if (t.includes(q)) return 1;
    const words = q.split(' ').filter(w => w.length > 2);
    if (!words.length) return 0;
    let m = 0; words.forEach(w => { if (t.includes(w)) m++; });
    return m / words.length;
  }

  // ========== دوال مساعدة ==========
  function generateSessionId() {
    let id = localStorage.getItem('bassam_session_id');
    if (!id) {
      id = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('bassam_session_id', id);
    }
    return id;
  }

  // ========== إرسال التحليلات (بحد أقصى 10 أسئلة لكل زائر) ==========
  const MAX_QUESTIONS      = 10;
  const QUESTION_COUNT_KEY = 'bassam_q_count';

  async function logToSupabase(payload) {
    // ✅ حد أقصى 10 أسئلة لكل زائر — حماية الخطة المجانية
    let count = parseInt(localStorage.getItem(QUESTION_COUNT_KEY) || '0');
    if (count >= MAX_QUESTIONS) return;
    count++;
    localStorage.setItem(QUESTION_COUNT_KEY, count.toString());

    try {
      const ctrl = new AbortController();
      const t    = setTimeout(() => ctrl.abort(), 3000);
      await fetch(ANALYTICS_URL, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
        signal:  ctrl.signal
      });
      clearTimeout(t);
    } catch(e) {}
  }

  function classifyIntent(q) {
    const t = normalize(q);
    if (/خرسانه|اسمنت|حديد|انشاء|تصميم|مقاومه|هندس/.test(t)) return 'engineering';
    if (/سياسه|سودان|حرب|ثوره|انقلاب|حكومه/.test(t))          return 'political';
    if (/نوبه|مروي|كوش|نوبي|اثار|بجراويه/.test(t))             return 'nubian';
    if (/مشروع|منحه|قياده|تدريب|تطوير|اداره|اكاديميه/.test(t)) return 'academy';
    if (/صحه|تغذيه|سعرات|رياضه|دايت|وزن/.test(t))              return 'health';
    return 'general';
  }

  // ========== DARDAG — محرك المزاج ==========
  function detectMood(raw) {
    const q = raw.toLowerCase();
    if (/مستعجل|بسرعه|عاجل|الحين|فوري/.test(q))             return 'urgent';
    if (/زهقت|ملل|مو لاقي|ما لقيت|تعبت|ما في/.test(q))      return 'frustrated';
    if (/رائع|ممتاز|جميل|اعجبني|حلو|تحفه/.test(q))           return 'excited';
    if (/ضاقت|محتاجك|علشان خاطري|ساعدني/.test(q))            return 'needy';
    return 'neutral';
  }

  function moodPrefix(mood) {
    return { urgent:'⚡ <b>سريع عشانك!</b><br>', frustrated:'💙 <b>أفهمك، خليني أساعدك.</b><br>', excited:'🎉 <b>يلا! دعنا نبحث معاً.</b><br>', needy:'🫶 <b>أنا معك، تكرم عيونك.</b><br>', neutral:'' }[mood] || '';
  }

  // ========== واجهة المستخدم ==========
  const style = document.createElement('style');
  style.textContent = `
    #smart-assistant-btn{position:fixed;bottom:24px;right:24px;width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg,#3B9EFF,#60CFFF);border:none;color:white;font-size:24px;cursor:pointer;z-index:1000;box-shadow:0 4px 15px rgba(59,158,255,0.5);transition:all 0.3s ease;display:flex;align-items:center;justify-content:center;}
    #smart-assistant-btn:hover{transform:scale(1.1);box-shadow:0 6px 25px rgba(59,158,255,0.8);}
    @media(max-width:480px){#smart-assistant-btn{bottom:80px}}
    #smart-chat-box{position:fixed;bottom:90px;right:24px;width:360px;max-width:90vw;height:500px;max-height:70vh;background:#080c12;border:1px solid rgba(59,158,255,0.3);border-radius:16px;z-index:1000;display:none;flex-direction:column;overflow:hidden;box-shadow:0 10px 40px rgba(0,0,0,0.7)}
    @media(max-width:480px){#smart-chat-box{bottom:146px;right:12px;width:calc(100vw - 24px)}}
    #smart-chat-box.open{display:flex}
    #smart-chat-header{padding:12px 16px;background:linear-gradient(135deg,#3B9EFF,#60CFFF);color:white;font-weight:700;font-size:14px;font-family:'Cairo',sans-serif;display:flex;justify-content:space-between;align-items:center;flex-shrink:0}
    #smart-chat-messages{flex:1;padding:12px;overflow-y:auto;font-family:'Cairo',sans-serif;font-size:13px;color:#ccc;display:flex;flex-direction:column;gap:8px;scroll-behavior:smooth}
    #smart-chat-input-area{display:flex;border-top:1px solid rgba(255,255,255,0.1);padding:8px;gap:8px;flex-shrink:0}
    #smart-chat-input{flex:1;padding:10px 12px;border-radius:20px;border:1px solid rgba(255,255,255,0.15);background:rgba(255,255,255,0.05);color:white;font-family:'Cairo',sans-serif;font-size:12px;outline:none}
    #smart-chat-input:focus{border-color:rgba(59,158,255,0.5)}
    #smart-chat-send{padding:8px 16px;border-radius:20px;background:#3B9EFF;color:white;border:none;font-family:'Cairo',sans-serif;font-weight:700;font-size:12px;cursor:pointer;transition:background 0.2s}
    #smart-chat-send:hover{background:#2280dd}
    .smart-msg-bot{align-self:flex-start;background:rgba(59,158,255,0.12);border:1px solid rgba(59,158,255,0.2);padding:10px 14px;border-radius:12px;max-width:88%;line-height:1.7}
    .smart-msg-user{align-self:flex-end;background:rgba(234,179,8,0.15);border:1px solid rgba(234,179,8,0.3);padding:10px 14px;border-radius:12px;max-width:88%}
    .smart-result{background:rgba(255,255,255,0.04);border:1px solid rgba(59,158,255,0.25);border-radius:10px;padding:10px 12px;margin-bottom:8px;line-height:1.7}
    .smart-result b{color:#fff}
    .whatsapp-link{color:#25D366!important;font-weight:700;text-decoration:none;display:inline-block;margin-top:6px;padding:6px 14px;background:rgba(37,211,102,0.15);border:1px solid rgba(37,211,102,0.4);border-radius:20px}
    .expert-badge{border-left:4px solid #EAB308!important;background:rgba(234,179,8,0.08)!important}
    .suggestion-chips{display:flex;flex-wrap:wrap;gap:6px;padding:4px 0 8px}
    .suggestion-chip{font-size:11px;padding:6px 12px;border-radius:16px;background:rgba(59,158,255,0.15);color:#3B9EFF;border:1px solid rgba(59,158,255,0.35);cursor:pointer;font-family:'Cairo',sans-serif;transition:all 0.2s}
    .suggestion-chip:hover{background:rgba(59,158,255,0.35);color:#fff}
    .section-badge{display:inline-block;padding:2px 8px;border-radius:10px;font-size:10px;font-weight:700;margin-left:4px;background:rgba(59,158,255,0.2);color:#3B9EFF;border:1px solid rgba(59,158,255,0.3)}
    .history-hint{font-size:11px;color:#8899bb;padding:4px 0;border-top:1px solid rgba(255,255,255,0.06);margin-top:4px}
    .feedback-btns{display:flex;gap:8px;margin-top:8px;padding-top:8px;border-top:1px solid rgba(255,255,255,0.1)}
    .feedback-btn{font-size:18px;cursor:pointer;padding:4px 10px;border-radius:12px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.15);transition:all 0.2s}
    .feedback-btn:hover{background:rgba(59,158,255,0.2);border-color:#3B9EFF}
    .feedback-btn.active{background:rgba(59,158,255,0.3);border-color:#3B9EFF}
    .wa-btn{display:inline-flex;align-items:center;gap:8px;padding:10px 18px;border-radius:12px;background:linear-gradient(135deg,rgba(37,211,102,0.2),rgba(37,211,102,0.1));border:1px solid rgba(37,211,102,0.5);color:#25D366;font-family:'Cairo',sans-serif;font-weight:700;font-size:13px;text-decoration:none;margin-top:10px;transition:all 0.2s}
    .wa-btn:hover{background:linear-gradient(135deg,rgba(37,211,102,0.35),rgba(37,211,102,0.2));box-shadow:0 4px 15px rgba(37,211,102,0.3)}
  `;
  document.head.appendChild(style);

  const btn = document.createElement('button');
  btn.id = 'smart-assistant-btn';
  btn.title = 'ابحث في المنصة';
  btn.textContent = '💬';
  document.body.appendChild(btn);

  const TAB_NAMES = {
    engineering:'المنصة الهندسية', political:'الأرشيف السياسي',
    nubian:'نوبيان', academy:'الأكاديمية', lifestyle:'نمط الحياة والصحة'
  };
  const BUTTON_NAMES = {
    materials_science:'علوم المواد', construction_innovation:'ابتكار إنشائي',
    engineering_lab:'مختبر هندسي', sudan_history:'تاريخ السودان',
    strategic_analysis:'تحليل استراتيجي', intellectual_visions:'رؤى فكرية',
    history:'تاريخ', archaeology:'آثار', identity:'هوية',
    project_writing:'المشاريع', leadership:'القيادة والإدارة',
    developmental_training:'تدريب تنموي', holistic_health:'صحة شاملة',
    scientific_nutrition:'تغذية علمية', physical_excellence:'تميز بدني'
  };

  // ✅ FIX: fallback ثابت عند التحميل — لا تظهر قائمة فارغة أبداً
  const SUGGESTIONS_FALLBACK = [
    'الهندسة الإنشائية','تاريخ السودان','الحضارة النوبية','التغذية العلمية'
  ];

  function getSuggestions(count = 4) {
    const pool = [];
    if (allArticles.length > 0) {
      allArticles
        .map(a => a.title_ar || '')
        .filter(t => t.length > 3)
        .sort(() => Math.random() - 0.5)
        .slice(0, count + 2)
        .forEach(t => pool.push(t.length > 35 ? t.substring(0, 33) + '...' : t));
    }
    knowledgeBase
      .map(item => item.keywords?.[0] || '')
      .filter(kw => kw.length > 3 && kw.length < 40)
      .sort(() => Math.random() - 0.5)
      .slice(0, 2)
      .forEach(kw => pool.push(kw));

    const result = [...new Set(pool)].slice(0, count);
    // ✅ fallback إذا لا يوجد محتوى بعد
    return result.length >= 2 ? result : SUGGESTIONS_FALLBACK.slice(0, count);
  }

  // ✅ SEC: escapeAttr يمنع كسر data-attributes
  function buildChips(count = 4) {
    const qs = getSuggestions(count);
    if (!qs.length) return '';
    return '<div class="suggestion-chips">' +
      qs.map(q => `<button class="suggestion-chip" data-question="${escapeAttr(q)}">${escapeHTML(q)}</button>`).join('') +
      '</div>';
  }

  function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return 'صباح الخير! 🌅';
    if (h < 18) return 'مساء النور! 🌤️';
    return 'مساء الخير! 🌙';
  }

  const HISTORY_KEY = 'bassam_search_history';
  function saveHistory(q) {
    try {
      const h = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
      localStorage.setItem(HISTORY_KEY, JSON.stringify([q, ...h.filter(x => x !== q)].slice(0, 5)));
    } catch(e) {}
  }
  function getHistory() {
    try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); }
    catch(e) { return []; }
  }

  function buildWelcome() {
    const hist = getHistory();
    const hint = hist.length > 0
      ? `<div class="history-hint">🕐 آخر بحث: <b>${escapeHTML(hist[0])}</b></div>`
      : '';
    return `<div class="smart-msg-bot">${getGreeting()} أنا مساعد البحث في منصة BassamIbrahim.<br>اسألني عن أي موضوع، أو اختر من الاقتراحات:${hint}</div>`;
  }

  // ========== إنشاء الصندوق ==========
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
    <div id="smart-chat-messages">${buildWelcome()}${buildChips()}</div>
    <div id="smart-chat-input-area">
      <input type="text" id="smart-chat-input" placeholder="ابحث في المنصة..." />
      <button id="smart-chat-send">بحث</button>
    </div>
  `;
  document.body.appendChild(box);

  const closeBtn   = document.getElementById('smart-chat-close');
  const clearBtn   = document.getElementById('smart-chat-clear');
  const inputEl    = document.getElementById('smart-chat-input');
  const sendBtn    = document.getElementById('smart-chat-send');
  const messagesEl = document.getElementById('smart-chat-messages');

  function bindChips(container) {
    container.querySelectorAll('.suggestion-chip').forEach(chip => chip.replaceWith(chip.cloneNode(true)));
    container.querySelectorAll('.suggestion-chip').forEach(chip => {
      if (chip.dataset.question) {
        chip.addEventListener('click', function() { handleQuestion(this.dataset.question); });
      }
    });
  }
  bindChips(messagesEl);

  btn.addEventListener('click', () => {
    box.classList.toggle('open');
    if (box.classList.contains('open')) inputEl?.focus();
  });
  closeBtn.addEventListener('click', () => box.classList.remove('open'));
  clearBtn.addEventListener('click', () => {
    messagesEl.innerHTML = buildWelcome() + buildChips();
    bindChips(messagesEl);
    messagesEl.scrollTop = 0;
  });

  // ✅ debounce — يمنع الإرسال المتكرر
  let lastSentTime = 0;
  function submitQuestion() {
    if (Date.now() - lastSentTime < 800) return;
    lastSentTime = Date.now();
    const q = inputEl.value.trim();
    if (q) { handleQuestion(q); inputEl.value = ''; }
  }
  sendBtn.addEventListener('click', submitQuestion);
  inputEl.addEventListener('keydown', e => { if (e.key === 'Enter') submitQuestion(); });

  // ========== دوال البحث ==========
  function searchArticles(query) {
    const q     = normalize(query);
    if (!q || q.length < 2) return [];
    const words = q.split(' ').filter(w => w.length > 2);
    const academyBoostWords = ['تدريب','قياده','اداره','مشروع','منحه','تطوير','اكاديميه','تنموي','قدرات','مهاري'];

    return allArticles.map(a => {
      let score  = 0;
      const tAr  = normalize(a.title_ar || a.title || '');
      const tEn  = normalize(a.title_en || '');
      const cAr  = normalize(a.content_ar || a.content || '');
      const tags = (a.tags || []).map(t => normalize(t));

      if (tAr.includes(q)) score += 100;
      if (tEn.includes(q)) score += 80;
      tags.forEach(tag => {
        if (tag === q) score += 150;
        else if (tag.includes(q) || q.includes(tag)) score += 80;
      });
      if (cAr.includes(q)) score += 15;
      if (words.length >= 2) {
        if (tAr.includes(q))                   score += 200;
        if (cAr.includes(q))                   score += 60;
        if (words.every(w => tAr.includes(w))) score += 70;
        if (words.every(w => cAr.includes(w))) score += 25;
      }
      words.forEach(w => {
        if (tAr.includes(w)) score += 30;
        if (cAr.includes(w)) score += 5;
        tags.forEach(tag => { if (tag.includes(w)) score += 20; });
      });
      const fm = fuzzyMatch(tAr, q);
      if (fm > 0.8) score += 50; else if (fm > 0.6) score += 25;
      if (a._tab === 'academy' && academyBoostWords.some(w => q.includes(w))) score += 60;
      return { ...a, score };
    }).filter(a => a.score > 0).sort((a, b) => b.score - a.score);
  }

  function searchLibrary(query) {
    return allLibraryFiles.map(f => {
      let s = 0;
      s += fuzzyMatch(f.title_ar || f.title || '', query) * 10;
      s += fuzzyMatch(f.title_en || '', query) * 8;
      (f.tags || []).forEach(t => { s += fuzzyMatch(t, query) * 6; });
      s += fuzzyMatch(f.description_ar || '', query) * 3;
      return { ...f, score: s };
    }).filter(f => f.score > 0).sort((a, b) => b.score - a.score);
  }

  function getContentPreview(article, max = 180) {
    const c = article.content_ar || article.content || '';
    if (!c) return '';
    let plain = c.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    return escapeHTML(plain.length > max ? plain.substring(0, max) + '...' : plain);
  }

  // ✅ FIX: fuzzy بعتبة 0.8 آمنة — لا إجابات خاطئة
  function searchKB(query) {
    if (!query || knowledgeBase.length === 0) return null;
    const q = normalize(query);
    if (!q || q.length < 2) return null;
    for (const item of knowledgeBase) {
      for (const kw of item.keywords) { if (normalize(kw) === q) return item.answer; }
    }
    for (const item of knowledgeBase) {
      for (const kw of item.keywords) {
        const nk = normalize(kw);
        if (nk.length >= 4 && (q.includes(nk) || nk.includes(q))) return item.answer;
      }
    }
    let best = null, bestScore = 0;
    for (const item of knowledgeBase) {
      for (const kw of item.keywords) {
        const sc = fuzzyMatch(normalize(kw), q);
        if (sc >= 0.8 && sc > bestScore) { bestScore = sc; best = item; }
      }
    }
    return best ? best.answer : null;
  }

  // ========== ردود الإيموجي ==========
  // ✅ FIX: تعمل فقط إذا كان النص الفعلي (بدون إيموجي) ≤ 3 أحرف
  const EMOJI_REPLIES = [
    { emojis:['🥰','🫶','😍','❤️','💕','💖','😘','🌹'], reply:'🥰🫶 <b>تسلم!</b><br>أنا في خدمتك دايمًا. اسألني عن أي موضوع في المنصة.' },
    { emojis:['😂','🤣','😆','😅'],                       reply:'😂 <b>منور!</b><br>أتمنى تضحك دايمًا. إذا احتجت مساعدة في البحث، أنا جاهز!' },
    { emojis:['👍','👏','👌'],                             reply:'👍 <b>تسلم! من ذوقك!</b><br>أي سؤال تاني؟' },
    { emojis:['👎'],                                       reply:'👎 <b>آسف إذا قصرت.</b><br>تواصل مع بسام مباشرة وهو يساعدك أكثر.' },
    { emojis:['🤔','🧐'],                                  reply:'🤔 <b>بتفكر؟</b><br>اكتب سؤالك وأنا أبحث لك.' },
    { emojis:['🤝','🤜','🤛'],                             reply:'🤝 <b>يد بيد!</b><br>كيف أقدر أساعدك اليوم؟' },
    { emojis:['😢','😭','💔','🥲'],                        reply:'💙 <b>أنا معك.</b><br>إذا تحتاج أي مساعدة في المنصة، أنا هنا دايمًا.' },
    { emojis:['🎉','🎊','🥳'],                             reply:'🎉 <b>مبروك!</b><br>إذا تحتاج معلومات في المنصة، اسألني.' },
    { emojis:['😔','😞','😟'],                             reply:'💙 <b>إن شاء الله تكون بخير.</b><br>أنا هنا إذا احتجت أي شيء.' },
  ];

  function checkEmojiOnly(rawText) {
    // ✅ FIX: نستخدم \p{Emoji} لتغطية كل الإيموجيات بما فيها ❤️
    let textOnly;
    try {
      textOnly = rawText.replace(/\p{Emoji}/gu, '').trim();
    } catch(e) {
      textOnly = rawText.replace(/[\u{1F000}-\u{1FFFF}]/gu, '').trim();
    }
    if (textOnly.length > 3) return null;
    for (const item of EMOJI_REPLIES) {
      if (item.emojis.some(e => rawText.includes(e))) return item.reply;
    }
    return null;
  }

  // ========== الردود الثابتة ==========
  function isIntentMatch(qNorm, keywords) {
    return keywords.some(kw => qNorm.includes(normalize(kw)));
  }

  const CONTACT_BASSAM_KEYWORDS = [
    'كيف اتواصل مع بسام','ممكن تكلمني ببسام','احتاج احكي مع المؤسس',
    'هل يمكنني التواصل مع المهندس','تواصل مع بسام','كيف ابلغ بسام',
    'رقم بسام','واتساب بسام','ايميل بسام','كيف ابلغ المهندس',
    'ابغا اتواصل مع بسام','كيف اراسل بسام'
  ];

  const GREETING_REPLIES = [
    '😊 <b>أهلاً وسهلاً!</b><br><br>أنا مساعد البحث في منصة <b>BassamIbrahim</b>.<br>يمكنني مساعدتك في: الهندسة، السياسة السودانية، الحضارة النوبية، التطوير، والصحة.<br><br>💡 اكتب موضوعك وأنا أبحث لك!',
    '👋 <b>يا هلا والله!</b> نوّرت المنصة. أنا مساعد البحث هنا، جاهز أبحث لك في 50+ مقالة. اسألني عن أي موضوع!',
    '🌟 <b>مرحباً يا غالي!</b> أنا جاهز أبحث لك في كل أقسام المنصة. اسألني عن الهندسة، السياسة، النوبة، التطوير، أو الصحة.'
  ];

  const GRATITUDE_REPLIES = [
    '🥰 <b>العفو! تسلم لي!</b><br>أنا في خدمتك دايمًا.',
    '🫶 <b>من ذوقك! الشكر لله.</b><br>أي سؤال تاني؟ أنا جاهز.',
    '🤝 <b>تسلم يا غالي!</b><br>أنا سعيد إني قدرت أساعدك.',
    '👏 <b>شكراً على كلامك الجميل!</b><br>دايمًا في الخدمة.',
    '💙 <b>كتر خيرك يا معلم!</b><br>أي خدمة تانية، أنا موجود.',
    '🤲 <b>الله يعطيك العافية!</b><br>ما قصرت والله. إذا احتجت شيء، أنا هنا.'
  ];

  const FAREWELL_REPLIES = [
    '👋 <b>تصبح على خير!</b><br>وانت من اهل الخير 🥰',
    '💙 <b>في أمان الله!</b><br>في رعاية الله 🫶',
    '🫶 <b>مع السلامة!</b><br>الله يسلمك 🤝'
  ];

  const STATIC_REPLIES = {
    greeting: {
      keywords: [
        'مرحبا','اهلا','هلا','سلام','السلام عليكم','تحياتي','صباح الخير','مساء الخير',
        'كيف حالك','شلونك','ازيك','كيفك','هاي','تمام','ماشي','يلا',
        'حبيبي','يا صديقي','باشمهندس','اخبارك','كيف اخبارك','كيف الامور',
        'صباحو','مساءو','وينك','يا هلا والله','نورت','نورتنا',
        'كيفك اليوم','وين كنت','زمان ما شفتك'
      ],
      answer: null // عشوائي من GREETING_REPLIES
    },
    farewell: {
      keywords: [
        'مع السلامه','باي','bye','good bye','يلا سلام','يلا باي',
        'في امان الله','الله معاك','بروح','ماشي بروح','تصبح على خير'
      ],
      answer: null // عشوائي من FAREWELL_REPLIES
    },
    assistant_identity: {
      keywords: [
        'من انت','انت منو','عرفني عليك','انت بوت ولا انسان',
        'هل انت ذكاء اصطناعي','من صنعك','من برمجك','كيف تعمل','شو اسمك','ما اسمك'
      ],
      answer: '🤖 <b>أنا مساعد BassamIbrahim الذكي!</b><br><br>أنا بوت (ذكاء اصطناعي) متخصص في البحث داخل محتوى المنصة.<br>أقدر أبحث في <b>50+ مقالة</b> عبر 5 أقسام، وأجيب على أسئلتك، وألخص المقالات، وأوصلك بالمهندس <b>بسام</b> مباشرة.'
    },
    about_bassam: {
      keywords: [
        'من هو بسام','بسام ابراهيم','صاحب الموقع','مطور الموقع',
        'نبذه عنك','عن بسام','من يكون','عرف بنفسك',
        'من هو مؤسس المنصه','منو اسس المنصه','مؤسس الموقع'
      ],
      answer: '👷‍♂️ <b>بسام إبراهيم أحمد</b> — مهندس مدني سوداني، باحث في الشأن السوداني، ناشط مجتمعي ومهتم بالابتكار الهندسي.<br><br>مؤمن بأن التخصص الحقيقي يمنح صاحبه مفاتيح لفهم العالم بطرق متعددة. هذه المنصة هي نافذته الرقمية لنشر العلم في خمسة مجالات.'
    },
    about_platform: {
      keywords: [
        'ما هذا الموقع','عن الموقع','ما هي المنصه','هدف الموقع','هدف المنصه',
        'غرض الموقع','فكره الموقع','اخبرني عن المنصه','الزبده','الزيت',
        'ما الهدف من تاسيس المنصه','لماذا تم تاسيس المنصه','سبب انشاء المنصه'
      ],
      answer: '🌐 <b>منصة BassamIbrahim الرقمية</b> — منصة سودانية مستقلة غير ربحية في خمسة مجالات:<br><br>🏗️ <b>المنصة الهندسية</b> — علوم المواد، ابتكار إنشائي، مختبر هندسي<br>🏛️ <b>الأرشيف السياسي</b> — تاريخ السودان، تحليل استراتيجي<br>🏺 <b>نوبيان</b> — الحضارة النوبية، التاريخ، الآثار<br>📚 <b>الأكاديمية</b> — المشاريع، القيادة، التدريب التنموي<br>🌿 <b>نمط الحياة</b> — الصحة، التغذية، التميز البدني'
    },
    how_to_use: {
      keywords: [
        'كيف استخدم الموقع','كيف ابحث في الموقع','كيف ابحث في المنصه',
        'طريقه استخدام الموقع','دليل الاستخدام','كيف اتصفح الموقع'
      ],
      answer: '💡 <b>كيف تستخدم المنصة:</b><br><br>1️⃣ تصفح الأقسام من القائمة العلوية أو اضغط ☰<br>2️⃣ اختر القسم واضغط على الزر المناسب<br>3️⃣ استخدم خانة البحث داخل القسم<br>4️⃣ اضغط 📚 للوصول للمكتبة الرقمية<br>5️⃣ اسألني أنا (💬) للبحث في كل المحتوى دفعة واحدة'
    },
    help_request: {
      keywords: [
        'ممكن تساعدني','بتقدر تساعدني','كيف يمكنك مساعدتي','هل يمكنك مساعدتي',
        'احتاج مساعدتك','كيف تقدر تساعدني','ضاقت بيا','محتاجك','علشان خاطري',
        'ساعدني الله يخليك','محتاجك ضروري','الله يرضى عليك ساعدني'
      ],
      answer: '🤝 <b>طبعًا! أنا هنا عشانك.</b><br><br>أقدر:<br>✅ أبحث في <b>50+ مقالة</b> عبر 5 أقسام<br>✅ أجيب على أسئلتك من قاعدة المعرفة<br>✅ ألخص المقالات بالذكاء الاصطناعي<br>✅ أوصلك بـ <b>بسام</b> مباشرة<br><br>💡 <b>اكتب سؤالك وأنا أتصرف فورًا!</b>'
    },
    gratitude: {
      keywords: [
        'شكرا','شاكر لك','اشكرك','انت رائع','انت ممتاز','يعطيك العافيه',
        'تسلم','مشكور','يسلمو','كتر خيرك','ما قصرت','الله يعطيك العافيه',
        'ربنا يبارك فيك','تاج راسي','جزاك الله خير','ما قصرت والله'
      ],
      answer: null // عشوائي من GRATITUDE_REPLIES
    },
    sections: {
      keywords: ['اقسام الموقع','ما هي اقسام الموقع','ماهي اقسام الموقع','عرفني علي اقسام الموقع'],
      answer: '📂 <b>أقسام منصة BassamIbrahim:</b><br><br>1️⃣ <b>المنصة الهندسية</b> — علوم المواد، ابتكار إنشائي، مختبر هندسي<br>2️⃣ <b>الأرشيف السياسي</b> — تاريخ السودان، تحليل استراتيجي، رؤى فكرية<br>3️⃣ <b>نوبيان</b> — الحضارة النوبية، التاريخ، الآثار، الهوية<br>4️⃣ <b>الأكاديمية</b> — المشاريع، القيادة والإدارة، التدريب التنموي<br>5️⃣ <b>نمط الحياة والصحة</b> — صحة شاملة، تغذية علمية، تميز بدني<br><br>💡 أي قسم يثير فضولك؟ اكتب اسمه وأبحث لك!'
    },
    start_here: {
      keywords: ['كيف ابدا','من اين ابدا','كيف يمكنني البدء','من وين ابدا','من اين اقرا'],
      answer: '🌟 <b>خليني أرشدك:</b><br><br>🏗️ <b>مهتم بالهندسة؟</b> ابدأ بـ "علوم المواد"<br>🏛️ <b>مهتم بالسياسة؟</b> اقرأ "تاريخ السودان"<br>🏺 <b>مهتم بالحضارة؟</b> استكشف "مملكة مروي"<br>📚 <b>مهتم بالتطوير؟</b> تعلم "القيادة والإدارة"<br>🌿 <b>مهتم بالصحة؟</b> اقرأ "التغذية العلمية"<br><br>💡 أخبرني أي مجال وأرشح لك أفضل المقالات!'
    },
    sudanese_social: {
      keywords: [
        'عامل ايه','شو اخبارك','مشتاق','صاحبي','يا زول',
        'يا زلمه','يا خوي','يا معلم','يا كبير','يا باشا','يا حليلك'
      ],
      answer: '😄 <b>كلو تمام والحمدلله!</b><br><br>أنا دايمًا هنا في الخدمة. اسألني عن أي موضوع في المنصة وأنا جاهز! 🤝'
    },
    encouragement: {
      // ✅ كلمات أطول للتمييز عن أسئلة البحث
      keywords: ['ما فهمت عليك','الموضوع صعب علي','مو واضح ليا','محتاج شرح اكثر','ابسط لي الموضوع','اشرح لي بطريقه ثانيه'],
      answer: '💡 <b>لا بأس، خليني أبسط لك!</b><br><br>يمكنك سؤالي بأي طريقة، وأنا أبحث لك في المنصة وأجيب بأبسط شكل ممكن.<br>جرّب واكتب موضوعك! 🙂'
    },
    personal_questions: {
      // ✅ عبارات كاملة لا كلمات منفردة تتعارض مع البحث
      keywords: [
        'كم عمرك','هل انت متجوز','هل عندك زوجه','هل تحبني','هل انت حقيقي',
        'هل انت انسان','انت ذكر ولا انثى','وين ساكن','هل عندك مشاعر',
        'هل تشعر','هل تحس','شنو هواياتك'
      ],
      answer: '😄 <b>أنا مساعد ذكي، مش إنسان!</b><br>لا عمري ولا ساكن ولا باكل 🥲<br><br>لكن أقدر أساعدك في البحث في المنصة! اسألني عن الهندسة، السياسة، النوبة، التطوير، أو الصحة.'
    },
    jokes_fun: {
      keywords: ['احكي نكته','قول نكته','عندك نكت','غني لي','قول اغنيه','اكتب شعر'],
      answer: '😄 <b>أنا ما عندي نكت، بس عندي مقالات حلوة!</b><br><br>جرّب تسألني عن "تاريخ السودان" أو "علوم المواد" أو "الحضارة النوبية"!'
    },
    capabilities: {
      keywords: [
        'شنو تقدر تعمل','ايش تعرف تسوي','شنو عندك معلومات',
        'ايش يمكنك فعله','ما هي قدراتك','ماذا تستطيع ان تفعل'
      ],
      answer: '🤖 <b>أقدر أساعدك في:</b><br><br>✅ البحث في <b>50+ مقالة</b> عبر 5 أقسام<br>✅ الإجابة على أسئلتك من قاعدة المعرفة<br>✅ تلخيص المقالات بالذكاء الاصطناعي<br>✅ توصيلك بـ <b>بسام</b> مباشرة<br><br>💡 اكتب موضوعك وأنا أتصرف فوراً!'
    },
    whats_new: {
      keywords: [
        'شنو الجديد','في جديد في المنصه','ايش الجديد','شو المواضيع الجديده',
        'شنو اخر المقالات','ايش في مقالات جديده'
      ],
      answer: '🌟 <b>عندي كنوز من المقالات!</b><br><br>في 5 أقسام: الهندسة، السياسة، الحضارة النوبية، التطوير، والصحة.<br><br>اسألني عن أي موضوع وأنا أبحث لك فوراً!'
    },
    dissatisfaction: {
      // ✅ عبارات كاملة فقط — لا كلمات منفردة كـ"سيء" أو "فاشل"
      keywords: [
        'الجواب ما عجبني','الرد ما كان مفيد','انت ما بتفهم شي',
        'ما قدرت تساعدني','الموضوع ما اتحل','ما حليت مشكلتي'
      ],
      answer: '💙 <b>آسف إذا ما قدرت أساعدك بالشكل المطلوب.</b><br><br>جرّب تسألني بطريقة مختلفة، أو تواصل مع بسام مباشرة وهو حيساعدك.'
    }
  };

  function checkStaticReply(qNorm) {
    for (const [key, data] of Object.entries(STATIC_REPLIES)) {
      if (isIntentMatch(qNorm, data.keywords)) {
        if (key === 'greeting')  return GREETING_REPLIES[Math.floor(Math.random() * GREETING_REPLIES.length)];
        if (key === 'gratitude') return GRATITUDE_REPLIES[Math.floor(Math.random() * GRATITUDE_REPLIES.length)];
        if (key === 'farewell')  return FAREWELL_REPLIES[Math.floor(Math.random() * FAREWELL_REPLIES.length)];
        return data.answer;
      }
    }
    return null;
  }

  function buildContactBassam() {
    return `📲 <b>للتواصل المباشر مع المهندس بسام إبراهيم:</b><br><br>
      <a href="https://wa.me/${WHATSAPP_NUMBER}" target="_blank" rel="noopener noreferrer" class="wa-btn">
        <svg viewBox="0 0 24 24" fill="currentColor" style="width:18px;height:18px;flex-shrink:0"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347"/></svg>
        راسل بسام على واتساب
      </a>
      <br><small style="color:#8899bb;font-size:11px;">عادةً ما يرد خلال ساعات قليلة.</small>`;
  }

  // ========== إضافة رسالة ==========
  function addMsg(html, isUser = false, showFeedback = false, question = '', results = 0, startTime = 0) {
    const div = document.createElement('div');
    div.className = isUser ? 'smart-msg-user' : 'smart-msg-bot';
    div.innerHTML = html;
    bindChips(div);

    if (showFeedback && !isUser) {
      const fb = document.createElement('div');
      fb.className = 'feedback-btns';
      fb.innerHTML = '<span style="font-size:10px;color:#8899bb;align-self:center;">هل كانت الإجابة مفيدة؟</span><button class="feedback-btn feedback-yes">👍</button><button class="feedback-btn feedback-no">👎</button>';
      div.appendChild(fb);
      const sendFB = (val) => logToSupabase({
        session_id: generateSessionId(), question,
        intent: classifyIntent(question), results_count: results,
        response_time_ms: startTime ? Math.round(performance.now() - startTime) : null,
        // ✅ FIX: لا نرسل user_agent كاملاً — فئة فقط
        platform: /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
        was_helpful: val
      });
      fb.querySelector('.feedback-yes').addEventListener('click', function() {
        this.classList.add('active'); fb.querySelector('.feedback-no').classList.remove('active'); sendFB(true);
      });
      fb.querySelector('.feedback-no').addEventListener('click', function() {
        this.classList.add('active'); fb.querySelector('.feedback-yes').classList.remove('active'); sendFB(false);
      });
    }

    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return div;
  }

  // ========== الخبير الذكي ==========
  async function askExpert(question, articles) {
    let context = '';
    if (articles && articles.length > 0) {
      context = articles.slice(0, 3)
        .map(a => `عنوان: ${a.title_ar || ''}\nمحتوى: ${(a.content_ar || a.content || '').substring(0, 300)}`)
        .join('\n---\n');
    }
    try {
      const r = await fetch(AI_PROXY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, context })
      });
      const d = await r.json();
      if (d.reply && d.reply.length > 50) return sanitizeHTML(d.reply);
      return sanitizeHTML(d.reply || '');
    } catch(e) { return '⚠️ تعذر الوصول للخبير حالياً. حاول مرة أخرى.'; }
  }

  // ========== المعالج الرئيسي ==========
  async function handleQuestion(question) {
    const start = performance.now();
    saveHistory(question);
    addMsg(escapeHTML(question), true); // ✅ SEC: المستخدم يرى رسالته معقَّمة

    const typing = addMsg('⏳ جاري البحث...', false, false);
    await Promise.race([loadAllData(), new Promise(r => setTimeout(r, 5000))]);
    typing.remove();

    const mood = detectMood(question);
    // ✅ FIX: moodPfx للبحث والـ fallback فقط — لا يُدمج مع KB والردود الثابتة
    const moodPfxSearch = moodPrefix(mood);

    const logBase = {
      session_id: generateSessionId(),
      question,
      intent:   classifyIntent(question),
      platform: /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop'
      // ✅ FIX: حذف user_agent الكامل
    };

    // ── 1. إيموجي فقط ──────────────────────────────────────────────
    const emojiReply = checkEmojiOnly(question);
    if (emojiReply) {
      logToSupabase({ ...logBase, results_count:1, response_time_ms:Math.round(performance.now()-start), response_type:'emoji', articles_found:0, library_files_found:0, kb_match:false, expert_used:false });
      addMsg(emojiReply, false, true, question, 1, start);
      return;
    }

    const qNorm = normalize(question);

    // ── 2. التواصل مع بسام ─────────────────────────────────────────
    if (CONTACT_BASSAM_KEYWORDS.some(kw => qNorm.includes(normalize(kw)))) {
      logToSupabase({ ...logBase, results_count:1, response_time_ms:Math.round(performance.now()-start), response_type:'contact', articles_found:0, library_files_found:0, kb_match:false, expert_used:false });
      addMsg(buildContactBassam(), false, false, question, 1, start);
      return;
    }

    // ── 3. قاعدة المعرفة ───────────────────────────────────────────
    const kbAns = searchKB(question);
    if (kbAns) {
      logToSupabase({ ...logBase, results_count:1, response_time_ms:Math.round(performance.now()-start), response_type:'kb', articles_found:0, library_files_found:0, kb_match:true, expert_used:false });
      addMsg(kbAns, false, true, question, 1, start); // ✅ بدون moodPfx — KB مصاغ بعناية
      return;
    }

    // ── 4. الردود الثابتة ──────────────────────────────────────────
    const staticAns = checkStaticReply(qNorm);
    if (staticAns) {
      logToSupabase({ ...logBase, results_count:1, response_time_ms:Math.round(performance.now()-start), response_type:'static', articles_found:0, library_files_found:0, kb_match:false, expert_used:false });
      addMsg(staticAns, false, true, question, 1, start); // ✅ بدون moodPfx — ردود مصاغة مسبقاً
      return;
    }

    // ── 5. البحث في المقالات والمكتبة ─────────────────────────────
    const articles = searchArticles(question).slice(0, 3);
    const files    = searchLibrary(question).slice(0, 3);
    const total    = articles.length + files.length;

    logToSupabase({ ...logBase, results_count:total, response_time_ms:Math.round(performance.now()-start), response_type:total>0?'articles':'fallback', articles_found:articles.length, library_files_found:files.length, kb_match:false, expert_used:false });

    // ✅ moodPfx هنا فقط — على نتائج البحث والـ fallback
    let reply = moodPfxSearch;

    if (articles.length) {
      reply += `<b>📰 مقالات ذات صلة (${articles.length}):</b><br><br>`;
      articles.forEach(a => {
        const title   = escapeHTML(a.title_ar || a.title || 'بدون عنوان');
        const tab     = escapeHTML(TAB_NAMES[a._tab] || a._tab || '');
        const btnName = escapeHTML(BUTTON_NAMES[a.button] || '');
        const preview = getContentPreview(a); // ✅ معقَّم داخل getContentPreview
        reply += `<div class="smart-result">
          📰 <b>${title}</b><br>
          📂 <span class="section-badge">${tab}</span>${btnName ? ` ← <b>${btnName}</b>` : ''}
          ${preview ? `<br><small style="color:#aaa;font-size:11px;">${preview}</small>` : ''}
        </div>`;
      });
      reply += `<div style="margin-top:12px;">
        <button class="suggestion-chip ask-expert-btn" style="border-color:#EAB308;color:#EAB308;">✨ اسأل الخبير لتلخيص هذه النتائج</button>
      </div>`;
    }

    if (files.length) {
      reply += `<b>📚 ملفات من المكتبة (${files.length}):</b><br><br>`;
      files.forEach(f => {
        const title = escapeHTML(f.title_ar || f.title || 'بدون عنوان');
        const tab   = escapeHTML(TAB_NAMES[f.category] || '');
        const url   = `https://raw.githubusercontent.com/bassamibrahim249/bassam-portfolio/main/${encodeURIComponent(f.filePath || '')}`;
        const size  = f.fileSize ? escapeHTML(f.fileSize) : '';
        reply += `<div class="smart-result">
          📁 <b>${title}</b><br>
          📂 <span class="section-badge">${tab}</span>${size ? ` 📦 ${size}` : ''}<br>
          <a href="${url}" target="_blank" rel="noopener noreferrer" style="color:#60CFFF;font-weight:bold;">⬇️ تحميل الملف المباشر</a>
        </div>`;
      });
    }

    if (!articles.length && !files.length) {
      // ✅ SEC: question معقَّم قبل الدمج في HTML
      const safeQ = escapeHTML(question);
      const enc   = encodeURIComponent(question);
      const suggs = getSuggestions(3);
      reply = `${moodPfxSearch}🤔 لم أجد نتيجة عن "<b>${safeQ}</b>" في المقالات أو المكتبة.
        <div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap;">
          <button class="suggestion-chip ask-general-ai" style="background:#EAB308;color:#000;border:none;font-weight:bold;">🧠 اسأل الخبير العام</button>
          <a href="https://wa.me/${WHATSAPP_NUMBER}?text=${enc}" target="_blank" class="whatsapp-link">💬 تواصل مع بسام</a>
        </div>
        ${suggs.length ? `<div style="margin-top:8px;font-size:11px;color:#8899bb;">💡 <b>اقتراحات:</b> ${suggs.map(s => `<button class="suggestion-chip" data-question="${escapeAttr(s)}">${escapeHTML(s)}</button>`).join(' ')}</div>` : ''}`;
    }

    const node = addMsg(reply, false, true, question, total, start);

    const expertBtn = node.querySelector('.ask-expert-btn');
    if (expertBtn) {
      expertBtn.addEventListener('click', async function() {
        this.disabled = true; this.textContent = '⏳ جاري التلخيص...';
        const ans = await askExpert(question, articles);
        logToSupabase({ ...logBase, results_count:total, response_time_ms:Math.round(performance.now()-start), response_type:'expert', articles_found:articles.length, library_files_found:files.length, kb_match:false, expert_used:true });
        addMsg(`<div class="smart-result expert-badge">🧠 <b>تلخيص الخبير:</b><br>${ans}<br><small style="color:#8899bb;font-size:11px;">💡 المقال الكامل يحتوي على تفاصيل أكثر.</small></div>`);
        this.style.display = 'none';
      });
    }

    const generalAI = node.querySelector('.ask-general-ai');
    if (generalAI) {
      generalAI.addEventListener('click', async function() {
        this.disabled = true; this.textContent = '⏳ جاري تفكير الخبير...';
        const ans = await askExpert(question, []);
        logToSupabase({ ...logBase, results_count:0, response_time_ms:Math.round(performance.now()-start), response_type:'expert', articles_found:0, library_files_found:0, kb_match:false, expert_used:true });
        addMsg(`<div class="smart-result expert-badge">🧠 <b>يقول الخبير العام:</b><br>${ans}</div>`);
        this.style.display = 'none';
      });
    }
  }

  // ✅ تحميل مبكر في الخلفية — أول بحث يكون فورياً
  loadAllData();

})();
