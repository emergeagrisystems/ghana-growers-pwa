import { CheckCircle2, CircleHelp, Clock3, SearchCheck } from "lucide-react";

export type FarmMateDecisionStatusValue =
  | "SUITABLE"
  | "CONDITIONS LOOK SUITABLE"
  | "CHECK FIRST"
  | "WAIT"
  | "NOT ENOUGH INFORMATION";

export function FarmMateDecisionStatus({ status }: { status: FarmMateDecisionStatusValue }) {
  const suitable = status === "SUITABLE" || status === "CONDITIONS LOOK SUITABLE";
  const waiting = status === "WAIT";
  const unknown = status === "NOT ENOUGH INFORMATION";
  const Icon = suitable ? CheckCircle2 : waiting ? Clock3 : unknown ? CircleHelp : SearchCheck;
  const color = suitable
    ? "bg-leaf-50 text-leaf-900 ring-leaf-700/20"
    : waiting
      ? "bg-earth-50 text-earth-700 ring-earth-500/25"
      : "bg-white text-leaf-900 ring-leaf-700/20";

  return <h3 className={`inline-flex min-h-11 items-center gap-2 rounded-md px-3 py-2 text-sm font-black ring-1 ${color}`}>
    <Icon size={18} aria-hidden="true" />{status}
  </h3>;
}
