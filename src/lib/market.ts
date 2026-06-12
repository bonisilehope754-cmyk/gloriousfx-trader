export const ALLOWED_PAIRS = ["EURUSD", "GBPUSD", "XAUUSD", "BTCUSD", "US30", "US100"];
export const SYNTHETIC_PAIRS = ["Volatility 75", "Boom 1000", "Crash 1000", "Volatility 25", "Volatility 100"];
export const ALL_TRADING_PAIRS = [...ALLOWED_PAIRS, ...SYNTHETIC_PAIRS];

export type MarketStatus = {
  isOpen: boolean;
  isWeekend: boolean;
  cryptoActive: boolean;
  label: string;
  session: string;
};

export function getMarketStatus(): MarketStatus {
  const now = new Date();
  const utcDay = now.getUTCDay();
  const utcHour = now.getUTCHours();

  const isWeekend =
    utcDay === 6 ||
    (utcDay === 5 && utcHour >= 22) ||
    (utcDay === 0 && utcHour < 22);

  if (isWeekend) {
    return {
      isOpen: false,
      isWeekend: true,
      cryptoActive: true,
      label: "Forex & Equity Markets Closed",
      session: "Weekend",
    };
  }

  let session = "Pre-Market";
  if (utcHour >= 8 && utcHour < 17) session = "London Session";
  else if (utcHour >= 13 && utcHour < 22) session = "New York Session";
  else if (utcHour >= 22 || utcHour < 7) session = "Asia/Pacific Session";

  return {
    isOpen: true,
    isWeekend: false,
    cryptoActive: true,
    label: "Markets Open",
    session,
  };
}

export function apiFetch(path: string, options?: RequestInit) {
  const token = localStorage.getItem("apex_token");
  return fetch(`/api/${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options?.headers || {}),
    },
  }).then(async (r) => {
    if (!r.ok) {
      const body = await r.text().catch(() => "");
      throw new Error(body || `HTTP ${r.status}`);
    }
    return r.json();
  });
}
