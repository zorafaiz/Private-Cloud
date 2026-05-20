/**
 * Magic link login page with email input.
 * Uses Supabase OTP authentication for passwordless login.
 */

'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';
import { z } from 'zod';

const emailSchema = z.string().email('Email tidak valid');

export default function LoginPage(): React.ReactElement {
  const [email, setEmail] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate email
      emailSchema.parse(email);

      const supabase = createClient();
      const origin = typeof window !== 'undefined' ? window.location.origin : '';

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${origin}/auth/callback`,
        },
      });

      if (error) {
        toast.error(error.message || 'Gagal mengirim link login');
        setLoading(false);
        return;
      }

      setSubmitted(true);
      toast.success('Link login sudah dikirim ke email kamu!');
    } catch (err) {
      const message = err instanceof z.ZodError 
        ? err.errors[0]?.message || 'Email tidak valid'
        : err instanceof Error 
        ? err.message 
        : 'Terjadi kesalahan';
      toast.error(message);
      setLoading(false);
    }
  };

  return (
    <div className="glass-card animate-fade-in p-8">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="mb-4 flex justify-center">
          <div className="rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 p-3">
            <svg
              className="h-8 w-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </div>
        </div>
        <h1 className="text-2xl font-bold text-surface-50">Private Cloud</h1>
        <p className="mt-2 text-sm text-surface-400">
          Platform cloud pribadi untuk file, catatan, dan jadwal Anda
        </p>
      </div>

      {submitted ? (
        /* Success state */
        <div className="space-y-4">
          <div className="rounded-lg border border-green-800/50 bg-green-900/20 p-4 text-center">
            <p className="text-sm font-medium text-green-400">✨ Email terkirim!</p>
            <p className="mt-2 text-xs text-green-300">
              Cek inbox (atau folder spam) kamu untuk link login. Link akan berlaku selama 24 jam.
            </p>
          </div>

          <button
            onClick={() => {
              setSubmitted(false);
              setEmail('');
            }}
            className="w-full rounded bg-surface-700 px-4 py-2 text-sm font-medium text-surface-200 transition-colors hover:bg-surface-600"
          >
            Coba Email Lain
          </button>
        </div>
      ) : (
        /* Form state */
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium text-surface-300"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@email.com"
              disabled={loading}
              className="input-field w-full"
              required
            />
            <p className="mt-1.5 text-xs text-surface-500">
              Kami akan mengirim link login ke email ini. Tanpa password!
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || !email}
            className="btn-primary w-full"
          >
            {loading ? (
              <>
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                Mengirim...
              </>
            ) : (
              'Kirim Link Login'
            )}
          </button>
        </form>
      )}

      {/* Footer info */}
      <div className="mt-6 border-t border-surface-700 pt-4 text-center">
        <p className="text-xs text-surface-500">
          Masuk dengan aman tanpa password menggunakan magic link via email.
        </p>
      </div>
    </div>
  );
}
