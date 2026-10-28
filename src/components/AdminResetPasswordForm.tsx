"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  recoveryCredentialsFromHash,
  recoveryLinkErrorFromHash,
  type RecoveryCredentials,
  updateAdminPasswordFromRecovery
} from "@/lib/adminPasswordRecovery";

const minimumPasswordLength = 12;

export function AdminResetPasswordForm() {
  const router = useRouter();
  const credentials = useRef<RecoveryCredentials | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    credentials.current = recoveryCredentialsFromHash(hash);

    // Recovery credentials arrive in the fragment. Remove them before the user
    // interacts with the page so they are not retained in copied URLs or telemetry.
    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);

    if (!credentials.current) {
      setError(
        recoveryLinkErrorFromHash(hash)
          ? "This recovery link is invalid or has expired. Request one new link from Admin Login."
          : "Open this page from a fresh Ghana Growers password-recovery email."
      );
      return;
    }

    setReady(true);
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!credentials.current) {
      setError("This recovery link is invalid or has expired. Request one new link.");
      return;
    }
    if (newPassword.length < minimumPasswordLength) {
      setError(`Use at least ${minimumPasswordLength} characters.`);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }

    setSubmitting(true);
    const result = await updateAdminPasswordFromRecovery({ credentials: credentials.current, password: newPassword });
    setSubmitting(false);
    setNewPassword("");
    setConfirmPassword("");
    credentials.current = null;

    if (!result.ok) {
      setError(result.error);
      return;
    }

    router.replace("/admin/login?password=updated");
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-earth-50 px-4 py-16">
      <section className="mx-auto max-w-md rounded-md border border-leaf-900/10 bg-white p-6 shadow-soft">
        <p className="text-sm font-black uppercase tracking-wide text-earth-700">Ghana Growers Admin</p>
        <h1 className="mt-3 text-3xl font-black text-ink">Set your password</h1>
        <p className="mt-3 text-sm leading-6 text-ink/65">
          Choose a private password for this staging administrator account. The recovery link can be used only for this reset.
        </p>

        <form className="mt-6 grid gap-4" onSubmit={submit}>
          <label className="grid gap-2 text-sm font-black text-ink">
            New password
            <input
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              className="rounded-md border border-leaf-900/10 px-4 py-3 text-sm font-semibold outline-none focus:border-leaf-700 focus:ring-2 focus:ring-leaf-600/20"
              autoComplete="new-password"
              minLength={minimumPasswordLength}
              disabled={!ready || submitting}
              required
            />
          </label>
          <label className="grid gap-2 text-sm font-black text-ink">
            Confirm password
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="rounded-md border border-leaf-900/10 px-4 py-3 text-sm font-semibold outline-none focus:border-leaf-700 focus:ring-2 focus:ring-leaf-600/20"
              autoComplete="new-password"
              minLength={minimumPasswordLength}
              disabled={!ready || submitting}
              required
            />
          </label>

          {error ? <p role="alert" className="rounded-md bg-earth-50 px-3 py-2 text-sm font-black text-earth-700">{error}</p> : null}

          <button
            type="submit"
            disabled={!ready || submitting}
            className="rounded-md bg-leaf-700 px-4 py-3 text-sm font-black text-white transition hover:bg-leaf-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Updating password..." : "Set password"}
          </button>
        </form>
      </section>
    </main>
  );
}
