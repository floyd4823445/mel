document.addEventListener('DOMContentLoaded', () => {
  const registerForm = document.getElementById('registerForm');
  const loginForm = document.getElementById('loginForm');
  const authMessage = document.getElementById('authMessage');
  const dashboard = document.getElementById('dashboard');
  const welcomeName = document.getElementById('welcomeName');
  const balanceValue = document.getElementById('balanceValue');
  const tradeMessage = document.getElementById('tradeMessage');
  const priceBadge = document.getElementById('priceBadge');
  const assetName = document.getElementById('assetName');
  const tradeButtons = document.querySelectorAll('.trade-btn');
  const fundingButtons = document.querySelectorAll('.funding-btn');
  const fundingMessage = document.getElementById('fundingMessage');
  const candles = document.getElementById('candles');
  const storageKey = 'novabinary-users';
  const sessionKey = 'novabinary-session';

  if (!registerForm || !loginForm) {
    return;
  }

  let currentUser = null;
  let currentPrice = 1.0898;
  let candlesData = Array.from({ length: 18 }, (_, index) => ({
    open: 1.084 + index * 0.00035 + Math.sin(index / 2) * 0.00018,
    high: 1.086 + index * 0.0004 + Math.cos(index / 3) * 0.00025,
    low: 1.083 + index * 0.0003 + Math.sin(index / 2.5) * 0.00015,
    close: 1.085 + index * 0.00045 + Math.cos(index / 4) * 0.0002
  }));

  const formatCurrency = (value) => `$${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  const formatPrice = (value) => value.toFixed(4);

  const saveUsers = (users) => {
    localStorage.setItem(storageKey, JSON.stringify(users));
  };

  const loadUsers = () => {
    try {
      return JSON.parse(localStorage.getItem(storageKey)) || [];
    } catch {
      return [];
    }
  };

  const revealDashboard = (user) => {
    currentUser = user;
    if (welcomeName) welcomeName.textContent = `Welcome back, ${user.name}`;
    if (balanceValue) balanceValue.textContent = formatCurrency(user.balance);
    dashboard.classList.remove('hidden');
    if (authMessage) authMessage.textContent = 'Logged in successfully. You can now trade.';
    if (tradeMessage) tradeMessage.textContent = 'You are ready to start trading.';
  };

  const updateBalance = () => {
    if (currentUser && balanceValue) {
      balanceValue.textContent = formatCurrency(currentUser.balance);
      const users = loadUsers();
      const existing = users.find((entry) => entry.email === currentUser.email);
      if (existing) {
        existing.balance = currentUser.balance;
        saveUsers(users);
      }
    }
  };

  const setMessage = (message, isError = false) => {
    if (!authMessage) return;
    authMessage.textContent = message;
    authMessage.style.color = isError ? '#fda4af' : '#9cefc9';
  };

  const renderCandles = () => {
    if (!candles) return;
    const width = 660;
    const height = 220;
    const min = Math.min(...candlesData.map((candle) => candle.low));
    const max = Math.max(...candlesData.map((candle) => candle.high));
    const range = max - min || 0.001;

    candles.innerHTML = '';

    candlesData.forEach((candle, index) => {
      const x = 30 + index * 34;
      const openY = 200 - ((candle.open - min) / range) * 160;
      const closeY = 200 - ((candle.close - min) / range) * 160;
      const highY = 200 - ((candle.high - min) / range) * 160;
      const lowY = 200 - ((candle.low - min) / range) * 160;
      const isUp = candle.close >= candle.open;
      const bodyTop = Math.min(openY, closeY);
      const bodyHeight = Math.max(6, Math.abs(closeY - openY));

      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', x);
      line.setAttribute('x2', x);
      line.setAttribute('y1', highY);
      line.setAttribute('y2', lowY);
      line.setAttribute('class', `candle ${isUp ? '' : 'candle-down'}`);
      candles.appendChild(line);

      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', x - 8);
      rect.setAttribute('y', bodyTop);
      rect.setAttribute('width', 16);
      rect.setAttribute('height', bodyHeight);
      rect.setAttribute('rx', '4');
      rect.setAttribute('class', isUp ? 'candle-body' : 'candle-body-down');
      candles.appendChild(rect);
    });

    priceBadge.textContent = `EUR/USD ${formatPrice(currentPrice)}`;
    assetName.textContent = 'EUR/USD';
  };

  const updateChart = () => {
    currentPrice += (Math.random() > 0.5 ? 1 : -1) * (Math.random() * 0.0007 + 0.0002);
    candlesData.shift();
    const lastClose = candlesData[candlesData.length - 1]?.close || currentPrice;
    candlesData.push({
      open: lastClose,
      high: lastClose + Math.random() * 0.0006 + 0.0001,
      low: lastClose - Math.random() * 0.0006 - 0.0001,
      close: lastClose + (Math.random() > 0.5 ? 1 : -1) * (Math.random() * 0.0006 + 0.0001)
    });
    renderCandles();
  };

  registerForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const name = document.getElementById('registerName').value.trim();
    const email = document.getElementById('registerEmail').value.trim().toLowerCase();
    const password = document.getElementById('registerPassword').value;

    const users = loadUsers();
    const existing = users.find((entry) => entry.email === email);

    if (existing) {
      setMessage('An account with that email already exists. Please log in.', true);
      return;
    }

    users.push({ name, email, password, balance: 10000, liveBalance: 10000, demoBalance: 10000, tradeHistory: [] });
    saveUsers(users);
    registerForm.reset();
    setMessage('Registration successful. Please log in to enter the trading room.');
  });

  loginForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const email = document.getElementById('loginEmail').value.trim().toLowerCase();
    const password = document.getElementById('loginPassword').value;
    const users = loadUsers();
    const found = users.find((entry) => entry.email === email && entry.password === password);

    if (!found) {
      setMessage('Invalid credentials. Please check your email and password.', true);
      return;
    }

    currentUser = found;
    localStorage.setItem(sessionKey, JSON.stringify(found));
    loginForm.reset();
    window.setTimeout(() => {
      window.location.assign('trading.html');
    }, 0);
  });

  tradeButtons.forEach((button) => {
    button.addEventListener('click', () => {
      if (!currentUser) {
        tradeMessage.textContent = 'Please log in before trading.';
        return;
      }

      const action = button.dataset.action;
      if (action === 'buy') {
        currentUser.balance -= Math.round(currentPrice * 1000);
        tradeMessage.textContent = `Buy order placed at ${formatPrice(currentPrice)}.`;
      } else {
        currentUser.balance += Math.round(currentPrice * 1000);
        tradeMessage.textContent = `Sell order placed at ${formatPrice(currentPrice)}.`;
      }

      updateBalance();
    });
  });

  fundingButtons.forEach((button) => {
    button.addEventListener('click', () => {
      if (!currentUser) {
        fundingMessage.textContent = 'Please log in to fund your account.';
        return;
      }

      const method = button.dataset.method;
      if (method === 'bank') {
        currentUser.balance += 5000;
        fundingMessage.textContent = 'Bank transfer received. Your balance has been credited.';
      } else if (method === 'mpesa') {
        currentUser.balance += 3000;
        fundingMessage.textContent = 'Mpesa deposit received. Your balance has been credited.';
      } else {
        fundingMessage.textContent = 'Demo balance selected. You can continue practicing.';
      }

      updateBalance();
    });
  });

  const savedSession = JSON.parse(localStorage.getItem(sessionKey) || 'null');
  if (savedSession) {
    const users = loadUsers();
    const found = users.find((entry) => entry.email === savedSession.email);
    if (found) {
      window.location.href = 'trading.html';
    }
  }

  renderCandles();
  setInterval(updateChart, 900);
});
