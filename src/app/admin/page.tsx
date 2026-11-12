import {staffCrmAvailable, staffClient, staffRpc, idPattern} from "@/lib/staffRpc";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AdminDashboard } from "@/components/AdminDashboard";
import { StaffShell } from "@/components/admin/StaffShell";
import { Today, type Queues, type DueFollowUp } from "@/components/admin/Today";
import { Tools } from "@/components/admin/Tools";
import { Records, Profiles } from "@/components/admin/Records";
import { adminAccessCookie, getAdminUserFromAccessToken } from "@/lib/adminAuth";
import { adminDestinations } from "@/lib/adminDestinations";
import { readIntakes, readProfiles, type StaffQueue } from "@/lib/adminReadModel";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Admin Dashboard | Ghana Growers",
  description: "Protected Ghana Growers admin dashboard for managing platform content and operational records."
};

const queueIds: StaffQueue[] = ["farmer", "supplier", "listing", "buyer"];
async function dueFollowUps(actor:string, now:string):Promise<DueFollowUp[]|null> {
  if (!staffCrmAvailable() || !actor) return null;
  try {
    const data = await staffRpc(staffClient(), "staff_today", {p_actor:actor, p_now:now});
    const rows = data?.my_follow_ups;
    if (!Array.isArray(rows) || !rows.every(r => r && idPattern.test(r.request_id)
      && typeof r.next_action==="string" && Number.isFinite(Date.parse(r.due_at)))) return null;
    return rows.map(r => ({id:r.request_id, action:r.next_action, due:r.due_at}));
  } catch { return null; }
}
const legacySections = [
  "analytics", "launch-checklist", "lead-queue", "featured-enquiries", "contact-enquiries",
  "farmer-import", "farmers", "buyers", "suppliers", "marketplace", "buyer-requests",
  "verifications", "applications", "submissions", "whatsapp-leads", "match-opportunities",
  "learn", "success-stories", "market-prices"
] as const;

export default async function AdminPage({ searchParams }: {
  searchParams: { view?: string; section?: string; tool?: string }
}) {
  const currentAdmin = await getAdminUserFromAccessToken(cookies().get(adminAccessCookie)?.value);
  if (!currentAdmin) redirect("/admin/login");

  const section = legacySections.find(id => id === searchParams.section);
  const tool = adminDestinations.flatMap(group => group.items.map(item => item.key as string))
    .find(key => key === searchParams.tool);
  if (section || tool) {
    return <>
      <nav aria-label="Return to workspace" className="flex gap-5 bg-white p-3 text-sm font-bold">
        <Link href="/admin">Today’s work</Link>
        <Link href="/admin?view=tools">All admin tools</Link>
      </nav>
      <AdminDashboard key={tool || section} currentAdmin={currentAdmin} initialTool={tool}
        initialSection={section} sitePrelaunchActive={process.env.SITE_PRELAUNCH === "true"} />
    </>;
  }

  const view = searchParams.view || "today";
  if (view === "tools") return <StaffShell view={view}><Tools /></StaffShell>;
  if (view === "profiles") {
    const kinds = ["farmer", "supplier"] as const;
    const profiles = await Promise.all(kinds.map(readProfiles));
    return <StaffShell view={view}>
      <Profiles rows={profiles.flatMap(result => result.rows)}
        unavailable={kinds.filter((_, index) => !profiles[index].available)} />
    </StaffShell>;
  }

  const queue = queueIds.find(id => id === view);
  const keys = queue ? [queue] : queueIds;
  const isOverview = !queue && view !== "find";
  const results = await Promise.all(keys.map(id => readIntakes(id, isOverview)));
  if (!isOverview) {
    return <StaffShell view={view}>
      <Records sharedCaseEnabled={staffCrmAvailable()} key={view} queue={queue} rows={results.flatMap(result => result.rows)}
        unavailable={keys.filter((_, index) => !results[index].available)} />
    </StaffShell>;
  }

  const queues = Object.fromEntries(keys.map((id, index) => [id, results[index]])) as Queues;
  const now = new Date().toISOString();
  const followUps = await dueFollowUps(currentAdmin.id, now);
  return <StaffShell view="today"><Today queues={queues} now={now} followUps={followUps} /></StaffShell>;
}
