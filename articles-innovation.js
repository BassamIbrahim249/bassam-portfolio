function InnovationSection({ onBack }) {
  const [articlesList, setArticlesList] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    const fetchArticles = async () => {
      try {
        const response = await fetch(
          "https://api.github.com/repos/bassamibrahim249/bassam-portfolio/contents/content/articles"
        );
        if (!response.ok) throw new Error("تعذر تحميل المقالات");
        const files = await response.json();
        const jsonFiles = files.filter(f => f.name.endsWith(".json"));
        const articlesData = await Promise.all(
          jsonFiles.map(async f => {
            const res = await fetch(f.download_url);
            return res.ok ? res.json() : null;
          })
        );
        setArticlesList(articlesData.filter(a => a !== null).reverse());
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchArticles();
  }, []);

  if (loading) {
    return (
      <div style={{ fontFamily: "'Cairo', sans-serif", minHeight: "100vh", padding: "24px", color: "#fff", textAlign: "center" }}>
        <button onClick={onBack} style={{ marginBottom: 32, padding: "10px 20px", borderRadius: 12, background: "transparent", border: "1px solid rgba(59,158,255,0.3)", color: "#8899bb", cursor: "pointer", fontSize: 14, fontWeight: "bold" }}>← العودة للمنصة الهندسية</button>
        <div style={{ marginTop: 80 }}>
          <div className="pulse-dot" style={{ width: 8, height: 8, borderRadius: "50%", background: "#EAB308", margin: "0 auto 20px" }} />
          <p style={{ color: "#8899bb", fontSize: 16 }}>جاري تحميل المقالات...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ fontFamily: "'Cairo', sans-serif", minHeight: "100vh", padding: "24px", color: "#fff", textAlign: "center" }}>
        <button onClick={onBack} style={{ marginBottom: 32, padding: "10px 20px", borderRadius: 12, background: "transparent", border: "1px solid rgba(59,158,255,0.3)", color: "#8899bb", cursor: "pointer", fontSize: 14, fontWeight: "bold" }}>← العودة للمنصة الهندسية</button>
        <div style={{ marginTop: 80, color: "#EAB308" }}>
          <p>⚠️ حدث خطأ أثناء تحميل المقالات</p>
          <p style={{ fontSize: 12, color: "#667788", marginTop: 10 }}>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'Cairo', sans-serif", minHeight: "100vh", padding: "24px", color: "#fff" }}>
      <button onClick={onBack} style={{ marginBottom: 32, padding: "10px 20px", borderRadius: 12, background: "transparent", border: "1px solid rgba(59,158,255,0.3)", color: "#8899bb", cursor: "pointer", fontSize: 14, fontWeight: "bold" }}>← العودة للمنصة الهندسية</button>

      <h2 style={{ fontSize: "clamp(1.5rem, 4vw, 2rem)", fontWeight: 900, marginBottom: 30, textAlign: "center", color: "#EAB308" }}>
        أحدث المقالات 🔬
      </h2>

      {articlesList.length === 0 ? (
        <div style={{ textAlign: "center", marginTop: 40, color: "#667788" }}>
          <p>📝 لا توجد مقالات حالياً. ابدأ بكتابة أول مقال من لوحة التحكم!</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 22, maxWidth: 1100, margin: "0 auto" }}>
          {articlesList.map((article, idx) => (
            <div
              key={idx}
              className="card-wrap"
              style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(234,179,8,0.2)",
                borderRadius: 20,
                overflow: "hidden",
                cursor: "pointer",
                transition: "all 0.45s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-6px)";
                e.currentTarget.style.borderColor = "#EAB308";
                e.currentTarget.style.background = "rgba(234,179,8,0.05)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.borderColor = "rgba(234,179,8,0.2)";
                e.currentTarget.style.background = "rgba(255,255,255,0.02)";
              }}
            >
              {article.headerImage?.src && (
                <img
                  src={article.headerImage.src}
                  alt={article.headerImage.alt || article.title}
                  style={{ width: "100%", height: 200, objectFit: "cover" }}
                  loading="lazy"
                />
              )}
              <div style={{ padding: 20 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: 8 }}>{article.title}</h3>
                {article.paragraphs?.length > 0 && (
                  <p style={{ fontSize: 12, color: "#8899bb", lineHeight: 1.6, marginBottom: 12 }}>
                    {article.paragraphs[0].substring(0, 100)}...
                  </p>
                )}
                {article.tags && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {article.tags.slice(0, 3).map((tag, i) => (
                      <span key={i} style={{ fontSize: 10, padding: "3px 8px", borderRadius: 6, background: "rgba(234,179,8,0.1)", color: "#EAB308", border: "1px solid rgba(234,179,8,0.3)" }}>{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
