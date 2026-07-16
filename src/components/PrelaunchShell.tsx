import Link from "next/link";
import { cookies } from "next/headers";
import { Sprout } from "lucide-react";

const PREVIEW_COOKIE = "ghana_growers_dev_preview";

function prelaunchEnabled() {
  return process.env.SITE_PRELAUNCH !== "false";
}

function previewEnabled() {
  return cookies().get(PREVIEW_COOKIE)?.value === "enabled";
}

export function PrelaunchHeader() {
  if (!prelaunchEnabled() || previewEnabled()) {
    return null;
  }

  return (
    <header className="border-b border-leaf-900/10 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="focus-ring flex min-w-0 items-center gap-2 rounded-md text-base font-black text-leaf-900 sm:text-lg">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-leaf-600 text-white">
            <Sprout size={20} aria-hidden="true" />
          </span>
          <span className="truncate">Ghana Growers</span>
        </Link>
        <span className="rounded-md bg-leaf-50 px-3 py-2 text-xs font-black uppercase tracking-wide text-earth-700">
          Launching Soon
        </span>
      </div>
    </header>
  );
}

export function PrelaunchFooter() {
  if (!prelaunchEnabled() || previewEnabled()) {
    return null;
  }

  return (
    <footer className="border-t border-leaf-900/10 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-sm text-ink/58 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <p className="font-black text-ink">Ghana Growers</p>
        <p>Launching Soon</p>
        <p>&copy; {new Date().getFullYear()} Ghana Growers.</p>
      </div>
    </footer>
  );
}
