import { CheckCircle2, Leaf, PackageCheck, ShieldCheck } from "lucide-react";

export function isGGStandardMember(status?: string | null) {
  return status === "Member";
}

export function GGStandardBadge({ status }: { status?: string | null }) {
  if (!isGGStandardMember(status)) {
    return null;
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#ECE7D1] px-3 py-1 text-xs font-black text-leaf-800 ring-1 ring-leaf-900/10">
      <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
      GG Standard Member
    </span>
  );
}

export function GGStandardCommitment({ status }: { status?: string | null }) {
  const commitments = [
    { label: "Sustainable Farming", icon: Leaf },
    { label: "Reliable Supply", icon: PackageCheck },
    { label: "Quality Produce", icon: CheckCircle2 }
  ];

  return (
    <section className="rounded-md border border-leaf-900/10 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-wide text-earth-700">GG Standard</p>
          <h2 className="mt-2 text-2xl font-black text-ink">Ghana Growers commitment framework</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/62">
            GG Standard is a platform commitment framework. It is separate from verification and does not act as a certification.
          </p>
        </div>
        <GGStandardBadge status={status} />
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {commitments.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="rounded-md bg-leaf-50 p-4">
              <Icon className="h-5 w-5 text-leaf-700" aria-hidden="true" />
              <p className="mt-3 font-black text-ink">{item.label}</p>
            </div>
          );
        })}
      </div>
      <p className="mt-4 text-xs font-semibold leading-5 text-ink/50">
        Status: {isGGStandardMember(status) ? "Member" : status || "Pending"}
      </p>
    </section>
  );
}
