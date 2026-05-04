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
              
              if (text.trim().startsWith('{')) {
                try {
                  const article = JSON.parse(text);
                  // معالجة الأقسام: إذا كانت sections مصفوفة نصوص، نحولها لكائنات
                  if (article.sections && Array.isArray(article.sections)) {
                    const processedSections = [];
                    let currentHeading = '';
                    article.sections.forEach(item => {
                      if (typeof item === 'string') {
                        const cleanText = item.trim();
                        if (cleanText.endsWith('\n') || cleanText.length < 50) {
                          // ربما عنوان قسم
                          if (currentHeading) {
                            processedSections.push({ heading: currentHeading, text: [] });
                          }
                          currentHeading = cleanText;
                        } else {
                          // نص قسم
                          if (!currentHeading) currentHeading = '';
                          const existing = processedSections.find(s => s.heading === currentHeading);
                          if (existing) {
                            existing.text.push(cleanText);
                          } else {
                            processedSections.push({ heading: currentHeading, text: [cleanText] });
                            currentHeading = '';
                          }
                        }
                      }
                    });
                    if (currentHeading) {
                      processedSections.push({ heading: currentHeading, text: [] });
                    }
                    article.sections = processedSections;
                  }
                  return article;
                } catch (e) {}
              }
              
              const lines = text.split('\n').filter(line => line.trim() !== '');
              const titleLine = lines.find(line => line.trim().startsWith('# '));
              const title = titleLine ? titleLine.trim().replace(/^#\s*/, '') : 'مقال بدون عنوان';
              return {
                title: title,
                paragraphs: [],
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
