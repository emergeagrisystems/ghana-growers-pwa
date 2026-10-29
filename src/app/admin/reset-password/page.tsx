import { AdminResetPasswordForm } from "@/components/AdminResetPasswordForm";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Set Admin Password | Ghana Growers",
  description: "Secure staging administrator password recovery for Ghana Growers.",
  referrer: "no-referrer",
  robots: { index: false, follow: false }
};

export default function AdminResetPasswordPage() {
  return <AdminResetPasswordForm />;
}
