// =============== المساعد الهجين - BassamIbrahim (v13.2-FIXED-FINAL) ===============
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
      if (/href\s*=\s*["']https?:\/\//i.test(decodedAttrs)) {
        return '<a ' + decodedAttrs + '>';
      }
      return '';
    });
    return text;
  }

  // ========== قاعدة المعرفة ==========
  let knowledgeBase = [];

  async function loadKnowledgeBase() {
    try {
      const response = await fetch(`data/knowledge-base.json?v=${APP_VERSION}`);
      if (!response.ok) throw new Error('Failed to load');
      knowledgeBase = await response.json();
    } catch (error) {
      knowledgeBase = [];
    }
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

  // ========== توليد معرف الجلسة ==========
  function generateSessionId() {
    let sessionId = localStorage.getItem('bassam_session_id');
    if (!sessionId) {
      sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('bassam_session_id', sessionId);
    }
    return sessionId;
  }

  // ========== إرسال التحليلات إلى Vercel ==========
  async function logToSupabase(payload) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      await fetch(ANALYTICS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
    } catch(e) {}
  }

  function classifyIntent(question) {
    const q = normalize(question);
    if (/خرسانة|إسمنت|حديد|إنشاء|تصميم|مقاومة|هندس/.test(q)) return 'engineering';
    if (/سياسة|سودان|حرب|ثورة|انقلاب|حكومة/.test(q)) return 'political';
    if (/نوبة|مروي|كوش|نوبي|آثار|بجراوية/.test(q)) return 'nubian';
    if (/مشروع|منحة|قيادة|تدريب|تطوير|إدارة/.test(q)) return 'academy';
    if (/صحة|تغذية|سعرات|رياضة|دايت|وزن/.test(q)) return 'health';
    return 'general';
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
    .expert-badge{border-left:4px solid #EAB308!important;background:rgba(234,179,8,0.08)!important;}
    .suggestion-chips{display:flex;flex-wrap:wrap;gap:6px;padding:4px 0 8px;}
    .suggestion-chip{font-size:11px;padding:6px 12px;border-radius:16px;background:rgba(59,158,255,0.15);color:#3B9EFF;border:1px solid rgba(59,158,255,0.35);cursor:pointer;font-family:'Cairo',sans-serif;transition:all 0.2s;}
    .suggestion-chip:hover{background:rgba(59,158,255,0.35);color:#fff;}
    .section-badge{display:inline-block;padding:2px 8px;border-radius:10px;font-size:10px;font-weight:700;margin-left:4px;background:rgba(59,158,255,0.2);color:#3B9EFF;border:1px solid rgba(59,158,255,0.3);}
    .history-hint{font-size:11px;color:#8899bb;padding:4px 0;border-top:1px solid rgba(255,255,255,0.06);margin-top:4px;}
    .feedback-btns{display:flex;gap:8px;margin-top:8px;padding-top:8px;border-top:1px solid rgba(255,255,255,0.1);}
    .feedback-btn{font-size:18px;cursor:pointer;padding:4px 10px;border-radius:12px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.15);transition:all 0.2s;}
    .feedback-btn:hover{background:rgba(59,158,255,0.2);border-color:#3B9EFF;}
    .feedback-btn.active{background:rgba(59,158,255,0.3);border-color:#3B9EFF;}
  `;
  document.head.appendChild(style);

  const btn = document.createElement('button');
  btn.id = 'smart-assistant-btn';
  btn.title = 'ابحث في المنصة';
  btn.textContent = '💬';
  document.body.appendChild(btn);

  // ✅ تعريف المتغيرات هنا (قبل أي دالة تستخدمها)
  let allArticles = [];
  let allLibraryFiles = [];
  let articlesLoaded = false;
  let libraryLoaded = false;

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

  function getDynamicSuggestions(count = 4) {
    const suggestions = [];
    if (allArticles.length > 0) {
      const titles = allArticles
        .map(a => a.title_ar || a.title || '')
        .filter(t => t.length > 5)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);
      suggestions.push(...titles);
    }
    const kbQuestions = ['ما هي المكتبة الرقمية؟', 'كيف أتواصل مع بسام؟', 'ما هي أقسام الموقع؟', 'كيف أبحث في المنصة؟'];
    suggestions.push(kbQuestions[Math.floor(Math.random() * kbQuestions.length)]);
    return suggestions.slice(0, count);
  }

  function buildSuggestionChips() {
    const qs = getDynamicSuggestions();
    return `<div class="suggestion-chips">${qs.map(q => `<button class="suggestion-chip" data-question="${q}">${q}</button>`).join('')}</div>`;
  }

  function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'صباح الخير! 🌅';
    if (hour < 18) return 'مساء النور! 🌤️';
    return 'مساء الخير! 🌙';
  }

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

  function buildWelcomeHTML() {
    const greeting = getGreeting();
    const history = getHistory();
    const historyHint = history.length > 0 ? `<div class="history-hint">🕐 آخر بحث: <b>${history[0]}</b></div>` : '';
    return `<div class="smart-msg-bot">${greeting} أنا مساعد البحث في منصة BassamIbrahim.<br>اسألني عن أي موضوع، أو اختر من الاقتراحات:${historyHint}</div>`;
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

  function bindChips(container) {
    container.querySelectorAll('.suggestion-chip').forEach(chip => {
      chip.replaceWith(chip.cloneNode(true));
    });
    container.querySelectorAll('.suggestion-chip').forEach(chip => {
      if(chip.dataset.question) {
        chip.addEventListener('click', function() {
          handleQuestion(this.dataset.question);
        });
      }
    });
  }
  bindChips(messagesEl);

  btn.addEventListener('click', () => {
    box.classList.toggle('open');
    if (box.classList.contains('open')) inputEl?.focus();
  });
  closeBtn.addEventListener('click', () => box.classList.remove('open'));
  clearBtn.addEventListener('click', resetChat);

  function resetChat() {
    messagesEl.innerHTML = buildWelcomeHTML() + buildSuggestionChips();
    bindChips(messagesEl);
    messagesEl.scrollTop = 0;
  }

  // ========== دوال البحث والمعالجة ==========
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
        if (titleAr.includes(q)) score += 100;
        if (titleEn.includes(q)) score += 90;
        tags.forEach(tag => {
          if (tag === q) score += 150;
          else if (tag.includes(q) || q.includes(tag)) score += 80;
        });
        if (contentAr.includes(q)) score += 15;
        if (contentEn.includes(q)) score += 10;
        if (q.split(/\s+/).length >= 2) {
          if (titleAr.includes(q)) score += 200;
          if (contentAr.includes(q)) score += 80;
        }
        if (fuzzyMatch(titleAr, q) > 0.8) score += 50;
        if (fuzzyMatch(contentAr, q) > 0.8) score += 20;
        const queryWords = q.split(/\s+/).filter(w => w.length > 2);
        if (queryWords.length >= 2) {
          if (queryWords.every(w => titleAr.includes(w))) score += 70;
          if (queryWords.every(w => contentAr.includes(w))) score += 30;
        }
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

  function getContentPreview(article, maxLength = 200) {
    const content = article.content_ar || article.content_en || article.content || '';
    if (!content) return '';
    let plain = content.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    if (plain.length > maxLength) plain = plain.substring(0, maxLength) + '...';
    return plain;
  }

  function getSearchSuggestions(query) {
    const allTitles = allArticles.map(a => a.title_ar || a.title_en || a.title || '').filter(Boolean);
    const suggestions = allTitles.filter(title => fuzzyMatch(title, query) > 0.3).slice(0, 3);
    return suggestions.length > 0 ? suggestions : ['الهندسة في السودان', 'تاريخ مملكة مروي', 'المشاريع'];
  }

  const BUTTON_NAMES = {
    materials_science:'علوم المواد', construction_innovation:'ابتكار إنشائي',
    engineering_lab:'مختبر هندسي', sudan_history:'تاريخ السودان',
    strategic_analysis:'تحليل استراتيجي', intellectual_visions:'رؤى فكرية',
    history:'تاريخ', archaeology:'آثار', identity:'هوية',
    project_writing:'المشاريع', leadership:'القيادة والإدارة',
    developmental_training:'تدريب تنموي', holistic_health:'صحة شاملة',
    scientific_nutrition:'تغذية علمية', physical_excellence:'تميز بدني'
  };

  function addMsg(html, isUser = false, showFeedback = false, question = '', resultCount = 0, answerStartTime = 0) {
    const div = document.createElement('div');
    div.className = isUser ? 'smart-msg-user' : 'smart-msg-bot';
    div.innerHTML = html;
    if (showFeedback) {
      const feedbackDiv = document.createElement('div');
      feedbackDiv.className = 'feedback-btns';
      feedbackDiv.innerHTML = `
        <span style="font-size:10px;color:#8899bb;align-self:center;">هل كانت الإجابة مفيدة؟</span>
        <button class="feedback-btn feedback-yes" title="نعم">👍</button>
        <button class="feedback-btn feedback-no" title="لا">👎</button>
      `;
      div.appendChild(feedbackDiv);
      const sendFeedback = (wasHelpful) => {
        logToSupabase({
          session_id: generateSessionId(),
          question: question,
          intent: classifyIntent(question),
          results_count: resultCount,
          response_time_ms: answerStartTime ? Math.round(performance.now() - answerStartTime) : null,
          was_helpful: wasHelpful
        });
      };
      feedbackDiv.querySelector('.feedback-yes').addEventListener('click', function() {
        this.classList.add('active');
        feedbackDiv.querySelector('.feedback-no').classList.remove('active');
        sendFeedback(true);
      });
      feedbackDiv.querySelector('.feedback-no').addEventListener('click', function() {
        this.classList.add('active');
        feedbackDiv.querySelector('.feedback-yes').classList.remove('active');
        sendFeedback(false);
      });
    }
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

  function getProfessionalFallback(question) {
    const q = question.trim();
    const chatKeywords = ['كيف حالك', 'شلونك', 'ازيك', 'كيفك'];
    if (chatKeywords.some(k => q.includes(k))) {
      return '🎯 <b>أنا هنا لخدمتك!</b><br><br>أنا مساعد متخصص في محتوى منصة بسام إبراهيم. جرّب أن تسألني عن الهندسة، السياسة، الحضارة النوبية، التطوير، أو الصحة.';
    }
    return '🎯 <b>شكراً على سؤالك!</b><br><br>يمكنك سؤالي عن: الهندسة، السياسة السودانية، الحضارة النوبية، التطوير، أو الصحة.';
  }

  async function askHybridExpert(question, articles) {
    let context = '';
    if (articles && articles.length > 0) {
      context = articles.slice(0, 3).map(a => {
        const title = a.title_ar || a.title_en || '';
        const content = (a.content_ar || a.content_en || a.content || '').substring(0, 300);
        return `عنوان المقال: ${title}\nمحتوى: ${content}`;
      }).join('\n---\n');
    }
    try {
      const response = await fetch(AI_PROXY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, context })
      });
      const data = await response.json();
      if (data.reply && data.reply.length > 50) {
        return sanitizeHTML(data.reply);
      }
      return sanitizeHTML(data.reply || getProfessionalFallback(question));
    } catch (error) {
      return getProfessionalFallback(question);
    }
  }

  async function handleQuestion(question) {
    const questionStartTime = performance.now();
    saveToHistory(question);
    addMsg(question, true);

    const kbAns = searchKB(question);
    if (kbAns) {
      logToSupabase({
        session_id: generateSessionId(),
        question: question,
        intent: classifyIntent(question),
        results_count: 1,
        response_time_ms: Math.round(performance.now() - questionStartTime),
        response_type: 'kb',
        articles_found: 0, library_files_found: 0,
        kb_match: true, expert_used: false,
        user_agent: navigator.userAgent,
        platform: /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop'
      });
      addMsg(kbAns, false, true, question, 1, questionStartTime);
      return;
    }

    const typing = addMsg('⏳ جاري البحث في المنصة...');
    await Promise.all([loadAllArticles(), loadLibrary()]);
    const articles = searchArticles(question).slice(0, 3);
    const files = searchLibrary(question).slice(0, 3);
    typing.remove();

    const totalResults = articles.length + files.length;
    logToSupabase({
      session_id: generateSessionId(),
      question: question,
      intent: classifyIntent(question),
      results_count: totalResults,
      response_time_ms: Math.round(performance.now() - questionStartTime),
      response_type: totalResults > 0 ? 'articles' : 'fallback',
      articles_found: articles.length, library_files_found: files.length,
      kb_match: false, expert_used: false,
      user_agent: navigator.userAgent,
      platform: /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop'
    });

    let reply = '';
    if (articles.length) {
      reply += `<b>📰 مقالات ذات صلة (${articles.length}):</b><br><br>`;
      articles.forEach(a => {
        const title = a.title_ar || a.title_en || a.title || 'بدون عنوان';
        reply += `<div class="smart-result">📰 <b>${title}</b></div>`;
      });
    }
    if (files.length) {
      reply += `<b>📚 ملفات من المكتبة (${files.length}):</b><br><br>`;
      files.forEach(f => {
        const title = f.title_ar || f.title_en || f.title || 'بدون عنوان';
        reply += `<div class="smart-result">📁 <b>${title}</b></div>`;
      });
    }
    if (!articles.length && !files.length) {
      reply = getProfessionalFallback(question);
    }
    addMsg(reply, false, true, question, totalResults, questionStartTime);
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

  loadKnowledgeBase();
})();