// analytics-tracker.js — 21 حدثاً استراتيجياً - نسخة محسّنة للمشاركة
(function() {
  'use strict';
  var LOG_URL = 'https://bassam-portfolio-eight.vercel.app/api/log-page-event';
  var SESSION_ID = 'sess_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);

  // دالة مساعدة لجلب عنوان المقال الحالي
  function getCurrentArticleTitle() {
    var openArticle = document.querySelector('.accordion-item [aria-expanded="true"]');
    if (openArticle) {
      var item = openArticle.closest('.accordion-item');
      var h3 = item ? item.querySelector('h3') : null;
      return h3 ? h3.textContent.trim().slice(0, 80) : '';
    }
    return '';
  }

  function sendEvent(name, extra) {
    extra = extra || {};
    var payload = {
      event_name: name,
      session_id: SESSION_ID,
      page_url: location.href,
      referrer: document.referrer || '',
      screen_width: screen.width,
      language: document.documentElement.lang || 'ar',
      timestamp: new Date().toISOString()
    };
    for (var k in extra) {
      if (extra.hasOwnProperty(k)) payload[k] = extra[k];
    }
    try {
      fetch(LOG_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true
      });
    } catch (e) {
      console.warn('Analytics failed silently');
    }
  }

  window.addEventListener('load', function() { sendEvent('page_view'); });
  window.addEventListener('error', function(e) { sendEvent('error_occurred', { error_message: (e.message || '').slice(0, 500) }); });
  window.addEventListener('unhandledrejection', function(e) { sendEvent('error_occurred', { error_message: ('Promise: ' + (e.reason?.message || e.reason)).slice(0, 500) }); });
  sendEvent('language_used', { language: document.documentElement.lang || 'ar' });
  if (matchMedia('(display-mode: standalone)').matches) sendEvent('pwa_open');
  window.addEventListener('appinstalled', function() { sendEvent('pwa_install'); });

  var s75 = false;
  window.addEventListener('scroll', function() {
    if (!s75 && (scrollY + innerHeight) / document.documentElement.scrollHeight * 100 >= 75) {
      s75 = true;
      sendEvent('scroll_75');
    }
  }, { passive: true });

  function attachHandlers() {
    document.querySelectorAll('.accordion-item').forEach(function(item) {
      if (item.dataset.t1) return;
      item.dataset.t1 = '1';
      var c = item.querySelector('div[role="button"]');
      if (!c) return;
      c.addEventListener('click', function() {
        var t = (item.querySelector('h3') || {}).textContent || '';
        sendEvent('article_open', { article_title: t.slice(0, 80) });
      });
    });

    document.querySelectorAll('.glass-card a[href*="raw.githubusercontent"]').forEach(function(a) {
      if (a.dataset.t2) return;
      a.dataset.t2 = '1';
      a.addEventListener('click', function() {
        var t = (a.closest('.glass-card')?.querySelector('h4') || {}).textContent || '';
        var x = a.textContent;
        if (x.includes('تحميل') || x.includes('Download')) sendEvent('book_download', { book_title: t.slice(0, 80) });
        else if (x.includes('معاينة') || x.includes('Preview')) sendEvent('book_preview', { book_title: t.slice(0, 80) });
      });
    });

    // --- أزرار المشاركة (تم التحديث هنا) ---
    document.querySelectorAll('button').forEach(function(b) {
      if (b.dataset.t3) return;
      var x = b.textContent.trim(), p = null;
      if (x.includes('واتساب')) p = 'whatsapp';
      else if (x.includes('فيسبوك')) p = 'facebook';
      else if (x.includes('تويتر') || x.includes('𝕏')) p = 'twitter';
      else if (x.includes('تيليجرام')) p = 'telegram';
      else if (x.includes('نسخ الرابط')) p = 'copy';
      else if (x.includes('مشاركة')) p = 'native';
      
      if (p) {
        b.dataset.t3 = '1';
        b.addEventListener('click', function() {
          var articleTitle = getCurrentArticleTitle();
          var extraData = { share_platform: p };
          if (articleTitle) {
            extraData.article_title = articleTitle;
          }
          sendEvent('share_' + p, extraData);
        });
      }
    });

    document.querySelectorAll('#smart-assistant-btn').forEach(function(b) {
      if (b.dataset.t4) return; b.dataset.t4 = '1';
      b.addEventListener('click', function() { sendEvent('chat_start'); });
    });

    document.querySelectorAll('a[href*="wa.me/249967238251"]').forEach(function(a) {
      if (a.dataset.t5) return; a.dataset.t5 = '1';
      a.addEventListener('click', function() { sendEvent('contact_click'); });
    });

    document.querySelectorAll('.search-input').forEach(function(i) {
      if (i.dataset.t6) return; i.dataset.t6 = '1'; var t;
      i.addEventListener('keypress', function(e) { if (e.key === 'Enter' && i.value.trim().length >= 2) { clearTimeout(t); sendEvent('search_articles', { search_query: i.value.trim().slice(0, 100) }); } });
      i.addEventListener('input', function() { clearTimeout(t); t = setTimeout(function() { if (i.value.trim().length >= 2) sendEvent('search_articles', { search_query: i.value.trim().slice(0, 100) }); }, 1500); });
    });

    document.querySelectorAll('a[target="_blank"]').forEach(function(a) {
      if (a.dataset.t7) return; var h = a.href || '';
      if (h.includes('wa.me/249967238251') || h.includes('facebook.com/sharer') || h.includes('twitter.com/intent') || h.includes('t.me/share') || h.includes('raw.githubusercontent')) return;
      a.dataset.t7 = '1'; a.addEventListener('click', function() { sendEvent('external_link', { target_url: h }); });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', attachHandlers);
  else attachHandlers();

  new MutationObserver(function(m) { if (m.some(function(x) { return x.addedNodes.length > 0; })) setTimeout(attachHandlers, 100); }).observe(document.body, { childList: true, subtree: true });

  console.log('📊 21 حدثاً جاهزون للتتبع.');
})();
