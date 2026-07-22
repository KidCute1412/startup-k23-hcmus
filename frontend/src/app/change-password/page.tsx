"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { authService } from '@/services/authService';
import { PinkHairCharacter } from '@/components/ui/pink-hair-character';

const inputClass =
  'w-full rounded-v-sm border border-vanguard-light-border bg-vanguard-light-surf px-3 py-2 text-sm text-vanguard-light-text outline-none transition placeholder:text-gray-400 focus:border-vanguard-primary focus:ring-4 focus:ring-vanguard-primary/10 dark:border-vanguard-dark-border dark:bg-vanguard-dark-surfDim dark:text-vanguard-dark-text dark:focus:border-vanguard-primary dark:focus:ring-vanguard-primary/10';

export default function ChangePasswordPage() {
  const [focusedField, setFocusedField] = useState<string>('idle');
  const [oldPassword, setOldPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmNewPassword, setConfirmNewPassword] = useState<string>('');
  
  const [showOldPassword, setShowOldPassword] = useState<boolean>(false);
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState<boolean>(false);
  
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 3;
      
      const dx = (event.clientX - centerX) / (rect.width / 2);
      const dy = (event.clientY - centerY) / (rect.height / 2);
      
      setMousePos({ 
        x: Math.max(-1, Math.min(1, dx)), 
        y: Math.max(-1, Math.min(1, dy)) 
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    if (newPassword !== confirmNewPassword) {
      setSubmitError('Mật khẩu mới xác nhận không khớp.');
      setIsSubmitting(false);
      return;
    }

    try {
      await authService.changePassword(oldPassword, newPassword);
      setSubmitSuccess('Đổi mật khẩu thành công!');
      setOldPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (error) {
      const errMsg = error instanceof Error 
        ? error.message 
        : (typeof error === 'object' && error !== null && 'message' in error 
            ? String((error as { message: unknown }).message) 
            : 'Đổi mật khẩu thất bại. Vui lòng thử lại.');
      setSubmitError(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-8">
      <div 
        className="w-full max-w-[780px] overflow-hidden rounded-v-lg border border-vanguard-light-border bg-vanguard-light-surf shadow-royal dark:border-vanguard-dark-border dark:bg-vanguard-dark-surf grid grid-cols-1 md:grid-cols-12"
        ref={cardRef}
      >
        {/* Left Side: Mascot Display */}
        <div className="relative hidden flex-col items-center justify-center bg-gradient-to-br from-vanguard-light-bg to-vanguard-light-surfDim dark:from-vanguard-dark-bg dark:to-vanguard-dark-surfDim p-8 text-center md:flex md:col-span-5 border-r border-vanguard-light-border dark:border-vanguard-dark-border transition-colors duration-300">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.08),transparent_70%)] pointer-events-none" />
          <PinkHairCharacter
            mode={focusedField}
            emailLength={0}
            showPassword={showOldPassword || showNewPassword || showConfirmNewPassword}
            mousePos={mousePos}
            isSubmitting={isSubmitting}
            hasError={!!submitError}
            className="h-44 w-44"
          />
          <div className="mt-4 z-10">
            <span className="font-display text-xl font-bold tracking-widest text-gradient">MUTUX</span>
            <p className="text-[10px] uppercase tracking-widest text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted mt-1">Heritage rentals</p>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="flex flex-col justify-center p-6 sm:p-8 md:col-span-7 bg-vanguard-light-surf dark:bg-vanguard-dark-surf">
          {/* Mascot in Mobile */}
          <div className="block md:hidden mb-4 text-center">
            <PinkHairCharacter
              mode={focusedField}
              emailLength={0}
              showPassword={showOldPassword || showNewPassword || showConfirmNewPassword}
              mousePos={mousePos}
              isSubmitting={isSubmitting}
              hasError={!!submitError}
              className="h-28 w-28"
            />
          </div>

          <div className="mb-5 text-center md:text-left">
            <h1 className="font-display text-xl font-bold text-vanguard-light-text dark:text-vanguard-dark-text">Đổi mật khẩu</h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-vanguard-light-text dark:text-vanguard-dark-text">
                Mật khẩu hiện tại
              </span>
              <div className="relative">
                <input
                  name="oldPassword"
                  type={showOldPassword ? 'text' : 'password'}
                  required
                  value={oldPassword}
                  onChange={(event) => setOldPassword(event.target.value)}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField('idle')}
                  className={`${inputClass} pr-16`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  aria-label={showOldPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    setShowOldPassword((current) => !current);
                    setFocusedField('password');
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-v-sm px-2 py-1 text-xs font-semibold text-vanguard-primary transition hover:bg-vanguard-primary/10 dark:hover:bg-vanguard-primary/10"
                >
                  {showOldPassword ? 'Ẩn' : 'Hiện'}
                </button>
              </div>
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-vanguard-light-text dark:text-vanguard-dark-text">
                Mật khẩu mới
              </span>
              <div className="relative">
                <input
                  name="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField('idle')}
                  className={`${inputClass} pr-16`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  aria-label={showNewPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    setShowNewPassword((current) => !current);
                    setFocusedField('password');
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-v-sm px-2 py-1 text-xs font-semibold text-vanguard-primary transition hover:bg-vanguard-primary/10 dark:hover:bg-vanguard-primary/10"
                >
                  {showNewPassword ? 'Ẩn' : 'Hiện'}
                </button>
              </div>
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-vanguard-light-text dark:text-vanguard-dark-text">
                Xác nhận mật khẩu mới
              </span>
              <div className="relative">
                <input
                  name="confirmNewPassword"
                  type={showConfirmNewPassword ? 'text' : 'password'}
                  required
                  value={confirmNewPassword}
                  onChange={(event) => setConfirmNewPassword(event.target.value)}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField('idle')}
                  className={`${inputClass} pr-16`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  aria-label={showConfirmNewPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    setShowConfirmNewPassword((current) => !current);
                    setFocusedField('password');
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-v-sm px-2 py-1 text-xs font-semibold text-vanguard-primary transition hover:bg-vanguard-primary/10 dark:hover:bg-vanguard-primary/10"
                >
                  {showConfirmNewPassword ? 'Ẩn' : 'Hiện'}
                </button>
              </div>
            </label>

            {submitError && (
              <p className="rounded-v-sm border border-red-200 bg-red-50 px-3 py-1.5 text-xs text-red-600 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400">
                {submitError}
              </p>
            )}

            {submitSuccess && (
              <p className="rounded-v-sm border border-green-200 bg-green-50 px-3 py-1.5 text-xs text-green-600 dark:border-green-900/50 dark:bg-green-900/20 dark:text-green-400">
                {submitSuccess}
              </p>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-v-sm bg-vanguard-primary py-2 text-sm font-bold text-vanguard-dark-bg transition hover:bg-vanguard-secondary disabled:cursor-not-allowed disabled:opacity-70 text-black font-semibold"
              >
                {isSubmitting ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
              </button>
            </div>

            <div className="text-center text-xs text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted pt-2">
              <Link href="/" className="font-semibold text-vanguard-primary hover:text-vanguard-secondary">
                Quay lại trang chủ
              </Link>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
