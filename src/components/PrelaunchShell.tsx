import Link from "next/link";
import { cookies } from "next/headers";
import { GhanaGrowersLogo } from "@/components/GhanaGrowersLogo";
import { previewAccessCookie, verifyPreviewAccessToken } from "@/lib/previewAccess";

function prelaunchEnabled() {
  return process.env.SITE_PRELAUNCH !== "false";
}

async function previewEnabled() {
  return verifyPreviewAccessToken(
    cookies().get(previewAccessCookie)?.value,
    process.env.PREVIEW_ACCESS_SECRET
  );
}

export async function PrelaunchHeader() {
  if (!prelaunchEnabled() || await previewEnabled()) {
    return null;
  }

  return (
    <header className="border-b border-leaf-900/10 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="focus-ring flex min-w-0 items-center rounded-md">
          <GhanaGrowersLogo layout="horizontal" className="h-11 w-auto sm:h-12" priority />
        </Link>
        <span className="rounded-md bg-leaf-50 px-3 py-2 text-xs font-black uppercase tracking-wide text-earth-700">
          Launching Soon
        </span>
      </div>
    </header>
  );
}

export async function PrelaunchFooter() {
  if (!prelaunchEnabled() || await previewEnabled()) {
    return null;
  }

  return (
    <footer className="border-t border-leaf-900/10 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-sm text-ink/58 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <GhanaGrowersLogo layout="horizontal" className="h-8 w-auto" />
        <p>Launching Soon</p>
        <p>&copy; {new Date().getFullYear()} Ghana Growers.</p>
      </div>
    </footer>
  );
}
