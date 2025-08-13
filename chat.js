(function () {
  const storeKey = 'sor_chat_kb_v1';

  function readKB() {
    try { return JSON.parse(localStorage.getItem(storeKey) || '[]'); } catch (e) { return []; }
  }
  function writeKB(arr) { localStorage.setItem(storeKey, JSON.stringify(arr)); }

  function normalizeText(t) { return (t || '').toLowerCase().replace(/\s+/g, ' ').trim(); }
  function similarity(a, b) {
    // Simple Jaccard-like similarity over word sets
    const A = new Set(normalizeText(a).split(' '));
    const B = new Set(normalizeText(b).split(' '));
    if (A.size === 0 || B.size === 0) return 0;
    let inter = 0;
    A.forEach((w) => { if (B.has(w)) inter += 1; });
    const union = new Set([...A, ...B]).size;
    return inter / union;
  }

  async function getBestMatch(question) {
    const kb = readKB();
    if (!kb.length) return null;
    // Prefer semantic retrieval if available
    try {
      if (window.SORSemantic) {
        await window.SORSemantic.ensureReady();
        // Ensure KB vectors are ready
        await window.SORSemantic.refreshKB(kb);
        const top = await window.SORSemantic.query(question, 1);
        if (Array.isArray(top) && top[0]) return { score: 1, item: top[0] };
      }
    } catch (e) { /* fallback below */ }

    let best = { score: 0, item: null };
    kb.forEach((qa) => {
      const score = similarity(question, qa.q) * 0.7 + similarity(question, qa.a) * 0.3;
      if (score > best.score) best = { score, item: qa };
    });
    return best.score > 0.05 ? best : null;
  }

  function addQA(q, a, tags) {
    const kb = readKB();
    kb.push({ q, a, tags: (tags || '').split(',').map((t) => normalizeText(t)).filter(Boolean), createdAt: Date.now() });
    writeKB(kb);
  }

  // (import helpers removed per request)

  function showRelated(baseItem, body, inputEl) {
    if (!baseItem || !Array.isArray(baseItem.tags) || baseItem.tags.length === 0) return;
    const kb = readKB();
    const related = kb
      .filter((x) => x !== baseItem && x.tags && x.tags.some((t) => baseItem.tags.includes(t)))
      .slice(0, 5);
    if (related.length === 0) return;
    const wrap = document.createElement('div');
    wrap.className = 'sor-chat-msg bot';
    const bubble = document.createElement('div');
    bubble.className = 'sor-chat-bubble';
    const title = document.createElement('div');
    title.textContent = 'Related questions:';
    const list = document.createElement('div');
    list.className = 'sor-related-list';
    related.forEach((r) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'sor-related-btn';
      btn.textContent = r.q;
      btn.addEventListener('click', () => {
        inputEl.value = r.q;
        const evt = new KeyboardEvent('keydown', { key: 'Enter' });
        inputEl.dispatchEvent(evt);
      });
      list.appendChild(btn);
    });
    bubble.appendChild(title);
    bubble.appendChild(list);
    wrap.appendChild(bubble);
    body.appendChild(wrap);
    body.scrollTop = body.scrollHeight;
  }

  function ui() {
    const launcher = document.createElement('div');
    launcher.className = 'sor-chat-launcher';
    launcher.title = 'Chat with SOR Assistant';
    launcher.innerHTML = '💬';

    const panel = document.createElement('div');
    panel.className = 'sor-chat-panel';
    panel.innerHTML = `
      <div class="sor-chat-header">
        <div class="sor-chat-title">SOR Assistant</div>
        <button class="sor-chat-close" aria-label="Close">✕</button>
      </div>
      <div class="sor-chat-body"></div>
      <div class="sor-chat-input">
        <input type="text" placeholder="Ask about periods, ovulation, moods..." />
        <button>Send</button>
      </div>
      <div class="sor-train">
        <h4>Improve the assistant</h4>
        <div class="row">
          <input class="train-q" placeholder="Question" />
          <input class="train-tags" placeholder="Tags (comma-separated)" />
        </div>
        <textarea class="train-a" placeholder="Answer"></textarea>
        <div class="actions">
          <button class="btn-add">Add Q&A</button>
          <button class="btn-clear">Clear KB</button>
        </div>
      </div>
      
    `;

    document.body.appendChild(launcher);
    document.body.appendChild(panel);

    const body = panel.querySelector('.sor-chat-body');
    const input = panel.querySelector('.sor-chat-input input');
    const sendBtn = panel.querySelector('.sor-chat-input button');
    const closeBtn = panel.querySelector('.sor-chat-close');
    const addBtn = panel.querySelector('.btn-add');
    const clearBtn = panel.querySelector('.btn-clear');
    const trainQ = panel.querySelector('.train-q');
    const trainA = panel.querySelector('.train-a');
    const trainTags = panel.querySelector('.train-tags');
    
    

    function show() { panel.classList.add('open'); input.focus(); }
    function hide() { panel.classList.remove('open'); }
    launcher.addEventListener('click', show);
    closeBtn.addEventListener('click', hide);

    function addMessage(text, who) {
      const wrap = document.createElement('div');
      wrap.className = `sor-chat-msg ${who}`;
      const bubble = document.createElement('div');
      bubble.className = 'sor-chat-bubble';
      bubble.textContent = text;
      wrap.appendChild(bubble);
      body.appendChild(wrap);
      body.scrollTop = body.scrollHeight;
    }

    function reply(text) {
      setTimeout(() => addMessage(text, 'bot'), 150);
    }

    function handleSend() {
      const q = (input.value || '').trim();
      if (!q) return;
      addMessage(q, 'user');
      input.value = '';

      (async () => {
        const best = await getBestMatch(q);
        if (best && best.item) {
          reply(best.item.a);
          showRelated(best.item, body, input);
        } else {
          reply("I'm not sure yet, but you can teach me below! Try adding this Q&A.");
        }
      })();
    }

    sendBtn.addEventListener('click', handleSend);
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') handleSend(); });

    addBtn.addEventListener('click', () => {
      const q = (trainQ.value || '').trim();
      const a = (trainA.value || '').trim();
      const t = (trainTags.value || '').trim();
      if (!q || !a) return;
      addQA(q, a, t);
      trainQ.value = '';
      trainA.value = '';
      trainTags.value = '';
      alert('Added to knowledge base! Ask me again.');
    });
    

    clearBtn.addEventListener('click', () => {
      if (!confirm('Clear the assistant knowledge base?')) return;
      localStorage.removeItem(storeKey);
      alert('Knowledge cleared.');
    });

    // Seed minimal knowledge
    if (readKB().length === 0) {
      addQA('What is ovulation?', 'Ovulation is when an ovary releases an egg, typically about 14 days before your next period in a 28-day cycle.', 'ovulation,basics');
      addQA('How can I relieve cramps?', 'Heat therapy, hydration, light exercise, and OTC pain relievers can help reduce cramps.', 'cramps,care');
      addQA('How do I track my mood?', 'In the tracker page, enter your current mood and click Track Mood. Your entries will be saved per user.', 'mood,tracker');
    }
    
  }

  document.addEventListener('DOMContentLoaded', function () {
    ui();
  });
})();

