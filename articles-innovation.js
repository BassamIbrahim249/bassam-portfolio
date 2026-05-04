// ========== ملف articles-innovation.js ==========
function fetchInnovationArticles() {
  return fetch("https://api.github.com/repos/bassamibrahim249/bassam-portfolio/contents/content/articles")
    .then(response => {
      if (!response.ok) throw new Error("تعذر تحميل المقالات");
      return response.json();
    })
    .then(files => {
      const supportedFiles = files.filter(f => f.name.endsWith('.json') || f.name.endsWith('.md'));
      return Promise.all(
        supportedFiles.map(f => {
          return fetch(f.download_url)
            .then(res => res.ok ? res.text() : null)
            .then(text => {
              if (!text) return null;
              
              // إذا النص يبدأ بـ { فهو JSON حقيقي
              if (text.trim().startsWith('{')) {
                try {
                  return JSON.parse(text);
                } catch (e) {
                  console.error("خطأ في تحليل JSON:", e);
                }
              }
              
              // إذا وصلنا هنا، اعتبره نص عادي أو Markdown
              const lines = text.split('\n').filter(line => line.trim() !== '');
              const titleLine = lines.find(line => line.trim().startsWith('# '));
              const title = titleLine ? titleLine.trim().replace(/^#\s*/, '') : 'مقال بدون عنوان';
              const content = lines.filter(l => l !== titleLine).join('\n').trim();
              return {
                title: title,
                paragraphs: content ? [content] : [],
                sections: [],
                tags: [],
                headerImage: null
              };
            });
        })
      );
    })
    .then(articles => articles.filter(a => a !== null).reverse());
}
