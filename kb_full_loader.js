// Auto-load kb_full.json into the chatbot KB once per browser
(function(){
  const STORE_KEY = 'sor_chat_kb_v1';
  const SEED_FLAG = 'sor_chat_seeded_full_v1';

  function readKB(){ try { return JSON.parse(localStorage.getItem(STORE_KEY) || '[]'); } catch(e){ return []; } }
  function writeKB(arr){ localStorage.setItem(STORE_KEY, JSON.stringify(arr)); }
  function norm(s){ return String(s || '').toLowerCase().replace(/\s+/g,' ').trim(); }

  async function loadOnce(){
    try {
      if (localStorage.getItem(SEED_FLAG) === '1') return;
      const res = await fetch('kb_full.json', { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      if (!Array.isArray(data)) return;
      const kb = readKB();
      const map = new Map(kb.map(item => [norm(item.q), item]));
      let added = 0;
      data.forEach((row) => {
        const q = row.q || row.question;
        const a = row.a || row.answer;
        const tags = Array.isArray(row.tags) ? row.tags : String(row.tags || '').split(',');
        if (!q || !a) return;
        const key = norm(q);
        map.set(key, { q, a, tags: tags.map(t=>norm(t)).filter(Boolean), createdAt: Date.now() });
        added += 1;
      });
      if (added > 0) writeKB(Array.from(map.values()));
      localStorage.setItem(SEED_FLAG, '1');
    } catch(e){ /* ignore */ }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadOnce);
  } else {
    loadOnce();
  }
})();

