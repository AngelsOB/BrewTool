import type { Recipe, RecipeCalculations } from "../../domain/models/Recipe";
import { recipeCalculationService } from "../../domain/services/RecipeCalculationService";
import { beerXmlExportService } from "../../domain/services/BeerXmlExportService";

const litersToGallons = (l: number | undefined): number | undefined =>
  l == null ? undefined : l * 0.2641720524;

const kgToLb = (kg: number | undefined): number | undefined =>
  kg == null ? undefined : kg * 2.2046226218;

const gToOz = (g: number | undefined): number | undefined =>
  g == null ? undefined : g * 0.03527396195;

const cToF = (c: number | undefined): number | undefined =>
  c == null ? undefined : (c * 9) / 5 + 32;

const formatNumber = (n: number | undefined, digits = 2): string => {
  if (n == null || Number.isNaN(n)) return "-";
  return Number(n).toFixed(digits);
};

export const sanitizeFileName = (raw: string): string => {
  const base = (raw || "Untitled").trim().replace(/[\n\r]+/g, " ");
  const sanitized = base.replace(/[^a-zA-Z0-9-_ .]/g, "").replace(/\s+/g, " ");
  return (sanitized || "Untitled").slice(0, 120);
};

export const downloadTextFile = (
  filename: string,
  content: string,
  mime = "text/markdown;charset=utf-8"
) => {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const generateBeerXml = (recipe: Recipe): string =>
  beerXmlExportService.generate(recipe);

export const generateRecipeMarkdown = (
  recipe: Recipe,
  calculations?: RecipeCalculations | null
): string => {
  const calc = calculations ?? recipeCalculationService.calculate(recipe);
  const lines: string[] = [];

  const batchGal = litersToGallons(recipe.batchVolumeL);

  // Header
  lines.push(`# ${recipe.name || "Untitled Recipe"}`);
  lines.push("");
  lines.push(`_Style: ${recipe.style ?? "—"}_`);
  lines.push("");

  // Vital Stats
  lines.push("## Vital Statistics");
  lines.push("");
  lines.push(
    `- Batch Size: ${formatNumber(recipe.batchVolumeL, 1)} L${
      batchGal != null ? ` (${formatNumber(batchGal, 1)} gal)` : ""
    }`
  );
  lines.push(
    `- Brewhouse Efficiency: ${formatNumber(
      recipe.equipment.mashEfficiencyPercent,
      0
    )} %`
  );
  lines.push(
    `- Boil Time: ${formatNumber(recipe.equipment.boilTimeMin, 0)} min`
  );
  lines.push(`- OG: ${formatNumber(calc.og, 3)}`);
  lines.push(`- FG: ${formatNumber(calc.fg, 3)}`);
  lines.push(`- ABV: ${formatNumber(calc.abv, 1)} %`);
  lines.push(`- IBU: ${formatNumber(calc.ibu, 0)}`);
  lines.push(`- SRM: ${formatNumber(calc.srm, 1)}`);
  lines.push("");

  // Ingredients
  lines.push("## Ingredients");
  lines.push("");

  // Malts
  lines.push("### Fermentables");
  if (recipe.fermentables.length === 0) {
    lines.push("- None");
  } else {
    recipe.fermentables.forEach((f) => {
      const lb = kgToLb(f.weightKg);
      lines.push(
        `- ${formatNumber(f.weightKg, 2)} kg${
          lb != null ? ` (${formatNumber(lb, 2)} lb)` : ""
        } ${f.name} — ${formatNumber(f.colorLovibond, 0)}L, ${formatNumber(
          f.ppg,
          0
        )} ppg`
      );
    });
  }
  lines.push("");

  // Hops
  lines.push("### Hops");
  if (recipe.hops.length === 0) {
    lines.push("- None");
  } else {
    recipe.hops.forEach((h) => {
      const oz = gToOz(h.grams);
      const timeLabel =
        h.type === "boil"
          ? `${formatNumber(h.timeMinutes, 0)} min`
          : h.type === "first wort"
          ? "First wort"
          : h.type === "whirlpool"
          ? `Whirlpool${
              h.whirlpoolTimeMinutes
                ? ` ${formatNumber(h.whirlpoolTimeMinutes, 0)} min`
                : ""
            }${
              h.temperatureC != null
                ? ` @ ${formatNumber(
                    cToF(h.temperatureC),
                    0
                  )}°F (${formatNumber(h.temperatureC, 0)}°C)`
                : ""
            }`
          : h.type === "dry hop"
          ? `Dry hop${
              h.dryHopStartDay != null
                ? ` day ${formatNumber(h.dryHopStartDay, 0)}`
                : ""
            }${
              h.dryHopDays != null
                ? ` for ${formatNumber(h.dryHopDays, 0)} days`
                : ""
            }`
          : "Mash";
      lines.push(
        `- ${timeLabel}: ${formatNumber(h.grams, 0)} g${
          oz != null ? ` (${formatNumber(oz, 2)} oz)` : ""
        } ${h.name} @ ${formatNumber(h.alphaAcid, 1)}% AA`
      );
    });
  }
  lines.push("");

  // Yeast
  lines.push("### Yeast");
  if (!recipe.yeast) {
    lines.push("- None");
  } else {
    lines.push(
      `- ${recipe.yeast.name} (${formatNumber(
        recipe.yeast.attenuation * 100,
        0
      )}% attenuation${
        recipe.yeast.laboratory ? `, ${recipe.yeast.laboratory}` : ""
      })`
    );
    if (recipe.yeast.starter && recipe.yeast.starter.steps.length > 0) {
      lines.push("  - Starter Steps:");
      recipe.yeast.starter.steps.forEach((s, idx) => {
        lines.push(
          `    ${idx + 1}. ${formatNumber(s.liters, 2)} L @ ${formatNumber(
            s.gravity,
            3
          )} (${
            s.model.kind === "white"
              ? `White/${s.model.aeration}`
              : "Braukaiser"
          })`
        );
      });
    }
  }
  lines.push("");

  // Other Ingredients
  lines.push("### Other Ingredients");
  if (!recipe.otherIngredients || recipe.otherIngredients.length === 0) {
    lines.push("- None");
  } else {
    recipe.otherIngredients.forEach((i) => {
      lines.push(
        `- ${i.name} — ${formatNumber(i.amount, 1)} ${i.unit} @ ${i.timing}${
          i.notes ? ` (${i.notes})` : ""
        }`
      );
    });
  }
  lines.push("");

  // Mash
  lines.push("## Mash Schedule");
  if (recipe.mashSteps.length === 0) {
    lines.push("- None");
  } else {
    recipe.mashSteps.forEach((s, idx) => {
      lines.push(
        `${idx + 1}. ${s.name || s.type} — ${formatNumber(
          s.temperatureC,
          0
        )}°C (${formatNumber(cToF(s.temperatureC), 0)}°F) for ${formatNumber(
          s.durationMinutes,
          0
        )} min`
      );
    });
  }
  lines.push("");

  // Fermentation
  lines.push("## Fermentation Schedule");
  if (recipe.fermentationSteps.length === 0) {
    lines.push("- None");
  } else {
    recipe.fermentationSteps.forEach((s, idx) => {
      lines.push(
        `${idx + 1}. ${s.name || s.type} — ${formatNumber(
          s.temperatureC,
          0
        )}°C (${formatNumber(cToF(s.temperatureC), 0)}°F) for ${formatNumber(
          s.durationDays,
          0
        )} days${s.notes ? ` — ${s.notes}` : ""}`
      );
    });
  }
  lines.push("");

  // Water
  lines.push("## Water & Losses");
  lines.push(
    `- Mash Thickness: ${formatNumber(
      recipe.equipment.mashThicknessLPerKg,
      2
    )} L/kg`
  );
  lines.push(
    `- Grain Absorption: ${formatNumber(
      recipe.equipment.grainAbsorptionLPerKg,
      2
    )} L/kg`
  );
  lines.push(
    `- Hop Absorption: ${formatNumber(
      recipe.equipment.hopsAbsorptionLPerKg,
      2
    )} L/kg`
  );
  lines.push(
    `- Kettle Loss: ${formatNumber(recipe.equipment.kettleLossLiters, 2)} L`
  );
  lines.push(
    `- Chiller Loss: ${formatNumber(recipe.equipment.chillerLossLiters, 2)} L`
  );
  lines.push(
    `- Fermenter Loss: ${formatNumber(
      recipe.equipment.fermenterLossLiters,
      2
    )} L`
  );
  lines.push(
    `- Cooling Shrinkage: ${formatNumber(
      recipe.equipment.coolingShrinkagePercent,
      1
    )} %`
  );
  if (recipe.waterChemistry) {
    const w = recipe.waterChemistry;
    lines.push("");
    lines.push("### Water Chemistry");
    lines.push(
      `- Source Profile: Ca ${formatNumber(
        w.sourceProfile.Ca,
        0
      )} / Mg ${formatNumber(w.sourceProfile.Mg, 0)} / Na ${formatNumber(
        w.sourceProfile.Na,
        0
      )} / Cl ${formatNumber(w.sourceProfile.Cl, 0)} / SO₄ ${formatNumber(
        w.sourceProfile.SO4,
        0
      )} / HCO₃ ${formatNumber(w.sourceProfile.HCO3, 0)}`
    );
    lines.push(
      `- Salts (g): Gypsum ${formatNumber(
        w.saltAdditions.gypsum_g,
        2
      )}, CaCl₂ ${formatNumber(
        w.saltAdditions.cacl2_g,
        2
      )}, Epsom ${formatNumber(
        w.saltAdditions.epsom_g,
        2
      )}, NaCl ${formatNumber(
        w.saltAdditions.nacl_g,
        2
      )}, Baking Soda ${formatNumber(w.saltAdditions.nahco3_g, 2)}`
    );
    if (w.sourceProfileName || w.targetStyleName) {
      lines.push(
        `- Profiles: Source ${w.sourceProfileName ?? "—"} | Target ${
          w.targetStyleName ?? "—"
        }`
      );
    }
  }
  lines.push("");

  lines.push(`_Exported: ${new Date().toISOString()}_`);

  return lines.join("\n");
};
