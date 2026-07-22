"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/authService';
import { PinkHairCharacter } from '@/components/ui/pink-hair-character';

const inputClass =
  'w-full rounded-v-sm border border-vanguard-light-border bg-vanguard-light-surf px-3 py-2 text-sm text-vanguard-light-text outline-none transition placeholder:text-gray-400 focus:border-vanguard-primary focus:ring-4 focus:ring-vanguard-primary/10 dark:border-vanguard-dark-border dark:bg-vanguard-dark-surfDim dark:text-vanguard-dark-text dark:focus:border-vanguard-primary dark:focus:ring-vanguard-primary/10';

export default function LoginPage() {
  const [focusedField, setFocusedField] = useState('idle');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState(null);
  const cardRef = useRef(null);

  useEffect(() => {
    const handleMouseMove = (event) => {
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

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setLoginError(null);
    try {
      await authService.login(email, password);
      window.location.href = '/';
    } catch (error) {
      setLoginError(error.message || 'Sai thông tin đăng nhập.');
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
        {/* Left Side: Mascot Display (Adapts to Dark / Light Mode) */}
        <div className="relative hidden flex-col items-center justify-center bg-gradient-to-br from-vanguard-light-bg to-vanguard-light-surfDim dark:from-vanguard-dark-bg dark:to-vanguard-dark-surfDim p-8 text-center md:flex md:col-span-5 border-r border-vanguard-light-border dark:border-vanguard-dark-border transition-colors duration-300">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.08),transparent_70%)] pointer-events-none" />
          <PinkHairCharacter
            mode={focusedField}
            emailLength={email.length}
            showPassword={showPassword}
            mousePos={mousePos}
            className="h-44 w-44"
          />
          <div className="mt-4 z-10">
            <span className="font-display text-xl font-bold tracking-widest text-gradient">MUTUX</span>
            <p className="text-[10px] uppercase tracking-widest text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted mt-1">Heritage rentals</p>
          </div>
        </div>

        {/* Right Side: Elegant Form */}
        <div className="flex flex-col justify-center p-6 sm:p-8 md:col-span-7 bg-vanguard-light-surf dark:bg-vanguard-dark-surf">
          {/* Mascot in Mobile */}
          <div className="block md:hidden mb-4 text-center">
            <PinkHairCharacter
              mode={focusedField}
              emailLength={email.length}
              showPassword={showPassword}
              mousePos={mousePos}
              className="h-28 w-28"
            />
          </div>

          <div className="mb-5 text-center md:text-left">
            <h1 className="font-display text-xl font-bold text-vanguard-light-text dark:text-vanguard-dark-text">Đăng nhập</h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-vanguard-light-text dark:text-vanguard-dark-text">
                Email
              </span>
              <input
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField('idle')}
                className={inputClass}
                placeholder="email@example.com"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-vanguard-light-text dark:text-vanguard-dark-text">
                Mật khẩu
              </span>
              <div className="relative">
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField('idle')}
                  className={`${inputClass} pr-16`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    setShowPassword((current) => !current);
                    setFocusedField('password');
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-v-sm px-2 py-1 text-xs font-semibold text-vanguard-primary transition hover:bg-vanguard-primary/10 dark:hover:bg-vanguard-primary/10"
                >
                  {showPassword ? 'Ẩn' : 'Hiện'}
                </button>
              </div>
            </label>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-1.5 text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
                <input
                  type="checkbox"
                  name="remember"
                  className="h-3.5 w-3.5 rounded-v-sm border-vanguard-light-border text-vanguard-primary focus:ring-vanguard-primary dark:border-vanguard-dark-border"
                />
                Ghi nhớ
              </label>
              <Link href="/" className="font-semibold text-vanguard-primary hover:text-vanguard-secondary">
                Quên mật khẩu?
              </Link>
            </div>

            {loginError && (
              <p className="rounded-v-sm border border-red-200 bg-red-50 px-3 py-1.5 text-xs text-red-600 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400">
                {loginError}
              </p>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-v-sm bg-vanguard-primary py-2 text-sm font-bold text-vanguard-dark-bg transition hover:bg-vanguard-secondary disabled:cursor-not-allowed disabled:opacity-70 text-black font-semibold"
              >
                {isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
