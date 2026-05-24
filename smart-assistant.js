// =============== محرك البحث الذكي - BassamIbrahim ===============
(function() {
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
    .smart-result a { color:#3B9EFF; font-weight:700; text-decoration:none; }
  `;
  document.head.appendChild(style);

  const btn = document.createElement('button');
  btn.id = 'smart-assistant-btn';
  btn.title = 'ابحث في المقالات';
  btn.textContent = '💬';
  document.body.appendChild(btn);

  const box = document.createElement('div');
  box.id = 'smart-chat-box';
  box.innerHTML = `
    <div id="smart-chat-header"><span>🤖 مساعد BassamIbrahim</span><button id="smart-chat-close" style="background:none;border:none;color:white;font-size:18px;cursor:pointer;">✕</button></div>
    <div id="smart-chat-messages"><div style="align-self:flex-start;background:rgba(59,158,255,0.15);padding:8px 12px;border-radius:12px;max-width:85%;">أهلاً! أنا مساعد البحث في منصة BassamIbrahim. اسألني عن أي موضوع، وسأبحث لك في جميع المقالات.</div></div>
    <div id="smart-chat-input-area"><input type="text" id="smart-chat-input" placeholder="ابحث عن مقال..." /><button id="smart-chat-send">بحث</button></div>
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

  // ---- ذاكرة تخزين مؤقت للمقالات ----
  let allArticles = [];
  let articlesLoaded = false;

  // أسماء التبويبات للترجمة
  const TAB_NAMES = {
    engineering: 'المنصة الهندسية',
    political: 'الأرشيف السياسي',
    nubian: 'نوبيان (الحضارة النوبية)',
    academy: 'أكاديمية التطوير والمنظمات',
    lifestyle: 'نمط الحياة والصحة'
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

  function getTabName(tab) {
    return TAB_NAMES[tab] || tab;
  }

  function getButtonName(article) {
    // محاولة ترجمة الزر إلى العربية
    const btn = article.button || '';
    const translations = {
      'materials_science': 'علوم المواد',
      'construction_innovation': 'ابتكار إنشائي',
      'engineering_lab': 'مختبر هندسي',
      'sudan_history': 'تاريخ السودان',
      'strategic_analysis': 'تحليل استراتيجي',
      'intellectual_visions': 'رؤى فكرية',
      'history': 'تاريخ',
      'archaeology': 'آثار',
      'identity': 'هوية',
      'project_writing': 'كتابة مشاريع',
      'leadership': 'قيادة',
      'developmental_training': 'تدريب تنموي',
      'holistic_health': 'صحة شاملة',
      'scientific_nutrition': 'تغذية علمية',
      'physical_excellence': 'تميز بدني',
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

  async function handleQuestion(question) {
    addMessage(question, true);

    const typing = document.createElement('div');
    typing.style.cssText = 'align-self:flex-start;background:rgba(255,255,255,0.05);padding:8px 12px;border-radius:12px;';
    typing.innerHTML = '⏳ جاري البحث في المقالات...';
    messages.appendChild(typing);
    messages.scrollTop = messages.scrollHeight;

    await loadAllArticles();

    setTimeout(() => {
      typing.remove();
      const results = searchArticles(question);

      if (results.length === 0) {
        addMessage('🤔 لم أجد مقالات تطابق بحثك. جرب كلمات أخرى، أو اطلع على الأقسام من القائمة الجانبية.');
      } else {
        const count = Math.min(results.length, 3);
        let reply = `✅ وجدت ${count} مقال(ة):\n\n`;
        for (let i = 0; i < count; i++) {
          const article = results[i];
          const title = article.title_ar || article.title_en || 'بدون عنوان';
          const tabName = getTabName(article._tab);
          const btnName = getButtonName(article);
          const snippet = (article.content_ar || article.content_en || '').substring(0, 150).replace(/[#*\[\]]/g, ' ');
          const articleId = article.id || '';

          reply += `<div class="smart-result">`;
          reply += `📰 <b>${title}</b><br>`;
          reply += `📂 ${tabName} → ${btnName}<br>`;
          reply += `📝 ${snippet}...<br>`;
          reply += `<a href="#" onclick="document.getElementById('article-${articleId}')?.scrollIntoView({behavior:'smooth'}); return false;">🔗 فتح المقال</a>`;
          reply += `</div>`;
        }
        if (results.length > 3) {
          reply += `\n... و ${results.length - 3} مقال آخر. جرب كلمات أكثر تحديداً.`;
        }
        addMessage(reply);
      }
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
