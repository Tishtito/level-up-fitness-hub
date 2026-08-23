import heroStudio from "@/assets/home/hero-studio.webp";
import programMobility from "@/assets/home/program-mobility.webp";
import programStrength from "@/assets/home/program-strength.webp";
import type { ApiProgram } from "@/lib/api";
import { apiAssetUrl } from "@/lib/env";

/**
 * Static labels for the three original categories, kept as a fallback for the first render
 * and offline use. Admin-created categories resolve through useProgramCategories().
 */
export const programCategoryLabels: Record<string, string> = {
  body_transformation: "Body transformation",
  lose_weight: "Lose weight",
  gain_weight_muscle_building: "Gain weight / muscle building",
};

/** Neutral default for categories with no dedicated art — a plain studio shot, no modality. */
const PROGRAM_IMAGE_FALLBACK = heroStudio;

// Per-category art for the three original categories. Admin-created categories fall through
// to PROGRAM_IMAGE_FALLBACK rather than rendering a broken <img>.
export const programFallbackImages: Record<string, string> = {
  body_transformation: heroStudio,
  lose_weight: programStrength,
  gain_weight_muscle_building: programMobility,
};

/** Thumbnail URL for any program-shaped object — plan summaries included. */
export function programImage(program: Pick<ApiProgram, "thumbnail" | "category">) {
  return apiAssetUrl(program.thumbnail) || programFallbackImages[program.category] || PROGRAM_IMAGE_FALLBACK;
}

/** "endurance_cardio" -> "Endurance cardio". Used before the public categories query resolves. */
export function humanizeProgramCategory(slug: string) {
  const spaced = slug.replace(/_/g, " ").trim();
  return spaced ? spaced.charAt(0).toUpperCase() + spaced.slice(1) : slug;
}

/**
 * Human-friendly trainer label. The catalog API exposes `trainer` as a profile ref
 * (e.g. "trn_…", "seed-trainer-profile") rather than a display name, so ref-like
 * values are hidden behind the coaching team fallback.
 */
export function programTrainerName(program: Pick<ApiProgram, "trainer">) {
  const trainer = program.trainer;
  if (!trainer || /^(trn|usr|seed)[_-]/.test(trainer)) return "Level Up coaching team";
  return trainer;
}
