import heroStudio from "@/assets/home/hero-studio.webp";
import programMobility from "@/assets/home/program-mobility.webp";
import programStrength from "@/assets/home/program-strength.webp";
import type { ApiProgram } from "@/lib/api";
import { apiAssetUrl } from "@/lib/env";

export const programCategoryLabels: Record<ApiProgram["category"], string> = {
  body_transformation: "Body transformation",
  lose_weight: "Lose weight",
  gain_weight_muscle_building: "Gain weight / muscle building",
};

export const programFallbackImages: Record<ApiProgram["category"], string> = {
  body_transformation: heroStudio,
  lose_weight: programStrength,
  gain_weight_muscle_building: programMobility,
};

/** Thumbnail URL for any program-shaped object — plan summaries included. */
export function programImage(program: Pick<ApiProgram, "thumbnail" | "category">) {
  return apiAssetUrl(program.thumbnail) || programFallbackImages[program.category];
}
