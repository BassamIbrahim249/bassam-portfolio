// =============== المساعد الهجين - BassamIbrahim (v13.6 - إصلاح KB جذري) ===============
(function() {
  const WHATSAPP_NUMBER = '249967238251';
  const APP_VERSION = '1.0.100';
  const AI_PROXY_URL = 'https://bassam-portfolio-eight.vercel.app/api/gemini';
  const ANALYTICS_URL = '/api/log-analytics';

  // ========== أداة تعقيم بسيطة ==========
  function sanitizeHTML(str) {
    const temp = document.createElement('div');
    temp.textContent = str;
    let text = temp.innerHTML;
    text = text.replace(/&lt;(\/?)(b|br|strong|em|a|ul|ol|li|p|div|span|small)&gt;/gi, '<$1$2>');
    text = text.replace(/&lt;a\s+([^&]*?)&gt;/gi, (match, attrs) => {
      const decodedAttrs = attrs.replace(/&amp;/g, '&').replace(/&quot;/g, '"');
      if (/href\s*=\s*["']https?:\/\//i.test(decodedAttrs)) return '<a ' + decodedAttrs + '>';
      return '';
    });
    return text;
  }

  // ========== تحميل البيانات (طريقة جديدة تماماً) ==========
  let knowledgeBase = [];
  let allArticles = [];
  let allLibraryFiles = [];
  let dataLoaded = false;

  async function loadAllData() {
    if (dataLoaded) return;
    try {
      const [kbRes, articlesRes] = await Promise.all([
        fetch(`data/knowledge-base.json?v=${APP_VERSION}`),
        Promise.all(['engineering','political','nubian','academy','lifestyle'].map(tab =>
          fetch(`data/${tab}.json?v=${APP_VERSION}`).then(r => r.ok ? r.json() : []).catch(() => [])
        ))
      ]);
      if (kbRes.ok) knowledgeBase = await kbRes.json();
      allArticles = articlesRes.flat();
      dataLoaded = true;
      console.log('✅ All data loaded: KB=' + knowledgeBase.length + ', Articles=' + allArticles.length);
    } catch(e) {
      console.warn('⚠️ Data load failed, retrying in 1s...');
      await new Promise(r => setTimeout(r, 1000));
      return loadAllData(); // إعادة المحاولة مرة واحدة
    }
  }

  function loadLibrary() {
    if (allLibraryFiles.length > 0) return;
    fetch(`library_index.json?v=${APP_VERSION}`)
      .then(r => r.json())
      .then(d => { allLibraryFiles = d.files || []; })
      .catch(() => {});
  }

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

  // ========== دوال مساعدة ==========
  function generateSessionId() {
    let id = localStorage.getItem('bassam_session_id');
    if (!id) {
      id = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('bassam_session_id', id);
    }
    return id;
  }

  async function logToSupabase(payload) {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 3000);
      await fetch(ANALYTICS_URL, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload), signal:ctrl.signal });
      clearTimeout(timer);
    } catch(e) {}
  }

  function classifyIntent(q) {
    const t = normalize(q);
    if (/خرسانة|إسمنت|حديد|إنشاء|تصميم|مقاومة|هندس/.test(t)) return 'engineering';
    if (/سياسة|سودان|حرب|ثورة|انقلاب|حكومة/.test(t)) return 'political';
    if (/نوبة|مروي|كوش|نوبي|آثار|بجراوية/.test(t)) return 'nubian';
    if (/مشروع|منحة|قيادة|تدريب|تطوير|إدارة/.test(t)) return 'academy';
    if (/صحة|تغذية|سعرات|رياضة|دايت|وزن/.test(t)) return 'health';
    return 'general';
  }

  // ========== واجهة المستخدم ==========
  const style = document.createElement('style');
  style.textContent = `#smart-assistant-btn{position:fixed;bottom:24px;right:24px;width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg,#3B9EFF,#60CFFF);border:none;color:white;font-size:24px;cursor:pointer;z-index:1000;box-shadow:0 4px 15px rgba(59,158,255,0.5);transition:all 0.3s ease;display:flex;align-items:center;justify-content:center;}#smart-assistant-btn:hover{transform:scale(1.1);box-shadow:0 6px 25px rgba(59,158,255,0.8);}@media(max-width:480px){#smart-assistant-btn{bottom:80px}}#smart-chat-box{position:fixed;bottom:90px;right:24px;width:360px;max-width:90vw;height:500px;max-height:70vh;background:#080c12;border:1px solid rgba(59,158,255,0.3);border-radius:16px;z-index:1000;display:none;flex-direction:column;overflow:hidden;box-shadow:0 10px 40px rgba(0,0,0,0.7)}@media(max-width:480px){#smart-chat-box{bottom:146px;right:12px;width:calc(100vw - 24px)}}#smart-chat-box.open{display:flex}#smart-chat-header{padding:12px 16px;background:linear-gradient(135deg,#3B9EFF,#60CFFF);color:white;font-weight:700;font-size:14px;font-family:'Cairo',sans-serif;display:flex;justify-content:space-between;align-items:center;flex-shrink:0}#smart-chat-messages{flex:1;padding:12px;overflow-y:auto;font-family:'Cairo',sans-serif;font-size:13px;color:#ccc;display:flex;flex-direction:column;gap:8px;scroll-behavior:smooth}#smart-chat-input-area{display:flex;border-top:1px solid rgba(255,255,255,0.1);padding:8px;gap:8px;flex-shrink:0}#smart-chat-input{flex:1;padding:10px 12px;border-radius:20px;border:1px solid rgba(255,255,255,0.15);background:rgba(255,255,255,0.05);color:white;font-family:'Cairo',sans-serif;font-size:12px;outline:none}#smart-chat-input:focus{border-color:rgba(59,158,255,0.5)}#smart-chat-send{padding:8px 16px;border-radius:20px;background:#3B9EFF;color:white;border:none;font-family:'Cairo',sans-serif;font-weight:700;font-size:12px;cursor:pointer;transition:background 0.2s}#smart-chat-send:hover{background:#2280dd}.smart-msg-bot{align-self:flex-start;background:rgba(59,158,255,0.12);border:1px solid rgba(59,158,255,0.2);padding:10px 14px;border-radius:12px;max-width:88%;line-height:1.7}.smart-msg-user{align-self:flex-end;background:rgba(234,179,8,0.15);border:1px solid rgba(234,179,8,0.3);padding:10px 14px;border-radius:12px;max-width:88%}.smart-result{background:rgba(255,255,255,0.04);border:1px solid rgba(59,158,255,0.25);border-radius:10px;padding:10px 12px;margin-bottom:8px;line-height:1.7}.smart-result b{color:#fff}.whatsapp-link{color:#25D366!important;font-weight:700;text-decoration:none;display:inline-block;margin-top:6px;padding:6px 14px;background:rgba(37,211,102,0.15);border:1px solid rgba(37,211,102,0.4);border-radius:20px}.expert-badge{border-left:4px solid #EAB308!important;background:rgba(234,179,8,0.08)!important}.suggestion-chips{display:flex;flex-wrap:wrap;gap:6px;padding:4px 0 8px}.suggestion-chip{font-size:11px;padding:6px 12px;border-radius:16px;background:rgba(59,158,255,0.15);color:#3B9EFF;border:1px solid rgba(59,158,255,0.35);cursor:pointer;font-family:'Cairo',sans-serif;transition:all 0.2s}.suggestion-chip:hover{background:rgba(59,158,255,0.35);color:#fff}.section-badge{display:inline-block;padding:2px 8px;border-radius:10px;font-size:10px;font-weight:700;margin-left:4px;background:rgba(59,158,255,0.2);color:#3B9EFF;border:1px solid rgba(59,158,255,0.3)}.history-hint{font-size:11px;color:#8899bb;padding:4px 0;border-top:1px solid rgba(255,255,255,0.06);margin-top:4px}.feedback-btns{display:flex;gap:8px;margin-top:8px;padding-top:8px;border-top:1px solid rgba(255,255,255,0.1)}.feedback-btn{font-size:18px;cursor:pointer;padding:4px 10px;border-radius:12px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.15);transition:all 0.2s}.feedback-btn:hover{background:rgba(59,158,255,0.2);border-color:#3B9EFF}.feedback-btn.active{background:rgba(59,158,255,0.3);border-color:#3B9EFF}`;
  document.head.appendChild(style);

  const btn = document.createElement('button');
  btn.id = 'smart-assistant-btn';
  btn.title = 'ابحث في المنصة';
  btn.textContent = '💬';
  document.body.appendChild(btn);

  const TAB_NAMES = { engineering:'المنصة الهندسية', political:'الأرشيف السياسي', nubian:'نوبيان', academy:'الأكاديمية', lifestyle:'نمط الحياة والصحة' };
  const BUTTON_NAMES = { materials_science:'علوم المواد', construction_innovation:'ابتكار إنشائي', engineering_lab:'مختبر هندسي', sudan_history:'تاريخ السودان', strategic_analysis:'تحليل استراتيجي', intellectual_visions:'رؤى فكرية', history:'تاريخ', archaeology:'آثار', identity:'هوية', project_writing:'المشاريع', leadership:'القيادة والإدارة', developmental_training:'تدريب تنموي', holistic_health:'صحة شاملة', scientific_nutrition:'تغذية علمية', physical_excellence:'تميز بدني' };

  const STATIC_SUGGESTIONS = ['ما هي علوم المواد؟','كيف أكتب مشروعاً ناجحاً؟','ما هي مملكة مروي؟','كيف أحسن تغذيتي؟','ما هي الحضارة النوبية؟','كيف أبحث في المنصة؟','ما هي المكتبة الرقمية؟','كيف أطور مهارات القيادة والإدارة؟','من هو بسام إبراهيم؟','ما هي أقسام الموقع؟','كيف أتواصل مع بسام؟','ما هو الابتكار الإنشائي؟','كيف أحقق التميز البدني؟','ما هي الآثار النوبية؟','كيف أكتب منحة دراسية؟','ما هي الصحة الشاملة؟','ما هو التحليل الاستراتيجي؟','ما هي فراعنة السودان؟','ما أقسام الأكاديمية؟','كيف أستخدم المنصة؟'];

  function getSuggestions() {
    if (allArticles.length === 0) return STATIC_SUGGESTIONS.slice(0, 4);
    const titles = allArticles.map(a => a.title_ar || '').filter(t => t.length > 5).sort(() => Math.random() - 0.5).slice(0, 3);
    return [...new Set([...titles, STATIC_SUGGESTIONS[Math.floor(Math.random() * STATIC_SUGGESTIONS.length)] ])].slice(0, 4);
  }

  function buildChips() {
    return '<div class="suggestion-chips">' + getSuggestions().map(q => `<button class="suggestion-chip" data-question="${q}">${q}</button>`).join('') + '</div>';
  }

  function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return 'صباح الخير! 🌅';
    if (h < 18) return 'مساء النور! 🌤️';
    return 'مساء الخير! 🌙';
  }

  const HISTORY_KEY = 'bassam_search_history';
  function saveHistory(q) { try { const h = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); const u = [q, ...h.filter(x => x !== q)].slice(0, 5); localStorage.setItem(HISTORY_KEY, JSON.stringify(u)); } catch(e) {} }
  function getHistory() { try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); } catch(e) { return []; } }

  function buildWelcome() {
    const g = getGreeting();
    const hist = getHistory();
    const hint = hist.length > 0 ? `<div class="history-hint">🕐 آخر بحث: <b>${hist[0]}</b></div>` : '';
    return `<div class="smart-msg-bot">${g} أنا مساعد البحث في منصة BassamIbrahim.<br>اسألني عن أي موضوع، أو اختر من الاقتراحات:${hint}</div>`;
  }

  const box = document.createElement('div');
  box.id = 'smart-chat-box';
  box.innerHTML = `<div id="smart-chat-header"><span>🤖 مساعد BassamIbrahim</span><div style="display:flex;align-items:center;gap:8px;"><button id="smart-chat-clear" title="محادثة جديدة" style="background:none;border:none;color:white;font-size:16px;cursor:pointer;opacity:0.85;">🔄</button><button id="smart-chat-close" style="background:none;border:none;color:white;font-size:18px;cursor:pointer;">✕</button></div></div><div id="smart-chat-messages">${buildWelcome()}${buildChips()}</div><div id="smart-chat-input-area"><input type="text" id="smart-chat-input" placeholder="ابحث في المنصة..." /><button id="smart-chat-send">بحث</button></div>`;
  document.body.appendChild(box);

  const closeBtn = document.getElementById('smart-chat-close');
  const clearBtn = document.getElementById('smart-chat-clear');
  const inputEl = document.getElementById('smart-chat-input');
  const sendBtn = document.getElementById('smart-chat-send');
  const messagesEl = document.getElementById('smart-chat-messages');

  function bindChips(container) {
    container.querySelectorAll('.suggestion-chip').forEach(chip => {
      chip.replaceWith(chip.cloneNode(true));
    });
    container.querySelectorAll('.suggestion-chip').forEach(chip => {
      if(chip.dataset.question) chip.addEventListener('click', function() { handleQuestion(this.dataset.question); });
    });
  }
  bindChips(messagesEl);

  btn.addEventListener('click', () => { box.classList.toggle('open'); if (box.classList.contains('open')) inputEl?.focus(); });
  closeBtn.addEventListener('click', () => box.classList.remove('open'));
  clearBtn.addEventListener('click', () => { messagesEl.innerHTML = buildWelcome() + buildChips(); bindChips(messagesEl); messagesEl.scrollTop = 0; });

  // ========== دوال البحث ==========
  function searchArticles(query) {
    const q = normalize(query);
    if (!q || q.length < 2) return [];
    return allArticles.map(a => {
      let score = 0;
      const t = normalize(a.title_ar || '');
      const c = normalize(a.content_ar || '');
      const tags = (a.tags || []).map(x => normalize(x));
      if (t.includes(q)) score += 100;
      if (tags.some(tg => tg === q)) score += 150;
      else if (tags.some(tg => tg.includes(q))) score += 80;
      if (c.includes(q)) score += 15;
      if (q.split(/\s+/).length >= 2 && t.includes(q)) score += 200;
      if (fuzzyMatch(t, q) > 0.8) score += 50;
      return { ...a, score };
    }).filter(a => a.score > 0).sort((a, b) => b.score - a.score);
  }

  function searchLibrary(query) {
    return allLibraryFiles.map(f => {
      let s = 0;
      s += fuzzyMatch(f.title_ar || '', query) * 10;
      (f.tags || []).forEach(t => { s += fuzzyMatch(t, query) * 6; });
      return { ...f, score: s };
    }).filter(f => f.score > 0).sort((a, b) => b.score - a.score);
  }

  function getContentPreview(article, max = 200) {
    const c = article.content_ar || '';
    if (!c) return '';
    let plain = c.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    if (plain.length > max) plain = plain.substring(0, max) + '...';
    return plain;
  }

  function searchKB(query) {
    const q = normalize(query);
    if (!q || q.length < 2 || knowledgeBase.length === 0) return null;

    // 1. تطابق تام
    for (const item of knowledgeBase) {
      for (const kw of item.keywords) {
        if (normalize(kw) === q) return item.answer;
      }
    }
    // 2. تطابق احتوائي
    for (const item of knowledgeBase) {
      for (const kw of item.keywords) {
        const nk = normalize(kw);
        if (q.includes(nk) || nk.includes(q)) return item.answer;
      }
    }
    // 3. تطابق ضبابي
    let best = null, bestScore = 0;
    for (const item of knowledgeBase) {
      for (const kw of item.keywords) {
        const score = fuzzyMatch(normalize(kw), q);
        if (score > 0.4 && score > bestScore) {
          bestScore = score;
          best = item;
        }
      }
    }
    return best ? best.answer : null;
  }

  function getFallback(question) {
    const q = question.trim();
    const chats = ['كيف حالك','شلونك','ازيك','كيفك','هل يمكنني التحدث','اريد التحدث','اتحدث مع','من انت','ما اسمك','شو اسمك','تعرف على','صديق','احبك','تحبني'];
    if (chats.some(k => q.includes(k))) return '🎯 <b>أنا هنا لخدمتك!</b><br><br>أنا مساعد متخصص في محتوى منصة بسام إبراهيم. جرّب أن تسألني عن الهندسة، السياسة، الحضارة النوبية، التطوير، أو الصحة.';
    return '🎯 <b>شكراً على سؤالك!</b><br><br>يمكنك سؤالي عن: الهندسة، السياسة السودانية، الحضارة النوبية، التطوير، أو الصحة.';
  }

  async function askExpert(question, articles) {
    let context = '';
    if (articles && articles.length > 0) {
      context = articles.slice(0, 3).map(a => `عنوان: ${a.title_ar}\nمحتوى: ${(a.content_ar || '').substring(0, 300)}`).join('\n---\n');
    }
    try {
      const r = await fetch(AI_PROXY_URL, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ question, context }) });
      const d = await r.json();
      if (d.reply && d.reply.length > 50) return sanitizeHTML(d.reply);
      return sanitizeHTML(d.reply || getFallback(question));
    } catch(e) { return getFallback(question); }
  }

  function addMsg(html, isUser, showFeedback, question, results, startTime) {
    const div = document.createElement('div');
    div.className = isUser ? 'smart-msg-user' : 'smart-msg-bot';
    div.innerHTML = html;
    bindChips(div);
    if (showFeedback) {
      const fb = document.createElement('div');
      fb.className = 'feedback-btns';
      fb.innerHTML = '<span style="font-size:10px;color:#8899bb;">هل كانت الإجابة مفيدة؟</span><button class="feedback-btn feedback-yes">👍</button><button class="feedback-btn feedback-no">👎</button>';
      div.appendChild(fb);
      const send = (val) => logToSupabase({ session_id: generateSessionId(), question, intent: classifyIntent(question), results_count: results, response_time_ms: startTime ? Math.round(performance.now() - startTime) : null, was_helpful: val });
      fb.querySelector('.feedback-yes').addEventListener('click', function() { this.classList.add('active'); fb.querySelector('.feedback-no').classList.remove('active'); send(true); });
      fb.querySelector('.feedback-no').addEventListener('click', function() { this.classList.add('active'); fb.querySelector('.feedback-yes').classList.remove('active'); send(false); });
    }
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return div;
  }

  // ========== المعالج الرئيسي ==========
  async function handleQuestion(question) {
    const start = performance.now();
    saveHistory(question);
    addMsg(question, true);
    loadLibrary();

    // ✅ تحميل البيانات مرة واحدة فقط، والانتظار حتى تنتهي
    await loadAllData();

    const kbAns = searchKB(question);
    if (kbAns) {
      logToSupabase({ session_id: generateSessionId(), question, intent: classifyIntent(question), results_count: 1, response_time_ms: Math.round(performance.now() - start), response_type:'kb', articles_found:0, library_files_found:0, kb_match:true, expert_used:false, user_agent:navigator.userAgent, platform:/Mobi|Android/i.test(navigator.userAgent)?'mobile':'desktop' });
      addMsg(kbAns, false, true, question, 1, start);
      return;
    }

    const articles = searchArticles(question).slice(0, 3);
    const files = searchLibrary(question).slice(0, 3);
    const total = articles.length + files.length;

    logToSupabase({ session_id: generateSessionId(), question, intent: classifyIntent(question), results_count: total, response_time_ms: Math.round(performance.now() - start), response_type: total > 0 ? 'articles' : 'fallback', articles_found: articles.length, library_files_found: files.length, kb_match:false, expert_used:false, user_agent:navigator.userAgent, platform:/Mobi|Android/i.test(navigator.userAgent)?'mobile':'desktop' });

    let reply = '';
    if (articles.length) {
      reply += `<b>📰 مقالات ذات صلة (${articles.length}):</b><br><br>`;
      articles.forEach(a => {
        const title = a.title_ar || 'بدون عنوان';
        const tab = TAB_NAMES[a._tab] || '';
        const btn = BUTTON_NAMES[a.button] || '';
        const preview = getContentPreview(a);
        reply += `<div class="smart-result">📰 <b>${title}</b><br>📂 <span class="section-badge">${tab}</span>${btn ? ` ← <b>${btn}</b>` : ''}${preview ? `<br><small style="color:#aaa;">${preview}</small>` : ''}</div>`;
      });
      reply += '<div style="margin-top:12px;"><button class="suggestion-chip ask-expert-btn" style="border-color:#EAB308;color:#EAB308;">✨ اسأل الخبير لتلخيص هذه النتائج</button></div>';
    }
    if (files.length) {
      reply += `<b>📚 ملفات من المكتبة (${files.length}):</b><br><br>`;
      files.forEach(f => {
        const title = f.title_ar || 'بدون عنوان';
        const tab = TAB_NAMES[f.category] || '';
        const url = `https://raw.githubusercontent.com/bassamibrahim249/bassam-portfolio/main/${f.filePath}`;
        reply += `<div class="smart-result">📁 <b>${title}</b><br>📂 <span class="section-badge">${tab}</span>${f.fileSize ? ` 📦 ${f.fileSize}` : ''}<br><a href="${url}" target="_blank" style="color:#60CFFF;">⬇️ تحميل الملف المباشر</a></div>`;
      });
    }
    if (!articles.length && !files.length) {
      const enc = encodeURIComponent(question);
      const suggs = STATIC_SUGGESTIONS.sort(() => Math.random() - 0.5).slice(0, 3);
      reply = `🤔 لم أجد نتيجة عن "<b>${question}</b>" في المقالات أو المكتبة.<div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap;"><button class="suggestion-chip ask-general-ai" style="background:#EAB308;color:#000;">🧠 اسأل الخبير العام</button><a href="https://wa.me/${WHATSAPP_NUMBER}?text=${enc}" target="_blank" class="whatsapp-link">💬 تواصل مع بسام</a></div><div style="margin-top:8px;font-size:11px;color:#8899bb;">💡 <b>اقتراحات:</b> ${suggs.map(s => `<button class="suggestion-chip" data-question="${s}">${s}</button>`).join(' ')}</div>`;
    }

    const node = addMsg(reply, false, true, question, total, start);

    const expertBtn = node.querySelector('.ask-expert-btn');
    if (expertBtn) {
      expertBtn.addEventListener('click', async function() {
        this.disabled = true;
        this.textContent = '⏳ جاري التلخيص...';
        const ans = await askExpert(question, articles);
        logToSupabase({ session_id: generateSessionId(), question, intent: classifyIntent(question), results_count: total, response_time_ms: Math.round(performance.now() - start), response_type:'expert', articles_found:articles.length, library_files_found:files.length, kb_match:false, expert_used:true, user_agent:navigator.userAgent, platform:/Mobi|Android/i.test(navigator.userAgent)?'mobile':'desktop' });
        addMsg(`<div class="smart-result expert-badge">🧠 <b>تلخيص الخبير:</b><br>${ans}<br><small>💡 المقال الكامل يحتوي على تفاصيل أكثر.</small></div>`);
        this.style.display = 'none';
      });
    }

    const generalAI = node.querySelector('.ask-general-ai');
    if (generalAI) {
      generalAI.addEventListener('click', async function() {
        this.disabled = true;
        this.textContent = '⏳ جاري تفكير الخبير...';
        const ans = await askExpert(question, []);
        logToSupabase({ session_id: generateSessionId(), question, intent: classifyIntent(question), results_count:0, response_time_ms: Math.round(performance.now() - start), response_type:'expert', articles_found:0, library_files_found:0, kb_match:false, expert_used:true, user_agent:navigator.userAgent, platform:/Mobi|Android/i.test(navigator.userAgent)?'mobile':'desktop' });
        addMsg(`<div class="smart-result expert-badge">🧠 <b>يقول الخبير العام:</b><br>${ans}</div>`);
        this.style.display = 'none';
      });
    }
  }

  sendBtn.addEventListener('click', () => { const q = inputEl.value.trim(); if (q) { handleQuestion(q); inputEl.value = ''; } });
  inputEl.addEventListener('keydown', e => { if (e.key === 'Enter') { const q = inputEl.value.trim(); if (q) { handleQuestion(q); inputEl.value = ''; } } });
})();