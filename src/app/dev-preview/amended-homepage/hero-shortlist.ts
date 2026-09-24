import "server-only";
import candidates from "./hero-candidates.json";
export function getHeroShortlist() {
 if(process.env.VERCEL_ENV === "production") throw new Error("Hero comparison unavailable in Production");
 return candidates;
}
