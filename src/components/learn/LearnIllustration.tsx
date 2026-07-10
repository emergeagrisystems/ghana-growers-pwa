import type { BlogPost } from "@/types";

export type LearnIllustrationType =
  | "compost"
  | "mulch"
  | "manure"
  | "rotation"
  | "soil-cover"
  | "crop-check"
  | "spray-check"
  | "rain-drainage"
  | "harvest-sorting"
  | "storage"
  | "farmmate"
  | "video";

type LearnIllustrationProps = {
  type: LearnIllustrationType;
  size?: "card" | "mini";
  className?: string;
};

export function getLearnIllustrationType(lesson: Pick<BlogPost, "title" | "category">): LearnIllustrationType {
  const text = `${lesson.title} ${lesson.category}`.toLowerCase();

  if (text.includes("video")) return "video";
  if (text.includes("crop doctor") || text.includes("farmmate")) return "farmmate";
  if (text.includes("spray")) return "spray-check";
  if (text.includes("scout") || text.includes("field check") || text.includes("yellow leaves") || text.includes("spacing")) return "crop-check";
  if (text.includes("mulch")) return "mulch";
  if (text.includes("manure")) return "manure";
  if (text.includes("rotation")) return "rotation";
  if (text.includes("soil cover") || text.includes("covered")) return "soil-cover";
  if (text.includes("rain") || text.includes("drainage") || text.includes("water")) return "rain-drainage";
  if (text.includes("sort") || text.includes("pack") || text.includes("harvest")) return "harvest-sorting";
  if (text.includes("store") || text.includes("storage") || text.includes("maize") || text.includes("yam")) return "storage";
  if (lesson.category === "Soil & Compost") return "compost";
  if (lesson.category === "Crop Care" || lesson.category === "Pests & Diseases") return "crop-check";
  if (lesson.category === "Harvest & Storage") return "harvest-sorting";
  if (lesson.category === "Video Lessons") return "video";

  return "farmmate";
}

function IllustrationMark({ type }: { type: LearnIllustrationType }) {
  switch (type) {
    case "mulch":
      return (
        <>
          <path d="M22 56h64" />
          <path d="M30 52c12-16 30-17 48 0" />
          <path d="M38 45c9 5 23 5 32 0" />
          <path d="M42 34c11 2 20 2 31 0" />
        </>
      );
    case "manure":
      return (
        <>
          <path d="M26 58c9-16 21-21 34-12 13-8 26-3 34 12" />
          <path d="M40 43c5-8 16-9 22-1" />
          <path d="M67 42c6-7 15-5 20 1" />
          <circle cx="48" cy="55" r="2" />
          <circle cx="73" cy="54" r="2" />
        </>
      );
    case "rotation":
      return (
        <>
          <path d="M34 32a25 25 0 0 1 40-4" />
          <path d="M73 21v13H60" />
          <path d="M78 56a25 25 0 0 1-40 4" />
          <path d="M39 67V54h13" />
          <path d="M50 46c5-10 14-10 19 0-5 7-14 7-19 0Z" />
        </>
      );
    case "soil-cover":
      return (
        <>
          <path d="M24 58h64" />
          <path d="M30 50c8-7 18-7 26 0 8-7 18-7 26 0" />
          <path d="M39 42c7-12 16-12 23 0" />
          <path d="M57 42c7-12 16-12 23 0" />
        </>
      );
    case "crop-check":
      return (
        <>
          <path d="M56 70V38" />
          <path d="M56 47c-18-1-25-9-27-23 18 1 25 9 27 23Z" />
          <path d="M56 55c18-1 25-9 27-23-18 1-25 9-27 23Z" />
          <path d="m70 70 13-13" />
          <circle cx="62" cy="48" r="24" />
        </>
      );
    case "spray-check":
      return (
        <>
          <path d="M32 68h29" />
          <path d="M42 68V39h16v29" />
          <path d="M45 39V28h10v11" />
          <path d="M58 43h16" />
          <path d="M74 43c4 0 7 3 7 7" />
          <path d="M81 29v1" />
          <path d="M88 38v1" />
          <path d="M84 56v1" />
        </>
      );
    case "rain-drainage":
      return (
        <>
          <path d="M32 38c4-12 23-15 31-3 9-2 18 4 18 14H30c-9 0-12-10-5-16" />
          <path d="M36 62c14 7 27 7 40 0" />
          <path d="M43 55v8" />
          <path d="M57 55v8" />
          <path d="M71 55v8" />
        </>
      );
    case "harvest-sorting":
      return (
        <>
          <path d="M28 44h56l-6 28H34l-6-28Z" />
          <path d="M39 44c2-12 12-18 18-6" />
          <path d="M58 44c4-13 16-13 21 0" />
          <circle cx="45" cy="58" r="4" />
          <circle cx="58" cy="60" r="4" />
          <circle cx="70" cy="56" r="4" />
        </>
      );
    case "storage":
      return (
        <>
          <path d="M34 70h44l-4-43H38l-4 43Z" />
          <path d="M40 36h32" />
          <path d="M43 48h26" />
          <path d="M43 60h26" />
          <path d="M50 27c3-7 9-7 12 0" />
        </>
      );
    case "farmmate":
      return (
        <>
          <rect x="35" y="24" width="42" height="56" rx="10" />
          <path d="M45 62h22" />
          <path d="M47 38h18" />
          <path d="M47 49h25" />
          <circle cx="56" cy="71" r="2" />
          <path d="M78 32c9 4 12 12 8 20" />
        </>
      );
    case "video":
      return (
        <>
          <rect x="26" y="30" width="60" height="40" rx="8" />
          <path d="m51 42 18 8-18 8V42Z" />
          <path d="M37 78h38" />
        </>
      );
    case "compost":
    default:
      return (
        <>
          <path d="M28 64c8-20 20-28 36-18 10-6 22-2 30 18" />
          <path d="M44 47c2-11 12-18 23-17-1 12-9 19-23 17Z" />
          <path d="M55 53c11-2 20 2 26 12" />
          <path d="M36 64h52" />
        </>
      );
  }
}

export function LearnIllustration({ type, size = "card", className = "" }: LearnIllustrationProps) {
  const isMini = size === "mini";

  return (
    <div
      aria-hidden="true"
      className={`overflow-hidden rounded-md border border-leaf-900/10 bg-[#ECF2D1] ${
        isMini ? "grid h-12 w-12 shrink-0 place-items-center" : "p-3 shadow-sm"
      } ${className}`}
    >
      <svg
        viewBox="0 0 112 96"
        fill="none"
        className={isMini ? "h-10 w-10" : "h-full min-h-28 w-full"}
        stroke="#143A1F"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M14 78c16-4 68-4 84 0" stroke="#4C6B36" strokeWidth="3" />
        <circle cx="88" cy="21" r="7" fill="#D6A84A" stroke="none" />
        <IllustrationMark type={type} />
      </svg>
    </div>
  );
}
