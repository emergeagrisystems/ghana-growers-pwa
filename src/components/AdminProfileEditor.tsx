"use client";

import {
  approvedSupplierCategories,
  authoritativeLifecycleSummary,
  farmerFarmTypes,
  ggStandardStatuses,
  supplierLaunchStatuses,
  supplierReviewStatuses,
  type FarmerProfileRecord,
  type ProfileEditorKind,
  type ProfileEditorRecord,
  type ProfileTransition,
  type PublicationCheck,
  type SupplierProfileRecord
} from "@/lib/profileEditorContracts";
import {
  AlertCircle,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  BadgeCheck,
  Check,
  Eye,
  FileLock2,
  Image as ImageIcon,
  LoaderCircle,
  PauseCircle,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  ShieldCheck,
  Star,
  Trash2,
  UploadCloud,
  X
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FarmerProfileImage } from "@/components/FarmerProfileImage";

type EditorTab = "overview" | "media" | "review" | "preview";
type SaveState = "idle" | "dirty" | "saving" | "saved" | "error";
type FarmerMediaTarget = "profile_image_url" | "farm_photo_urls" | "produce_photo_urls";
type StagedFarmerMedia = { path: string; target: FarmerMediaTarget; previewUrl: string };
type PrivateMediaItem = {
  path: string;
  group: "profile" | "farm" | "produce" | "logo" | "photos" | "certificates" | "documents";
  label: string;
  promotable: boolean;
};
type EditorPayload = {
  kind: ProfileEditorKind;
  record: ProfileEditorRecord;
  sourceHistory: null | {
    applicationId: string;
    status: string;
    createdAt: string;
    privateMedia: PrivateMediaItem[];
    privateContactName?: string;
    privateEmail?: string;
    privateNotes?: string;
  };
  preview: Record<string, unknown>;
  eligibility: {
    eligible: boolean;
    checks: PublicationCheck[];
    hiddenReasons: string[];
    featuredPublic: boolean;
  };
  categoryReview: null | { normalized: string; requiresReview: boolean };
};

function text(value: unknown) {
  return typeof value === "string" ? value : "";
}

function textList(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function inputClass(hasError = false) {
  return `min-h-11 w-full rounded-md border bg-white px-3 py-2 text-sm font-semibold text-ink outline-none transition focus:ring-2 ${
    hasError ? "border-tomato focus:border-tomato focus:ring-tomato/15" : "border-leaf-900/15 focus:border-leaf-700 focus:ring-leaf-600/20"
  }`;
}

function Field({
  label,
  value,
  onChange,
  error,
  optional,
  type = "text",
  placeholder,
  readOnly = false
}: {
  label: string;
  value: string;
  onChange?: (value: string) => void;
  error?: string;
  optional?: boolean;
  type?: "text" | "email" | "url" | "date";
  placeholder?: string;
  readOnly?: boolean;
}) {
  return (
    <label className="grid min-w-0 gap-2 text-sm font-black text-ink">
      <span>{label}{optional ? <span className="ml-1 font-semibold text-ink/45">Optional</span> : null}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
        placeholder={placeholder}
        readOnly={readOnly}
        aria-invalid={Boolean(error)}
        className={`${inputClass(Boolean(error))} ${readOnly ? "bg-leaf-50 text-ink/60" : ""}`}
      />
      {error ? <span className="text-xs font-bold text-tomato">{error}</span> : null}
    </label>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  error,
  optional,
  placeholder,
  readOnly = false
}: {
  label: string;
  value: string;
  onChange?: (value: string) => void;
  error?: string;
  optional?: boolean;
  placeholder?: string;
  readOnly?: boolean;
}) {
  return (
    <label className="grid min-w-0 gap-2 text-sm font-black text-ink">
      <span>{label}{optional ? <span className="ml-1 font-semibold text-ink/45">Optional</span> : null}</span>
      <textarea
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
        placeholder={placeholder}
        readOnly={readOnly}
        rows={4}
        aria-invalid={Boolean(error)}
        className={`${inputClass(Boolean(error))} resize-y ${readOnly ? "bg-leaf-50 text-ink/60" : ""}`}
      />
      {error ? <span className="text-xs font-bold text-tomato">{error}</span> : null}
    </label>
  );
}

function SelectField({ label, value, options, onChange, warning }: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
  warning?: string;
}) {
  const choices = options.includes(value) || !value ? options : [value, ...options];
  return (
    <label className="grid min-w-0 gap-2 text-sm font-black text-ink">
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)} className={inputClass(Boolean(warning))}>
        {choices.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
      {warning ? <span className="text-xs font-bold text-earth-700">{warning}</span> : null}
    </label>
  );
}

function OrderedListField({ label, values, onChange, placeholder, error }: {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  placeholder: string;
  error?: string;
}) {
  const updateAt = (index: number, value: string) => onChange(values.map((item, itemIndex) => itemIndex === index ? value : item));
  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= values.length) return;
    const next = [...values];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  return (
    <fieldset className={`min-w-0 rounded-md border p-4 ${error ? "border-tomato" : "border-leaf-900/10"}`}>
      <legend className="px-1 text-sm font-black text-ink">{label}</legend>
      <div className="grid gap-2">
        {values.map((value, index) => (
          <div key={`${index}-${value}`} className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] gap-2">
            <input value={value} onChange={(event) => updateAt(index, event.target.value)} className={inputClass()} aria-label={`${label} ${index + 1}`} />
            <div className="flex gap-1">
              <button type="button" onClick={() => move(index, -1)} disabled={index === 0} className="admin-icon-button" aria-label={`Move ${label} item up`}><ArrowUp className="h-4 w-4" /></button>
              <button type="button" onClick={() => move(index, 1)} disabled={index === values.length - 1} className="admin-icon-button" aria-label={`Move ${label} item down`}><ArrowDown className="h-4 w-4" /></button>
              <button type="button" onClick={() => onChange(values.filter((_, itemIndex) => itemIndex !== index))} className="admin-icon-button text-tomato" aria-label={`Remove ${label} item`}><Trash2 className="h-4 w-4" /></button>
            </div>
          </div>
        ))}
        <button type="button" onClick={() => onChange([...values, ""])} className="admin-action-secondary w-fit"><Plus className="h-4 w-4" /> {placeholder}</button>
        {error ? <p className="text-xs font-bold text-tomato">{error}</p> : null}
      </div>
    </fieldset>
  );
}

function PublicImageControl({
  label,
  value,
  uploading,
  onUpload,
  onRemove
}: {
  label: string;
  value: string | null;
  uploading: boolean;
  onUpload: (file: File) => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-md border border-leaf-900/10 bg-leaf-50/45 p-4">
      <p className="text-sm font-black text-ink">{label}</p>
      <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative h-28 w-full overflow-hidden rounded-md bg-white ring-1 ring-leaf-900/10 sm:w-40">
          {value ? <Image src={value} alt="Current approved public media" fill unoptimized className="object-cover" /> : <div className="grid h-full place-items-center text-ink/35"><ImageIcon className="h-8 w-8" /><span className="sr-only">No public image selected</span></div>}
        </div>
        <div className="flex flex-1 flex-wrap gap-2">
          <label className="admin-action-secondary cursor-pointer">
            <UploadCloud className="h-4 w-4" /> {uploading ? "Uploading..." : value ? "Replace" : "Upload"}
            <input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" disabled={uploading} onChange={(event) => { const file = event.target.files?.[0]; if (file) onUpload(file); event.currentTarget.value = ""; }} />
          </label>
          {value ? <button type="button" onClick={onRemove} className="admin-action-secondary text-tomato"><Trash2 className="h-4 w-4" /> Remove</button> : null}
        </div>
      </div>
    </div>
  );
}

function PublicGalleryControl({
  label,
  values,
  uploading,
  onUpload,
  onChange
}: {
  label: string;
  values: string[];
  uploading: boolean;
  onUpload: (file: File) => void;
  onChange: (values: string[]) => void;
}) {
  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= values.length) return;
    const next = [...values];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };
  return (
    <fieldset className="rounded-md border border-leaf-900/10 bg-leaf-50/45 p-4">
      <legend className="px-1 text-sm font-black text-ink">{label}</legend>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {values.map((value, index) => (
          <div key={value} className="overflow-hidden rounded-md bg-white ring-1 ring-leaf-900/10">
            <div className="relative aspect-[4/3]"><Image src={value} alt={`${label} image ${index + 1}`} fill unoptimized className="object-cover" /></div>
            <div className="flex items-center justify-between gap-2 p-2">
              <span className="text-xs font-black text-ink/55">Image {index + 1}</span>
              <div className="flex gap-1">
                <button type="button" onClick={() => move(index, -1)} disabled={index === 0} className="admin-icon-button" aria-label={`Move ${label} image up`}><ArrowUp className="h-4 w-4" /></button>
                <button type="button" onClick={() => move(index, 1)} disabled={index === values.length - 1} className="admin-icon-button" aria-label={`Move ${label} image down`}><ArrowDown className="h-4 w-4" /></button>
                <button type="button" onClick={() => onChange(values.filter((_, itemIndex) => itemIndex !== index))} className="admin-icon-button text-tomato" aria-label={`Remove ${label} image`}><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {values.length === 0 ? <p className="mt-2 text-sm font-semibold text-ink/45">No approved public images selected.</p> : null}
      <label className="admin-action-secondary mt-3 w-fit cursor-pointer">
        <UploadCloud className="h-4 w-4" /> {uploading ? "Uploading..." : "Add image"}
        <input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" disabled={uploading} onChange={(event) => { const file = event.target.files?.[0]; if (file) onUpload(file); event.currentTarget.value = ""; }} />
      </label>
    </fieldset>
  );
}

function StatusSummary({ label, value }: { label: string; value: string }) {
  return <div className="rounded-md border border-leaf-900/10 bg-leaf-50 px-4 py-3"><p className="text-xs font-black uppercase tracking-wide text-ink/45">{label}</p><span className="mt-2 inline-flex rounded-full bg-white px-3 py-1 text-sm font-black text-leaf-800 ring-1 ring-leaf-900/10">{value}</span></div>;
}

function Section({ title, description, privateSection = false, children }: {
  title: string;
  description?: string;
  privateSection?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className={`rounded-md border p-4 sm:p-5 ${privateSection ? "border-earth-500/35 bg-earth-50/45" : "border-leaf-900/10 bg-white"}`}>
      <div className="flex items-start gap-3">
        {privateSection ? <FileLock2 className="mt-0.5 h-5 w-5 shrink-0 text-earth-700" aria-hidden="true" /> : null}
        <div>
          <h2 className="text-lg font-black text-ink">{title}</h2>
          {description ? <p className="mt-1 text-sm font-semibold leading-6 text-ink/55">{description}</p> : null}
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function PublicPreviewGallery({ title, photos, emptyMessage, compact }: {
  title: string;
  photos: string[];
  emptyMessage: string;
  compact: boolean;
}) {
  return (
    <section aria-labelledby={`preview-${title.toLowerCase().replaceAll(" ", "-")}`} className="border-t border-leaf-900/10 px-5 py-6 sm:px-6">
      <h4 id={`preview-${title.toLowerCase().replaceAll(" ", "-")}`} className="text-lg font-black text-ink">{title}</h4>
      {photos.length > 0 ? (
        <div className={`mt-4 grid gap-3 ${compact ? "grid-cols-1" : "sm:grid-cols-2"}`}>
          {photos.map((source, index) => (
            <div key={`${source}-${index}`} className="relative aspect-[4/3] overflow-hidden rounded-md bg-leaf-50">
              <Image src={source} alt={`${title} image ${index + 1}`} fill unoptimized className="object-cover" />
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3 rounded-md bg-white px-4 py-3 text-sm font-semibold text-ink/60">{emptyMessage}</p>
      )}
    </section>
  );
}

export function AdminProfileEditor({ kind, recordKey, currentAdmin }: { kind: ProfileEditorKind; recordKey: string; currentAdmin: { email: string } }) {
  const [payload, setPayload] = useState<EditorPayload | null>(null);
  const [draft, setDraft] = useState<ProfileEditorRecord | null>(null);
  const [baseline, setBaseline] = useState<ProfileEditorRecord | null>(null);
  const [activeTab, setActiveTab] = useState<EditorTab>("overview");
  const [loadError, setLoadError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [uploadingTarget, setUploadingTarget] = useState<string | null>(null);
  const [stagedFarmerMedia, setStagedFarmerMedia] = useState<StagedFarmerMedia[]>([]);

  const load = useCallback(async () => {
    setLoadError("");
    const response = await fetch(`/api/admin/profile-editor?kind=${kind}&id=${encodeURIComponent(recordKey)}`, { cache: "no-store" }).catch(() => null);
    const result = (await response?.json().catch(() => null)) as (EditorPayload & { error?: string }) | null;
    if (!response?.ok || !result?.record) {
      if (response?.status === 401) window.location.href = "/admin/login";
      setLoadError(result?.error ?? "This profile could not be loaded.");
      return;
    }
    setPayload(result);
    setDraft(result.record);
    setBaseline(result.record);
    setStagedFarmerMedia([]);
    setSaveState("idle");
  }, [kind, recordKey]);

  useEffect(() => { void load(); }, [load]);

  const dirty = useMemo(() => Boolean(
    draft && baseline && (JSON.stringify(draft) !== JSON.stringify(baseline) || stagedFarmerMedia.length > 0)
  ), [draft, baseline, stagedFarmerMedia.length]);
  useEffect(() => {
    if (dirty && saveState !== "saving") setSaveState("dirty");
    if (!dirty && saveState === "dirty") setSaveState("idle");
  }, [dirty, saveState]);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (!dirty) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  function updateField(field: string, value: unknown) {
    setDraft((current) => current ? ({ ...current, [field]: value } as ProfileEditorRecord) : current);
    setFieldErrors((current) => ({ ...current, [field]: "" }));
  }

  function backHref() {
    return kind === "farmer" ? "/admin?section=farmers" : "/admin?section=suppliers";
  }

  function confirmLeave(event: React.MouseEvent<HTMLAnchorElement>) {
    if (dirty && !window.confirm("Leave this profile without saving your changes?")) event.preventDefault();
  }

  async function cleanupStagedMedia(items: StagedFarmerMedia[]) {
    if (!draft || kind !== "farmer" || items.length === 0) return true;
    const response = await fetch("/api/admin/profile-editor/media", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profileId: draft.id, paths: items.map((item) => item.path) })
    }).catch(() => null);
    return Boolean(response?.ok);
  }

  async function resetChanges() {
    if (!baseline || saveState === "saving") return;
    if (stagedFarmerMedia.length && !window.confirm("Reset edits and remove the newly staged images? Existing profile media will not be deleted.")) return;
    const cleaned = await cleanupStagedMedia(stagedFarmerMedia);
    if (!cleaned) {
      setSaveError("The staged images could not be removed. Try Reset again before leaving.");
      return;
    }
    setStagedFarmerMedia([]);
    setDraft(baseline);
    setFieldErrors({});
    setSaveError("");
    setSaveState("idle");
  }

  async function saveChanges() {
    if (!draft || !baseline || !dirty || saveState === "saving") return;
    const changes = Object.fromEntries(Object.entries(draft).filter(([key, value]) => JSON.stringify(value) !== JSON.stringify((baseline as unknown as Record<string, unknown>)[key])));
    setSaveState("saving");
    setSaveError("");
    setFieldErrors({});
    const response = await fetch("/api/admin/profile-editor", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind,
        id: draft.id,
        version: kind === "farmer" ? baseline.updated_at : undefined,
        changes,
        stagedMedia: kind === "farmer" ? stagedFarmerMedia.map(({ path, target }) => ({ path, target })) : []
      })
    }).catch(() => null);
    const result = (await response?.json().catch(() => null)) as (EditorPayload & { error?: string; errors?: Record<string, string>; stagedMediaDiscarded?: boolean }) | null;
    if (!response?.ok || !result?.record) {
      if (response?.status === 401) window.location.href = "/admin/login";
      setSaveState("error");
      setSaveError(result?.error ?? "Save failed. Your edits remain on screen.");
      setFieldErrors(result?.errors ?? {});
      if (result?.stagedMediaDiscarded) setStagedFarmerMedia([]);
      return;
    }
    setPayload(result);
    setDraft(result.record);
    setBaseline(result.record);
    setStagedFarmerMedia([]);
    setSaveState("saved");
    setLastSaved(new Date());
  }

  async function transition(action: ProfileTransition, label: string) {
    if (!draft || busyAction || dirty) {
      if (dirty) setSaveError("Save or reset your unsaved changes before changing publication state.");
      return;
    }
    const confirmation = kind === "farmer" && action === "launch-ready" && draft.status === "Active" && !draft.launch_ready
      ? "Mark Launch Ready for this legacy Active farmer profile? It will return to Pending Review and stay hidden until Activate / Publish is used explicitly."
      : `${label} for this ${kind} profile? This will not contact anyone.`;
    if (!window.confirm(confirmation)) return;
    setBusyAction(action);
    setSaveError("");
    const response = await fetch("/api/admin/profile-editor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "transition", kind, id: draft.id, transition: action })
    }).catch(() => null);
    const result = (await response?.json().catch(() => null)) as (EditorPayload & { error?: string; checks?: PublicationCheck[] }) | null;
    setBusyAction(null);
    if (!response?.ok || !result?.record) {
      setSaveError(result?.error ?? "The profile state could not be updated.");
      if (result?.checks && payload) setPayload({ ...payload, eligibility: { ...payload.eligibility, checks: result.checks, hiddenReasons: result.checks.filter((item) => !item.complete).map((item) => item.label) } });
      return;
    }
    setPayload(result);
    setDraft(result.record);
    setBaseline(result.record);
    setLastSaved(new Date());
    setSaveState("saved");
  }

  async function previewPrivateMedia(item: PrivateMediaItem) {
    if (!payload?.sourceHistory) return;
    setBusyAction(`preview:${item.path}`);
    const response = await fetch("/api/admin/profile-applications/media", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "preview", kind, applicationId: payload.sourceHistory.applicationId, path: item.path })
    }).catch(() => null);
    const result = (await response?.json().catch(() => null)) as { signedUrl?: string; error?: string } | null;
    setBusyAction(null);
    if (!response?.ok || !result?.signedUrl) {
      setSaveError(result?.error ?? "Private media preview is unavailable.");
      return;
    }
    window.open(result.signedUrl, "_blank", "noopener,noreferrer");
  }

  async function promotePrivateImage(item: PrivateMediaItem) {
    if (!payload?.sourceHistory || !draft || !item.promotable) return;
    if (dirty) {
      setSaveError("Save or reset your unsaved changes before approving public media.");
      return;
    }
    if (!window.confirm(`Approve ${item.label} for public profile use? The private original will remain available.`)) return;
    const profileField = kind === "farmer"
      ? item.group === "profile" ? "profile_image_url" : item.group === "farm" ? "farm_photo_urls" : "produce_photo_urls"
      : item.group === "logo" ? "logo_url" : "profile_image_url";
    setBusyAction(`promote:${item.path}`);
    const response = await fetch("/api/admin/profile-applications/media", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "promote", kind, applicationId: payload.sourceHistory.applicationId, path: item.path, profileId: draft.id, profileField, approved: true })
    }).catch(() => null);
    const result = (await response?.json().catch(() => null)) as { error?: string } | null;
    setBusyAction(null);
    if (!response?.ok) {
      setSaveError(result?.error ?? "Approved image could not be promoted.");
      return;
    }
    await load();
  }

  async function uploadPublicImage(
    file: File,
    target: "profile_image_url" | "logo_url" | "farm_photo_urls" | "produce_photo_urls"
  ) {
    if (!draft || uploadingTarget) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setSaveError("Upload a JPG, PNG, or WEBP image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setSaveError("Image must be 5MB or smaller.");
      return;
    }
    setUploadingTarget(target);
    setSaveError("");
    const formData = new FormData();
    formData.append("file", file);
    if (kind === "farmer") {
      formData.append("profileId", draft.id);
      formData.append("target", target);
    } else {
      formData.append("bucket", "suppliers");
    }
    const response = await fetch(kind === "farmer" ? "/api/admin/profile-editor/media" : "/api/admin/uploads", { method: "POST", body: formData }).catch(() => null);
    const result = (await response?.json().catch(() => null)) as { publicUrl?: string; previewUrl?: string; path?: string; target?: FarmerMediaTarget; error?: string } | null;
    setUploadingTarget(null);
    if (!response?.ok || !result || (kind === "farmer" ? !result.previewUrl || !result.path || !result.target : !result.publicUrl)) {
      setSaveError(result?.error ?? "The image could not be uploaded.");
      return;
    }
    if (kind === "farmer") {
      const staged = { path: result.path!, previewUrl: result.previewUrl!, target: result.target! };
      if (target === "profile_image_url") {
        const replaced = stagedFarmerMedia.filter((item) => item.target === target);
        if (replaced.length) await cleanupStagedMedia(replaced);
        setStagedFarmerMedia((current) => [...current.filter((item) => item.target !== target), staged]);
      } else {
        setStagedFarmerMedia((current) => [...current, staged]);
      }
      setDraft((current) => current ? ({
        ...current,
        launch_checklist: { ...current.launch_checklist, approvedNoPhoto: false }
      } as ProfileEditorRecord) : current);
      return;
    }
    setDraft((current) => {
      if (!current) return current;
      const existingGallery = target === "farm_photo_urls"
        ? ("farm_photo_urls" in current ? current.farm_photo_urls : [])
        : target === "produce_photo_urls"
          ? ("produce_photo_urls" in current ? current.produce_photo_urls : [])
          : [];
      const nextValue = target === "farm_photo_urls" || target === "produce_photo_urls"
        ? Array.from(new Set([...existingGallery, result.publicUrl!]))
        : result.publicUrl!;
      return {
        ...current,
        [target]: nextValue,
        launch_checklist: { ...current.launch_checklist, approvedNoPhoto: false }
      } as ProfileEditorRecord;
    });
  }

  if (loadError) {
    return <main className="min-h-screen bg-cream px-4 py-10"><div className="mx-auto max-w-xl rounded-md bg-white p-6 shadow-soft"><AlertCircle className="h-7 w-7 text-tomato" /><h1 className="mt-4 text-2xl font-black text-ink">Profile unavailable</h1><p className="mt-2 text-sm font-semibold text-ink/60">{loadError}</p><button type="button" onClick={() => void load()} className="admin-action-secondary mt-5"><RefreshCw className="h-4 w-4" /> Retry</button></div></main>;
  }
  if (!draft || !payload) {
    return <main className="grid min-h-screen place-items-center bg-cream"><p className="flex items-center gap-2 font-black text-ink/65"><LoaderCircle className="h-5 w-5 animate-spin" /> Loading live profile...</p></main>;
  }

  const farmer = kind === "farmer" ? draft as FarmerProfileRecord : null;
  const supplier = kind === "supplier" ? draft as SupplierProfileRecord : null;
  const lifecycle = authoritativeLifecycleSummary(draft);
  const title = farmer?.farm_name || supplier?.company_name || `${kind} profile`;
  const previewMainImage = text(payload.preview.mainImage) || (kind === "supplier" ? textList(payload.preview.photos)[0] : "");
  const previewFarmPhotos = kind === "farmer" ? textList(payload.preview.farmPhotos) : [];
  const previewProducePhotos = kind === "farmer" ? textList(payload.preview.producePhotos) : [];
  const stagedMainImage = stagedFarmerMedia.find((item) => item.target === "profile_image_url")?.previewUrl;
  const stagedFarmPhotos = stagedFarmerMedia.filter((item) => item.target === "farm_photo_urls");
  const stagedProducePhotos = stagedFarmerMedia.filter((item) => item.target === "produce_photo_urls");
  const tabs: Array<[EditorTab, string]> = [["overview", "Profile"], ["media", "Media & documents"], ["review", "Review & publication"], ["preview", "Public preview"]];
  const promotableApplicationMedia = payload.sourceHistory?.privateMedia.filter((item) => item.promotable) ?? [];
  const privateDocuments = payload.sourceHistory?.privateMedia.filter((item) => !item.promotable) ?? [];

  return (
    <main className="min-h-screen overflow-x-hidden bg-cream pb-40 sm:pb-28">
      <header className="border-b border-leaf-900/10 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <Link href={backHref()} onClick={confirmLeave} className="inline-flex items-center gap-2 text-sm font-black text-leaf-800 hover:text-leaf-600"><ArrowLeft className="h-4 w-4" /> Back to Admin</Link>
            <p className="mt-4 text-xs font-black uppercase tracking-[0.16em] text-earth-700">{kind === "farmer" ? "Farmer Profile Editor" : "Supplier Profile Editor"}</p>
            <h1 className="mt-1 break-words text-2xl font-black text-ink sm:text-3xl">{title}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-black">
            <span className={`rounded-full px-3 py-1.5 ${payload.eligibility.eligible ? "bg-leaf-100 text-leaf-800" : "bg-ink/8 text-ink/55"}`}>{payload.eligibility.eligible ? "Publicly eligible" : "Currently hidden"}</span>
            <span className="rounded-full bg-leaf-50 px-3 py-1.5 text-ink/60">Admin: {currentAdmin.email}</span>
            <button type="button" onClick={() => setActiveTab("preview")} className="admin-action-secondary"><Eye className="h-4 w-4" /> Public Preview</button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6">
        <nav className="grid grid-cols-2 gap-2 sm:flex sm:overflow-x-auto sm:pb-2" aria-label="Profile editor sections">
          {tabs.map(([tab, label]) => <button key={tab} type="button" onClick={() => setActiveTab(tab)} aria-current={activeTab === tab ? "page" : undefined} className={`min-h-11 min-w-0 rounded-md px-3 py-2 text-sm font-black leading-5 transition sm:shrink-0 sm:px-4 ${activeTab === tab ? "bg-leaf-800 text-white" : "bg-white text-ink/60 ring-1 ring-leaf-900/10 hover:text-leaf-800"}`}>{label}</button>)}
        </nav>

        {saveError ? <div className="mt-4 flex items-start gap-3 rounded-md border border-tomato/20 bg-red-50 p-4 text-sm font-bold text-tomato" role="alert"><AlertCircle className="mt-0.5 h-5 w-5 shrink-0" /><span>{saveError}</span></div> : null}

        <div className="mt-5 grid gap-5">
          {activeTab === "overview" && farmer ? (
            <>
              <Section title="Public Identity" description="These details may appear in the Farmer Directory after every eligibility rule is satisfied."><div className="grid gap-4 md:grid-cols-2">
                <Field label="Farm / public name" value={farmer.farm_name} onChange={(value) => updateField("farm_name", value)} error={fieldErrors.farm_name} />
                <Field label="Public farmer name" optional value={farmer.farmer_name ?? ""} onChange={(value) => updateField("farmer_name", value)} />
                <Field label="Public URL slug" value={farmer.slug ?? ""} onChange={(value) => updateField("slug", value)} error={fieldErrors.slug} placeholder="farm-name" />
                <Field label="Region" value={farmer.region} onChange={(value) => updateField("region", value)} />
                <Field label="District / town" value={farmer.district} onChange={(value) => updateField("district", value)} />
                <Field label="Public location" optional value={farmer.farm_location ?? ""} onChange={(value) => updateField("farm_location", value)} />
                <SelectField label="Farm type" value={farmer.farm_type} options={farmerFarmTypes} onChange={(value) => updateField("farm_type", value)} warning={farmerFarmTypes.includes(farmer.farm_type as (typeof farmerFarmTypes)[number]) ? undefined : "Legacy value preserved. Choose an approved farm type before publishing."} />
                <TextAreaField label="Main crops / products" value={farmer.products.join("\n")} onChange={(value) => updateField("products", value.split(/\n|,/))} placeholder="One crop or product per line" />
                <div className="md:col-span-2"><TextAreaField label="Short description / story" value={farmer.description ?? ""} onChange={(value) => updateField("description", value)} /></div>
              </div></Section>
              <Section title="Operations" description="Operational details help Ghana Growers review availability without changing publication state."><div className="grid gap-4 md:grid-cols-2">
                <Field label="Farming experience" optional value={farmer.farming_experience ?? ""} onChange={(value) => updateField("farming_experience", value)} />
                <Field label="Current harvest status" optional value={farmer.currently_harvesting ?? ""} onChange={(value) => updateField("currently_harvesting", value)} />
                <Field label="Supply frequency" optional value={farmer.supply_frequency ?? ""} onChange={(value) => updateField("supply_frequency", value)} />
                <Field label="Delivery / pickup options" optional value={farmer.delivery_preference ?? ""} onChange={(value) => updateField("delivery_preference", value)} />
                <Field label="Payment / trading notes" optional value={farmer.payment_preference ?? ""} onChange={(value) => updateField("payment_preference", value)} />
                <Field label="Farm size / capacity" optional value={farmer.farm_size ?? ""} onChange={(value) => updateField("farm_size", value)} />
              </div></Section>
              <Section title="Private Contact" description="Private - never shown publicly" privateSection><div className="grid gap-4 md:grid-cols-2">
                <Field label="Application contact name" optional value={payload.sourceHistory?.privateContactName ?? "Not stored separately on this profile"} readOnly />
                <Field label="Phone" optional value={farmer.phone_number ?? ""} onChange={(value) => updateField("phone_number", value)} />
                <Field label="WhatsApp" optional value={farmer.whatsapp_number ?? ""} onChange={(value) => updateField("whatsapp_number", value)} />
                <Field label="Email" optional type="email" value={farmer.email ?? ""} onChange={(value) => updateField("email", value)} />
                <div className="md:col-span-2"><TextAreaField label="Internal location / contact notes" optional value={farmer.editorial_notes ?? ""} onChange={(value) => updateField("editorial_notes", value)} /></div>
              </div></Section>
            </>
          ) : null}

          {activeTab === "overview" && supplier ? (
            <>
              <Section title="Public Business Identity" description="The public description is generated from these reviewed fields because the supplier profile table has no separate description column."><div className="grid gap-4 md:grid-cols-2">
                <Field label="Company / business name" value={supplier.company_name} onChange={(value) => updateField("company_name", value)} />
                <Field label="Public URL slug" value={supplier.slug ?? ""} onChange={(value) => updateField("slug", value)} error={fieldErrors.slug} />
                <SelectField label="Category" value={supplier.category} options={approvedSupplierCategories} onChange={(value) => updateField("category", value)} warning={payload.categoryReview?.requiresReview ? "Unknown legacy category preserved. Select an approved category before publishing." : undefined} />
                <Field label="Region" value={supplier.region} onChange={(value) => updateField("region", value)} />
                <Field label="District" value={supplier.district} onChange={(value) => updateField("district", value)} />
                <Field label="Service coverage" value={supplier.service_coverage_area ?? ""} onChange={(value) => updateField("service_coverage_area", value)} />
                <div className="md:col-span-2"><TextAreaField label="Products and services" value={supplier.products_services.join("\n")} onChange={(value) => updateField("products_services", value.split(/\n|,/))} placeholder="One product or service per line" /></div>
                <Field label="Website" optional type="url" value={supplier.website ?? ""} onChange={(value) => updateField("website", value)} />
                <div className="md:col-span-2"><TextAreaField label="Generated public business description" value={text(payload.preview.companyOverview)} readOnly /></div>
              </div></Section>
              <Section title="Private Contact" description="Private - never shown publicly" privateSection><div className="grid gap-4 md:grid-cols-2">
                <Field label="Contact person" value={supplier.contact_person} onChange={(value) => updateField("contact_person", value)} />
                <Field label="Phone" optional value={supplier.phone ?? ""} onChange={(value) => updateField("phone", value)} />
                <Field label="WhatsApp" optional value={supplier.whatsapp_number ?? ""} onChange={(value) => updateField("whatsapp_number", value)} />
                <Field label="Application email" optional type="email" value={payload.sourceHistory?.privateEmail ?? ""} readOnly />
                <div className="md:col-span-2"><TextAreaField label="Application / internal notes" optional value={payload.sourceHistory?.privateNotes ?? supplier.editorial_notes ?? ""} onChange={payload.sourceHistory?.privateNotes ? undefined : (value) => updateField("editorial_notes", value)} readOnly={Boolean(payload.sourceHistory?.privateNotes)} /></div>
              </div></Section>
            </>
          ) : null}

          {activeTab === "media" ? (
            <>
              <Section title="Public Media" description="Upload reviewed public images, or explicitly select an approved image from the linked application. Normal profile editing does not require typing a URL."><div className="grid gap-4">
                {farmer ? <>
                  <PublicImageControl label="Main profile image" value={stagedMainImage ?? farmer.profile_image_url} uploading={uploadingTarget === "profile_image_url"} onUpload={(file) => void uploadPublicImage(file, "profile_image_url")} onRemove={() => { const staged = stagedFarmerMedia.filter((item) => item.target === "profile_image_url"); if (staged.length) { void cleanupStagedMedia(staged); setStagedFarmerMedia((current) => current.filter((item) => item.target !== "profile_image_url")); } else updateField("profile_image_url", null); }} />
                  <PublicGalleryControl label="Farm gallery" values={[...farmer.farm_photo_urls, ...stagedFarmPhotos.map((item) => item.previewUrl)]} uploading={uploadingTarget === "farm_photo_urls"} onUpload={(file) => void uploadPublicImage(file, "farm_photo_urls")} onChange={(value) => { const keptStaged = stagedFarmPhotos.filter((item) => value.includes(item.previewUrl)); const removed = stagedFarmPhotos.filter((item) => !value.includes(item.previewUrl)); if (removed.length) void cleanupStagedMedia(removed); setStagedFarmerMedia((current) => [...current.filter((item) => item.target !== "farm_photo_urls"), ...keptStaged]); updateField("farm_photo_urls", value.filter((item) => !stagedFarmPhotos.some((staged) => staged.previewUrl === item))); }} />
                  <PublicGalleryControl label="Produce gallery" values={[...farmer.produce_photo_urls, ...stagedProducePhotos.map((item) => item.previewUrl)]} uploading={uploadingTarget === "produce_photo_urls"} onUpload={(file) => void uploadPublicImage(file, "produce_photo_urls")} onChange={(value) => { const keptStaged = stagedProducePhotos.filter((item) => value.includes(item.previewUrl)); const removed = stagedProducePhotos.filter((item) => !value.includes(item.previewUrl)); if (removed.length) void cleanupStagedMedia(removed); setStagedFarmerMedia((current) => [...current.filter((item) => item.target !== "produce_photo_urls"), ...keptStaged]); updateField("produce_photo_urls", value.filter((item) => !stagedProducePhotos.some((staged) => staged.previewUrl === item))); }} />
                </> : null}
                {supplier ? <>
                  <PublicImageControl label="Public logo" value={supplier.logo_url} uploading={uploadingTarget === "logo_url"} onUpload={(file) => void uploadPublicImage(file, "logo_url")} onRemove={() => updateField("logo_url", null)} />
                  <PublicImageControl label="Public profile image" value={supplier.profile_image_url} uploading={uploadingTarget === "profile_image_url"} onUpload={(file) => void uploadPublicImage(file, "profile_image_url")} onRemove={() => updateField("profile_image_url", null)} />
                  <p className="rounded-md bg-leaf-50 p-3 text-sm font-semibold text-ink/55">Supplier gallery ordering is not stored by the current production schema. No unsupported field is written.</p>
                </> : null}
                {promotableApplicationMedia.length ? <div className="rounded-md border border-leaf-900/10 bg-white p-4"><h3 className="text-sm font-black text-ink">Approved application images</h3><p className="mt-1 text-sm font-semibold text-ink/50">Preview an application image, then explicitly select it for public use.</p><div className="mt-3 grid gap-2">{promotableApplicationMedia.map((item) => <div key={item.path} className="flex flex-col gap-3 rounded-md bg-leaf-50 p-3 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm font-black text-ink">{item.label}</p><div className="flex flex-wrap gap-2"><button type="button" onClick={() => void previewPrivateMedia(item)} className="admin-action-secondary"><Eye className="h-4 w-4" /> Preview</button><button type="button" onClick={() => void promotePrivateImage(item)} className="admin-action-secondary"><ImageIcon className="h-4 w-4" /> Select approved application image</button></div></div>)}</div></div> : null}
                <label className="flex min-h-11 items-center gap-3 rounded-md bg-leaf-50 px-4 py-3 text-sm font-black text-ink/70">
                  <input type="checkbox" checked={draft.launch_checklist.approvedNoPhoto === true} onChange={(event) => updateField("launch_checklist", { ...draft.launch_checklist, approvedNoPhoto: event.target.checked })} className="h-4 w-4 rounded border-leaf-900/20 text-leaf-700" />
                  Approve no-photo state
                </label>
                <details className="rounded-md border border-leaf-900/10 bg-white p-4"><summary className="cursor-pointer text-sm font-black text-ink">Technical details</summary><p className="mt-2 text-sm font-semibold text-ink/50">Compatibility fields for reviewed public URLs. Most administrators should use the controls above.</p><div className="mt-4 grid gap-4">{farmer ? <><Field label="Main profile image URL" optional type="url" value={farmer.profile_image_url ?? ""} onChange={(value) => updateField("profile_image_url", value)} error={fieldErrors.profile_image_url} /><OrderedListField label="Farm gallery URLs" values={farmer.farm_photo_urls} onChange={(value) => updateField("farm_photo_urls", value)} placeholder="Add URL" error={fieldErrors.farm_photo_urls} /><OrderedListField label="Produce gallery URLs" values={farmer.produce_photo_urls} onChange={(value) => updateField("produce_photo_urls", value)} placeholder="Add URL" error={fieldErrors.produce_photo_urls} /></> : null}{supplier ? <><Field label="Public logo URL" optional type="url" value={supplier.logo_url ?? ""} onChange={(value) => updateField("logo_url", value)} error={fieldErrors.logo_url} /><Field label="Public profile image URL" optional type="url" value={supplier.profile_image_url ?? ""} onChange={(value) => updateField("profile_image_url", value)} error={fieldErrors.profile_image_url} /></> : null}</div></details>
              </div></Section>
              <Section title="Private Application Documents" description="Protected short-lived previews only. Certificates and documents can never be promoted publicly." privateSection>
                {payload.sourceHistory ? <div className="grid gap-2">
                  {privateDocuments.map((item) => <div key={item.path} className="flex flex-col gap-3 rounded-md bg-white p-3 ring-1 ring-leaf-900/10 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-black text-ink">{item.label}</p><p className="mt-1 text-xs font-semibold text-ink/45">Private document - public promotion disabled</p></div><button type="button" onClick={() => void previewPrivateMedia(item)} className="admin-action-secondary"><Eye className="h-4 w-4" /> Preview</button></div>)}
                  {privateDocuments.length === 0 ? <p className="admin-empty-state p-4 text-sm font-semibold">No private application documents are linked.</p> : null}
                </div> : <p className="admin-empty-state p-4 text-sm font-semibold">This profile has no linked application media.</p>}
              </Section>
              {payload.sourceHistory ? <details className="rounded-md border border-leaf-900/10 bg-white p-4"><summary className="cursor-pointer text-sm font-black text-ink">Source history</summary><dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3"><div><dt className="font-black text-ink/45">Application status</dt><dd className="mt-1 font-semibold text-ink/70">{payload.sourceHistory.status}</dd></div><div><dt className="font-black text-ink/45">Submitted</dt><dd className="mt-1 font-semibold text-ink/70">{new Date(payload.sourceHistory.createdAt).toLocaleDateString()}</dd></div><div><dt className="font-black text-ink/45">Relationship</dt><dd className="mt-1 font-semibold text-ink/70">Linked one-to-one</dd></div></dl></details> : null}
            </>
          ) : null}

          {activeTab === "review" ? (
            <>
              <Section title="Publication Checklist" description="This is the same server-side readiness evaluation used by Activate / Publish. Every required item must pass."><div className="grid gap-2 sm:grid-cols-2">{payload.eligibility.checks.map((check) => <div key={check.key} className={`flex items-start justify-between gap-3 rounded-md px-3 py-3 text-sm font-bold ${check.state === "passed" ? "bg-leaf-50 text-leaf-800" : check.state === "needs-review" ? "bg-amber-50 text-earth-800" : "bg-ink/[0.04] text-ink/65"}`}><span className="flex min-w-0 items-start gap-2">{check.state === "passed" ? <Check className="mt-0.5 h-4 w-4 shrink-0" /> : check.state === "needs-review" ? <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> : <X className="mt-0.5 h-4 w-4 shrink-0" />}<span>{check.label}</span></span><span className="shrink-0 rounded-full bg-white/80 px-2 py-0.5 text-xs ring-1 ring-current/10">{check.state === "passed" ? "Passed" : check.state === "needs-review" ? "Needs review" : "Missing"}</span></div>)}</div></Section>
              <Section title="Review and Publication" description="Saving content never publishes it. Each status change is a separate protected, confirmed action.">
                <div aria-label="Authoritative lifecycle summary" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                  <StatusSummary label="Status" value={lifecycle.status} />
                  <StatusSummary label="Verification" value={lifecycle.verification} />
                  <StatusSummary label="Launch Ready" value={lifecycle.launchReady} />
                  <StatusSummary label="Featured" value={lifecycle.featured} />
                  <StatusSummary label="Featured until" value={lifecycle.featuredUntil} />
                </div>
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                {farmer && farmer.status === "Active" && !farmer.launch_ready ? <p className="rounded-md bg-earth-50 p-3 text-sm font-semibold leading-6 text-earth-800 md:col-span-2">This legacy Active record is not launch ready. Mark Launch Ready returns it to Pending Review; Activate / Publish remains the explicit final publication action.</p> : null}
                <SelectField label="Ghana Growers Standard status" value={draft.gg_standard_status ?? "Pending"} options={ggStandardStatuses} onChange={(value) => updateField("gg_standard_status", value)} />
                {supplier ? <SelectField label="Launch status" value={supplier.launch_status} options={supplierLaunchStatuses} onChange={(value) => updateField("launch_status", value)} /> : null}
                {supplier ? <SelectField label="Profile review status" value={supplier.profile_review_status} options={supplierReviewStatuses} onChange={(value) => updateField("profile_review_status", value)} /> : null}
                {farmer ? <details className="rounded-md border border-leaf-900/10 bg-ink/[0.025] p-4 md:col-span-2"><summary className="cursor-pointer text-sm font-black text-ink">Historical import metadata</summary><dl className="mt-3 text-sm"><dt className="font-black text-ink/55">Historical import value - does not control publication or Featured status</dt><dd className="mt-1 font-semibold text-ink/70">{farmer.launch_status || "Not set"}</dd></dl></details> : null}
                <div className="rounded-md border border-leaf-900/10 bg-white p-4 md:col-span-2"><h3 className="text-sm font-black text-ink">Verification audit</h3><dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2"><div><dt className="font-black text-ink/45">Verified by</dt><dd className="mt-1 font-semibold text-ink/70">{draft.verified_by || "Not verified"}</dd></div><div><dt className="font-black text-ink/45">Verification date</dt><dd className="mt-1 font-semibold text-ink/70">{draft.verification_date ? new Date(draft.verification_date).toLocaleDateString() : "Not verified"}</dd></div></dl><p className="mt-3 text-xs font-semibold text-ink/45">These values are written by the protected Verify action using the signed-in Admin identity.</p></div>
                <Field label="Featured until" optional type="date" value={draft.featured_until ?? ""} onChange={(value) => updateField("featured_until", value)} error={fieldErrors.featured_until} />
                <div className="md:col-span-2"><TextAreaField label="Featured note" optional value={draft.featured_note ?? ""} onChange={(value) => updateField("featured_note", value)} /></div>
                <div className="md:col-span-2"><TextAreaField label="Internal review notes" optional value={draft.verification_notes ?? ""} onChange={(value) => updateField("verification_notes", value)} /></div>
                </div>
              {kind === "supplier" ? <p className="mt-4 rounded-md bg-leaf-50 p-3 text-sm font-semibold text-ink/58">Supplier activation requires the reviewed launch-readiness checklist. The approved public directory eligibility rule remains Active + Verified + valid slug + non-demo source.</p> : null}
              <p className="mt-3 rounded-md bg-leaf-50 p-3 text-sm font-semibold text-ink/58">Featured status will become public only after the profile is eligible.</p>
              <div className="mt-5 flex flex-wrap gap-2">
                <button type="button" onClick={() => void transition("under-review", "Mark Under Review")} className="admin-action-secondary"><ShieldCheck className="h-4 w-4" /> Mark Under Review</button>
                <button type="button" onClick={() => void transition("verify", "Verify")} className="admin-action-secondary"><BadgeCheck className="h-4 w-4" /> Verify</button>
                <button type="button" onClick={() => void transition("launch-ready", "Mark Launch Ready")} className="admin-action-secondary"><Check className="h-4 w-4" /> Mark Launch Ready</button>
                <button type="button" onClick={() => void transition("activate", "Activate / Publish")} className="admin-action-primary"><BadgeCheck className="h-4 w-4" /> Activate / Publish</button>
                <button type="button" onClick={() => void transition("pause", "Pause / Deactivate")} className="admin-action-destructive"><PauseCircle className="h-4 w-4" /> Pause / Deactivate</button>
                <button type="button" onClick={() => void transition(draft.is_featured ? "unfeature" : "feature", draft.is_featured ? "Remove Featured" : "Feature")} className="admin-action-secondary"><Star className="h-4 w-4" /> {draft.is_featured ? "Remove Featured" : "Feature"}</button>
              </div></Section>
            </>
          ) : null}

          {activeTab === "preview" ? (
            <Section title="Admin-only Public Preview" description="This preview uses the same safe public DTO as the directory. Private contact, notes, documents, paths, and signed URLs are excluded.">
              <div className="flex gap-2"><button type="button" onClick={() => setPreviewMode("desktop")} className={previewMode === "desktop" ? "admin-action-primary" : "admin-action-secondary"}>Desktop</button><button type="button" onClick={() => setPreviewMode("mobile")} className={previewMode === "mobile" ? "admin-action-primary" : "admin-action-secondary"}>Mobile</button></div>
              <div className={`mt-5 mx-auto overflow-hidden rounded-md border border-leaf-900/10 bg-cream shadow-sm ${previewMode === "mobile" ? "max-w-[390px]" : "max-w-4xl"}`}>
                {previewMainImage ? kind === "farmer" ? <div className="bg-cream p-3 sm:p-5"><FarmerProfileImage src={previewMainImage} alt="Approved public profile preview" variant="profile" sizes={previewMode === "mobile" ? "390px" : "896px"} unoptimized landscapePositionClass="object-[center_30%]" /></div> : <div className="relative aspect-[16/8] w-full bg-leaf-50"><Image src={previewMainImage} alt="Approved public profile preview" fill unoptimized className="object-cover" /></div> : <div className="grid aspect-[16/7] place-items-center bg-leaf-50 text-leaf-700"><ImageIcon className="h-10 w-10" /><span className="sr-only">No public image</span></div>}
                <div className="p-5 sm:p-6"><p className="text-xs font-black uppercase tracking-wide text-earth-700">{kind === "farmer" ? "Farmer profile" : "Supplier profile"}</p><h3 className="mt-2 text-2xl font-black text-ink">{text(payload.preview.farmName) || text(payload.preview.companyName)}</h3><p className="mt-2 text-sm font-semibold text-ink/55">{text(payload.preview.publicLocation) || [text(payload.preview.district), text(payload.preview.region)].filter(Boolean).join(", ")}</p><p className={`mt-4 text-sm font-semibold leading-7 ${text(payload.preview.description) === "No public description has been added yet." ? "text-earth-700" : "text-ink/70"}`}>{text(payload.preview.description) || text(payload.preview.companyOverview)}</p><div className="mt-4 flex flex-wrap gap-2">{(textList(payload.preview.products).length ? textList(payload.preview.products) : textList(payload.preview.productsServices)).map((item) => <span key={item} className="rounded-full bg-leaf-50 px-3 py-1 text-xs font-black text-leaf-800">{item}</span>)}</div></div>
                {kind === "farmer" ? (
                  <>
                    <PublicPreviewGallery title="Farm Gallery" photos={previewFarmPhotos} emptyMessage="No farm gallery images have been added yet." compact={previewMode === "mobile"} />
                    <PublicPreviewGallery title="Produce Gallery" photos={previewProducePhotos} emptyMessage="No produce gallery images have been added yet." compact={previewMode === "mobile"} />
                  </>
                ) : null}
              </div>
              {!payload.eligibility.eligible ? <div className="mt-5 rounded-md bg-earth-50 p-4"><p className="font-black text-earth-800">This profile is currently hidden.</p><ul className="mt-2 grid gap-1 text-sm font-semibold text-earth-800/80">{payload.eligibility.hiddenReasons.map((reason) => <li key={reason}>- {reason}</li>)}</ul></div> : null}
            </Section>
          ) : null}
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-leaf-900/10 bg-white/95 px-4 py-3 shadow-[0_-8px_24px_rgba(20,58,31,0.08)] backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm font-black text-ink/65" role="status" aria-live="polite">
            {saveState === "saving" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : saveState === "saved" ? <Check className="h-4 w-4 text-leaf-700" /> : saveState === "error" ? <AlertCircle className="h-4 w-4 text-tomato" /> : dirty ? <AlertCircle className="h-4 w-4 text-earth-700" /> : <Save className="h-4 w-4" />}
            {saveState === "saving" ? "Saving..." : saveState === "saved" ? `Saved${lastSaved ? ` at ${lastSaved.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : ""}` : saveState === "error" ? "Save failed" : dirty ? "Unsaved changes" : "No unsaved changes"}
          </div>
          <div className="flex gap-2"><button type="button" onClick={() => void resetChanges()} disabled={!dirty || saveState === "saving"} className="admin-action-secondary flex-1 sm:flex-none"><RotateCcw className="h-4 w-4" /> Reset</button><button type="button" onClick={() => void saveChanges()} disabled={!dirty || saveState === "saving"} className="admin-action-primary flex-1 sm:flex-none"><Save className="h-4 w-4" /> {saveState === "saving" ? "Saving..." : "Save Changes"}</button></div>
        </div>
      </div>
    </main>
  );
}
