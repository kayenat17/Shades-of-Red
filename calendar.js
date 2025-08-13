(function(){
  const WEEKDAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  function getUsersStore() {
    try { return JSON.parse(localStorage.getItem('sor_users') || '{}'); } catch(e){ return {}; }
  }
  function setUsersStore(obj) { localStorage.setItem('sor_users', JSON.stringify(obj)); }
  function getCurrentUserEmail() { return localStorage.getItem('sor_current_user') || ''; }
  function getCurrentUserRecord() { const u = getUsersStore(); const e = getCurrentUserEmail(); return e ? (u[e]||null):null; }
  function setCurrentUserRecord(updated){ const u = getUsersStore(); const e = getCurrentUserEmail(); if(!e) return; u[e]=updated; setUsersStore(u); }

  function startOfMonth(d){ return new Date(d.getFullYear(), d.getMonth(), 1); }
  function endOfMonth(d){ return new Date(d.getFullYear(), d.getMonth()+1, 0); }
  function sameDay(a,b){ return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate(); }
  function toISO(d){ return d.toISOString().slice(0,10); }

  function computeFertility(lastISO, cycleLen){
    if(!lastISO) return null;
    const length = Number.isFinite(cycleLen) ? cycleLen : 28;
    const last = new Date(lastISO);
    const nextOv = new Date(last); nextOv.setDate(nextOv.getDate() + Math.max(1, length - 14));
    const windowStart = new Date(nextOv); windowStart.setDate(windowStart.getDate()-5);
    const windowEnd = new Date(nextOv); windowEnd.setDate(windowEnd.getDate()+1);
    return { ovulation: nextOv, windowStart, windowEnd };
  }

  function renderCalendar(root){
    const container = document.createElement('div');
    container.className = 'cal-card';

    const header = document.createElement('div');
    header.className = 'cal-header';
    const title = document.createElement('div'); title.className='cal-title';
    const controls = document.createElement('div'); controls.className='cal-controls';

    const prevBtn = document.createElement('button'); prevBtn.className='cal-btn'; prevBtn.textContent='◀';
    const nextBtn = document.createElement('button'); nextBtn.className='cal-btn'; nextBtn.textContent='▶';
    const todayBtn = document.createElement('button'); todayBtn.className='cal-btn primary'; todayBtn.textContent='Today';
    controls.append(prevBtn, todayBtn, nextBtn);
    header.append(title, controls);

    const grid = document.createElement('div'); grid.className='cal-grid';
    WEEKDAYS.forEach((w) => { const d = document.createElement('div'); d.className='cal-weekday'; d.textContent=w; grid.appendChild(d); });

    container.append(header, grid);
    root.innerHTML='';
    root.appendChild(container);

    // State
    let current = new Date();
    const user = getCurrentUserRecord();
    let startISO = user?.calendar?.startISO || user?.tracker?.lastPeriodISO || '';
    let endISO = user?.calendar?.endISO || '';
    const cycleLen = user?.tracker?.cycleLengthDays || 28;

    function updateTitle(){
      title.textContent = current.toLocaleString(undefined, { month: 'long', year: 'numeric' });
    }

    function within(date, start, end){ if(!start||!end) return false; return date>=start && date<=end; }

    function draw(){
      grid.querySelectorAll('.cal-day').forEach((n)=>n.remove());
      const first = startOfMonth(current);
      const last = endOfMonth(current);
      const today = new Date(); today.setHours(0,0,0,0);
      const offset = first.getDay();

      const selectedStart = startISO ? new Date(startISO) : null;
      const selectedEnd = endISO ? new Date(endISO) : null;
      const fertile = computeFertility(startISO, cycleLen);

      // Leading blanks
      for(let i=0;i<offset;i+=1){ const cell=document.createElement('div'); cell.className='cal-day muted'; grid.appendChild(cell); }
      // Days
      for(let d=1; d<= last.getDate(); d+=1){
        const date = new Date(current.getFullYear(), current.getMonth(), d);
        const cell = document.createElement('div'); cell.className='cal-day'; cell.textContent=String(d);
        if (sameDay(date, today)) cell.classList.add('today');
        if (selectedStart && selectedEnd && within(date, selectedStart, selectedEnd)) cell.classList.add('period');
        if (selectedStart && sameDay(date, selectedStart)) cell.classList.add('period-start');
        if (selectedEnd && sameDay(date, selectedEnd)) cell.classList.add('period-end');
        if (fertile) {
          if (within(date, new Date(fertile.windowStart), new Date(fertile.windowEnd))) cell.classList.add('fertile');
          if (sameDay(date, new Date(fertile.ovulation))) cell.classList.add('ovulation');
        }
        // Mood dot example: show dot when any mood exists that day
        const moods = Array.isArray(user?.moods) ? user.moods : [];
        if (moods.some((m)=> (m.timestampISO||'').slice(0,10) === toISO(date))) {
          const dot = document.createElement('div'); dot.className='mood-dot'; cell.appendChild(dot);
        }
        cell.addEventListener('click', ()=> onSelect(date));
        grid.appendChild(cell);
      }
      updateTitle();
    }

    function onSelect(date){
      // Cycle selection: pick start then end; if both set, reset to new start
      if (!startISO) {
        startISO = toISO(date);
        endISO = '';
      } else if (!endISO) {
        const start = new Date(startISO);
        if (date >= start) endISO = toISO(date);
        else { startISO = toISO(date); endISO=''; }
      } else {
        startISO = toISO(date); endISO='';
      }
      persist();
      draw();
    }

    function persist(){
      const u = getCurrentUserRecord(); if (!u) return;
      const updated = {
        ...u,
        calendar: { ...(u.calendar||{}), startISO, endISO, year: current.getFullYear(), month: current.getMonth() },
        tracker: { ...(u.tracker||{}), lastPeriodISO: startISO },
      };
      setCurrentUserRecord(updated);
    }

    prevBtn.addEventListener('click', ()=>{ current.setMonth(current.getMonth()-1); draw(); });
    nextBtn.addEventListener('click', ()=>{ current.setMonth(current.getMonth()+1); draw(); });
    todayBtn.addEventListener('click', ()=>{ current = new Date(); draw(); });

    draw();
  }

  window.SORCalendar = { renderCalendar };
})();

