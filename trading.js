import { calculateTradeOutcome, formatTradeSummary, normalizeUser } from './tradingLogic.mjs';

document.addEventListener('DOMContentLoaded', () => {
  const storageKey = 'novabinary-users';
  const sessionKey = 'novabinary-session';
  const balanceValue = document.getElementById('balanceValue');
  const welcomeName = document.getElementById('welcomeName');
  const tradeMessage = document.getElementById('tradeMessage');
  const priceBadge = document.getElementById('priceBadge');
  const assetName = document.getElementById('assetName');
  const currentPriceValue = document.getElementById('currentPriceValue');
  const fundingMessage = document.getElementById('fundingMessage');
  const fundingModal = document.getElementById('fundingModal');
  const closeModal = document.getElementById('closeModal');
  const fundingForm = document.getElementById('fundingForm');
  const modalTitle = document.getElementById('modalTitle');
  const modalDescription = document.getElementById('modalDescription');
  const detailLabel = document.getElementById('detailLabel');
  const fundingDetail = document.getElementById('fundingDetail');
  const fundingAmount = document.getElementById('fundingAmount');
  const candles = document.getElementById('candles');
  const fundingButtons = document.querySelectorAll('.funding-btn');
  const assetButtons = document.querySelectorAll('.asset-btn');
  const logoutBtn = document.getElementById('logoutBtn');
  const optionButtons = document.querySelectorAll('.option-btn');
  const modeButtons = document.querySelectorAll('.mode-btn');
  const stakeInput = document.getElementById('stakeInput');
  const modeDisplay = document.getElementById('modeDisplay');
  const stakeDisplay = document.getElementById('stakeDisplay');
  const modeBadge = document.getElementById('modeBadge');
  const tradeHistoryList = document.getElementById('tradeHistoryList');
  const withdrawBtn = document.getElementById('withdrawBtn');

  if (!balanceValue || !welcomeName || !tradeMessage || !priceBadge || !assetName || !currentPriceValue || !fundingMessage || !fundingModal || !closeModal || !fundingForm || !modalTitle || !modalDescription || !detailLabel || !fundingDetail || !fundingAmount || !candles || !logoutBtn || !stakeInput || !modeDisplay || !stakeDisplay || !modeBadge || !tradeHistoryList || !withdrawBtn) {
    return;
  }

  let currentUser = null;
  let currentPrice = 1.0898;
  let activeAsset = 'EUR/USD';
  let activeMode = 'demo';
  let liveTick = 0;
  let candlesData = Array.from({ length: 24 }, (_, index) => ({
    open: 1.084 + index * 0.00028 + Math.sin(index / 2.4) * 0.00018,
    high: 1.086 + index * 0.00031 + Math.cos(index / 3) * 0.00024,
    low: 1.083 + index * 0.00026 + Math.sin(index / 2.6) * 0.00015,
    close: 1.085 + index * 0.00035 + Math.cos(index / 4) * 0.00019
  }));

  const formatCurrency = (value) => `$${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  const formatPrice = (value) => value.toFixed(4);

  const loadUsers = () => {
    try {
      return JSON.parse(localStorage.getItem(storageKey)) || [];
    } catch {
      return [];
    }
  };

  const saveUsers = (users) => {
    localStorage.setItem(storageKey, JSON.stringify(users));
  };

  const getActiveBalance = () => {
    if (!currentUser) return 0;
    return activeMode === 'demo'
      ? Number(currentUser.demoBalance ?? currentUser.liveBalance ?? currentUser.balance ?? 10000)
      : Number(currentUser.liveBalance ?? currentUser.balance ?? 10000);
  };

  const setActiveBalance = (value) => {
    if (!currentUser) return;
    const numericValue = Number(value) || 0;
    if (activeMode === 'demo') {
      currentUser.demoBalance = numericValue;
      currentUser.balance = numericValue;
    } else {
      currentUser.liveBalance = numericValue;
      currentUser.balance = numericValue;
    }
  };

  const syncUser = () => {
    if (!currentUser) return;
    const users = loadUsers();
    const existing = users.find((entry) => entry.email === currentUser.email);
    if (existing) {
      existing.name = currentUser.name;
      existing.email = currentUser.email;
      existing.password = currentUser.password;
      existing.liveBalance = Number(currentUser.liveBalance ?? currentUser.balance ?? 10000);
      existing.demoBalance = Number(currentUser.demoBalance ?? currentUser.balance ?? 10000);
      existing.tradeHistory = currentUser.tradeHistory || [];
      existing.balance = activeMode === 'demo' ? existing.demoBalance : existing.liveBalance;
      existing.lastMode = activeMode;
      saveUsers(users);
    }
  };

  const updateBalance = () => {
    if (!currentUser) return;
    const balance = getActiveBalance();
    balanceValue.textContent = formatCurrency(balance);
    welcomeName.textContent = currentUser.name;
    stakeDisplay.textContent = formatCurrency(Math.max(10, Number(stakeInput.value || 10)));
    modeDisplay.textContent = activeMode === 'demo' ? 'Demo' : 'Live';
    modeBadge.textContent = activeMode === 'demo' ? 'Demo mode' : 'Live mode';
    syncUser();
  };

  const renderHistory = () => {
    if (!currentUser?.tradeHistory?.length) {
      tradeHistoryList.innerHTML = '<li>No trades yet. Start with a stake to build a history.</li>';
      return;
    }

    const recent = [...currentUser.tradeHistory].reverse().slice(0, 6);
    tradeHistoryList.innerHTML = recent.map((trade) => {
      const outcome = trade.outcome === 'win' ? 'Win' : 'Loss';
      return `<li><strong>${trade.mode.toUpperCase()}</strong> · ${trade.asset} · ${trade.direction.toUpperCase()} · ${formatCurrency(trade.stake)}<br>${outcome} · ${trade.summary}</li>`;
    }).join('');
  };

  const renderCandles = () => {
    if (!candles) return;
    const min = Math.min(...candlesData.map((candle) => candle.low));
    const max = Math.max(...candlesData.map((candle) => candle.high));
    const range = max - min || 0.001;
    candles.innerHTML = '';

    candlesData.forEach((candle, index) => {
      const x = 36 + index * 28;
      const openY = 260 - ((candle.open - min) / range) * 200;
      const closeY = 260 - ((candle.close - min) / range) * 200;
      const highY = 260 - ((candle.high - min) / range) * 200;
      const lowY = 260 - ((candle.low - min) / range) * 200;
      const isUp = candle.close >= candle.open;
      const bodyTop = Math.min(openY, closeY);
      const bodyHeight = Math.max(7, Math.abs(closeY - openY));

      const wick = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      wick.setAttribute('x1', x);
      wick.setAttribute('x2', x);
      wick.setAttribute('y1', highY);
      wick.setAttribute('y2', lowY);
      wick.setAttribute('class', `candle ${isUp ? '' : 'candle-down'}`);
      candles.appendChild(wick);

      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', x - 10);
      rect.setAttribute('y', bodyTop);
      rect.setAttribute('width', 20);
      rect.setAttribute('height', bodyHeight);
      rect.setAttribute('rx', '4');
      rect.setAttribute('class', isUp ? 'candle-body' : 'candle-body-down');
      candles.appendChild(rect);
    });

    priceBadge.textContent = `${activeAsset} ${formatPrice(currentPrice)}`;
    assetName.textContent = activeAsset;
    currentPriceValue.textContent = formatPrice(currentPrice);
  };

  const updateChart = () => {
    liveTick += 1;
    const drift = Math.sin(liveTick / 6) * 0.00016 + Math.cos(liveTick / 10) * 0.00008;
    currentPrice += drift;
    candlesData.shift();
    const lastClose = candlesData[candlesData.length - 1]?.close || currentPrice;
    const nextClose = lastClose + drift + (Math.random() > 0.5 ? 0.00012 : -0.00012);
    candlesData.push({
      open: lastClose,
      high: Math.max(lastClose, nextClose) + 0.00016,
      low: Math.min(lastClose, nextClose) - 0.00016,
      close: nextClose
    });
    renderCandles();
  };

  const openModal = (method) => {
    fundingModal.classList.remove('hidden');
    fundingModal.setAttribute('aria-hidden', 'false');
    if (method === 'mpesa') {
      modalTitle.textContent = 'Mpesa deposit';
      modalDescription.textContent = 'Enter your phone number and the request will be sent to the account owner for approval.';
      detailLabel.textContent = 'Phone number';
      fundingDetail.placeholder = 'Enter phone number';
    } else {
      modalTitle.textContent = 'Bank transfer';
      modalDescription.textContent = 'Enter your bank account number and the request will be sent to the account owner for approval.';
      detailLabel.textContent = 'Account number';
      fundingDetail.placeholder = 'Enter account number';
    }
  };

  const closeFundingModal = () => {
    fundingModal.classList.add('hidden');
    fundingModal.setAttribute('aria-hidden', 'true');
    fundingForm.reset();
    fundingAmount.value = '1000';
  };

  const authenticateUser = () => {
    const savedSession = JSON.parse(localStorage.getItem(sessionKey) || 'null');
    if (!savedSession) {
      window.location.href = 'index.html';
      return;
    }

    const users = loadUsers();
    const found = users.find((entry) => entry.email === savedSession.email);
    if (!found) {
      window.location.href = 'index.html';
      return;
    }

    currentUser = normalizeUser(found);
    currentUser.tradeHistory = Array.isArray(found.tradeHistory) ? found.tradeHistory : [];
    activeMode = currentUser.lastMode || 'demo';
    balanceValue.textContent = formatCurrency(getActiveBalance());
    welcomeName.textContent = currentUser.name;
    updateBalance();
  };

  fundingButtons.forEach((button) => {
    button.addEventListener('click', () => {
      if (!currentUser) {
        fundingMessage.textContent = 'Please log in again to fund your account.';
        return;
      }
      const method = button.dataset.method;
      if (method === 'demo') {
        setActiveBalance(getActiveBalance() + 1000);
        fundingMessage.textContent = 'Demo balance replenished. You can continue practicing.';
        updateBalance();
        return;
      }
      openModal(method);
    });
  });

  closeModal.addEventListener('click', closeFundingModal);
  fundingModal.addEventListener('click', (event) => {
    if (event.target === fundingModal) closeFundingModal();
  });

  fundingForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!currentUser) return;

    const amount = Number(fundingAmount.value || 0);
    if (!amount || amount <= 0) return;

    setActiveBalance(getActiveBalance() + amount);
    updateBalance();
    fundingMessage.textContent = `Deposit request approved for ${formatCurrency(amount)} to your ${activeMode} account.`;
    closeFundingModal();
  });

  optionButtons.forEach((button) => {
    button.addEventListener('click', () => {
      if (!currentUser) {
        tradeMessage.textContent = 'Please log in again to trade.';
        return;
      }

      const stake = Math.max(10, Number(stakeInput.value || 10));
      const balance = getActiveBalance();
      if (stake > balance) {
        tradeMessage.textContent = `Insufficient ${activeMode === 'demo' ? 'demo' : 'live'} balance for a ${formatCurrency(stake)} stake.`;
        return;
      }

      const direction = button.dataset.action;
      const entryPrice = currentPrice;
      const exitPrice = entryPrice + (direction === 'up' ? 0.0009 + Math.random() * 0.0006 : -(0.0009 + Math.random() * 0.0006));
      const outcome = calculateTradeOutcome({ mode: activeMode, stake, direction, entryPrice, exitPrice });
      const nextBalance = balance + outcome.net;
      setActiveBalance(nextBalance);
      currentUser.tradeHistory = currentUser.tradeHistory || [];
      currentUser.tradeHistory.push({
        mode: activeMode,
        asset: activeAsset,
        direction,
        stake,
        outcome: outcome.isWin ? 'win' : 'loss',
        summary: `${outcome.isWin ? 'Won' : 'Lost'} at ${formatPrice(exitPrice)}`
      });
      currentUser.lastMode = activeMode;
      updateBalance();
      renderHistory();
      updateChart();
      const summary = formatTradeSummary(outcome, activeMode, activeAsset);
      tradeMessage.textContent = `${activeMode === 'demo' ? 'Demo' : 'Live'} ${direction === 'up' ? 'Call' : 'Put'} placed on ${activeAsset}. ${summary}`;
    });
  });

  modeButtons.forEach((button) => {
    button.addEventListener('click', () => {
      if (!currentUser) {
        fundingMessage.textContent = 'Please log in again to switch trading modes.';
        return;
      }
      activeMode = button.dataset.mode;
      modeButtons.forEach((item) => item.classList.toggle('active', item === button));
      currentUser.lastMode = activeMode;
      updateBalance();
      fundingMessage.textContent = `${activeMode === 'demo' ? 'Demo' : 'Live'} account ready for staking.`;
      tradeMessage.textContent = `${activeMode === 'demo' ? 'Demo' : 'Live'} mode is active. Choose a direction and stake.`;
    });
  });

  stakeInput.addEventListener('input', () => {
    if (stakeDisplay) {
      stakeDisplay.textContent = formatCurrency(Math.max(10, Number(stakeInput.value || 10)));
    }
  });

  assetButtons.forEach((button) => {
    button.addEventListener('click', () => {
      assetButtons.forEach((item) => item.classList.remove('active'));
      button.classList.add('active');
      activeAsset = button.dataset.asset;
      renderCandles();
    });
  });

  withdrawBtn.addEventListener('click', () => {
    if (!currentUser) {
      fundingMessage.textContent = 'Please log in again to withdraw funds.';
      return;
    }

    const amount = Number(window.prompt('Enter amount to withdraw', '500'));
    if (!amount || amount <= 0) return;

    const balance = getActiveBalance();
    if (amount > balance) {
      fundingMessage.textContent = 'Withdrawal rejected. Balance is too low.';
      return;
    }

    setActiveBalance(balance - amount);
    updateBalance();
    fundingMessage.textContent = `${formatCurrency(amount)} withdrawn from your ${activeMode} account.`;
  });

  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem(sessionKey);
    window.location.href = 'index.html';
  });

  authenticateUser();
  renderHistory();
  renderCandles();
  setInterval(updateChart, 120);
});
