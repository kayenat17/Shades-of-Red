// Local semantic retrieval using TensorFlow.js Universal Sentence Encoder (no cloud)
(function(){
  let model = null;
  // In-memory embedding cache: key -> Float32Array
  const questionKeyToVec = new Map();
  let kbItems = [];

  function isReady(){ return !!model; }

  async function ensureReady(){
    if (model) return model;
    if (!window.use || !window.tf) return null;
    try {
      model = await use.load();
      return model;
    } catch (e) {
      return null;
    }
  }

  function normalize(text){ return String(text || '').trim(); }

  async function embedTexts(texts){
    if (!model) return null;
    const emb = await model.embed(texts);
    const arr = await emb.array();
    emb.dispose();
    // Convert to Float32Array sequences
    return arr.map((row) => Float32Array.from(row));
  }

  function cosine(a, b){
    if (!a || !b || a.length !== b.length) return -1;
    let dot = 0, na = 0, nb = 0;
    for (let i = 0; i < a.length; i += 1){
      dot += a[i] * b[i];
      na  += a[i] * a[i];
      nb  += b[i] * b[i];
    }
    const denom = Math.sqrt(na) * Math.sqrt(nb);
    return denom ? dot / denom : -1;
  }

  async function refreshKB(items){
    kbItems = Array.isArray(items) ? items.slice() : [];
    if (!model) return;
    // Embed questions (and optionally answers) for better matching
    const texts = kbItems.map((x) => normalize(`${x.q}\n\n${x.a}`));
    const vectors = await embedTexts(texts);
    if (!vectors) return;
    for (let i = 0; i < kbItems.length; i += 1){
      const key = normalize(kbItems[i].q);
      questionKeyToVec.set(key, vectors[i]);
    }
  }

  async function query(question, topK = 3){
    if (!model || kbItems.length === 0) return [];
    const qvecArr = await embedTexts([normalize(question)]);
    if (!qvecArr) return [];
    const qvec = qvecArr[0];
    const scored = [];
    for (let i = 0; i < kbItems.length; i += 1){
      const item = kbItems[i];
      const key = normalize(item.q);
      const vec = questionKeyToVec.get(key);
      if (!vec) continue;
      const score = cosine(qvec, vec);
      scored.push({ item, score });
    }
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topK).map((x) => x.item);
  }

  window.SORSemantic = { isReady, ensureReady, refreshKB, query };
})();

