"use client";

import type { ComponentType } from "react";
import { isPublicSubmissionAvailable, PUBLIC_SUBMISSION_UNAVAILABLE, type PublicSubmissionWorkflow } from "@/lib/publicSubmissionAvailability";

export function PublicSubmissionUnavailable({ title, compact = false }: { title: string; compact?: boolean }) {
  return compact ? (
    <span className="inline-flex min-h-11 items-center rounded-md border border-leaf-900/15 px-3 py-2 text-sm text-ink/70" data-public-submission-unavailable>
      {title} currently unavailable
    </span>
  ) : (
    <section className="rounded-md border border-leaf-900/10 bg-white p-5 sm:p-6" data-public-submission-unavailable>
      <h2 className="text-lg font-bold text-ink">{title} currently unavailable</h2>
      <p className="mt-2 text-sm leading-6 text-ink/70">{PUBLIC_SUBMISSION_UNAVAILABLE}</p>
    </section>
  );
}

// The active form is not mounted while closed, so file selectors, local drafts,
// effects and submission handlers cannot collect information or run behind it.
export function withPublicSubmissionGate<Props extends object>(
  ActiveForm: ComponentType<Props>,
  workflow: PublicSubmissionWorkflow,
  title: string,
  compact = false
) {
  return function PublicSubmissionGate(props: Props) {
    return isPublicSubmissionAvailable(workflow)
      ? <ActiveForm {...props} />
      : <PublicSubmissionUnavailable title={title} compact={compact} />;
  };
}
