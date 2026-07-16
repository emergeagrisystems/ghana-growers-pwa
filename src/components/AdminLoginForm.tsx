"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function AdminLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  async function submitLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsSubmitting(true);

    const response = await fetch("/api/admin/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    }).catch(() => null);
    setIsSubmitting(false);

    const result = (await response?.json().catch(() => null)) as { error?: string } | null;

    if (!response?.ok) {
      setError(result?.error ?? "Admin login failed.");
      return;
    }

    setMessage("Login successful. Opening dashboard...");
    router.replace("/admin");
    router.refresh();
  }

  async function sendPasswordReset() {
    setError("");
    setMessage("");

    if (!email.trim()) {
      setError("Enter your admin email first.");
      return;
    }

    setIsResetting(true);
    const response = await fetch("/api/admin/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    }).catch(() => null);
    setIsResetting(false);

    const result = (await response?.json().catch(() => null)) as { error?: string; message?: string } | null;

    if (!response?.ok) {
      setError(result?.error ?? "Could not send reset instructions.");
      return;
    }

    setMessage(result?.message ?? "Password reset instructions sent.");
  }

  return (
    <main className="min-h-screen bg-earth-50 px-4 py-16">
      <section className="mx-auto max-w-md rounded-md border border-leaf-900/10 bg-white p-6 shadow-soft">
        <p className="text-sm font-black uppercase tracking-wide text-earth-700">Ghana Growers Admin</p>
        <h1 className="mt-3 text-3xl font-black text-ink">Admin Login</h1>
        <p className="mt-3 text-sm leading-6 text-ink/65">
          Sign in with a Supabase Auth account that has the admin role.
        </p>

        <form className="mt-6 grid gap-4" onSubmit={submitLogin}>
          <label className="grid gap-2 text-sm font-black text-ink">
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="rounded-md border border-leaf-900/10 px-4 py-3 text-sm font-semibold outline-none focus:border-leaf-700 focus:ring-2 focus:ring-leaf-600/20"
              placeholder="admin@example.com"
              autoComplete="email"
              required
            />
          </label>
          <label className="grid gap-2 text-sm font-black text-ink">
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="rounded-md border border-leaf-900/10 px-4 py-3 text-sm font-semibold outline-none focus:border-leaf-700 focus:ring-2 focus:ring-leaf-600/20"
              placeholder="Enter password"
              autoComplete="current-password"
              required
            />
          </label>

          {error ? <p className="rounded-md bg-earth-50 px-3 py-2 text-sm font-black text-earth-700">{error}</p> : null}
          {message ? <p className="rounded-md bg-leaf-50 px-3 py-2 text-sm font-black text-leaf-700">{message}</p> : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-md bg-leaf-700 px-4 py-3 text-sm font-black text-white transition hover:bg-leaf-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Signing in..." : "Login"}
          </button>
        </form>

        <button
          type="button"
          onClick={sendPasswordReset}
          disabled={isResetting}
          className="mt-4 text-sm font-black text-leaf-700 underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isResetting ? "Sending reset instructions..." : "Forgot password?"}
        </button>
      </section>
    </main>
  );
}
