'use client';

import { useSyncExternalStore } from 'react';

export type PageTab =
  | 'dashboard'
  | 'deposit'
  | 'withdraw'
  | 'transfer'
  | 'swap'
  | 'transactions'
  | 'plans'
  | 'my-investments'
  | 'vacation-portal'
  | 'real-estate'
  | 'kyc'
  | 'profile'
  | 'referrals'
  | 'contact'
  | 'admin'
  | 'apk';

export type AccountType = 'Individual' | 'Joint';
export type UserRole = 'investor' | 'admin';
export type KycStatus = 'Unverified' | 'Pending' | 'Approved' | 'Rejected';
export type CryptoAssetSymbol = 'USD' | 'USDC' | 'ETH' | 'BTC' | 'USDT' | 'BNB' | 'SOL' | 'XRP';

export interface JointOwnerDetails {
  coOwnerName: string;
  coOwnerEmail: string;
  relationship: string;
  authorizationMode: 'Either Owner' | 'Dual Notice';
}

export interface KycSubmission {
  legalName: string;
  country: string;
  documentType: 'Passport' | 'National ID' | 'Driver License';
  documentNumber: string;
  idFrontDataUrl: string;
  idFrontName: string;
  selfieDataUrl: string;
  selfieName: string;
  submittedAt: string;
  reviewedAt?: string;
  adminNote?: string;
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  accountType: AccountType;
  jointDetails?: JointOwnerDetails;
  avatarDataUrl?: string;
  referralCode: string;
  accountBalance: number;
  totalProfit: number;
  bonus: number;
  referralBonus: number;
  totalDeposit: number;
  cryptoBalances: Record<Exclude<CryptoAssetSymbol, 'USD'>, number>;
  kycStatus: KycStatus;
  kycSubmission?: KycSubmission;
  createdAt: string;
}

export interface TransactionRecord {
  id: string;
  userId: string;
  type: 'Deposit' | 'Withdrawal' | 'Transfer Out' | 'Transfer In' | 'Swap' | 'Investment' | 'Bonus';
  method: string;
  amount: number;
  status: 'Completed' | 'Pending' | 'Cancelled';
  date: string;
  note?: string;
  proofName?: string;
  proofDataUrl?: string;
}

export interface ActiveInvestment {
  id: string;
  userId: string;
  category: 'Standard' | 'Vacation' | 'Real Estate';
  planName: string;
  amount: number;
  dailyRate: string;
  durationDays: number;
  status: 'Active';
  startedAt: string;
  meta?: string;
}

export interface VisitorLocationLog {
  id: string;
  refCode: string;
  clickedUrl: string;
  latitude: string;
  longitude: string;
  accuracyLabel: string;
  timezone: string;
  language: string;
  deviceSummary: string;
  timestamp: string;
}

export interface ContactTicket {
  id: string;
  userId: string;
  senderEmail: string;
  targetDeskEmail: string;
  subject: string;
  message: string;
  date: string;
}

export interface AssetCrestStore {
  activeUserId: string | null;
  users: UserAccount[];
  transactions: TransactionRecord[];
  investments: ActiveInvestment[];
  locationLogs: VisitorLocationLog[];
  tickets: ContactTicket[];
  welcomeModalUserId: string | null;
}

export interface PaymentMethodOption {
  id: string;
  label: string;
  subtitle: string;
  networkType: string;
  address: string;
  symbol: Exclude<CryptoAssetSymbol, 'USD'>;
}

export const PAYMENT_METHODS: PaymentMethodOption[] = [
  {
    id: 'usdc-bep20',
    label: 'USDC (BEP20)',
    subtitle: 'Pay via usdc (bep20)',
    networkType: 'BEP20',
    address: '0xD0E2f9e3c73A4aaDF4436F2b7cef9255b8a41E92',
    symbol: 'USDC',
  },
  {
    id: 'eth',
    label: 'Ethereum',
    subtitle: 'Pay via ethereum',
    networkType: 'ERC20',
    address: '0xD0E2f9e3c73A4aaDF4436F2b7cef9255b8a41E92',
    symbol: 'ETH',
  },
  {
    id: 'btc',
    label: 'Bitcoin',
    subtitle: 'Pay via bitcoin',
    networkType: 'BTC',
    address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
    symbol: 'BTC',
  },
  {
    id: 'usdt-bep20',
    label: 'USDT (BEP20)',
    subtitle: 'Pay via usdt (bep20)',
    networkType: 'BEP20',
    address: '0xD0E2f9e3c73A4aaDF4436F2b7cef9255b8a41E92',
    symbol: 'USDT',
  },
  {
    id: 'usdt-trc20',
    label: 'USDT (TRC20)',
    subtitle: 'Pay via usdt (trc20)',
    networkType: 'TRC20',
    address: 'TX9aK3vPq8L2mN5xR7cW4yH1zF6dB8sQ3p',
    symbol: 'USDT',
  },
  {
    id: 'bnb',
    label: 'BNB',
    subtitle: 'Pay via bnb',
    networkType: 'BEP20',
    address: '0xD0E2f9e3c73A4aaDF4436F2b7cef9255b8a41E92',
    symbol: 'BNB',
  },
  {
    id: 'sol',
    label: 'SOL',
    subtitle: 'Pay via solana',
    networkType: 'SOL',
    address: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
    symbol: 'SOL',
  },
  {
    id: 'xrp',
    label: 'Ripple',
    subtitle: 'Pay via ripple',
    networkType: 'XRP',
    address: 'rEb8TK3gBgk5auZkwc6sHnwrGVJH8DuaLh',
    symbol: 'XRP',
  },
];

export const CRYPTO_ASSETS: {
  symbol: CryptoAssetSymbol;
  name: string;
  usdPrice: number;
  network: string;
}[] = [
  { symbol: 'USD', name: 'US Dollar Wallet', usdPrice: 1, network: 'Internal USD' },
  { symbol: 'USDC', name: 'USD Coin', usdPrice: 1, network: 'BEP20' },
  { symbol: 'USDT', name: 'Tether USD', usdPrice: 1, network: 'BEP20 / TRC20' },
  { symbol: 'BTC', name: 'Bitcoin', usdPrice: 94250, network: 'BTC Mainnet' },
  { symbol: 'ETH', name: 'Ethereum', usdPrice: 3180, network: 'ERC20' },
  { symbol: 'BNB', name: 'BNB Smart Chain', usdPrice: 635, network: 'BEP20' },
  { symbol: 'SOL', name: 'Solana', usdPrice: 218, network: 'Solana' },
  { symbol: 'XRP', name: 'Ripple', usdPrice: 1.42, network: 'XRP Ledger' },
];

export const INVESTMENT_PLANS = [
  { id: 'starter', name: 'Starter Plan', dailyRate: '0.45%', durationDays: 30, min: 50, max: 999 },
  { id: 'growth', name: 'Growth Plan', dailyRate: '0.70%', durationDays: 30, min: 1000, max: 4999 },
  { id: 'premium', name: 'Premium Plan', dailyRate: '0.95%', durationDays: 60, min: 5000, max: 24999 },
  { id: 'institutional', name: 'Institutional Plan', dailyRate: '1.20%', durationDays: 90, min: 25000, max: 250000 },
];

export const VACATION_QUALIFICATION_USD = 5000;

export const VACATION_PLANS = [
  {
    id: 'vac-amalfi',
    name: 'Amalfi Coast Executive Retreat',
    destination: 'Positano & Ravello, Italy',
    dailyRate: '1.15%',
    durationDays: 45,
    min: 5000,
    max: 49999,
    perk: 'Complimentary 5-night coastal villa stay + concierge flight credit',
  },
  {
    id: 'vac-alpine',
    name: 'Swiss Alpine Private Reserve',
    destination: 'St. Moritz, Switzerland',
    dailyRate: '1.35%',
    durationDays: 60,
    min: 12000,
    max: 120000,
    perk: 'Private chalet week + helicopter transfer voucher upon maturity',
  },
  {
    id: 'vac-maldives',
    name: 'Maldives Overwater Sovereign Plan',
    destination: 'Baa Atoll, Maldives',
    dailyRate: '1.55%',
    durationDays: 90,
    min: 25000,
    max: 300000,
    perk: '7-night overwater residence + VIP lounge & seaplane access',
  },
];

export const REAL_ESTATE_PLANS = [
  {
    id: 're-metro-reit',
    name: 'Metropolitan Commercial REIT',
    sector: 'Class-A Office & Retail',
    location: 'London & Manchester, UK',
    dailyRate: '0.88%',
    annualized: '32.1% Est. APY',
    durationDays: 60,
    min: 1000,
    max: 50000,
    occupancy: '96.4%',
  },
  {
    id: 're-coastal-luxury',
    name: 'Coastal Luxury Residential Fund',
    sector: 'Prime Waterfront Residences',
    location: 'Miami & Marbella',
    dailyRate: '1.10%',
    annualized: '40.2% Est. APY',
    durationDays: 90,
    min: 5000,
    max: 150000,
    occupancy: '98.1%',
  },
  {
    id: 're-logistics',
    name: 'Continental Logistics & Cold-Chain',
    sector: 'Industrial Fulfillment Hubs',
    location: 'Rotterdam & Frankfurt',
    dailyRate: '1.30%',
    annualized: '47.5% Est. APY',
    durationDays: 120,
    min: 15000,
    max: 500000,
    occupancy: '99.2%',
  },
];

export const SUPPORT_EMAILS = [
  {
    label: 'Primary Investor Concierge',
    email: 'support@assetcrest.co',
    hours: '24/7 Account, Deposits & Transfers',
  },
  {
    label: 'Compliance & Account Escalation Desk',
    email: 'desk@assetcrest.co',
    hours: 'KYC Review, Joint Accounts & Institutional',
  },
];

export const EMPTY_CRYPTO_BALANCES: Record<Exclude<CryptoAssetSymbol, 'USD'>, number> = {
  USDC: 0,
  ETH: 0,
  BTC: 0,
  USDT: 0,
  BNB: 0,
  SOL: 0,
  XRP: 0,
};

export const DEFAULT_SEED_STORE: AssetCrestStore = {
  activeUserId: 'usr-annabella',
  welcomeModalUserId: null,
  users: [
    {
      id: 'usr-annabella',
      name: 'Annabella Menor',
      email: 'bitfurytech21@gmail.com',
      password: 'Password123!',
      role: 'investor',
      accountType: 'Individual',
      referralCode: 'ANNABELLA',
      accountBalance: 0,
      totalProfit: 0,
      bonus: 0,
      referralBonus: 0,
      totalDeposit: 0,
      cryptoBalances: { ...EMPTY_CRYPTO_BALANCES },
      kycStatus: 'Unverified',
      createdAt: '2026-11-01',
    },
    {
      id: 'usr-marcus',
      name: 'Marcus Vance',
      email: 'marcus.vance@assetcrest.co',
      password: 'Password123!',
      role: 'investor',
      accountType: 'Joint',
      jointDetails: {
        coOwnerName: 'Elena Vance',
        coOwnerEmail: 'elena.vance@assetcrest.co',
        relationship: 'Spouse',
        authorizationMode: 'Either Owner',
      },
      referralCode: 'MARCUS',
      accountBalance: 6450,
      totalProfit: 840,
      bonus: 150,
      referralBonus: 120,
      totalDeposit: 6000,
      cryptoBalances: {
        USDC: 1200,
        ETH: 0.45,
        BTC: 0.025,
        USDT: 800,
        BNB: 1.5,
        SOL: 4.2,
        XRP: 350,
      },
      kycStatus: 'Approved',
      kycSubmission: {
        legalName: 'Marcus & Elena Vance',
        country: 'United Kingdom',
        documentType: 'Passport',
        documentNumber: 'UK-88342019',
        idFrontDataUrl: '',
        idFrontName: 'passport_vance_verified.png',
        selfieDataUrl: '',
        selfieName: 'selfie_vance_verified.png',
        submittedAt: '2026-11-05 10:14',
        reviewedAt: '2026-11-05 11:02',
        adminNote: 'Verified joint holders.',
      },
      createdAt: '2026-10-15',
    },
    {
      id: 'usr-admin',
      name: 'AssetCrest Admin',
      email: 'admin@assetcrest.co',
      password: 'AdminPassword123!',
      role: 'admin',
      accountType: 'Individual',
      referralCode: 'ADMIN',
      accountBalance: 25000,
      totalProfit: 0,
      bonus: 0,
      referralBonus: 0,
      totalDeposit: 25000,
      cryptoBalances: {
        USDC: 5000,
        ETH: 2,
        BTC: 0.1,
        USDT: 5000,
        BNB: 5,
        SOL: 10,
        XRP: 1000,
      },
      kycStatus: 'Approved',
      createdAt: '2026-10-01',
    },
  ],
  transactions: [
    {
      id: 'TX-SEED-001',
      userId: 'usr-marcus',
      type: 'Deposit',
      method: 'USDC (BEP20)',
      amount: 6000,
      status: 'Completed',
      date: '2026-11-05 09:30',
      note: 'Initial joint deposit confirmed',
    },
  ],
  investments: [],
  locationLogs: [],
  tickets: [],
};

const STORE_KEY = 'assetcrest_portal_store_v2';
const THEME_KEY = 'assetcrest_theme_mode_v1';

let idCounter = 2000;
export function nextRecordId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
}

export function formatNowStamp(): string {
  return new Date().toISOString().slice(0, 16).replace('T', ' ');
}

let cachedStore: AssetCrestStore | null = null;
const storeListeners = new Set<() => void>();

function readStoreFromStorage(): AssetCrestStore {
  if (typeof window === 'undefined') return DEFAULT_SEED_STORE;
  if (cachedStore) return cachedStore;
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    if (!raw) {
      cachedStore = DEFAULT_SEED_STORE;
      return cachedStore;
    }
    const parsed = JSON.parse(raw) as Partial<AssetCrestStore>;
    if (!parsed || !Array.isArray(parsed.users) || parsed.users.length === 0) {
      cachedStore = DEFAULT_SEED_STORE;
      return cachedStore;
    }
    cachedStore = {
      activeUserId: parsed.activeUserId === undefined ? 'usr-annabella' : parsed.activeUserId,
      welcomeModalUserId: parsed.welcomeModalUserId ?? null,
      users: parsed.users,
      transactions: Array.isArray(parsed.transactions) ? parsed.transactions : [],
      investments: Array.isArray(parsed.investments) ? parsed.investments : [],
      locationLogs: Array.isArray(parsed.locationLogs) ? parsed.locationLogs : [],
      tickets: Array.isArray(parsed.tickets) ? parsed.tickets : [],
    };
    return cachedStore;
  } catch {
    cachedStore = DEFAULT_SEED_STORE;
    return cachedStore;
  }
}

export function updateAssetCrestStore(updater: (prev: AssetCrestStore) => AssetCrestStore): void {
  const current = readStoreFromStorage();
  const next = updater(current);
  cachedStore = next;
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(STORE_KEY, JSON.stringify(next));
    } catch {
      // Ignore quota errors if localStorage is full
    }
  }
  storeListeners.forEach((listener) => listener());
}

function subscribeStore(listener: () => void): () => void {
  storeListeners.add(listener);
  return () => {
    storeListeners.delete(listener);
  };
}

function getServerStoreSnapshot(): AssetCrestStore {
  return DEFAULT_SEED_STORE;
}

export function useAssetCrestStore(): AssetCrestStore {
  return useSyncExternalStore(subscribeStore, readStoreFromStorage, getServerStoreSnapshot);
}

// --- Theme Store (Light / Dark) ---
export type ThemeMode = 'light' | 'dark';
let cachedTheme: ThemeMode | null = null;
const themeListeners = new Set<() => void>();

function readTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'light';
  if (cachedTheme) return cachedTheme;
  try {
    const saved = window.localStorage.getItem(THEME_KEY);
    cachedTheme = saved === 'dark' ? 'dark' : 'light';
    return cachedTheme;
  } catch {
    cachedTheme = 'light';
    return 'light';
  }
}

export function setThemeMode(mode: ThemeMode): void {
  cachedTheme = mode;
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(THEME_KEY, mode);
    } catch {
      // ignore
    }
    document.documentElement.classList.toggle('dark', mode === 'dark');
  }
  themeListeners.forEach((l) => l());
}

function subscribeTheme(listener: () => void): () => void {
  themeListeners.add(listener);
  return () => {
    themeListeners.delete(listener);
  };
}

export function useThemeMode(): ThemeMode {
  return useSyncExternalStore(subscribeTheme, readTheme, () => 'light');
}

// --- Image File Compression Helper (fits localStorage & Firestore volumetric limits) ---
export function readAndCompressFile(
  file: File,
  maxDimension = 640,
  maxChars = 230000
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (file.type === 'application/pdf') {
      const reader = new FileReader();
      reader.onload = () => {
        const result = String(reader.result || '');
        if (result.length > maxChars) {
          reject(new Error('PDF file exceeds 170 KB embedded receipt limit. Please upload an image screenshot instead.'));
          return;
        }
        resolve(result);
      };
      reader.onerror = () => reject(new Error('Failed to read PDF file'));
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.onload = () => {
      const rawUrl = String(reader.result || '');
      const img = new window.Image();
      img.onload = () => {
        let dim = maxDimension;
        let quality = 0.78;
        let output = '';

        for (let attempt = 0; attempt < 5; attempt += 1) {
          const scale = Math.min(1, dim / Math.max(img.width, img.height));
          const width = Math.max(1, Math.round(img.width * scale));
          const height = Math.max(1, Math.round(img.height * scale));
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(rawUrl.slice(0, maxChars));
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          output = canvas.toDataURL('image/jpeg', quality);
          if (output.length <= maxChars) {
            resolve(output);
            return;
          }
          dim = Math.round(dim * 0.72);
          quality = Math.max(0.4, quality - 0.12);
        }

        resolve(output);
      };
      img.onerror = () => resolve(rawUrl.slice(0, maxChars));
      img.src = rawUrl;
    };
    reader.readAsDataURL(file);
  });
}

// --- Admin-Only Referral/Tracking Link Visitor Location Capture ---
export function captureVisitorLocationForAdmin(
  refCode: string,
  clickedUrl: string,
  onCaptured?: (entry: Omit<VisitorLocationLog, 'id'>) => void
): void {
  if (typeof window === 'undefined') return;

  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  const language = navigator.language || 'en-US';
  const deviceSummary = navigator.userAgent.slice(0, 95);
  const stamp = formatNowStamp();

  const recordLog = (latitude: string, longitude: string, accuracyLabel: string) => {
    const entryBase: Omit<VisitorLocationLog, 'id'> = {
      refCode: refCode.toUpperCase(),
      clickedUrl,
      latitude,
      longitude,
      accuracyLabel,
      timezone,
      language,
      deviceSummary,
      timestamp: stamp,
    };
    const newEntry: VisitorLocationLog = {
      id: nextRecordId('LOC'),
      ...entryBase,
    };
    updateAssetCrestStore((prev) => ({
      ...prev,
      locationLogs: [newEntry, ...prev.locationLogs].slice(0, 100),
    }));
    onCaptured?.(entryBase);
  };

  if ('geolocation' in navigator) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        recordLog(
          pos.coords.latitude.toFixed(5),
          pos.coords.longitude.toFixed(5),
          `GPS ±${Math.round(pos.coords.accuracy)}m`
        );
      },
      () => {
        recordLog('Permission declined', 'Permission declined', `Timezone fallback (${timezone})`);
      },
      { enableHighAccuracy: false, timeout: 4500, maximumAge: 60000 }
    );
  } else {
    recordLog('Unavailable', 'Unavailable', `Timezone fallback (${timezone})`);
  }
}
