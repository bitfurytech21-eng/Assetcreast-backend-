'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  UserPlus,
  LogIn,
  KeyRound,
  Users,
  User,
  Upload,
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  FileText,
  AlertCircle,
  Lock,
  Cloud,
  CloudOff,
} from 'lucide-react';
import {
  AccountType,
  AssetCrestStore,
  EMPTY_CRYPTO_BALANCES,
  formatNowStamp,
  nextRecordId,
  readAndCompressFile,
  TransactionRecord,
  updateAssetCrestStore,
  UserAccount,
  PageTab,
} from '@/lib/assetcrest-store';
import { signInWithGoogleCloud, signOutCloud } from '@/lib/firebase';

interface AuthModalProps {
  open: boolean;
  initialMode?: 'login' | 'register' | 'forgot';
  onClose: () => void;
  store: AssetCrestStore;
  onNotify: (msg: string, tone?: 'success' | 'info' | 'error') => void;
  isCloudMode?: boolean;
  cloudEmail?: string | null;
}

export function AuthModal({
  open,
  initialMode = 'login',
  onClose,
  store,
  onNotify,
  isCloudMode = false,
  cloudEmail = null,
}: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(initialMode);
  const [cloudBusy, setCloudBusy] = useState(false);

  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regAccountType, setRegAccountType] = useState<AccountType>('Individual');
  const [coOwnerName, setCoOwnerName] = useState('');
  const [coOwnerEmail, setCoOwnerEmail] = useState('');
  const [coOwnerRelationship, setCoOwnerRelationship] = useState('Spouse');
  const [authMode, setAuthMode] = useState<'Either Owner' | 'Dual Notice'>('Either Owner');
  const [regAvatar, setRegAvatar] = useState<string>('');

  // Forgot password state
  const [forgotStep, setForgotStep] = useState<'email' | 'verify'>('email');
  const [forgotEmail, setForgotEmail] = useState('');
  const [generatedResetCode, setGeneratedResetCode] = useState('');
  const [enteredResetCode, setEnteredResetCode] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');

  if (!open) return null;

  const handleGoogleSignIn = async () => {
    setCloudBusy(true);
    try {
      const { user, isNewUser } = await signInWithGoogleCloud();
      onNotify(
        isNewUser
          ? `Welcome ${user.displayName || user.email}! Your Cloud Investor Account is now active.`
          : `Cloud Sync connected as ${user.email}.`,
        'success'
      );
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Google sign-in failed.';
      if (msg.includes('popup-closed-by-user')) {
        onNotify('Google sign-in popup was closed.', 'info');
      } else if (msg.includes('Quota exceeded')) {
        onNotify('Daily Firestore free-tier quota exceeded. Quota resets tomorrow.', 'error');
      } else {
        onNotify('Could not complete Google Cloud sign-in. Please allow popups and try again.', 'error');
      }
    } finally {
      setCloudBusy(false);
    }
  };

  const handleGoogleSignOut = async () => {
    setCloudBusy(true);
    try {
      await signOutCloud();
      onNotify('Signed out of Google Cloud Sync. Returned to Single-Device Demo mode.', 'info');
      onClose();
    } catch {
      onNotify('Failed to sign out cleanly.', 'error');
    } finally {
      setCloudBusy(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      onNotify('Please choose an image file for your profile photo.', 'error');
      return;
    }
    try {
      const dataUrl = await readAndCompressFile(file, 180, 100000);
      setRegAvatar(dataUrl);
    } catch {
      onNotify('Could not process profile photo.', 'error');
    }
  };

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    const target = store.users.find(
      (u) => u.email.trim().toLowerCase() === loginEmail.trim().toLowerCase()
    );
    if (!target || target.password !== loginPassword) {
      onNotify('Invalid email or password.', 'error');
      return;
    }
    updateAssetCrestStore((prev) => ({
      ...prev,
      activeUserId: target.id,
    }));
    onNotify(`Signed in as ${target.name}.`, 'success');
    onClose();
  };

  const handleQuickSwitch = (user: UserAccount) => {
    updateAssetCrestStore((prev) => ({
      ...prev,
      activeUserId: user.id,
    }));
    onNotify(`Switched active session to ${user.name}.`, 'success');
    onClose();
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regEmail.trim() || !regPassword) {
      onNotify('Please complete all required registration fields.', 'error');
      return;
    }
    if (regPassword.length < 6) {
      onNotify('Password must be at least 6 characters long.', 'error');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      onNotify('Passwords do not match.', 'error');
      return;
    }
    const exists = store.users.some(
      (u) => u.email.trim().toLowerCase() === regEmail.trim().toLowerCase()
    );
    if (exists) {
      onNotify('An account with this email already exists.', 'error');
      return;
    }
    if (regAccountType === 'Joint' && (!coOwnerName.trim() || !coOwnerEmail.trim())) {
      onNotify('Please enter co-owner name and email for a Joint Account.', 'error');
      return;
    }

    const newId = nextRecordId('USR');
    const cleanRefPrefix = regName
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 6);
    const refSuffix = newId.split('-')[1] || '101';

    const newUser: UserAccount = {
      id: newId,
      name: regName.trim(),
      email: regEmail.trim().toLowerCase(),
      password: regPassword,
      role: 'investor',
      accountType: regAccountType,
      jointDetails:
        regAccountType === 'Joint'
          ? {
              coOwnerName: coOwnerName.trim(),
              coOwnerEmail: coOwnerEmail.trim().toLowerCase(),
              relationship: coOwnerRelationship,
              authorizationMode: authMode,
            }
          : undefined,
      avatarDataUrl: regAvatar || undefined,
      referralCode: `${cleanRefPrefix || 'INVESTOR'}${refSuffix}`,
      accountBalance: 0,
      totalProfit: 0,
      bonus: 0,
      referralBonus: 0,
      totalDeposit: 0,
      cryptoBalances: { ...EMPTY_CRYPTO_BALANCES },
      kycStatus: 'Unverified',
      createdAt: formatNowStamp().slice(0, 10),
    };

    updateAssetCrestStore((prev) => ({
      ...prev,
      users: [...prev.users, newUser],
      activeUserId: newUser.id,
      welcomeModalUserId: newUser.id,
    }));

    onNotify('Registration successful! Welcome to AssetCrest.', 'success');
    onClose();
  };

  const handleRequestResetCode = (e: React.FormEvent) => {
    e.preventDefault();
    const user = store.users.find(
      (u) => u.email.trim().toLowerCase() === forgotEmail.trim().toLowerCase()
    );
    if (!user) {
      onNotify('No AssetCrest account found with that email address.', 'error');
      return;
    }
    const code = String(Math.floor(100000 + Math.random() * 900000));
    setGeneratedResetCode(code);
    setForgotStep('verify');
    onNotify('Recovery verification code generated below.', 'info');
  };

  const handleCompleteReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (enteredResetCode.trim() !== generatedResetCode) {
      onNotify('Verification code does not match.', 'error');
      return;
    }
    if (resetNewPassword.length < 6) {
      onNotify('New password must be at least 6 characters.', 'error');
      return;
    }
    if (resetNewPassword !== resetConfirmPassword) {
      onNotify('New passwords do not match.', 'error');
      return;
    }

    const emailKey = forgotEmail.trim().toLowerCase();
    const matched = store.users.find((u) => u.email.toLowerCase() === emailKey);
    if (!matched) {
      onNotify('Account could not be found.', 'error');
      return;
    }

    updateAssetCrestStore((prev) => ({
      ...prev,
      activeUserId: matched.id,
      users: prev.users.map((u) =>
        u.id === matched.id ? { ...u, password: resetNewPassword } : u
      ),
    }));

    onNotify('Password updated and account unlocked.', 'success');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-2xl w-full max-w-lg overflow-hidden my-auto"
      >
        <div className="bg-[#2b4865] text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-sky-300" />
            <span className="font-bold text-sm tracking-wide">AssetCrest Account Access</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded hover:bg-white/15 cursor-pointer"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="grid grid-cols-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`py-3 inline-flex items-center justify-center gap-1.5 cursor-pointer transition ${
              mode === 'login'
                ? 'bg-white dark:bg-slate-900 text-[#2b4865] dark:text-sky-400 border-b-2 border-[#2b4865] dark:border-sky-400'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <LogIn className="h-3.5 w-3.5" />
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setMode('register')}
            className={`py-3 inline-flex items-center justify-center gap-1.5 cursor-pointer transition ${
              mode === 'register'
                ? 'bg-white dark:bg-slate-900 text-[#2b4865] dark:text-sky-400 border-b-2 border-[#2b4865] dark:border-sky-400'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <UserPlus className="h-3.5 w-3.5" />
            Register
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('forgot');
              setForgotStep('email');
            }}
            className={`py-3 inline-flex items-center justify-center gap-1.5 cursor-pointer transition ${
              mode === 'forgot'
                ? 'bg-white dark:bg-slate-900 text-[#2b4865] dark:text-sky-400 border-b-2 border-[#2b4865] dark:border-sky-400'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <KeyRound className="h-3.5 w-3.5" />
            Forgot Password
          </button>
        </div>

        <div className="px-5 pt-4 pb-3 bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
          {isCloudMode ? (
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex items-center gap-2 text-xs">
                <span className="h-7 w-7 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Cloud className="h-4 w-4" />
                </span>
                <div>
                  <p className="font-bold text-emerald-700 dark:text-emerald-300">
                    Firebase Cloud Sync Active
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[230px]">
                    {cloudEmail}
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={cloudBusy}
                onClick={handleGoogleSignOut}
                className="px-3 py-1.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <CloudOff className="h-3.5 w-3.5" />
                Sign Out
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <button
                type="button"
                disabled={cloudBusy}
                onClick={handleGoogleSignIn}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold py-2.5 px-4 rounded-md inline-flex items-center justify-center gap-2 shadow-xs transition cursor-pointer disabled:opacity-50"
              >
                <Cloud className="h-4 w-4" />
                {cloudBusy
                  ? 'Connecting Google Cloud Sync...'
                  : 'Continue with Google (Live Cloud Sync)'}
              </button>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center">
                Syncs balances, KYC, receipts, swaps &amp; transfers across all devices, or use local demo below.
              </p>
            </div>
          )}
        </div>

        <div className="p-5 max-h-[70vh] overflow-y-auto space-y-5">
          {mode === 'login' && (
            <>
              <form onSubmit={handleSignIn} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#2b4865]"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setMode('forgot');
                        setForgotEmail(loginEmail);
                        setForgotStep('email');
                      }}
                      className="text-xs text-[#2b4865] dark:text-sky-400 hover:underline cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#2b4865]"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-[#2b4865] hover:bg-[#223a52] text-white text-sm font-medium py-2.5 rounded-md transition cursor-pointer"
                >
                  Sign In to Account
                </button>
              </form>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-700 space-y-2.5">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Quick Single-Device Demo Account Switcher
                </p>
                <div className="space-y-2">
                  {store.users.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => handleQuickSwitch(u)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md border text-left text-xs transition cursor-pointer ${
                        store.activeUserId === u.id
                          ? 'border-[#2b4865] bg-[#2b4865]/5 dark:border-sky-500 dark:bg-sky-500/10'
                          : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-100">
                          <span>{u.name}</span>
                          {u.role === 'admin' && (
                            <span className="px-1.5 py-0.5 text-[10px] rounded bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">
                              ADMIN
                            </span>
                          )}
                          {u.accountType === 'Joint' && (
                            <span className="px-1.5 py-0.5 text-[10px] rounded bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300">
                              JOINT
                            </span>
                          )}
                        </div>
                        <p className="text-slate-500 dark:text-slate-400">{u.email}</p>
                      </div>
                      <span className="font-mono tabular-nums font-semibold text-[#2b4865] dark:text-sky-400">
                        ${u.accountBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              {/* Account Type Choice: Individual vs Joint */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                  Account Ownership Type
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setRegAccountType('Individual')}
                    className={`p-3 rounded-md border text-left transition cursor-pointer ${
                      regAccountType === 'Individual'
                        ? 'border-[#2b4865] bg-[#2b4865]/5 dark:border-sky-400 dark:bg-sky-500/10'
                        : 'border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-semibold text-xs text-slate-800 dark:text-slate-100">
                      <User className="h-4 w-4 text-[#2b4865] dark:text-sky-400" />
                      Individual Account
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      Single primary investor
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRegAccountType('Joint')}
                    className={`p-3 rounded-md border text-left transition cursor-pointer ${
                      regAccountType === 'Joint'
                        ? 'border-[#2b4865] bg-[#2b4865]/5 dark:border-sky-400 dark:bg-sky-500/10'
                        : 'border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-semibold text-xs text-slate-800 dark:text-slate-100">
                      <Users className="h-4 w-4 text-[#2b4865] dark:text-sky-400" />
                      Joint Account
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      Shared with co-owner
                    </p>
                  </button>
                </div>
              </div>

              {/* Optional Profile Picture */}
              <div className="flex items-center gap-3 p-3 rounded-md bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700">
                <div className="h-12 w-12 rounded-full bg-[#2b4865] text-white flex items-center justify-center font-bold overflow-hidden shrink-0">
                  {regAvatar ? (
                    <Image
                      src={regAvatar}
                      alt="Profile avatar preview"
                      width={48}
                      height={48}
                      referrerPolicy="no-referrer"
                      className="h-12 w-12 object-cover"
                    />
                  ) : (
                    <span>{(regName.trim()[0] || 'A').toUpperCase()}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                    Profile Picture (Optional)
                  </p>
                  <label className="inline-flex items-center gap-1.5 mt-1 text-xs text-[#2b4865] dark:text-sky-400 font-medium cursor-pointer hover:underline">
                    <Upload className="h-3.5 w-3.5" />
                    <span>{regAvatar ? 'Change Photo' : 'Upload Avatar Image'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Primary Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="e.g. Sophia Carter"
                    className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#2b4865]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="sophia@domain.com"
                    className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#2b4865]"
                  />
                </div>
              </div>

              {regAccountType === 'Joint' && (
                <div className="p-3.5 rounded-md border border-sky-200 dark:border-sky-800 bg-sky-50/70 dark:bg-sky-950/30 space-y-3">
                  <p className="text-xs font-bold text-[#2b4865] dark:text-sky-300 flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5" />
                    Joint Co-Owner Details
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <input
                      type="text"
                      required
                      value={coOwnerName}
                      onChange={(e) => setCoOwnerName(e.target.value)}
                      placeholder="Co-owner Full Name"
                      className="rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-800 dark:text-slate-100"
                    />
                    <input
                      type="email"
                      required
                      value={coOwnerEmail}
                      onChange={(e) => setCoOwnerEmail(e.target.value)}
                      placeholder="Co-owner Email"
                      className="rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-800 dark:text-slate-100"
                    />
                    <select
                      value={coOwnerRelationship}
                      onChange={(e) => setCoOwnerRelationship(e.target.value)}
                      className="rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-800 dark:text-slate-100"
                    >
                      <option value="Spouse">Spouse</option>
                      <option value="Business Partner">Business Partner</option>
                      <option value="Family Member">Family Member</option>
                      <option value="Co-Trustee">Trust Co-Trustee</option>
                    </select>
                    <select
                      value={authMode}
                      onChange={(e) =>
                        setAuthMode(e.target.value as 'Either Owner' | 'Dual Notice')
                      }
                      className="rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-800 dark:text-slate-100"
                    >
                      <option value="Either Owner">Either Owner Can Transact</option>
                      <option value="Dual Notice">Dual Owner Notification</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Password (min 6 chars)
                  </label>
                  <input
                    type="password"
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Create password"
                    className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    required
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-[#2b4865] hover:bg-[#223a52] text-white text-sm font-medium py-2.5 rounded-md transition cursor-pointer"
              >
                Create {regAccountType} Account
              </button>
            </form>
          )}

          {mode === 'forgot' && (
            <div className="space-y-4">
              {forgotStep === 'email' ? (
                <form onSubmit={handleRequestResetCode} className="space-y-3.5">
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Enter your registered AssetCrest email address to generate a 6-digit password recovery code.
                  </p>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Registered Email
                    </label>
                    <input
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="bitfurytech21@gmail.com"
                      className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-800 dark:text-slate-100"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-[#2b4865] hover:bg-[#223a52] text-white text-sm font-medium py-2.5 rounded-md cursor-pointer"
                  >
                    Send Recovery Code
                  </button>
                </form>
              ) : (
                <form onSubmit={handleCompleteReset} className="space-y-3.5">
                  <div className="p-3 rounded-md bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200">
                    Single-Device Recovery Code for <strong>{forgotEmail}</strong>:{' '}
                    <span className="font-mono font-bold text-sm tracking-widest ml-1">
                      {generatedResetCode}
                    </span>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      6-Digit Verification Code
                    </label>
                    <input
                      type="text"
                      required
                      value={enteredResetCode}
                      onChange={(e) => setEnteredResetCode(e.target.value)}
                      placeholder="Enter 6-digit code"
                      className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm font-mono text-slate-800 dark:text-slate-100"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                        New Password
                      </label>
                      <input
                        type="password"
                        required
                        value={resetNewPassword}
                        onChange={(e) => setResetNewPassword(e.target.value)}
                        className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-800 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                        Confirm Password
                      </label>
                      <input
                        type="password"
                        required
                        value={resetConfirmPassword}
                        onChange={(e) => setResetConfirmPassword(e.target.value)}
                        className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-800 dark:text-slate-100"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-[#2b4865] hover:bg-[#223a52] text-white text-sm font-medium py-2.5 rounded-md cursor-pointer"
                  >
                    Verify &amp; Reset Password
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

interface WelcomeModalProps {
  user: UserAccount | null;
  onDismiss: () => void;
  onNavigate: (tab: PageTab) => void;
}

export function WelcomeRegistrationModal({ user, onDismiss, onNavigate }: WelcomeModalProps) {
  if (!user) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 14 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94 }}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-2xl w-full max-w-md overflow-hidden"
        >
          <div className="bg-[#2b4865] text-white p-6 text-center space-y-2 relative">
            <div className="mx-auto h-12 w-12 rounded-full bg-white/15 flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-amber-300" />
            </div>
            <h3 className="text-lg font-bold">Welcome to AssetCrest, {user.name}!</h3>
            <p className="text-xs text-slate-200">
              {user.accountType === 'Joint' && user.jointDetails
                ? `Your Joint Investor Account with ${user.jointDetails.coOwnerName} is now active and secured.`
                : 'Your Individual Investor Account has been created and secured.'}
            </p>
          </div>

          <div className="p-5 space-y-4 text-xs text-slate-600 dark:text-slate-300">
            <p className="leading-relaxed">
              We are delighted to have you on board. Complete these quick steps to unlock your full AssetCrest experience:
            </p>
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => {
                  onDismiss();
                  onNavigate('deposit');
                }}
                className="w-full flex items-center justify-between p-3 rounded-md border border-slate-200 dark:border-slate-700 hover:border-[#2b4865] dark:hover:border-sky-400 transition text-left cursor-pointer"
              >
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-100">
                    1. Fund Your Account
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Deposit via 8 crypto rails and upload your payment receipt
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-[#2b4865] dark:text-sky-400 shrink-0" />
              </button>

              <button
                type="button"
                onClick={() => {
                  onDismiss();
                  onNavigate('kyc');
                }}
                className="w-full flex items-center justify-between p-3 rounded-md border border-slate-200 dark:border-slate-700 hover:border-[#2b4865] dark:hover:border-sky-400 transition text-left cursor-pointer"
              >
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-100">
                    2. Pass KYC Verification
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Required before making any withdrawals from your wallet
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-[#2b4865] dark:text-sky-400 shrink-0" />
              </button>

              <button
                type="button"
                onClick={() => {
                  onDismiss();
                  onNavigate('vacation-portal');
                }}
                className="w-full flex items-center justify-between p-3 rounded-md border border-slate-200 dark:border-slate-700 hover:border-[#2b4865] dark:hover:border-sky-400 transition text-left cursor-pointer"
              >
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-100">
                    3. Explore Vacation ($5,000+) &amp; Real Estate Portals
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Access specialized wealth &amp; lifestyle yield tiers
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-[#2b4865] dark:text-sky-400 shrink-0" />
              </button>
            </div>

            <button
              type="button"
              onClick={onDismiss}
              className="w-full bg-[#2b4865] hover:bg-[#223a52] text-white text-sm font-medium py-2.5 rounded-md cursor-pointer"
            >
              Go to My Dashboard
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export function ReceiptPreviewModal({
  transaction,
  onClose,
}: {
  transaction: TransactionRecord | null;
  onClose: () => void;
}) {
  if (!transaction) return null;

  const isPdf = transaction.proofDataUrl?.startsWith('data:application/pdf');

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-[#2b4865] text-white px-4 py-3 flex items-center justify-between">
          <span className="text-xs font-bold">Payment Receipt — {transaction.id}</span>
          <button type="button" onClick={onClose} className="p-1 rounded hover:bg-white/15 cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-4 space-y-3 text-xs">
          <div className="flex justify-between text-slate-600 dark:text-slate-300">
            <span>Method: {transaction.method}</span>
            <span className="font-mono font-bold">
              ${transaction.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
          {transaction.proofDataUrl ? (
            isPdf ? (
              <div className="p-5 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-center space-y-2">
                <FileText className="h-8 w-8 mx-auto text-[#2b4865] dark:text-sky-400" />
                <p className="font-semibold text-slate-700 dark:text-slate-200">
                  {transaction.proofName || 'receipt.pdf'}
                </p>
                <a
                  href={transaction.proofDataUrl}
                  download={transaction.proofName || 'payment-receipt.pdf'}
                  className="inline-block bg-[#2b4865] text-white px-3 py-1.5 rounded text-xs font-medium"
                >
                  Download PDF Receipt
                </a>
              </div>
            ) : (
              <div className="rounded border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-50 dark:bg-slate-800 flex justify-center p-2">
                <Image
                  src={transaction.proofDataUrl}
                  alt={transaction.proofName || 'Payment Receipt'}
                  width={420}
                  height={420}
                  referrerPolicy="no-referrer"
                  className="max-h-80 w-auto object-contain rounded"
                />
              </div>
            )
          ) : (
            <div className="p-6 text-center text-slate-500 dark:text-slate-400 border border-dashed border-slate-200 dark:border-slate-700 rounded">
              <AlertCircle className="h-6 w-6 mx-auto mb-1 text-slate-400" />
              Receipt file name recorded ({transaction.proofName || 'N/A'}), no preview image attached.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function KycInspectModal({
  user,
  onClose,
  onApprove,
  onReject,
}: {
  user: UserAccount | null;
  onClose: () => void;
  onApprove: (userId: string) => void;
  onReject: (userId: string, reason: string) => void;
}) {
  const [rejectReason, setRejectReason] = useState('Document details unclear or mismatched');

  if (!user || !user.kycSubmission) return null;
  const sub = user.kycSubmission;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-2xl w-full max-w-lg overflow-hidden my-auto">
        <div className="bg-[#2b4865] text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-sky-300" />
            <span className="text-xs font-bold">Admin KYC Inspection — {user.name}</span>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded hover:bg-white/15 cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3 p-3 rounded bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <div>
              <span className="text-slate-400 block">Legal Name</span>
              <span className="font-semibold text-slate-800 dark:text-slate-100">{sub.legalName}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Country</span>
              <span className="font-semibold text-slate-800 dark:text-slate-100">{sub.country}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Document Type</span>
              <span className="font-semibold text-slate-800 dark:text-slate-100">{sub.documentType}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Document Number</span>
              <span className="font-mono font-semibold text-slate-800 dark:text-slate-100">
                {sub.documentNumber}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="border border-slate-200 dark:border-slate-700 rounded p-2.5 space-y-1.5">
              <p className="font-semibold text-slate-600 dark:text-slate-300">ID Document Front</p>
              {sub.idFrontDataUrl ? (
                <Image
                  src={sub.idFrontDataUrl}
                  alt="ID Document"
                  width={240}
                  height={160}
                  referrerPolicy="no-referrer"
                  className="w-full h-32 object-cover rounded"
                />
              ) : (
                <div className="h-32 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                  {sub.idFrontName}
                </div>
              )}
            </div>
            <div className="border border-slate-200 dark:border-slate-700 rounded p-2.5 space-y-1.5">
              <p className="font-semibold text-slate-600 dark:text-slate-300">Verification Selfie</p>
              {sub.selfieDataUrl ? (
                <Image
                  src={sub.selfieDataUrl}
                  alt="Verification Selfie"
                  width={240}
                  height={160}
                  referrerPolicy="no-referrer"
                  className="w-full h-32 object-cover rounded"
                />
              ) : (
                <div className="h-32 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                  {sub.selfieName}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Rejection Note (if rejecting)
            </label>
            <input
              type="text"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-800 dark:text-slate-100"
            />
          </div>

          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => {
                onApprove(user.id);
                onClose();
              }}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded inline-flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="h-4 w-4" />
              Approve KYC &amp; Unlock Withdrawals
            </button>
            <button
              type="button"
              onClick={() => {
                onReject(user.id, rejectReason);
                onClose();
              }}
              className="px-4 bg-rose-600 hover:bg-rose-700 text-white font-semibold py-2.5 rounded cursor-pointer"
            >
              Reject
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
