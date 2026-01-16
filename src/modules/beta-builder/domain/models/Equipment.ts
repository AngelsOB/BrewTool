/**
 * Equipment Profile Domain Model
 *
 * Represents brewing equipment configurations that affect recipe calculations.
 * Equipment profiles can be saved and reused across multiple recipes.
 */

export type EquipmentProfile = {
  name: string;
  description?: string;

  // Volume settings
  batchSizeL: number;              // Target final volume in fermenter
  boilTimeMin: number;              // Length of boil in minutes
  boilOffRateL_hr: number;          // Evaporation rate during boil (L/hr)

  // Deadspace/Loss settings
  mashTunDeadspaceL: number;        // Volume lost to mash tun deadspace
  kettleDeadspaceL: number;         // Volume lost to kettle/trunnion
  fermenterLossL: number;           // Volume lost in fermenter (trub, etc.)

  // Absorption settings
  grainAbsorptionL_kg: number;      // Water absorbed by grain (typically ~1.0 L/kg)
  hopAbsorptionL_g: number;         // Water absorbed by hops (typically ~0.005 L/g)

  // Efficiency settings
  mashEfficiency: number;           // Mash efficiency % (0-100)
  brewhouseEfficiency: number;      // Overall brewhouse efficiency % (0-100)

  // Metadata
  isCustom?: boolean;               // Whether this is a user-created profile
};

/**
 * Default equipment profile values
 */
export const DEFAULT_EQUIPMENT: EquipmentProfile = {
  name: "Default 5 Gallon Setup",
  description: "Standard 5 gallon homebrewing equipment",
  batchSizeL: 18.9,                 // ~5 gallons
  boilTimeMin: 60,
  boilOffRateL_hr: 3.8,             // ~1 gallon/hr
  mashTunDeadspaceL: 0.95,          // ~1 quart
  kettleDeadspaceL: 0.95,           // ~1 quart
  fermenterLossL: 0.95,             // ~1 quart
  grainAbsorptionL_kg: 1.0,         // Industry standard
  hopAbsorptionL_g: 0.005,          // ~0.15 L/oz
  mashEfficiency: 75,
  brewhouseEfficiency: 72,
  isCustom: false,
};

/**
 * Common equipment profile presets
 */
export const EQUIPMENT_PRESETS: EquipmentProfile[] = [
  {
    name: "BIAB 5 Gallon",
    description: "Brew-in-a-bag setup for 5 gallon batches",
    batchSizeL: 18.9,
    boilTimeMin: 60,
    boilOffRateL_hr: 3.8,
    mashTunDeadspaceL: 0,             // No separate mash tun
    kettleDeadspaceL: 0.95,
    fermenterLossL: 0.95,
    grainAbsorptionL_kg: 0.5,         // Less absorption with bag squeeze
    hopAbsorptionL_g: 0.005,
    mashEfficiency: 78,
    brewhouseEfficiency: 75,
    isCustom: false,
  },
  {
    name: "3-Vessel 5 Gallon",
    description: "Traditional 3-vessel system (HLT/Mash/Kettle) for 5 gallon batches",
    batchSizeL: 18.9,
    boilTimeMin: 60,
    boilOffRateL_hr: 3.8,
    mashTunDeadspaceL: 1.9,
    kettleDeadspaceL: 1.9,
    fermenterLossL: 0.95,
    grainAbsorptionL_kg: 1.0,
    hopAbsorptionL_g: 0.005,
    mashEfficiency: 75,
    brewhouseEfficiency: 72,
    isCustom: false,
  },
  {
    name: "Grainfather G30",
    description: "Grainfather G30 all-in-one system",
    batchSizeL: 23,                   // 6 gallon batches
    boilTimeMin: 60,
    boilOffRateL_hr: 4.5,
    mashTunDeadspaceL: 3.5,
    kettleDeadspaceL: 3.5,
    fermenterLossL: 0.95,
    grainAbsorptionL_kg: 0.96,
    hopAbsorptionL_g: 0.005,
    mashEfficiency: 75,
    brewhouseEfficiency: 72,
    isCustom: false,
  },
  {
    name: "3-Vessel 10 Gallon",
    description: "Traditional 3-vessel system for 10 gallon batches",
    batchSizeL: 37.9,                 // ~10 gallons
    boilTimeMin: 90,
    boilOffRateL_hr: 5.7,             // ~1.5 gallon/hr
    mashTunDeadspaceL: 1.9,
    kettleDeadspaceL: 1.9,
    fermenterLossL: 1.9,
    grainAbsorptionL_kg: 1.0,
    hopAbsorptionL_g: 0.005,
    mashEfficiency: 75,
    brewhouseEfficiency: 72,
    isCustom: false,
  },
  {
    name: "Anvil Foundry 10.5 Gallon",
    description: "Anvil Foundry all-in-one electric system",
    batchSizeL: 37.9,
    boilTimeMin: 60,
    boilOffRateL_hr: 5.7,
    mashTunDeadspaceL: 2.8,
    kettleDeadspaceL: 2.8,
    fermenterLossL: 1.9,
    grainAbsorptionL_kg: 0.96,
    hopAbsorptionL_g: 0.005,
    mashEfficiency: 75,
    brewhouseEfficiency: 72,
    isCustom: false,
  },
];
