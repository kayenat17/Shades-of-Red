// Minimal client-side persistence for ovulation and mood tracking, keyed by logged-in user

(function () {
  const lastPeriodInput = document.getElementById('lastPeriod');
  const ovulationDateElement = document.getElementById('ovulationDate');
  const moodInput = document.getElementById('mood');
  const moodListElement = document.getElementById('moodList');
  const userInfoElement = document.getElementById('userInfo');
  const logoutBtn = document.getElementById('logoutBtn');
  const insightsContent = document.getElementById('insightsContent');
  const cycleLengthInput = document.getElementById('cycleLength');
  const saveCycleLengthBtn = document.getElementById('saveCycleLength');
  const fertileWindowEl = document.getElementById('fertileWindow');
  const moodChartCanvas = document.getElementById('moodChart');
  
  const notifToggle = document.getElementById('notifToggle');
  const notifTime = document.getElementById('notifTime');
  const saveNotifBtn = document.getElementById('saveNotifBtn');

  function getUsersStore() {
    try {
      const raw = localStorage.getItem('sor_users');
      return raw ? JSON.parse(raw) : {};
    } catch (error) {
      return {};
    }
  }

  function setUsersStore(users) {
    localStorage.setItem('sor_users', JSON.stringify(users));
  }

  function getCurrentUserEmail() {
    return localStorage.getItem('sor_current_user') || '';
  }

  function getCurrentUserRecord() {
    const email = getCurrentUserEmail();
    if (!email) return null;
    const users = getUsersStore();
    return users[email] || null;
  }

  function setCurrentUserRecord(updatedRecord) {
    const email = getCurrentUserEmail();
    if (!email) return;
    const users = getUsersStore();
    users[email] = updatedRecord;
    setUsersStore(users);
  }

  function calculateFertileWindow(lastPeriodISO, cycleLengthDays) {
    if (!lastPeriodISO) return null;
    const length = Number.isFinite(cycleLengthDays) ? cycleLengthDays : 28;
    // Approximate ovulation at length - 14 days from next period, which is at lastPeriod + length
    const ovulation = addDaysToDateString(lastPeriodISO, length - 14);
    if (!ovulation) return null;
    const start = new Date(ovulation.getTime());
    start.setDate(start.getDate() - 5);
    const end = new Date(ovulation.getTime());
    end.setDate(end.getDate() + 1);
    return { ovulation, windowStart: start, windowEnd: end };
  }

  function addDaysToDateString(isoDateString, daysToAdd) {
    const baseDate = new Date(isoDateString);
    if (Number.isNaN(baseDate.getTime())) return null;
    const result = new Date(baseDate.getTime());
    result.setDate(result.getDate() + daysToAdd);
    return result;
  }

  function formatDateForDisplay(date) {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  function renderExistingData() {
    const user = getCurrentUserRecord();
    if (!user) return;

    if (userInfoElement) {
      const email = getCurrentUserEmail();
      userInfoElement.textContent = `Logged in as: ${user.name ? user.name + ' (' + email + ')' : email}`;
    }

    if (user.tracker && user.tracker.lastPeriodISO) {
      if (lastPeriodInput) lastPeriodInput.value = user.tracker.lastPeriodISO;
    }

    if (user.tracker && user.tracker.ovulationDateISO) {
      const ovulationDate = new Date(user.tracker.ovulationDateISO);
      if (ovulationDateElement) {
        ovulationDateElement.textContent = `Estimated ovulation date: ${formatDateForDisplay(ovulationDate)}`;
      }
    }

    if (cycleLengthInput) {
      const cl = user.tracker && Number(user.tracker.cycleLengthDays);
      cycleLengthInput.value = Number.isFinite(cl) && cl > 0 ? String(cl) : '';
    }

    // Fertile window
    if (fertileWindowEl) {
      const lastISO = user.tracker?.lastPeriodISO || '';
      const cycleLen = user.tracker?.cycleLengthDays || 28;
      const fw = calculateFertileWindow(lastISO, cycleLen);
      if (fw) {
        fertileWindowEl.textContent = `Fertile window: ${formatDateForDisplay(fw.windowStart)} to ${formatDateForDisplay(fw.windowEnd)} (Ovulation ~ ${formatDateForDisplay(fw.ovulation)})`;
      } else {
        fertileWindowEl.textContent = '';
      }
    }

    if (Array.isArray(user.moods) && moodListElement) {
      moodListElement.innerHTML = '';
      user.moods.forEach((moodEntry) => {
        const listItem = document.createElement('li');
        const when = moodEntry.timestampISO
          ? new Date(moodEntry.timestampISO)
          : null;
        const whenText = when ? ` (${formatDateForDisplay(when)})` : '';
        listItem.textContent = `${moodEntry.text}${whenText}`;
        moodListElement.appendChild(listItem);
      });
    }

    // Render insights
    if (insightsContent && window.SORAnalytics && typeof window.SORAnalytics.summarize === 'function') {
      const summary = window.SORAnalytics.summarize();
      if (summary) {
        const nextPeriodText = summary.nextPeriodDate
          ? new Date(summary.nextPeriodDate).toLocaleDateString()
          : '—';
        insightsContent.innerHTML = `
          <div><strong>Total mood entries:</strong> ${summary.moodCount}</div>
          <div><strong>Last period:</strong> ${summary.lastPeriodISO || '—'}</div>
          <div><strong>Predicted next period:</strong> ${nextPeriodText}</div>
        `;
      }
    }

    // Render mood chart (simple count per day)
    if (moodChartCanvas && window.Chart) {
      const moods = Array.isArray(user.moods) ? user.moods : [];
      const byDay = new Map();
      moods.forEach((m) => {
        const d = m.timestampISO ? m.timestampISO.slice(0, 10) : 'unknown';
        byDay.set(d, (byDay.get(d) || 0) + 1);
      });
      const labels = Array.from(byDay.keys()).sort();
      const data = labels.map((d) => byDay.get(d));
      const ctx = moodChartCanvas.getContext('2d');
      // eslint-disable-next-line no-new
      new Chart(ctx, {
        type: 'line',
        data: {
          labels,
          datasets: [
            {
              label: 'Mood entries per day',
              data,
              borderColor: '#b24141',
              backgroundColor: 'rgba(178,65,65,0.15)',
              tension: 0.25,
            },
          ],
        },
        options: {
          responsive: true,
          plugins: { legend: { display: true } },
          scales: { x: { display: true }, y: { beginAtZero: true, precision: 0 } },
        },
      });
    }
  }

  function ensureAuthenticatedOrRedirect() {
    const email = getCurrentUserEmail();
    if (!email) {
      // Redirect to login when not authenticated
      window.location.href = 'try2.html';
    }
  }

  // Expose functions expected by sor.html buttons
  window.calculateOvulation = function calculateOvulation() {
    ensureAuthenticatedOrRedirect();

    if (!lastPeriodInput || !ovulationDateElement) return;
    const lastPeriodISO = lastPeriodInput.value;
    if (!lastPeriodISO) {
      ovulationDateElement.textContent = 'Please select your last period date first.';
      return;
    }

    // Typical assumption: ovulation ~14 days after start of last period in a 28-day cycle
    const userBefore = getCurrentUserRecord();
    const cycleLengthDays = (userBefore && Number(userBefore.tracker?.cycleLengthDays)) || 28;
    const ovulationDate = addDaysToDateString(lastPeriodISO, Math.max(1, cycleLengthDays - 14));
    if (!ovulationDate) {
      ovulationDateElement.textContent = 'Invalid date. Please try again.';
      return;
    }

    ovulationDateElement.textContent = `Estimated ovulation date: ${formatDateForDisplay(ovulationDate)}`;

    const user = getCurrentUserRecord();
    if (!user) return;
    const updated = {
      ...user,
      tracker: {
        lastPeriodISO,
        ovulationDateISO: ovulationDate.toISOString(),
        cycleLengthDays: Number.isFinite(Number(user.tracker?.cycleLengthDays)) ? Number(user.tracker.cycleLengthDays) : 28,
      },
    };
    setCurrentUserRecord(updated);

    // Update fertile window text
    if (fertileWindowEl) {
      const fw = calculateFertileWindow(lastPeriodISO, updated.tracker.cycleLengthDays);
      if (fw) {
        fertileWindowEl.textContent = `Fertile window: ${formatDateForDisplay(fw.windowStart)} to ${formatDateForDisplay(fw.windowEnd)} (Ovulation ~ ${formatDateForDisplay(fw.ovulation)})`;
      }
    }
  };

  window.trackMood = function trackMood() {
    ensureAuthenticatedOrRedirect();

    if (!moodInput || !moodListElement) return;
    const moodText = (moodInput.value || '').trim();
    if (!moodText) return;

    const user = getCurrentUserRecord();
    if (!user) return;

    const moodEntry = {
      text: moodText,
      timestampISO: new Date().toISOString(),
    };

    const updated = {
      ...user,
      moods: Array.isArray(user.moods) ? [...user.moods, moodEntry] : [moodEntry],
    };
    setCurrentUserRecord(updated);

    // Update UI
    const listItem = document.createElement('li');
    listItem.textContent = `${moodEntry.text} (${formatDateForDisplay(new Date(moodEntry.timestampISO))})`;
    moodListElement.appendChild(listItem);
    moodInput.value = '';
  };

  document.addEventListener('DOMContentLoaded', function onReady() {
    ensureAuthenticatedOrRedirect();
    renderExistingData();

    if (logoutBtn) {
      logoutBtn.addEventListener('click', function () {
        localStorage.removeItem('sor_current_user');
        window.location.href = 'try2.html';
      });
    }

    if (saveCycleLengthBtn && cycleLengthInput) {
      saveCycleLengthBtn.addEventListener('click', function () {
        const user = getCurrentUserRecord();
        if (!user) return;
        const val = Number(cycleLengthInput.value);
        if (!Number.isFinite(val) || val < 15 || val > 60) {
          alert('Please enter a cycle length between 15 and 60 days.');
          return;
        }
        const updated = {
          ...user,
          tracker: {
            ...user.tracker,
            cycleLengthDays: val,
          },
        };
        setCurrentUserRecord(updated);
        // Recalculate displays if a last period is set
        if (updated.tracker.lastPeriodISO) {
          const ov = addDaysToDateString(updated.tracker.lastPeriodISO, Math.max(1, val - 14));
          if (ovulationDateElement && ov) {
            ovulationDateElement.textContent = `Estimated ovulation date: ${formatDateForDisplay(ov)}`;
          }
          if (fertileWindowEl) {
            const fw = calculateFertileWindow(updated.tracker.lastPeriodISO, val);
            if (fw) {
              fertileWindowEl.textContent = `Fertile window: ${formatDateForDisplay(fw.windowStart)} to ${formatDateForDisplay(fw.windowEnd)} (Ovulation ~ ${formatDateForDisplay(fw.ovulation)})`;
            }
          }
        }
      });
    }

    // Data management removed per request

    // Daily reminders (in-app when open)
    if (saveNotifBtn && notifToggle && notifTime) {
      saveNotifBtn.addEventListener('click', async function () {
        const enabled = notifToggle.checked;
        const time = notifTime.value || '09:00';
        const email = getCurrentUserEmail();
        const user = getCurrentUserRecord();
        if (!email || !user) return;

        if (enabled) {
          const ok = await (window.requestSorNotificationPermission?.() || Promise.resolve(false));
          if (!ok) {
            alert('Notification permission not granted.');
            notifToggle.checked = false;
            return;
          }
        }

        const updated = {
          ...user,
          notifications: { enabled, time },
        };
        setCurrentUserRecord(updated);
        alert('Reminder saved. Leave this tab open for in-app daily notifications.');

        // Set up a simple interval for demo: checks every minute
        if (enabled) {
          scheduleDailyReminder(time);
        }
      });
    }

    // Render calendar on tracker page
    const calendarRoot = document.getElementById('calendarRoot');
    if (calendarRoot && window.SORCalendar) {
      window.SORCalendar.renderCalendar(calendarRoot);
    }
  });

  function scheduleDailyReminder(hhmm) {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    const [hh, mm] = hhmm.split(':').map((n) => Number(n));
    // Clear any existing interval attached to window
    if (window.__sorReminderInterval) {
      clearInterval(window.__sorReminderInterval);
    }
    window.__sorReminderInterval = setInterval(() => {
      const now = new Date();
      if (now.getHours() === hh && now.getMinutes() === mm && now.getSeconds() < 2) {
        const summary = (window.SORAnalytics && window.SORAnalytics.summarize && window.SORAnalytics.summarize()) || null;
        const next = summary && summary.nextPeriodDate ? new Date(summary.nextPeriodDate).toLocaleDateString() : '';
        const body = next ? `Next period predicted: ${next}` : 'Log your mood today.';
        // eslint-disable-next-line no-new
        new Notification('Shades of Red', { body });
      }
    }, 1000);
  }
})();

