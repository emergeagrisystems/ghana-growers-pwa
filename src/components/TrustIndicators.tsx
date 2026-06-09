import { BadgeCheck, CheckCircle2, CircleDashed, ShieldCheck, Star, XCircle } from "lucide-react";
import type { TrustProfile, TrustScore, TrustStatus, VerificationRequirements } from "@/types";

type ProfileKind = "farmer" | "buyer" | "supplier";

type TrustBadgeProps = {
  kind: ProfileKind;
  status: TrustStatus;
};

const defaultRequirements: VerificationRequirements = {
  phoneVerified: false,
  whatsappVerified: false,
  identitySubmitted: false,
  businessRegistration: false
};

const defaultScore: TrustScore = {
  profileCompleteness: 45,
  verificationLevel: 20,
  activityLevel: 25
};

export function normalizeTrust(trust?: TrustProfile, fallbackStatus: TrustStatus = "Pending Verification"): TrustProfile {
  const rawStatus = trust?.status ?? fallbackStatus;
  const status: TrustStatus =
    rawStatus === "Pending Verification" ? "Pending" : rawStatus === "Premium Member" ? "Verified" : rawStatus;

  return {
    status,
    requirements: trust?.requirements ?? defaultRequirements,
    score: trust?.score ?? defaultScore
  };
}

export function trustScoreTotal(score: TrustScore) {
  return Math.round((score.profileCompleteness + score.verificationLevel + score.activityLevel) / 3);
}

export function VerificationBadge({ kind, status }: TrustBadgeProps) {
  if (status !== "Verified") {
    return null;
  }

  const label = kind === "farmer" ? "Verified by Ghana Growers" : kind === "buyer" ? "Verified by Ghana Growers" : "Verified by Ghana Growers";
  const Icon = BadgeCheck;

  return (
    <span className="inline-flex items-center gap-2 rounded-md bg-leaf-600 px-3 py-2 text-xs font-black text-white">
      <Icon size={15} aria-hidden="true" />
      {label}
    </span>
  );
}

export function ProfileStatusBadge({ status }: { status: TrustStatus }) {
  const Icon = status === "Verified" ? ShieldCheck : CircleDashed;
  const className = status === "Verified"
      ? "bg-leaf-50 text-leaf-700"
      : status === "Rejected"
        ? "bg-tomato/10 text-tomato"
      : "bg-ink/10 text-ink/70";

  return (
    <span className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-xs font-black ${className}`}>
      <Icon size={15} aria-hidden="true" />
      {status}
    </span>
  );
}

export function VerificationRequirementsList({ requirements }: { requirements: VerificationRequirements }) {
  const items = [
    ["Phone verified", requirements.phoneVerified],
    ["WhatsApp verified", requirements.whatsappVerified],
    ["Identity submitted", requirements.identitySubmitted],
    ["Business registration optional", requirements.businessRegistration]
  ] as const;

  return (
    <div className="rounded-md border border-leaf-900/10 bg-white p-4">
      <h3 className="text-sm font-black uppercase text-earth-700">Verification requirements</h3>
      <div className="mt-3 grid gap-2">
        {items.map(([label, complete]) => {
          const Icon = complete ? CheckCircle2 : XCircle;

          return (
            <div key={label} className="flex items-center justify-between gap-3 text-sm">
              <span className="font-bold text-ink/70">{label}</span>
              <span className={`inline-flex items-center gap-1 text-xs font-black ${complete ? "text-leaf-700" : "text-ink/45"}`}>
                <Icon size={15} aria-hidden="true" />
                {complete ? "Done" : "Pending"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ScoreRow({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3 text-xs font-black uppercase text-ink/55">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-leaf-50">
        <div className="h-full rounded-full bg-leaf-600" style={{ width: `${Math.max(0, Math.min(value, 100))}%` }} />
      </div>
    </div>
  );
}

export function TrustScoreCard({ score }: { score: TrustScore }) {
  const total = trustScoreTotal(score);

  return (
    <div className="rounded-md border border-leaf-900/10 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-black uppercase text-earth-700">Trust score</h3>
        <span className="inline-flex items-center gap-1 rounded-md bg-earth-50 px-3 py-2 text-xs font-black text-ink">
          <Star size={14} aria-hidden="true" />
          {total}%
        </span>
      </div>
      <div className="mt-4 grid gap-3">
        <ScoreRow label="Profile completeness" value={score.profileCompleteness} />
        <ScoreRow label="Verification status" value={score.verificationLevel} />
        <ScoreRow label="Activity" value={score.activityLevel} />
      </div>
    </div>
  );
}

export function TrustSummary({ kind, trust }: { kind: ProfileKind; trust: TrustProfile }) {
  return (
    <div className="flex flex-wrap gap-2">
      <ProfileStatusBadge status={trust.status} />
      <VerificationBadge kind={kind} status={trust.status} />
    </div>
  );
}
