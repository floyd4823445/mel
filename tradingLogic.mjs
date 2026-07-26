export function normalizeUser(user) {
  const liveBalance = Number(user?.liveBalance ?? user?.balance ?? 10000);
  const demoBalance = Number(user?.demoBalance ?? user?.balance ?? 10000);

  return {
    ...user,
    balance: liveBalance,
    liveBalance,
    demoBalance,
    tradeHistory: Array.isArray(user?.tradeHistory) ? user.tradeHistory : []
  };
}

export function calculateTradeOutcome({ mode, stake, direction, entryPrice, exitPrice }) {
  const normalizedStake = Math.max(10, Number(stake) || 10);
  const payoutMultiplier = mode === 'demo' ? 0.85 : 0.8;
  const isWin = direction === 'up'
    ? exitPrice > entryPrice
    : exitPrice < entryPrice;
  const payout = Math.round(normalizedStake + normalizedStake * payoutMultiplier);
  const net = isWin ? payout - normalizedStake : -normalizedStake;

  return {
    isWin,
    payout,
    net,
    exitPrice,
    entryPrice,
    stake: normalizedStake
  };
}

export function formatTradeSummary(result, mode, asset) {
  const outcome = result.isWin ? 'won' : 'lost';
  const sign = result.net >= 0 ? '+' : '-';
  return `${mode.toUpperCase()} ${asset} trade ${outcome}. ${sign}${Math.abs(result.net)} cash ${result.isWin ? 'earned' : 'deducted'}`;
}
