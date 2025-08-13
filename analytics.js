// Simple on-device analytics & predictions using stored data
(function () {
  function readUsers() {
    try {
      const raw = localStorage.getItem('sor_users');
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function getCurrentUserEmail() {
    return localStorage.getItem('sor_current_user') || '';
  }

  function getCurrentUserRecord() {
    const email = getCurrentUserEmail();
    if (!email) return null;
    const users = readUsers();
    return users[email] || null;
  }

  function calcNextPeriodPrediction(lastPeriodISO, cycleLengthDays) {
    if (!lastPeriodISO) return null;
    const base = new Date(lastPeriodISO);
    const length = Number.isFinite(cycleLengthDays) ? cycleLengthDays : 28;
    const next = new Date(base.getTime());
    next.setDate(base.getDate() + length);
    return next;
  }

  // Public API
  window.SORAnalytics = {
    summarize() {
      const user = getCurrentUserRecord();
      if (!user) return null;
      const moods = Array.isArray(user.moods) ? user.moods : [];
      const moodCount = moods.length;
      const lastPeriodISO = user.tracker?.lastPeriodISO || '';
      const nextPeriod = calcNextPeriodPrediction(lastPeriodISO, user.tracker?.cycleLengthDays || 28);
      return {
        moodCount,
        lastPeriodISO,
        nextPeriodDate: nextPeriod ? nextPeriod.toISOString() : '',
      };
    },
  };
})();

