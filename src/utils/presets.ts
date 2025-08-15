export type GrainPreset = {
  name: string;
  colorLovibond: number;
};

export type HopPreset = {
  name: string;
  alphaAcidPercent: number;
};

export const GRAIN_PRESETS: GrainPreset[] = [
  { name: "Pilsner Malt", colorLovibond: 1.5 },
  { name: "Pale Malt (2-Row)", colorLovibond: 2 },
  { name: "Maris Otter", colorLovibond: 3 },
  { name: "Vienna Malt", colorLovibond: 4 },
  { name: "Munich Malt", colorLovibond: 10 },
  { name: "Wheat Malt", colorLovibond: 2 },
  { name: "Crystal 20L", colorLovibond: 20 },
  { name: "Crystal 40L", colorLovibond: 40 },
  { name: "Crystal 60L", colorLovibond: 60 },
  { name: "Chocolate Malt", colorLovibond: 350 },
  { name: "Roasted Barley", colorLovibond: 500 },
];

export const HOP_PRESETS: HopPreset[] = [
  { name: "Cascade", alphaAcidPercent: 5.5 },
  { name: "Centennial", alphaAcidPercent: 10 },
  { name: "Citra", alphaAcidPercent: 12.5 },
  { name: "Mosaic", alphaAcidPercent: 12 },
  { name: "Simcoe", alphaAcidPercent: 13 },
  { name: "Amarillo", alphaAcidPercent: 9 },
  { name: "Saaz", alphaAcidPercent: 3.5 },
  { name: "Hallertau Mittelfrüh", alphaAcidPercent: 4 },
  { name: "East Kent Goldings", alphaAcidPercent: 5 },
  { name: "Fuggle", alphaAcidPercent: 4.5 },
];
