'use client';

import React, { useState, useEffect, useRef, useSyncExternalStore, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'motion/react';
import {
  Menu,
  MoreVertical,
  Home,
  ChevronsDown,
  ArrowUpCircle,
  Banknote,
  Boxes,
  ChevronDown,
  Repeat,
  Mail,
  Wallet,
  Coins,
  Gift,
  Share2,
  ArrowDownCircle,
  ChevronRight,
  Copy,
  Check,
  Upload,
  X,
  ArrowRightCircle,
  Smartphone,
  Download,
  Cpu,
  RefreshCw,
  CheckCircle2,
  QrCode,
  Terminal,
  Search,
  Send,
  ShieldCheck,
  Sun,
  Moon,
  ArrowLeftRight,
  Plane,
  Building2,
  UserCog,
  ShieldAlert,
  Lock,
  Eye,
  LogIn,
  Users,
  BadgeCheck,
  Clock,
  Cloud,
} from 'lucide-react';
import { PWAInstallButton } from '@/components/PWAInstallButton';
import { AppQRCode } from '@/components/AppQRCode';
import {
  AuthModal,
  KycInspectModal,
  ReceiptPreviewModal,
  WelcomeRegistrationModal,
} from '@/components/AuthAndAccountModals';
import {
  AccountProfileView,
  AdminDashboardView,
  CryptoSwapView,
  KycVerificationView,
  RealEstatePortalView,
  TransferFundsView,
  VacationPortalView,
} from '@/components/InvestorPortals';
import {
  AssetCrestStore,
  captureVisitorLocationForAdmin,
  formatNowStamp,
  INVESTMENT_PLANS,
  nextRecordId,
  PageTab,
  PAYMENT_METHODS,
  readAndCompressFile,
  SUPPORT_EMAILS,
  TransactionRecord,
  updateAssetCrestStore,
  useAssetCrestStore,
  UserAccount,
  useThemeMode,
  setThemeMode,
} from '@/lib/assetcrest-store';
import {
  auth,
  cloudAdminDecideKyc,
  cloudClaimTransferRequest,
  cloudCreateTicket,
  cloudInvestPlan,
  cloudLogVisitorLocation,
  cloudSubmitDeposit,
  cloudSubmitWithdrawal,
  queuePendingLocationLog,
  signInWithGoogleCloud,
  signOutCloud,
  useFirebaseCloudSync,
} from '@/lib/firebase';

let toastSequence = 100;
function nextToastId(): number {
  toastSequence += 1;
  return toastSequence;
}

const emptySubscribe = () => () => {};
function getClientOrigin(): string {
  return typeof window !== 'undefined' ? window.location.origin : 'https://assetcrest.co';
}

interface ToastItem {
  id: number;
  message: string;
  tone: 'success' | 'info' | 'error';
}

const LANGUAGE_LABELS: Record<
  string,
  {
    welcome: string;
    dashboard: string;
    deposit: string;
    withdraw: string;
    transfer: string;
    swap: string;
    transactions: string;
    plans: string;
    vacation: string;
    realEstate: string;
    referrals: string;
    contact: string;
  }
> = {
  en: {
    welcome: 'Welcome to AssetCrest',
    dashboard: 'Dashboard',
    deposit: 'Deposit',
    withdraw: 'Withdraw',
    transfer: 'Transfer Funds',
    swap: 'Crypto Swap',
    transactions: 'Transactions',
    plans: 'Investment Plan',
    vacation: 'Vacation Portal',
    realEstate: 'Real Estate Plan',
    referrals: 'Referrals',
    contact: 'Contact Us',
  },
  es: {
    welcome: 'Bienvenido a AssetCrest',
    dashboard: 'Panel',
    deposit: 'Depositar',
    withdraw: 'Retirar',
    transfer: 'Transferir Fondos',
    swap: 'Intercambio Cripto',
    transactions: 'Transacciones',
    plans: 'Plan de Inversión',
    vacation: 'Portal de Vacaciones',
    realEstate: 'Plan Inmobiliario',
    referrals: 'Referidos',
    contact: 'Contáctenos',
  },
  fr: {
    welcome: 'Bienvenue sur AssetCrest',
    dashboard: 'Tableau de bord',
    deposit: 'Dépôt',
    withdraw: 'Retirer',
    transfer: 'Transfert de fonds',
    swap: 'Échange Crypto',
    transactions: 'Transactions',
    plans: "Plan d'investissement",
    vacation: 'Portail Vacances',
    realEstate: 'Plan Immobilier',
    referrals: 'Parrainages',
    contact: 'Contactez-nous',
  },
  de: {
    welcome: 'Willkommen bei AssetCrest',
    dashboard: 'Dashboard',
    deposit: 'Einzahlung',
    withdraw: 'Auszahlung',
    transfer: 'Geldtransfer',
    swap: 'Krypto-Tausch',
    transactions: 'Transaktionen',
    plans: 'Investmentplan',
    vacation: 'Urlaubsportal',
    realEstate: 'Immobilienplan',
    referrals: 'Empfehlungen',
    contact: 'Kontakt',
  },
  pt: {
    welcome: 'Bem-vindo ao AssetCrest',
    dashboard: 'Painel',
    deposit: 'Depositar',
    withdraw: 'Sacar',
    transfer: 'Transferir Fundos',
    swap: 'Troca Cripto',
    transactions: 'Transações',
    plans: 'Plano de Investimento',
    vacation: 'Portal de Férias',
    realEstate: 'Plano Imobiliário',
    referrals: 'Indicações',
    contact: 'Fale Conosco',
  },
};

export default function AssetCrestPortal() {
  const store = useAssetCrestStore();
  const cloudSync = useFirebaseCloudSync();
  const isCloudMode = Boolean(cloudSync.firebaseUser && cloudSync.cloudUser);
  const effectiveStore: AssetCrestStore =
    isCloudMode && cloudSync.cloudUser
      ? {
          activeUserId: cloudSync.cloudUser.id,
          users: cloudSync.isAdmin ? cloudSync.allUsers : [cloudSync.cloudUser],
          transactions: cloudSync.transactions,
          investments: cloudSync.investments,
          locationLogs: cloudSync.locationLogs,
          tickets: cloudSync.tickets,
          welcomeModalUserId: cloudSync.isNewUserWelcome ? cloudSync.cloudUser.id : null,
        }
      : store;

  const theme = useThemeMode();
  const activeUser =
    effectiveStore.users.find((u) => u.id === effectiveStore.activeUserId) ??
    effectiveStore.users[0];

  const [activeTab, setActiveTab] = useState<PageTab>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [planSubmenuOpen, setPlanSubmenuOpen] = useState(false);
  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);
  const [showWelcomeBanner, setShowWelcomeBanner] = useState(true);
  const [language, setLanguage] = useState('en');

  // Modals
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [receiptModalTx, setReceiptModalTx] = useState<TransactionRecord | null>(null);
  const [kycInspectUser, setKycInspectUser] = useState<UserAccount | null>(null);

  // Deposit Wizard State
  const [depositStep, setDepositStep] = useState<'amount' | 'payment'>('amount');
  const [depositAmountInput, setDepositAmountInput] = useState('');
  const [selectedMethodId, setSelectedMethodId] = useState<string>('usdc-bep20');
  const [proofStageVisible, setProofStageVisible] = useState(false);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [addressCopied, setAddressCopied] = useState(false);

  // Withdraw State
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState('USDC (BEP20)');
  const [withdrawDestination, setWithdrawDestination] = useState('');

  // Transactions State
  const [txFilter, setTxFilter] = useState<'All' | 'Completed' | 'Pending' | 'Cancelled'>('All');
  const [txSearch, setTxSearch] = useState('');

  // Investment Plans State
  const [planInvestAmounts, setPlanInvestAmounts] = useState<Record<string, string>>({
    starter: '100',
    growth: '1000',
    premium: '5000',
    institutional: '25000',
  });

  // Referrals State
  const [refCopied, setRefCopied] = useState(false);

  // Contact Us State (2 Support Emails)
  const [contactDeskEmail, setContactDeskEmail] = useState(SUPPORT_EMAILS[0].email);
  const [contactSubject, setContactSubject] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [copiedSupportEmail, setCopiedSupportEmail] = useState<string | null>(null);

  // APK & PWA Builder State
  const detectedOrigin = useSyncExternalStore(
    emptySubscribe,
    getClientOrigin,
    () => 'https://assetcrest.co'
  );
  const [apkAppName, setApkAppName] = useState('AssetCrest');
  const [apkPackageName, setApkPackageName] = useState('com.assetcrest.investor');
  const [apkVersionName, setApkVersionName] = useState('1.0.4');
  const apkVersionCode = 4;
  const [customTargetUrl, setCustomTargetUrl] = useState<string | null>(null);
  const apkTargetUrl = customTargetUrl ?? detectedOrigin;
  const [isBuildingApk, setIsBuildingApk] = useState(false);
  const [apkReady, setApkReady] = useState(false);
  const [bundleBlobUrl, setBundleBlobUrl] = useState<string | null>(null);
  const [bundleFilename, setBundleFilename] = useState('assetcrest-v1.0.4-android-apk-bundle.zip');
  const [bundleSizeKb, setBundleSizeKb] = useState<number | null>(null);

  // Sync Tailwind .dark class on root html element
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  // Silent Admin-only referral link location capture on ?ref= visit
  const refTrackedRef = useRef(false);
  useEffect(() => {
    if (refTrackedRef.current || typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const refParam = params.get('ref') || params.get('track');
    if (refParam) {
      refTrackedRef.current = true;
      captureVisitorLocationForAdmin(refParam, window.location.href, (entry) => {
        if (auth.currentUser) {
          void cloudLogVisitorLocation(auth.currentUser.uid, entry);
        } else {
          queuePendingLocationLog(entry);
        }
      });
    }
  }, []);

  useEffect(() => {
    return () => {
      if (bundleBlobUrl) {
        URL.revokeObjectURL(bundleBlobUrl);
      }
    };
  }, [bundleBlobUrl]);

  // Toast State
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const notify = useCallback(
    (message: string, tone: 'success' | 'info' | 'error' = 'success') => {
      const id = nextToastId();
      setToasts((prev) => [...prev, { id, message, tone }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((item) => item.id !== id));
      }, 4000);
    },
    []
  );

  // Auto-claim incoming Cloud P2P transfer requests
  const claimedIdsRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!isCloudMode || cloudSync.incomingTransfers.length === 0) return;
    for (const trf of cloudSync.incomingTransfers) {
      if (claimedIdsRef.current.has(trf.id)) continue;
      claimedIdsRef.current.add(trf.id);
      void cloudClaimTransferRequest(trf)
        .then(() => {
          notify(
            `Received $${trf.amount.toLocaleString('en-US', {
              minimumFractionDigits: 2,
            })} transfer from ${trf.fromName}!`,
            'success'
          );
        })
        .catch(() => {
          claimedIdsRef.current.delete(trf.id);
        });
    }
  }, [isCloudMode, cloudSync.incomingTransfers, notify]);

  const t = LANGUAGE_LABELS[language] || LANGUAGE_LABELS.en;
  const selectedMethod =
    PAYMENT_METHODS.find((m) => m.id === selectedMethodId) || PAYMENT_METHODS[0];
  const parsedDepositAmount = parseFloat(depositAmountInput) || 0;

  const userTransactions = effectiveStore.transactions.filter(
    (tx) => tx.userId === activeUser.id
  );
  const userInvestments = effectiveStore.investments.filter(
    (inv) => inv.userId === activeUser.id
  );
  const userTickets = effectiveStore.tickets.filter((tk) => tk.userId === activeUser.id);
  const welcomeModalUser = effectiveStore.welcomeModalUserId
    ? effectiveStore.users.find((u) => u.id === effectiveStore.welcomeModalUserId) || null
    : null;

  const navigateTo = (tab: PageTab) => {
    setActiveTab(tab);
    setSidebarOpen(false);
    setHeaderMenuOpen(false);
    if (tab === 'deposit') {
      setDepositStep('amount');
      setProofStageVisible(false);
      setProofFile(null);
    }
  };

  const handleProceedToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!parsedDepositAmount || parsedDepositAmount <= 0) {
      notify('Please enter a valid deposit amount.', 'error');
      return;
    }
    setDepositStep('payment');
    setProofStageVisible(false);
    setProofFile(null);
  };

  const handleCancelPayment = async () => {
    if (parsedDepositAmount > 0) {
      if (isCloudMode) {
        try {
          await cloudSubmitDeposit({
            uid: activeUser.id,
            method: selectedMethod.label,
            amount: parsedDepositAmount,
            status: 'Cancelled',
          });
        } catch {
          notify('Failed to log cancelled deposit.', 'error');
        }
      } else {
        const cancelledTx: TransactionRecord = {
          id: nextRecordId('DEP'),
          userId: activeUser.id,
          type: 'Deposit',
          method: selectedMethod.label,
          amount: parsedDepositAmount,
          status: 'Cancelled',
          date: formatNowStamp(),
        };
        updateAssetCrestStore((prev) => ({
          ...prev,
          transactions: [cancelledTx, ...prev.transactions],
        }));
      }
    }
    setDepositStep('amount');
    setProofStageVisible(false);
    setProofFile(null);
    notify('Payment cancelled.', 'info');
  };

  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(selectedMethod.address);
      setAddressCopied(true);
      notify('Payment address copied to clipboard.', 'success');
      setTimeout(() => setAddressCopied(false), 2000);
    } catch {
      notify(`Address: ${selectedMethod.address}`, 'info');
    }
  };

  const handleCompleteDeposit = async () => {
    if (!proofFile) {
      notify('Please choose an image or PDF payment receipt first.', 'error');
      return;
    }
    const allowedTypes = [
      'image/png',
      'image/jpeg',
      'image/webp',
      'image/gif',
      'application/pdf',
    ];
    if (proofFile.type && !allowedTypes.includes(proofFile.type)) {
      notify('Only PNG, JPEG, WebP, GIF images and PDF files are allowed.', 'error');
      return;
    }
    if (proofFile.size > 6 * 1024 * 1024) {
      notify('File must be 6 MB or smaller.', 'error');
      return;
    }

    let proofDataUrl = '';
    try {
      proofDataUrl = await readAndCompressFile(proofFile, 640, 225000);
    } catch {
      proofDataUrl = '';
    }

    const amt = parsedDepositAmount;
    if (isCloudMode) {
      try {
        await cloudSubmitDeposit({
          uid: activeUser.id,
          method: selectedMethod.label,
          amount: amt,
          status: 'Pending',
          proofName: proofFile.name,
          proofDataUrl,
        });
      } catch {
        notify('Failed to submit deposit receipt to Cloud. Please try again.', 'error');
        return;
      }
    } else {
      const depositTx: TransactionRecord = {
        id: nextRecordId('DEP'),
        userId: activeUser.id,
        type: 'Deposit',
        method: selectedMethod.label,
        amount: amt,
        status: 'Pending',
        date: formatNowStamp(),
        proofName: proofFile.name,
        proofDataUrl,
      };

      updateAssetCrestStore((prev) => ({
        ...prev,
        transactions: [depositTx, ...prev.transactions],
      }));
    }

    setDepositStep('amount');
    setDepositAmountInput('');
    setProofStageVisible(false);
    setProofFile(null);
    setActiveTab('transactions');
    notify(
      `Receipt uploaded for $${amt.toLocaleString('en-US', { minimumFractionDigits: 2 })}. Pending Admin audit.`,
      'success'
    );
  };

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (activeUser.kycStatus !== 'Approved') {
      notify('Strict KYC Gate: Admin approval is required before withdrawing.', 'error');
      return;
    }
    const amt = parseFloat(withdrawAmount) || 0;
    if (amt < 100) {
      notify('Minimum withdrawal amount is $100.00.', 'error');
      return;
    }
    if (amt > activeUser.accountBalance) {
      notify('Insufficient account balance for this withdrawal.', 'error');
      return;
    }
    if (!withdrawDestination.trim()) {
      notify('Enter a valid destination wallet address.', 'error');
      return;
    }

    if (isCloudMode) {
      try {
        await cloudSubmitWithdrawal({
          uid: activeUser.id,
          currentBalance: activeUser.accountBalance,
          method: withdrawMethod,
          amount: amt,
          destination: withdrawDestination,
        });
      } catch {
        notify('Failed to submit withdrawal request to Cloud.', 'error');
        return;
      }
    } else {
      const wdrTx: TransactionRecord = {
        id: nextRecordId('WDR'),
        userId: activeUser.id,
        type: 'Withdrawal',
        method: withdrawMethod,
        amount: amt,
        status: 'Pending',
        date: formatNowStamp(),
        note: `Destination: ${withdrawDestination.trim()}`,
      };

      updateAssetCrestStore((prev) => ({
        ...prev,
        users: prev.users.map((u) =>
          u.id === activeUser.id
            ? { ...u, accountBalance: Number((u.accountBalance - amt).toFixed(2)) }
            : u
        ),
        transactions: [wdrTx, ...prev.transactions],
      }));
    }

    setWithdrawAmount('');
    setWithdrawDestination('');
    notify(
      `Withdrawal request for $${amt.toLocaleString('en-US', { minimumFractionDigits: 2 })} submitted.`,
      'success'
    );
  };

  const handleInvestPlan = async (plan: (typeof INVESTMENT_PLANS)[number]) => {
    const amt = parseFloat(planInvestAmounts[plan.id] || '0') || 0;
    if (amt < plan.min || amt > plan.max) {
      notify(
        `Amount must be between $${plan.min.toLocaleString('en-US')} and $${plan.max.toLocaleString('en-US')}.`,
        'error'
      );
      return;
    }
    if (amt > activeUser.accountBalance) {
      notify('Insufficient balance. Please make a deposit first.', 'error');
      return;
    }

    if (isCloudMode) {
      try {
        await cloudInvestPlan({
          uid: activeUser.id,
          currentBalance: activeUser.accountBalance,
          category: 'Standard',
          planName: plan.name,
          amount: amt,
          dailyRate: plan.dailyRate,
          durationDays: plan.durationDays,
        });
      } catch {
        notify('Failed to activate investment plan in Cloud.', 'error');
        return;
      }
    } else {
      const invId = nextRecordId('INV');
      const txId = nextRecordId('TX');
      const stamp = formatNowStamp();

      updateAssetCrestStore((prev) => ({
        ...prev,
        users: prev.users.map((u) =>
          u.id === activeUser.id
            ? { ...u, accountBalance: Number((u.accountBalance - amt).toFixed(2)) }
            : u
        ),
        investments: [
          {
            id: invId,
            userId: activeUser.id,
            category: 'Standard',
            planName: plan.name,
            amount: amt,
            dailyRate: plan.dailyRate,
            durationDays: plan.durationDays,
            status: 'Active',
            startedAt: stamp,
          },
          ...prev.investments,
        ],
        transactions: [
          {
            id: txId,
            userId: activeUser.id,
            type: 'Investment',
            method: plan.name,
            amount: amt,
            status: 'Completed',
            date: stamp,
          },
          ...prev.transactions,
        ],
      }));
    }

    notify(
      `Invested $${amt.toLocaleString('en-US', { minimumFractionDigits: 2 })} in ${plan.name}.`,
      'success'
    );
  };

  const handleExportCsv = () => {
    const header = 'Reference,Type,Method,Amount,Status,Date\n';
    const rows = userTransactions
      .map(
        (tx) =>
          `${tx.id},${tx.type},"${tx.method}",${tx.amount.toFixed(2)},${tx.status},"${tx.date}"`
      )
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `assetcrest-${activeUser.referralCode.toLowerCase()}-transactions.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    notify('Transactions exported to CSV.', 'success');
  };

  const shareReferralUrl = `${detectedOrigin}/?ref=${activeUser.referralCode}`;

  const handleCopyReferral = async () => {
    try {
      await navigator.clipboard.writeText(shareReferralUrl);
      setRefCopied(true);
      notify('Referral tracking link copied.', 'success');
      setTimeout(() => setRefCopied(false), 2000);
    } catch {
      notify(shareReferralUrl, 'info');
    }
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactSubject.trim() || !contactMessage.trim()) {
      notify('Please fill out both subject and message.', 'error');
      return;
    }

    if (isCloudMode) {
      try {
        await cloudCreateTicket({
          userId: activeUser.id,
          senderEmail: activeUser.email,
          targetDeskEmail: contactDeskEmail,
          subject: contactSubject.trim(),
          message: contactMessage.trim(),
        });
      } catch {
        notify('Failed to route support ticket in Cloud.', 'error');
        return;
      }
    } else {
      updateAssetCrestStore((prev) => ({
        ...prev,
        tickets: [
          {
            id: nextRecordId('MSG'),
            userId: activeUser.id,
            senderEmail: activeUser.email,
            targetDeskEmail: contactDeskEmail,
            subject: contactSubject.trim(),
            message: contactMessage.trim(),
            date: formatNowStamp(),
          },
          ...prev.tickets,
        ],
      }));
    }

    setContactSubject('');
    setContactMessage('');
    notify(`Support ticket routed to ${contactDeskEmail}.`, 'success');
  };

  const handleCopySupportEmail = async (email: string) => {
    try {
      await navigator.clipboard.writeText(email);
      setCopiedSupportEmail(email);
      notify(`Copied ${email}`, 'success');
      setTimeout(() => setCopiedSupportEmail(null), 2000);
    } catch {
      notify(email, 'info');
    }
  };

  const handleBuildApkBundle = async () => {
    setIsBuildingApk(true);
    setApkReady(false);
    try {
      const res = await fetch('/api/apk/package', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appName: apkAppName,
          packageName: apkPackageName,
          versionName: apkVersionName,
          versionCode: apkVersionCode,
          themeColor: '#2b4865',
          targetUrl: apkTargetUrl,
          enablePush: true,
        }),
      });
      if (!res.ok) throw new Error('Build failed');
      const disposition = res.headers.get('Content-Disposition') || '';
      const match = disposition.match(/filename="([^"]+)"/);
      const filename = match?.[1] || 'assetcrest-android-apk-bundle.zip';
      const blob = await res.blob();
      if (bundleBlobUrl) URL.revokeObjectURL(bundleBlobUrl);
      const url = URL.createObjectURL(blob);
      setBundleBlobUrl(url);
      setBundleFilename(filename);
      setBundleSizeKb(Math.max(1, Math.round(blob.size / 1024)));
      setApkReady(true);
      notify('Android APK project bundle compiled!', 'success');
    } catch {
      notify('Failed to compile APK bundle.', 'error');
    } finally {
      setIsBuildingApk(false);
    }
  };

  const handleDownloadApkBundle = () => {
    if (!bundleBlobUrl) return;
    const a = document.createElement('a');
    a.href = bundleBlobUrl;
    a.download = bundleFilename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const handleApproveKyc = async (userId: string) => {
    if (isCloudMode) {
      try {
        await cloudAdminDecideKyc(userId, 'Approved', 'Approved by Admin');
        notify('KYC Approved — Withdrawals unlocked for user.', 'success');
      } catch {
        notify('Failed to approve KYC in Cloud.', 'error');
      }
      return;
    }

    updateAssetCrestStore((prev) => ({
      ...prev,
      users: prev.users.map((u) =>
        u.id === userId && u.kycSubmission
          ? {
              ...u,
              kycStatus: 'Approved',
              kycSubmission: {
                ...u.kycSubmission,
                reviewedAt: formatNowStamp(),
                adminNote: 'Approved by Admin',
              },
            }
          : u
      ),
    }));
    notify('KYC Approved — Withdrawals unlocked for user.', 'success');
  };

  const handleRejectKyc = async (userId: string, reason: string) => {
    if (isCloudMode) {
      try {
        await cloudAdminDecideKyc(userId, 'Rejected', reason);
        notify('KYC rejected with feedback.', 'info');
      } catch {
        notify('Failed to reject KYC in Cloud.', 'error');
      }
      return;
    }

    updateAssetCrestStore((prev) => ({
      ...prev,
      users: prev.users.map((u) =>
        u.id === userId && u.kycSubmission
          ? {
              ...u,
              kycStatus: 'Rejected',
              kycSubmission: {
                ...u.kycSubmission,
                reviewedAt: formatNowStamp(),
                adminNote: reason,
              },
            }
          : u
      ),
    }));
    notify('KYC rejected with feedback.', 'info');
  };

  const filteredTransactions = userTransactions.filter((tx) => {
    const matchesFilter = txFilter === 'All' || tx.status === txFilter;
    const matchesSearch =
      !txSearch.trim() ||
      tx.id.toLowerCase().includes(txSearch.toLowerCase()) ||
      tx.method.toLowerCase().includes(txSearch.toLowerCase()) ||
      tx.type.toLowerCase().includes(txSearch.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const navItemClass = (isActive: boolean) =>
    `w-full flex items-center gap-3.5 px-4 py-2.5 rounded-lg text-sm font-medium transition cursor-pointer ${
      isActive
        ? 'bg-[#2b4865] text-white shadow-sm'
        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
    }`;

  return (
    <div className="min-h-screen flex flex-col bg-[#f4f6f9] dark:bg-slate-950 text-[#2d3748] dark:text-slate-100 transition-colors duration-200">
      {/* Auth, Welcome, Receipt & Admin KYC Modals */}
      <AuthModal
        key={authModalOpen ? authModalMode : 'closed'}
        open={authModalOpen}
        initialMode={authModalMode}
        onClose={() => setAuthModalOpen(false)}
        store={effectiveStore}
        onNotify={notify}
        isCloudMode={isCloudMode}
        cloudEmail={cloudSync.firebaseUser?.email ?? null}
      />
      <WelcomeRegistrationModal
        user={welcomeModalUser}
        onDismiss={() =>
          isCloudMode
            ? cloudSync.dismissWelcome()
            : updateAssetCrestStore((prev) => ({ ...prev, welcomeModalUserId: null }))
        }
        onNavigate={navigateTo}
      />
      <ReceiptPreviewModal
        transaction={receiptModalTx}
        onClose={() => setReceiptModalTx(null)}
      />
      <KycInspectModal
        key={kycInspectUser?.id ?? 'none'}
        user={kycInspectUser}
        onClose={() => setKycInspectUser(null)}
        onApprove={handleApproveKyc}
        onReject={handleRejectKyc}
      />

      {/* Toast Stack */}
      <div className="fixed bottom-16 right-4 z-50 flex flex-col gap-2 max-w-xs w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className={`pointer-events-auto flex items-center justify-between gap-2 px-4 py-3 rounded-md shadow-lg text-xs font-medium text-white ${
                toast.tone === 'success'
                  ? 'bg-[#2b4865]'
                  : toast.tone === 'error'
                  ? 'bg-red-600'
                  : 'bg-slate-700'
              }`}
            >
              <span>{toast.message}</span>
              <button
                type="button"
                onClick={() => setToasts((prev) => prev.filter((item) => item.id !== toast.id))}
                className="opacity-80 hover:opacity-100 cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Top Steel-Navy Navbar */}
      <header className="h-14 bg-[#2b4865] dark:bg-slate-900 border-b border-[#223a52] dark:border-slate-800 text-white px-4 flex items-center justify-between sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open navigation menu"
            className="p-1.5 rounded hover:bg-white/10 transition cursor-pointer"
          >
            <Menu className="h-6 w-6 text-white" />
          </button>
        </div>

        {/* Center Brand Emblem + ASSETCREST Wordmark */}
        <button
          type="button"
          onClick={() => navigateTo('dashboard')}
          className="flex items-center gap-2 cursor-pointer"
        >
          <svg width="28" height="28" viewBox="0 0 64 64" fill="none" aria-hidden="true">
            <polygon points="32,4 58,19 58,45 32,60 6,45 6,19" fill="#991b1b" />
            <polygon points="32,4 58,19 32,34 6,19" fill="#dc2626" />
            <polygon points="32,34 58,19 58,45 32,60" fill="#7f1d1d" />
            <polygon points="32,16 46,44 37,44 32,32 27,44 18,44" fill="#1e293b" />
          </svg>
          <span className="text-lg font-extrabold tracking-tight leading-none">
            <span className="text-slate-900 dark:text-white">ASSET</span>
            <span className="text-[#c53030] dark:text-rose-400">CREST</span>
          </span>
        </button>

        {/* Right Theme Toggle, Install Button & Account Menu */}
        <div className="relative flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setThemeMode(theme === 'dark' ? 'light' : 'dark')}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="p-1.5 rounded hover:bg-white/10 transition cursor-pointer"
          >
            {theme === 'dark' ? (
              <Sun className="h-4.5 w-4.5 text-amber-300" />
            ) : (
              <Moon className="h-4.5 w-4.5 text-slate-100" />
            )}
          </button>

          <div className="hidden sm:block">
            <PWAInstallButton variant="header" />
          </div>

          <button
            type="button"
            onClick={() => {
              setAuthModalMode('login');
              setAuthModalOpen(true);
            }}
            aria-label="Account profile and sign in"
            className="h-8 w-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-xs font-bold overflow-hidden cursor-pointer"
          >
            {activeUser.avatarDataUrl ? (
              <Image
                src={activeUser.avatarDataUrl}
                alt={activeUser.name}
                width={32}
                height={32}
                referrerPolicy="no-referrer"
                className="h-8 w-8 object-cover"
              />
            ) : (
              <span>{activeUser.name[0]?.toUpperCase() || 'A'}</span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setHeaderMenuOpen((v) => !v)}
            aria-label="More options"
            className="p-1.5 rounded hover:bg-white/10 transition cursor-pointer"
          >
            <MoreVertical className="h-5 w-5 text-white" />
          </button>

          {headerMenuOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setHeaderMenuOpen(false)} />
              <div className="absolute right-0 top-11 z-40 w-64 bg-white dark:bg-slate-900 rounded-md shadow-xl border border-slate-200 dark:border-slate-700 py-1.5 text-slate-700 dark:text-slate-200 text-xs">
                <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-slate-900 dark:text-white truncate">
                      {activeUser.name}
                    </p>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-semibold">
                      {activeUser.accountType}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {activeUser.email}
                  </p>
                  <div className="mt-1.5 flex items-center gap-1.5 text-[10px] font-semibold">
                    <Cloud
                      className={`h-3 w-3 ${
                        isCloudMode ? 'text-emerald-600' : 'text-slate-400'
                      }`}
                    />
                    <span className={isCloudMode ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}>
                      {isCloudMode ? 'Firebase Cloud Sync Active' : 'Local Demo Storage'}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => navigateTo('profile')}
                  className="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                >
                  <UserCog className="h-3.5 w-3.5 text-slate-400" />
                  Profile, Photo &amp; Password
                </button>
                <button
                  type="button"
                  onClick={() => navigateTo('kyc')}
                  className="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <BadgeCheck className="h-3.5 w-3.5 text-slate-400" />
                    KYC Verification
                  </span>
                  <span
                    className={`text-[10px] font-bold ${
                      activeUser.kycStatus === 'Approved'
                        ? 'text-emerald-600'
                        : activeUser.kycStatus === 'Pending'
                        ? 'text-amber-600'
                        : 'text-rose-600'
                    }`}
                  >
                    {activeUser.kycStatus}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => navigateTo('admin')}
                  className="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                >
                  <ShieldCheck className="h-3.5 w-3.5 text-amber-500" />
                  Admin Control Portal
                </button>
                <button
                  type="button"
                  onClick={() => navigateTo('apk')}
                  className="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 font-medium text-[#2b4865] dark:text-sky-400 cursor-pointer"
                >
                  <Smartphone className="h-3.5 w-3.5" />
                  Install / Export APK
                </button>
                <div className="border-t border-slate-100 dark:border-slate-800 mt-1 pt-1">
                  {!isCloudMode ? (
                    <button
                      type="button"
                      onClick={() => {
                        setHeaderMenuOpen(false);
                        void signInWithGoogleCloud()
                          .then(({ user }) => {
                            notify(`Cloud Sync connected as ${user.email}.`, 'success');
                          })
                          .catch(() => {
                            setAuthModalMode('login');
                            setAuthModalOpen(true);
                          });
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-semibold cursor-pointer"
                    >
                      <Cloud className="h-3.5 w-3.5" />
                      Connect Google Cloud Sync
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setHeaderMenuOpen(false);
                        void signOutCloud().then(() => {
                          notify('Signed out of Cloud Sync.', 'info');
                        });
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 text-slate-600 dark:text-slate-300 font-medium cursor-pointer"
                    >
                      <Cloud className="h-3.5 w-3.5" />
                      Sign Out Cloud Sync
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setHeaderMenuOpen(false);
                      setAuthModalMode('login');
                      setAuthModalOpen(true);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 text-[#2b4865] dark:text-sky-400 font-semibold cursor-pointer"
                  >
                    <LogIn className="h-3.5 w-3.5" />
                    Sign In / Register / Switch Account
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </header>

      {/* Slide-out Sidebar Drawer */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-black/40 z-40"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.22 }}
              className="fixed inset-y-0 left-0 w-72 max-w-[84vw] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-50 shadow-2xl flex flex-col justify-between overflow-y-auto"
            >
              <div>
                {/* User Profile Header */}
                <div className="px-5 pt-5 pb-4 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-11 w-11 rounded-full bg-[#2b4865] text-white font-bold flex items-center justify-center overflow-hidden shrink-0">
                      {activeUser.avatarDataUrl ? (
                        <Image
                          src={activeUser.avatarDataUrl}
                          alt={activeUser.name}
                          width={44}
                          height={44}
                          referrerPolicy="no-referrer"
                          className="h-11 w-11 object-cover"
                        />
                      ) : (
                        <span>{activeUser.name[0]?.toUpperCase() || 'A'}</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                          {activeUser.name}
                        </p>
                        {activeUser.accountType === 'Joint' && (
                          <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300 shrink-0">
                            JOINT
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {activeUser.email}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSidebarOpen(false)}
                    aria-label="Close sidebar"
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Navigation List */}
                <nav className="px-3 py-3 space-y-1">
                  <button
                    type="button"
                    onClick={() => navigateTo('dashboard')}
                    className={navItemClass(activeTab === 'dashboard')}
                  >
                    <Home className="h-4 w-4 shrink-0" />
                    <span>{t.dashboard}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => navigateTo('deposit')}
                    className={navItemClass(activeTab === 'deposit')}
                  >
                    <ChevronsDown className="h-4 w-4 shrink-0" />
                    <span>{t.deposit}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => navigateTo('withdraw')}
                    className={navItemClass(activeTab === 'withdraw')}
                  >
                    <ArrowUpCircle className="h-4 w-4 shrink-0" />
                    <span>{t.withdraw}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => navigateTo('transfer')}
                    className={navItemClass(activeTab === 'transfer')}
                  >
                    <Send className="h-4 w-4 shrink-0" />
                    <span>{t.transfer}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => navigateTo('swap')}
                    className={navItemClass(activeTab === 'swap')}
                  >
                    <ArrowLeftRight className="h-4 w-4 shrink-0" />
                    <span>{t.swap}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => navigateTo('transactions')}
                    className={navItemClass(activeTab === 'transactions')}
                  >
                    <Banknote className="h-4 w-4 shrink-0" />
                    <span>{t.transactions}</span>
                  </button>

                  {/* Standard Investment Plan Accordion */}
                  <div>
                    <button
                      type="button"
                      onClick={() => setPlanSubmenuOpen((v) => !v)}
                      className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-medium transition cursor-pointer ${
                        activeTab === 'plans' || activeTab === 'my-investments'
                          ? 'bg-[#2b4865] text-white shadow-sm'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span className="flex items-center gap-3.5">
                        <Boxes className="h-4 w-4 shrink-0" />
                        <span>{t.plans}</span>
                      </span>
                      <ChevronDown
                        className={`h-4 w-4 transition-transform ${
                          planSubmenuOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    {planSubmenuOpen && (
                      <div className="pl-11 pr-2 py-1 space-y-1">
                        <button
                          type="button"
                          onClick={() => navigateTo('plans')}
                          className={`w-full text-left px-3 py-1.5 rounded-md text-xs font-medium cursor-pointer ${
                            activeTab === 'plans'
                              ? 'text-[#2b4865] dark:text-sky-300 bg-slate-100 dark:bg-slate-800 font-semibold'
                              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                          }`}
                        >
                          Investment Plans
                        </button>
                        <button
                          type="button"
                          onClick={() => navigateTo('my-investments')}
                          className={`w-full text-left px-3 py-1.5 rounded-md text-xs font-medium cursor-pointer ${
                            activeTab === 'my-investments'
                              ? 'text-[#2b4865] dark:text-sky-300 bg-slate-100 dark:bg-slate-800 font-semibold'
                              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                          }`}
                        >
                          My Investments
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Separate Dedicated Section: Vacation Portal ($5,000+ Gate) */}
                  <button
                    type="button"
                    onClick={() => navigateTo('vacation-portal')}
                    className={navItemClass(activeTab === 'vacation-portal')}
                  >
                    <Plane className="h-4 w-4 shrink-0" />
                    <span className="flex-1 text-left">{t.vacation}</span>
                    <span className="text-[10px] font-mono opacity-80">$5k+</span>
                  </button>

                  {/* Separate Dedicated Section: Real Estate Plan */}
                  <button
                    type="button"
                    onClick={() => navigateTo('real-estate')}
                    className={navItemClass(activeTab === 'real-estate')}
                  >
                    <Building2 className="h-4 w-4 shrink-0" />
                    <span>{t.realEstate}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => navigateTo('referrals')}
                    className={navItemClass(activeTab === 'referrals')}
                  >
                    <Repeat className="h-4 w-4 shrink-0" />
                    <span>{t.referrals}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => navigateTo('contact')}
                    className={navItemClass(activeTab === 'contact')}
                  >
                    <Mail className="h-4 w-4 shrink-0" />
                    <span>{t.contact}</span>
                  </button>

                  <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-800 space-y-1">
                    <button
                      type="button"
                      onClick={() => navigateTo('profile')}
                      className={navItemClass(activeTab === 'profile')}
                    >
                      <UserCog className="h-4 w-4 shrink-0" />
                      <span>Profile &amp; Password</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => navigateTo('kyc')}
                      className={navItemClass(activeTab === 'kyc')}
                    >
                      <BadgeCheck className="h-4 w-4 shrink-0" />
                      <span className="flex-1 text-left">KYC Verification</span>
                      <span
                        className={`text-[10px] font-bold ${
                          activeUser.kycStatus === 'Approved'
                            ? 'text-emerald-400'
                            : activeUser.kycStatus === 'Pending'
                            ? 'text-amber-400'
                            : 'text-rose-400'
                        }`}
                      >
                        {activeUser.kycStatus}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => navigateTo('admin')}
                      className={navItemClass(activeTab === 'admin')}
                    >
                      <ShieldCheck className="h-4 w-4 shrink-0" />
                      <span>Admin Dashboard</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => navigateTo('apk')}
                      className={navItemClass(activeTab === 'apk')}
                    >
                      <Smartphone className="h-4 w-4 shrink-0" />
                      <span>Android APK / Install</span>
                    </button>
                  </div>
                </nav>
              </div>

              <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
                <button
                  type="button"
                  onClick={() => setThemeMode(theme === 'dark' ? 'light' : 'dark')}
                  className="w-full py-2 px-3 rounded-md border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  {theme === 'dark' ? <Sun className="h-3.5 w-3.5 text-amber-400" /> : <Moon className="h-3.5 w-3.5" />}
                  <span>{theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}</span>
                </button>
                <PWAInstallButton variant="full" />
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Container */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-6 space-y-5">
        {/* TAB 1: DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="space-y-4">
            {showWelcomeBanner && (
              <div className="bg-white dark:bg-slate-900 rounded-md border border-slate-200/80 dark:border-slate-800 border-l-4 border-l-[#2b4865] px-5 py-4 flex items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                  <span>
                    {t.welcome}, <strong>{activeUser.name}</strong>
                  </span>
                  {activeUser.accountType === 'Joint' && activeUser.jointDetails && (
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-sky-100 dark:bg-sky-900/40 text-sky-800 dark:text-sky-300 font-medium">
                      <Users className="h-3 w-3" />
                      Joint w/ {activeUser.jointDetails.coOwnerName}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setShowWelcomeBanner(false)}
                  aria-label="Dismiss welcome banner"
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* KYC Warning Strip if not approved */}
            {activeUser.kycStatus !== 'Approved' && (
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
                  <ShieldAlert className="h-4 w-4 shrink-0" />
                  <span>
                    <strong>KYC Status: {activeUser.kycStatus}</strong> — Complete verification and receive Admin approval before making withdrawals.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => navigateTo('kyc')}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-semibold px-3 py-1.5 rounded cursor-pointer"
                >
                  {activeUser.kycStatus === 'Pending' ? 'View KYC Status' : 'Verify Identity'}
                </button>
              </div>
            )}

            {/* 5 KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-md p-5 flex items-center gap-5">
                <div className="w-16 h-16 rounded-md bg-[#2b4865] flex items-center justify-center shrink-0">
                  <Wallet className="h-8 w-8 text-white stroke-[1.75]" />
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Account balance</p>
                  <p className="text-2xl font-semibold font-mono tabular-nums text-slate-800 dark:text-white mt-0.5">
                    ${activeUser.accountBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-md p-5 flex items-center gap-5">
                <div className="w-16 h-16 rounded-md bg-[#5cc84b] flex items-center justify-center shrink-0">
                  <Coins className="h-8 w-8 text-white stroke-[1.75]" />
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Total Profit</p>
                  <p className="text-2xl font-semibold font-mono tabular-nums text-slate-800 dark:text-white mt-0.5">
                    ${activeUser.totalProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-md p-5 flex items-center gap-5">
                <div className="w-16 h-16 rounded-md bg-[#5b5ce6] flex items-center justify-center shrink-0">
                  <Gift className="h-8 w-8 text-white stroke-[1.75]" />
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Bonus</p>
                  <p className="text-2xl font-semibold font-mono tabular-nums text-slate-800 dark:text-white mt-0.5">
                    ${activeUser.bonus.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-md p-5 flex items-center gap-5">
                <div className="w-16 h-16 rounded-md bg-[#2b4865] flex items-center justify-center shrink-0">
                  <Share2 className="h-8 w-8 text-white stroke-[1.75]" />
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Referral Bonus</p>
                  <p className="text-2xl font-semibold font-mono tabular-nums text-slate-800 dark:text-white mt-0.5">
                    ${activeUser.referralBonus.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-md p-5 flex items-center gap-5 md:col-span-2">
                <div className="w-16 h-16 rounded-md bg-[#f5b041] flex items-center justify-center shrink-0">
                  <ArrowDownCircle className="h-8 w-8 text-white stroke-[1.75]" />
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Total Deposit</p>
                  <p className="text-2xl font-semibold font-mono tabular-nums text-slate-800 dark:text-white mt-0.5">
                    ${activeUser.totalDeposit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-md p-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Quick Actions</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Deposit, transfer, swap crypto, or enter Real Estate &amp; Vacation Portals.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => navigateTo('deposit')}
                  className="px-3.5 py-2 rounded-md bg-[#2b4865] text-white text-xs font-medium hover:bg-[#223a52] transition cursor-pointer"
                >
                  Deposit
                </button>
                <button
                  type="button"
                  onClick={() => navigateTo('transfer')}
                  className="px-3.5 py-2 rounded-md border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Transfer Funds
                </button>
                <button
                  type="button"
                  onClick={() => navigateTo('swap')}
                  className="px-3.5 py-2 rounded-md border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Swap Crypto
                </button>
                <button
                  type="button"
                  onClick={() => navigateTo('vacation-portal')}
                  className="px-3.5 py-2 rounded-md border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Vacation Portal
                </button>
                <button
                  type="button"
                  onClick={() => navigateTo('real-estate')}
                  className="px-3.5 py-2 rounded-md border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Real Estate
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: DEPOSIT FLOW + RECEIPT UPLOAD */}
        {activeTab === 'deposit' && (
          <div className="space-y-5">
            {depositStep === 'amount' ? (
              <>
                <div>
                  <h2 className="text-2xl font-semibold text-slate-700 dark:text-slate-100">
                    Make a Deposit
                  </h2>
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-2">
                    <button
                      type="button"
                      onClick={() => navigateTo('dashboard')}
                      className="hover:text-[#2b4865] dark:hover:text-sky-400 cursor-pointer"
                    >
                      <Home className="h-4 w-4 text-slate-400" />
                    </button>
                    <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                    <span>Deposit</span>
                  </div>
                </div>

                <form
                  onSubmit={handleProceedToPayment}
                  className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-md p-5 space-y-6"
                >
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
                      Enter Amount
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="1"
                      value={depositAmountInput}
                      onChange={(e) => setDepositAmountInput(e.target.value)}
                      placeholder="Enter Amount here"
                      className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm font-mono tabular-nums text-slate-700 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">
                      Choose your method of payment from the list below
                    </p>
                    <div className="space-y-3">
                      {PAYMENT_METHODS.map((method) => {
                        const isSelected = selectedMethodId === method.id;
                        return (
                          <button
                            key={method.id}
                            type="button"
                            onClick={() => setSelectedMethodId(method.id)}
                            className={`w-full flex items-center justify-between px-4 py-3.5 rounded-md border text-left transition cursor-pointer ${
                              isSelected
                                ? 'border-blue-500 bg-white dark:bg-slate-800 ring-1 ring-blue-500/20'
                                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-600'
                            }`}
                          >
                            <span
                              className={`text-sm ${
                                method.id === 'eth' && !isSelected
                                  ? 'text-blue-600 dark:text-sky-400'
                                  : 'text-slate-700 dark:text-slate-200'
                              }`}
                            >
                              {method.label}
                            </span>
                            <span
                              className={`w-4 h-4 rounded-full flex items-center justify-center border ${
                                isSelected
                                  ? 'border-blue-500 bg-blue-500'
                                  : 'border-slate-400 bg-white dark:bg-slate-800'
                              }`}
                            >
                              {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <button
                      type="submit"
                      className="bg-[#2b4865] hover:bg-[#223a52] text-white text-sm font-medium px-5 py-2.5 rounded-md inline-flex items-center gap-2 transition cursor-pointer"
                    >
                      <span>Proceed to Payment</span>
                      <ArrowRightCircle className="h-4 w-4" />
                    </button>
                  </div>
                </form>

                <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-md p-5">
                  <p className="text-sm text-slate-500 dark:text-slate-400">Total Deposited</p>
                  <p className="text-2xl font-bold font-mono tabular-nums text-slate-800 dark:text-white mt-1">
                    ${activeUser.totalDeposit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <div className="border-t border-slate-100 dark:border-slate-800 mt-5 pt-4">
                    <button
                      type="button"
                      onClick={() => navigateTo('transactions')}
                      className="text-sm text-slate-600 dark:text-slate-300 hover:text-[#2b4865] dark:hover:text-sky-400 transition cursor-pointer"
                    >
                      View deposit history
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div>
                  <h2 className="text-2xl font-semibold text-slate-700 dark:text-slate-100">
                    Make payment
                  </h2>
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-2">
                    <button
                      type="button"
                      onClick={() => navigateTo('dashboard')}
                      className="hover:text-[#2b4865] cursor-pointer"
                    >
                      <Home className="h-4 w-4 text-slate-400" />
                    </button>
                    <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                    <button
                      type="button"
                      onClick={() => setDepositStep('amount')}
                      className="hover:text-[#2b4865] cursor-pointer"
                    >
                      Deposit
                    </button>
                    <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                    <span>Make Payment</span>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleCancelPayment}
                    className="bg-[#f5b041] hover:bg-[#e5a031] text-white text-xs font-medium px-3.5 py-2 rounded-md inline-flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                    <span>Cancel payment</span>
                  </button>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-md p-5 space-y-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-base font-bold text-slate-800 dark:text-white">
                        {selectedMethod.label}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {selectedMethod.subtitle}
                      </p>
                    </div>
                    <p className="text-2xl font-bold font-mono tabular-nums text-slate-800 dark:text-white">
                      ${parsedDepositAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>

                  <div className="space-y-2.5 pt-2">
                    <p className="text-sm text-slate-700 dark:text-slate-200">
                      Send ${parsedDepositAmount.toLocaleString('en-US')} to the address below
                    </p>
                    <div className="flex items-stretch">
                      <input
                        type="text"
                        readOnly
                        value={selectedMethod.address}
                        className="flex-1 min-w-0 bg-[#f8f9fa] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-l-md px-3 py-2.5 text-sm text-slate-600 dark:text-slate-200 font-mono focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleCopyAddress}
                        aria-label="Copy wallet address"
                        className="px-4 border border-l-0 border-slate-300 dark:border-slate-700 rounded-r-md bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 flex items-center justify-center transition cursor-pointer"
                      >
                        {addressCopied ? (
                          <Check className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <p className="text-sm text-slate-700 dark:text-slate-200">
                    <span className="font-semibold">Network Type:</span> {selectedMethod.networkType}
                  </p>

                  {!proofStageVisible ? (
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => setProofStageVisible(true)}
                        className="bg-[#2b4865] hover:bg-[#223a52] text-white text-sm font-medium px-5 py-2.5 rounded-md transition cursor-pointer"
                      >
                        Mark as Completed
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <div>
                        <label className="block text-sm text-slate-700 dark:text-slate-200 mb-2">
                          Upload Payment Receipt (Screenshot / PDF)
                        </label>
                        <div className="border border-slate-200 dark:border-slate-700 rounded-md p-3 flex items-center gap-3 bg-white dark:bg-slate-800">
                          <label className="px-3 py-1.5 rounded border border-blue-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-blue-600 dark:text-sky-300 text-xs font-medium cursor-pointer shrink-0">
                            Choose File
                            <input
                              type="file"
                              accept="image/png,image/jpeg,image/webp,image/gif,application/pdf"
                              onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                              className="sr-only"
                            />
                          </label>
                          <span className="text-xs text-slate-500 dark:text-slate-300 truncate">
                            {proofFile ? proofFile.name : 'no file selected'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                          <span className="font-bold">NOTE:</span> Only Images and PDF are allowed. Uploaded receipts are stored for Admin verification and viewable anytime in Transactions.
                        </p>
                      </div>

                      <div className="border-t border-slate-100 dark:border-slate-800 pt-4 flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={handleCompleteDeposit}
                          className="bg-[#2b4865] hover:bg-[#223a52] text-white text-sm font-medium px-5 py-2.5 rounded-md inline-flex items-center gap-2 transition cursor-pointer"
                        >
                          <Upload className="h-4 w-4" />
                          <span>Complete deposit</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelPayment}
                          className="bg-[#343a40] hover:bg-[#23272b] text-white text-sm font-medium px-5 py-2.5 rounded-md transition cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* TAB 3: WITHDRAW (STRICTLY KYC-GATED BY ADMIN APPROVAL) */}
        {activeTab === 'withdraw' && (
          <div className="space-y-5">
            <div>
              <h2 className="text-2xl font-semibold text-slate-700 dark:text-slate-100">
                Withdraw Funds
              </h2>
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-2">
                <button
                  type="button"
                  onClick={() => navigateTo('dashboard')}
                  className="hover:text-[#2b4865] cursor-pointer"
                >
                  <Home className="h-4 w-4 text-slate-400" />
                </button>
                <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                <span>Withdraw</span>
              </div>
            </div>

            {activeUser.kycStatus !== 'Approved' ? (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md p-6 text-center space-y-4">
                <div className="mx-auto h-14 w-14 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                  {activeUser.kycStatus === 'Pending' ? (
                    <Clock className="h-7 w-7 text-amber-600" />
                  ) : (
                    <Lock className="h-7 w-7" />
                  )}
                </div>
                <div className="space-y-1.5">
                  <span className="inline-block px-2.5 py-0.5 rounded bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 text-xs font-bold">
                    Strict KYC Gate · Status: {activeUser.kycStatus}
                  </span>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                    {activeUser.kycStatus === 'Pending'
                      ? 'Withdrawals Locked Pending Admin Approval'
                      : 'KYC Verification Required Before Withdrawal'}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 max-w-md mx-auto leading-relaxed">
                    {activeUser.kycStatus === 'Pending'
                      ? 'Your KYC identity submission has been received and is awaiting strict Admin approval. Withdrawals will unlock immediately upon approval.'
                      : 'To protect account security, all investors must pass KYC identity verification and receive Admin approval before submitting any withdrawal.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigateTo('kyc')}
                  className="bg-[#2b4865] hover:bg-[#223a52] text-white text-xs font-medium px-5 py-2.5 rounded-md cursor-pointer"
                >
                  {activeUser.kycStatus === 'Pending'
                    ? 'View Submitted KYC Application'
                    : 'Complete KYC Verification Now'}
                </button>
              </div>
            ) : (
              <form
                onSubmit={handleWithdrawSubmit}
                className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-md p-5 space-y-4"
              >
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-md flex items-center justify-between text-xs">
                  <span className="text-emerald-700 dark:text-emerald-300 font-semibold flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4" />
                    KYC Approved — Withdrawals Unlocked
                  </span>
                  <span className="font-bold font-mono tabular-nums text-[#2b4865] dark:text-sky-400 text-sm">
                    ${activeUser.accountBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                    Withdrawal Method
                  </label>
                  <select
                    value={withdrawMethod}
                    onChange={(e) => setWithdrawMethod(e.target.value)}
                    className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-700 dark:text-slate-100 focus:outline-none focus:border-blue-500"
                  >
                    {PAYMENT_METHODS.map((m) => (
                      <option key={m.id} value={m.label}>
                        {m.label} ({m.networkType})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                    Amount (USD, min $100)
                  </label>
                  <input
                    type="number"
                    min={100}
                    step="any"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="Enter withdrawal amount"
                    className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm font-mono tabular-nums text-slate-700 dark:text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                    Destination Wallet Address
                  </label>
                  <input
                    type="text"
                    value={withdrawDestination}
                    onChange={(e) => setWithdrawDestination(e.target.value)}
                    placeholder="Paste receiving address"
                    className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-700 dark:text-slate-100 font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>

                <button
                  type="submit"
                  className="bg-[#2b4865] hover:bg-[#223a52] text-white text-sm font-medium px-5 py-2.5 rounded-md transition cursor-pointer"
                >
                  Submit Withdrawal Request
                </button>
              </form>
            )}
          </div>
        )}

        {/* NEW PORTALS */}
        {activeTab === 'transfer' && (
          <TransferFundsView
            user={activeUser}
            store={effectiveStore}
            isCloudMode={isCloudMode}
            onNavigate={navigateTo}
            onNotify={notify}
          />
        )}

        {activeTab === 'swap' && (
          <CryptoSwapView
            user={activeUser}
            store={effectiveStore}
            isCloudMode={isCloudMode}
            onNavigate={navigateTo}
            onNotify={notify}
          />
        )}

        {activeTab === 'vacation-portal' && (
          <VacationPortalView
            user={activeUser}
            store={effectiveStore}
            isCloudMode={isCloudMode}
            onNavigate={navigateTo}
            onNotify={notify}
          />
        )}

        {activeTab === 'real-estate' && (
          <RealEstatePortalView
            user={activeUser}
            store={effectiveStore}
            isCloudMode={isCloudMode}
            onNavigate={navigateTo}
            onNotify={notify}
          />
        )}

        {activeTab === 'profile' && (
          <AccountProfileView
            key={activeUser.id}
            user={activeUser}
            store={effectiveStore}
            isCloudMode={isCloudMode}
            onNavigate={navigateTo}
            onNotify={notify}
          />
        )}

        {activeTab === 'kyc' && (
          <KycVerificationView
            key={activeUser.id}
            user={activeUser}
            store={effectiveStore}
            isCloudMode={isCloudMode}
            onNavigate={navigateTo}
            onNotify={notify}
          />
        )}

        {activeTab === 'admin' && (
          <AdminDashboardView
            user={activeUser}
            store={effectiveStore}
            isCloudMode={isCloudMode}
            onNavigate={navigateTo}
            onNotify={notify}
            onInspectReceipt={(tx) => setReceiptModalTx(tx)}
            onInspectKyc={(target) => setKycInspectUser(target)}
          />
        )}

        {/* TAB 4: TRANSACTIONS */}
        {activeTab === 'transactions' && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-semibold text-slate-700 dark:text-slate-100">
                  Transactions
                </h2>
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-2">
                  <button
                    type="button"
                    onClick={() => navigateTo('dashboard')}
                    className="hover:text-[#2b4865] cursor-pointer"
                  >
                    <Home className="h-4 w-4 text-slate-400" />
                  </button>
                  <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                  <span>Transactions</span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleExportCsv}
                className="bg-[#2b4865] hover:bg-[#223a52] text-white text-xs font-medium px-4 py-2 rounded-md inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" />
                Export CSV
              </button>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-md p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-1.5">
                  {(['All', 'Completed', 'Pending', 'Cancelled'] as const).map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setTxFilter(status)}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition cursor-pointer ${
                        txFilter === status
                          ? 'bg-[#2b4865] text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
                <div className="relative">
                  <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={txSearch}
                    onChange={(e) => setTxSearch(e.target.value)}
                    placeholder="Search reference or method"
                    className="pl-8 pr-3 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {filteredTransactions.length === 0 ? (
                <div className="py-12 text-center text-sm text-slate-500 dark:text-slate-400 border border-dashed border-slate-200 dark:border-slate-700 rounded-md">
                  No transactions recorded yet. Make a deposit to see your ledger history.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400">
                        <th className="pb-2.5 font-semibold">Reference</th>
                        <th className="pb-2.5 font-semibold">Type</th>
                        <th className="pb-2.5 font-semibold">Details / Receipt</th>
                        <th className="pb-2.5 font-semibold">Amount</th>
                        <th className="pb-2.5 font-semibold">Status</th>
                        <th className="pb-2.5 font-semibold">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredTransactions.map((tx) => (
                        <tr key={tx.id}>
                          <td className="py-3 font-mono text-slate-700 dark:text-slate-200">
                            {tx.id}
                          </td>
                          <td className="py-3 text-slate-700 dark:text-slate-200">{tx.type}</td>
                          <td className="py-3 text-slate-600 dark:text-slate-300">
                            <div>{tx.method}</div>
                            {tx.proofName && (
                              <button
                                type="button"
                                onClick={() => setReceiptModalTx(tx)}
                                className="mt-0.5 text-[11px] text-[#2b4865] dark:text-sky-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                              >
                                <Eye className="h-3 w-3" />
                                View Receipt ({tx.proofName})
                              </button>
                            )}
                          </td>
                          <td className="py-3 font-mono tabular-nums font-semibold text-slate-800 dark:text-white">
                            ${tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                                tx.status === 'Completed'
                                  ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300'
                                  : tx.status === 'Cancelled'
                                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                                  : 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300'
                              }`}
                            >
                              {tx.status}
                            </span>
                          </td>
                          <td className="py-3 font-mono text-slate-500 dark:text-slate-400">
                            {tx.date}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: INVESTMENT PLANS */}
        {activeTab === 'plans' && (
          <div className="space-y-5">
            <div>
              <h2 className="text-2xl font-semibold text-slate-700 dark:text-slate-100">
                Investment Plans
              </h2>
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-2">
                <button
                  type="button"
                  onClick={() => navigateTo('dashboard')}
                  className="hover:text-[#2b4865] cursor-pointer"
                >
                  <Home className="h-4 w-4 text-slate-400" />
                </button>
                <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                <span>Investment Plans</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {INVESTMENT_PLANS.map((plan) => (
                <div
                  key={plan.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md p-5 space-y-4 border-t-4 border-t-[#2b4865]"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-slate-800 dark:text-white">
                      {plan.name}
                    </h3>
                    <span className="px-2.5 py-1 rounded bg-[#2b4865]/10 dark:bg-sky-500/20 text-[#2b4865] dark:text-sky-300 text-xs font-bold font-mono">
                      {plan.dailyRate} / day
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5">
                    <div className="flex justify-between">
                      <span>Duration</span>
                      <span className="font-semibold text-slate-800 dark:text-white">
                        {plan.durationDays} Days
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Minimum Deposit</span>
                      <span className="font-mono tabular-nums font-semibold text-slate-800 dark:text-white">
                        ${plan.min.toLocaleString('en-US')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Maximum Deposit</span>
                      <span className="font-mono tabular-nums font-semibold text-slate-800 dark:text-white">
                        ${plan.max.toLocaleString('en-US')}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min={plan.min}
                      max={plan.max}
                      value={planInvestAmounts[plan.id] || ''}
                      onChange={(e) =>
                        setPlanInvestAmounts((prev) => ({ ...prev, [plan.id]: e.target.value }))
                      }
                      className="flex-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-mono text-slate-700 dark:text-slate-100"
                    />
                    <button
                      type="button"
                      onClick={() => handleInvestPlan(plan)}
                      className="bg-[#2b4865] hover:bg-[#223a52] text-white text-xs font-medium px-4 py-2 rounded-md transition cursor-pointer"
                    >
                      Invest Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5B: MY INVESTMENTS */}
        {activeTab === 'my-investments' && (
          <div className="space-y-5">
            <div>
              <h2 className="text-2xl font-semibold text-slate-700 dark:text-slate-100">
                My Investments
              </h2>
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-2">
                <button
                  type="button"
                  onClick={() => navigateTo('dashboard')}
                  className="hover:text-[#2b4865] cursor-pointer"
                >
                  <Home className="h-4 w-4 text-slate-400" />
                </button>
                <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                <span>My Investments</span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md p-5">
              {userInvestments.length === 0 ? (
                <div className="py-10 text-center space-y-3">
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    You have no active investment plans yet.
                  </p>
                  <button
                    type="button"
                    onClick={() => navigateTo('plans')}
                    className="bg-[#2b4865] text-white text-xs font-medium px-4 py-2 rounded-md cursor-pointer"
                  >
                    Browse Investment Plans
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {userInvestments.map((inv) => (
                    <div
                      key={inv.id}
                      className="p-4 border border-slate-200 dark:border-slate-700 rounded-md flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-slate-800 dark:text-white">{inv.planName}</p>
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px]">
                            {inv.category}
                          </span>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400">
                          {inv.dailyRate}/day · {inv.durationDays} days · Started {inv.startedAt}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold font-mono tabular-nums text-[#2b4865] dark:text-sky-400">
                          ${inv.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </p>
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                          {inv.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 6: REFERRALS */}
        {activeTab === 'referrals' && (
          <div className="space-y-5">
            <div>
              <h2 className="text-2xl font-semibold text-slate-700 dark:text-slate-100">
                Referrals
              </h2>
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-2">
                <button
                  type="button"
                  onClick={() => navigateTo('dashboard')}
                  className="hover:text-[#2b4865] cursor-pointer"
                >
                  <Home className="h-4 w-4 text-slate-400" />
                </button>
                <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                <span>Referrals</span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md p-5 space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Share your personal tracking referral link below and earn a 5% referral bonus on every invitee&apos;s first confirmed deposit.
              </p>
              <div className="flex items-stretch">
                <input
                  type="text"
                  readOnly
                  value={shareReferralUrl}
                  className="flex-1 min-w-0 bg-[#f8f9fa] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-l-md px-3 py-2.5 text-xs font-mono text-slate-700 dark:text-slate-200"
                />
                <button
                  type="button"
                  onClick={handleCopyReferral}
                  className="bg-[#2b4865] hover:bg-[#223a52] text-white text-xs font-medium px-4 rounded-r-md inline-flex items-center gap-1.5 cursor-pointer"
                >
                  {refCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {refCopied ? 'Copied' : 'Copy'}
                </button>
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => {
                    captureVisitorLocationForAdmin(
                      activeUser.referralCode,
                      shareReferralUrl,
                      (entry) => {
                        if (auth.currentUser) {
                          void cloudLogVisitorLocation(auth.currentUser.uid, entry);
                        } else {
                          queuePendingLocationLog(entry);
                        }
                      }
                    );
                    notify('Referral link visit simulated.', 'info');
                  }}
                  className="text-xs text-[#2b4865] dark:text-sky-400 hover:underline cursor-pointer"
                >
                  Test Referral Link Click
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: CONTACT US (2 SUPPORT EMAILS) */}
        {activeTab === 'contact' && (
          <div className="space-y-5">
            <div>
              <h2 className="text-2xl font-semibold text-slate-700 dark:text-slate-100">
                Contact Us
              </h2>
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-2">
                <button
                  type="button"
                  onClick={() => navigateTo('dashboard')}
                  className="hover:text-[#2b4865] cursor-pointer"
                >
                  <Home className="h-4 w-4 text-slate-400" />
                </button>
                <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                <span>Contact Us</span>
              </div>
            </div>

            {/* Two Direct Support Email Channels */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {SUPPORT_EMAILS.map((channel) => (
                <div
                  key={channel.email}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md p-4 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#2b4865] dark:text-sky-400">
                      {channel.label}
                    </p>
                    <p className="text-sm font-mono font-semibold text-slate-800 dark:text-white truncate mt-0.5">
                      {channel.email}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {channel.hours}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopySupportEmail(channel.email)}
                    className="px-3 py-1.5 rounded border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 inline-flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    {copiedSupportEmail === channel.email ? (
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                    Copy
                  </button>
                </div>
              ))}
            </div>

            <form
              onSubmit={handleContactSubmit}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md p-5 space-y-4"
            >
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                  Route Inquiry To
                </label>
                <select
                  value={contactDeskEmail}
                  onChange={(e) => setContactDeskEmail(e.target.value)}
                  className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-700 dark:text-slate-100 focus:outline-none focus:border-blue-500"
                >
                  {SUPPORT_EMAILS.map((c) => (
                    <option key={c.email} value={c.email}>
                      {c.label} ({c.email})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                  Subject
                </label>
                <input
                  type="text"
                  value={contactSubject}
                  onChange={(e) => setContactSubject(e.target.value)}
                  placeholder="How can we help?"
                  className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-700 dark:text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                  Message
                </label>
                <textarea
                  rows={4}
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  placeholder="Describe your request..."
                  className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-700 dark:text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>
              <button
                type="submit"
                className="bg-[#2b4865] hover:bg-[#223a52] text-white text-sm font-medium px-5 py-2.5 rounded-md inline-flex items-center gap-2 cursor-pointer"
              >
                <Send className="h-4 w-4" />
                Send Message
              </button>

              {userTickets.length > 0 && (
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Submitted Tickets
                  </p>
                  {userTickets.map((m) => (
                    <div
                      key={m.id}
                      className="text-xs text-slate-600 dark:text-slate-300 flex flex-wrap justify-between gap-2 bg-slate-50 dark:bg-slate-800 px-3 py-2 rounded"
                    >
                      <span>
                        <strong>{m.subject}</strong> → {m.targetDeskEmail}
                      </span>
                      <span className="font-mono text-slate-400">{m.date}</span>
                    </div>
                  ))}
                </div>
              )}
            </form>
          </div>
        )}

        {/* TAB 8: ANDROID APK & PWA INSTALLER */}
        {activeTab === 'apk' && (
          <div className="space-y-5">
            <div>
              <h2 className="text-2xl font-semibold text-slate-700 dark:text-slate-100">
                Android APK &amp; App Install
              </h2>
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-2">
                <button
                  type="button"
                  onClick={() => navigateTo('dashboard')}
                  className="hover:text-[#2b4865] cursor-pointer"
                >
                  <Home className="h-4 w-4 text-slate-400" />
                </button>
                <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                <span>Android APK</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md p-5 space-y-4">
                <div className="flex items-center gap-2 text-[#2b4865] dark:text-sky-400 font-bold text-sm">
                  <QrCode className="h-4 w-4" />
                  <span>Instant Android WebAPK Install</span>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <AppQRCode url={apkTargetUrl} size={120} />
                  <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
                    <p>
                      Scan this QR code with your Android camera, open in Chrome, and tap{' '}
                      <strong>Install App</strong> to install AssetCrest directly onto your phone.
                    </p>
                    <PWAInstallButton variant="full" />
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md p-5 space-y-4">
                <div className="flex items-center gap-2 text-[#2b4865] dark:text-sky-400 font-bold text-sm">
                  <ShieldCheck className="h-4 w-4" />
                  <span>Build Android APK Project (.zip)</span>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      App Name
                    </label>
                    <input
                      type="text"
                      value={apkAppName}
                      onChange={(e) => setApkAppName(e.target.value)}
                      className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-700 dark:text-slate-100"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                        Package ID
                      </label>
                      <input
                        type="text"
                        value={apkPackageName}
                        onChange={(e) => setApkPackageName(e.target.value)}
                        className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-mono text-slate-700 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                        Version
                      </label>
                      <input
                        type="text"
                        value={apkVersionName}
                        onChange={(e) => setApkVersionName(e.target.value)}
                        className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-700 dark:text-slate-100"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Target URL
                    </label>
                    <input
                      type="url"
                      value={apkTargetUrl}
                      onChange={(e) => setCustomTargetUrl(e.target.value)}
                      className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-mono text-slate-700 dark:text-slate-100"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleBuildApkBundle}
                    disabled={isBuildingApk}
                    className="w-full bg-[#2b4865] hover:bg-[#223a52] text-white text-xs font-medium py-2.5 rounded-md inline-flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
                  >
                    {isBuildingApk ? (
                      <>
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        Packaging APK Bundle...
                      </>
                    ) : (
                      <>
                        <Cpu className="h-3.5 w-3.5" />
                        Package Android APK Bundle (.zip)
                      </>
                    )}
                  </button>

                  {apkReady && (
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-md space-y-2">
                      <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
                        <CheckCircle2 className="h-4 w-4 shrink-0" />
                        <span className="truncate">
                          {bundleFilename} ({bundleSizeKb ?? 32} KB)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleDownloadApkBundle}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium py-2 rounded-md inline-flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Download className="h-3.5 w-3.5" />
                        Download Android APK Project (.zip)
                      </button>
                      <div className="text-[11px] text-slate-600 dark:text-slate-300 flex items-center gap-1">
                        <Terminal className="h-3.5 w-3.5 text-[#2b4865] dark:text-sky-400 shrink-0" />
                        <span>Includes Gradle, TWA manifest &amp; GitHub Actions APK CI.</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Steel-Navy Footer */}
      <footer className="bg-[#2b4865] dark:bg-slate-900 border-t border-[#223a52] dark:border-slate-800 text-white px-5 py-6 mt-auto">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="text-sm space-y-1">
            <p>All Rights Reserved ©</p>
            <p>AssetCrest 2026</p>
          </div>
          <div className="flex flex-col items-end">
            <select
              aria-label="Select Language"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs font-medium rounded-full px-4 py-1.5 shadow-sm focus:outline-none cursor-pointer"
            >
              <option value="en">Select Language (EN)</option>
              <option value="es">Español</option>
              <option value="fr">Français</option>
              <option value="de">Deutsch</option>
              <option value="pt">Português</option>
            </select>
            <span className="text-[10px] text-slate-300/70 mt-1">Multi-language UI</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
