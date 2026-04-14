  explainDoc: async () => {
    const { selectedDoc } = get();
    if (!selectedDoc) return;

    const res = await fetch("/api/docs/ai/explain", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        version: selectedDoc.version,
        name: selectedDoc.name
      })
    });

    const data = await res.json();
    set({ selectedDocContent: data.answer });
  },

  askDoc: async () => {
    const { selectedDoc } = get();
    if (!selectedDoc) return;

    const question = prompt("Ask a question about this document:");
    if (!question) return;

    const res = await fetch("/api/docs/ai/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        version: selectedDoc.version,
        name: selectedDoc.name,
        question
      })
    });

    const data = await res.json();
    set({ selectedDocContent: data.answer });
  },

  generateRelated: async () => {
    const { selectedDoc } = get();
    if (!selectedDoc) return;

    const res = await fetch("/api/docs/ai/related", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        version: selectedDoc.version,
        name: selectedDoc.name
      })
    });

    const data = await res.json();
    set({ selectedDocContent: data.answer });
  },
