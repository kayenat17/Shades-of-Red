
// Simple client-side auth state and persistence via localStorage

function readUsers() {
  try {
    const raw = localStorage.getItem('sor_users');
    return raw ? JSON.parse(raw) : {};
  } catch (error) {
    return {};
  }
}

function writeUsers(users) {
  localStorage.setItem('sor_users', JSON.stringify(users));
}

function setCurrentUser(email) {
  localStorage.setItem('sor_current_user', email);
}

function hashPassword(plain) {
  // Simple non-cryptographic hash for demo purposes only
  let hash = 0;
  for (let i = 0; i < plain.length; i += 1) {
    hash = (hash << 5) - hash + plain.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  return String(hash);
}

// Forms
const signUpForm = document.getElementById('signUpForm');
const signInForm = document.getElementById('signInForm');

if (signUpForm) {
  signUpForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('signUpName').value.trim();
    const email = document.getElementById('signUpEmail').value.trim().toLowerCase();
    const password = document.getElementById('signUpPassword').value;

    if (!name) {
      alert('Please enter your name.');
      return;
    }
    if (!email) {
      alert('Please enter a valid email.');
      return;
    }
    if (!password || password.length < 6) {
      alert('Password must be at least 6 characters.');
      return;
    }
    const users = readUsers();
    if (users[email]) {
      alert('An account with this email already exists.');
      return;
    }

    users[email] = {
      name,
      passwordHash: hashPassword(password),
      tracker: {
        lastPeriodISO: '',
        ovulationDateISO: '',
      },
      moods: [],
    };
    writeUsers(users);
    setCurrentUser(email);
    window.location.href = 'sor.html';
  });
}

if (signInForm) {
  signInForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('signInEmail').value.trim().toLowerCase();
    const password = document.getElementById('signInPassword').value;

    const users = readUsers();
    const record = users[email];
    if (!record || record.passwordHash !== hashPassword(password)) {
      alert('Invalid email or password.');
      return;
    }
    setCurrentUser(email);
    window.location.href = 'sor.html';
  });
}
