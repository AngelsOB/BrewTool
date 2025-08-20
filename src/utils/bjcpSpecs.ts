import { getBjcpCategories } from "./bjcp";

export type RangeTuple = [number, number];

export type BjcpStyleSpec = {
  abv?: RangeTuple; // %
  og?: RangeTuple; // specific gravity
  fg?: RangeTuple; // specific gravity
  ibu?: RangeTuple; // bitterness units
  srm?: RangeTuple; // SRM color
  ebc?: RangeTuple; // if provided, otherwise derived from SRM (ebc ≈ srm * 1.97)
};

// Seed specs. Source: BJCP 2021 Beer Style Guidelines PDF.
const SEEDED_SPECS: Record<string, BjcpStyleSpec> = {
  // 1. Standard American Beer
  "1A": {
    abv: [2.8, 4.2],
    og: [1.028, 1.04],
    fg: [0.998, 1.008],
    ibu: [8, 12],
    srm: [2, 3],
  }, // American Light Lager
  "1B": {
    abv: [4.2, 5.3],
    og: [1.04, 1.05],
    fg: [1.004, 1.01],
    ibu: [8, 18],
    srm: [2, 3.5],
  }, // American Lager
  "1C": {
    abv: [4.2, 5.6],
    og: [1.042, 1.055],
    fg: [1.006, 1.012],
    ibu: [8, 20],
    srm: [2, 5],
  }, // Cream Ale
  "1D": {
    abv: [4.0, 5.5],
    og: [1.04, 1.055],
    fg: [1.008, 1.013],
    ibu: [15, 30],
    srm: [3, 6],
  }, // American Wheat Beer

  // 2. International Lager
  "2A": {
    abv: [4.5, 6.0],
    og: [1.042, 1.05],
    fg: [1.008, 1.012],
    ibu: [18, 25],
    srm: [2, 6],
  }, // International Pale Lager
  "2B": {
    abv: [4.5, 6.0],
    og: [1.042, 1.055],
    fg: [1.008, 1.014],
    ibu: [8, 25],
    srm: [6, 14],
  }, // International Amber Lager
  "2C": {
    abv: [4.2, 6.0],
    og: [1.044, 1.056],
    fg: [1.008, 1.012],
    ibu: [8, 20],
    srm: [14, 30],
  }, // International Dark Lager

  // 3. Czech Lager
  "3A": {
    abv: [3.0, 4.1],
    og: [1.028, 1.044],
    fg: [1.008, 1.014],
    ibu: [20, 35],
    srm: [3, 6],
  }, // Czech Pale Lager
  "3B": {
    abv: [4.2, 5.8],
    og: [1.044, 1.06],
    fg: [1.013, 1.017],
    ibu: [30, 45],
    srm: [3.5, 6],
  }, // Czech Premium Pale Lager
  "3C": {
    abv: [4.4, 5.8],
    og: [1.044, 1.06],
    fg: [1.013, 1.017],
    ibu: [20, 35],
    srm: [10, 16],
  }, // Czech Amber Lager
  "3D": {
    abv: [4.4, 5.8],
    og: [1.044, 1.06],
    fg: [1.013, 1.017],
    ibu: [18, 34],
    srm: [17, 35],
  }, // Czech Dark Lager

  // 4. Pale Malty European Lager
  "4A": {
    abv: [4.7, 5.4],
    og: [1.044, 1.048],
    fg: [1.006, 1.012],
    ibu: [16, 22],
    srm: [3, 5],
  }, // Munich Helles
  "4B": {
    abv: [5.8, 6.3],
    og: [1.054, 1.057],
    fg: [1.01, 1.012],
    ibu: [18, 25],
    srm: [4, 6],
  }, // Festbier
  "4C": {
    abv: [6.3, 7.4],
    og: [1.064, 1.072],
    fg: [1.011, 1.018],
    ibu: [23, 35],
    srm: [6, 9],
  }, // Helles Bock

  // 5. Pale Bitter European Beer
  "5A": {
    abv: [2.4, 3.6],
    og: [1.026, 1.034],
    fg: [1.006, 1.01],
    ibu: [15, 28],
    srm: [1.5, 4],
  }, // German Leichtbier
  "5B": {
    abv: [4.4, 5.2],
    og: [1.044, 1.05],
    fg: [1.007, 1.011],
    ibu: [18, 30],
    srm: [3.5, 5],
  }, // Kölsch
  "5C": {
    abv: [5.0, 6.0],
    og: [1.05, 1.058],
    fg: [1.008, 1.015],
    ibu: [20, 30],
    srm: [4, 6],
  }, // German Helles Exportbier
  "5D": {
    abv: [4.4, 5.2],
    og: [1.044, 1.05],
    fg: [1.008, 1.013],
    ibu: [22, 40],
    srm: [2, 4],
  }, // German Pils

  // 6. Amber Malty European Lager
  "6A": {
    abv: [5.6, 6.3],
    og: [1.054, 1.06],
    fg: [1.01, 1.014],
    ibu: [18, 24],
    srm: [8, 17],
  }, // Märzen
  "6B": {
    abv: [4.8, 6.0],
    og: [1.05, 1.057],
    fg: [1.012, 1.016],
    ibu: [20, 30],
    srm: [12, 22],
  }, // Rauchbier
  "6C": {
    abv: [6.3, 7.2],
    og: [1.064, 1.072],
    fg: [1.013, 1.019],
    ibu: [20, 27],
    srm: [14, 22],
  }, // Dunkles Bock

  // 7. Amber Bitter European Beer
  "7A": {
    abv: [4.7, 5.5],
    og: [1.048, 1.055],
    fg: [1.01, 1.014],
    ibu: [18, 30],
    srm: [9, 15],
  }, // Vienna Lager
  "7B": {
    abv: [4.3, 5.5],
    og: [1.044, 1.052],
    fg: [1.008, 1.014],
    ibu: [25, 50],
    srm: [9, 17],
  }, // Altbier

  // 8. Dark European Lager
  "8A": {
    abv: [4.5, 5.6],
    og: [1.048, 1.056],
    fg: [1.01, 1.016],
    ibu: [18, 28],
    srm: [17, 28],
  }, // Munich Dunkel
  "8B": {
    abv: [4.4, 5.4],
    og: [1.046, 1.052],
    fg: [1.01, 1.016],
    ibu: [20, 35],
    srm: [19, 30],
  }, // Schwarzbier

  // 9. Strong European Beer
  "9A": {
    abv: [7.0, 10.0],
    og: [1.072, 1.112],
    fg: [1.016, 1.024],
    ibu: [16, 26],
    srm: [6, 25],
  }, // Doppelbock
  "9B": {
    abv: [9.0, 14.0],
    og: [1.078, 1.12],
    fg: [1.02, 1.035],
    ibu: [25, 35],
    srm: [17, 30],
  }, // Eisbock
  "9C": {
    abv: [6.5, 9.5],
    og: [1.06, 1.09],
    fg: [1.016, 1.024],
    ibu: [20, 40],
    srm: [17, 30],
  }, // Baltic Porter

  // 10. German Wheat Beer
  "10A": {
    abv: [4.3, 5.6],
    og: [1.044, 1.053],
    fg: [1.008, 1.014],
    ibu: [8, 15],
    srm: [2, 6],
  }, // Weissbier
  "10B": {
    abv: [4.3, 5.6],
    og: [1.044, 1.057],
    fg: [1.008, 1.014],
    ibu: [10, 18],
    srm: [14, 23],
  }, // Dunkles Weissbier
  "10C": {
    abv: [6.5, 9.0],
    og: [1.064, 1.09],
    fg: [1.015, 1.022],
    ibu: [15, 30],
    srm: [6, 25],
  }, // Weizenbock

  // 11. British Bitter
  "11A": {
    abv: [3.2, 3.8],
    og: [1.03, 1.039],
    fg: [1.007, 1.011],
    ibu: [25, 35],
    srm: [8, 14],
  }, // Ordinary Bitter
  "11B": {
    abv: [3.8, 4.6],
    og: [1.04, 1.048],
    fg: [1.008, 1.012],
    ibu: [25, 40],
    srm: [8, 16],
  }, // Best Bitter
  "11C": {
    abv: [4.6, 6.2],
    og: [1.048, 1.06],
    fg: [1.01, 1.016],
    ibu: [30, 50],
    srm: [8, 18],
  }, // Strong Bitter

  // 12. Pale Commonwealth Beer
  "12A": {
    abv: [3.8, 5.0],
    og: [1.038, 1.053],
    fg: [1.006, 1.012],
    ibu: [20, 45],
    srm: [2, 5],
  }, // British Golden Ale
  "12B": {
    abv: [4.5, 6.0],
    og: [1.038, 1.05],
    fg: [1.004, 1.006],
    ibu: [20, 35],
    srm: [4, 7],
  }, // Australian Sparkling Ale
  "12C": {
    abv: [5.0, 7.5],
    og: [1.05, 1.07],
    fg: [1.01, 1.015],
    ibu: [40, 60],
    srm: [6, 14],
  }, // English IPA

  // 13. Brown British Beer
  "13A": {
    abv: [3.0, 3.8],
    og: [1.03, 1.038],
    fg: [1.008, 1.013],
    ibu: [10, 25],
    srm: [14, 25],
  }, // Dark Mild
  "13B": {
    abv: [4.2, 5.9],
    og: [1.04, 1.052],
    fg: [1.008, 1.013],
    ibu: [20, 30],
    srm: [12, 22],
  }, // British Brown Ale
  "13C": {
    abv: [4.0, 5.4],
    og: [1.04, 1.052],
    fg: [1.008, 1.014],
    ibu: [18, 35],
    srm: [20, 30],
  }, // English Porter

  // 14. Scottish Ale
  "14A": {
    abv: [2.5, 3.3],
    og: [1.03, 1.035],
    fg: [1.01, 1.013],
    ibu: [10, 20],
    srm: [17, 25],
  }, // Scottish Light
  "14B": {
    abv: [3.3, 3.9],
    og: [1.035, 1.04],
    fg: [1.01, 1.015],
    ibu: [10, 20],
    srm: [12, 20],
  }, // Scottish Heavy
  "14C": {
    abv: [3.9, 6.0],
    og: [1.04, 1.06],
    fg: [1.01, 1.016],
    ibu: [15, 30],
    srm: [12, 20],
  }, // Scottish Export

  // 15. Irish Beer
  "15A": {
    abv: [3.8, 5.0],
    og: [1.036, 1.046],
    fg: [1.01, 1.014],
    ibu: [18, 28],
    srm: [9, 14],
  }, // Irish Red Ale
  "15B": {
    abv: [3.8, 5.0],
    og: [1.036, 1.044],
    fg: [1.007, 1.011],
    ibu: [25, 45],
    srm: [25, 40],
  }, // Irish Stout
  "15C": {
    abv: [5.0, 6.5],
    og: [1.052, 1.062],
    fg: [1.01, 1.014],
    ibu: [35, 50],
    srm: [30, 40],
  }, // Irish Extra Stout

  // 16. Dark British Beer
  "16A": {
    abv: [4.0, 6.0],
    og: [1.044, 1.06],
    fg: [1.012, 1.024],
    ibu: [20, 40],
    srm: [30, 40],
  }, // Sweet Stout
  "16B": {
    abv: [4.2, 5.9],
    og: [1.045, 1.065],
    fg: [1.01, 1.018],
    ibu: [25, 40],
    srm: [22, 40],
  }, // Oatmeal Stout
  "16C": {
    abv: [5.5, 8.0],
    og: [1.056, 1.075],
    fg: [1.01, 1.018],
    ibu: [30, 50],
    srm: [30, 40],
  }, // Tropical Stout
  "16D": {
    abv: [6.3, 8.0],
    og: [1.056, 1.075],
    fg: [1.01, 1.018],
    ibu: [50, 70],
    srm: [30, 40],
  }, // Foreign Extra Stout

  // 17. Strong British Ale
  "17A": {
    abv: [5.5, 8.0],
    og: [1.055, 1.08],
    fg: [1.015, 1.022],
    ibu: [30, 60],
    srm: [8, 22],
  }, // British Strong Ale
  "17B": {
    abv: [5.5, 9.0],
    og: [1.055, 1.088],
    fg: [1.015, 1.022],
    ibu: [30, 60],
    srm: [10, 22],
  }, // Old Ale
  "17C": {
    abv: [6.5, 10.0],
    og: [1.07, 1.13],
    fg: [1.018, 1.04],
    ibu: [17, 35],
    srm: [14, 25],
  }, // Wee Heavy
  "17D": {
    abv: [8.0, 12.0],
    og: [1.08, 1.12],
    fg: [1.018, 1.03],
    ibu: [35, 70],
    srm: [8, 22],
  }, // English Barley Wine

  // 18. Pale American Ale
  "18A": {
    abv: [3.8, 5.5],
    og: [1.038, 1.054],
    fg: [1.008, 1.013],
    ibu: [15, 28],
    srm: [3, 6],
  }, // Blonde Ale
  "18B": {
    abv: [4.5, 6.2],
    og: [1.045, 1.06],
    fg: [1.01, 1.015],
    ibu: [30, 50],
    srm: [5, 10],
  }, // American Pale Ale

  // 19. Amber and Brown American Beer
  "19A": {
    abv: [4.5, 6.2],
    og: [1.045, 1.06],
    fg: [1.01, 1.015],
    ibu: [25, 40],
    srm: [10, 17],
  }, // American Amber Ale
  "19B": {
    abv: [4.5, 5.5],
    og: [1.048, 1.054],
    fg: [1.011, 1.014],
    ibu: [30, 45],
    srm: [9, 14],
  }, // California Common
  "19C": {
    abv: [4.3, 6.2],
    og: [1.045, 1.06],
    fg: [1.01, 1.016],
    ibu: [20, 30],
    srm: [18, 35],
  }, // American Brown Ale

  // 20. American Porter and Stout
  "20A": {
    abv: [4.8, 6.5],
    og: [1.05, 1.07],
    fg: [1.012, 1.018],
    ibu: [25, 50],
    srm: [22, 40],
  }, // American Porter
  "20B": {
    abv: [5.0, 7.0],
    og: [1.05, 1.075],
    fg: [1.01, 1.022],
    ibu: [35, 75],
    srm: [30, 40],
  }, // American Stout
  "20C": {
    abv: [8.0, 12.0],
    og: [1.075, 1.115],
    fg: [1.018, 1.03],
    ibu: [50, 90],
    srm: [30, 40],
  }, // Imperial Stout

  // 21. IPA
  "21A": {
    abv: [5.5, 7.5],
    og: [1.056, 1.07],
    fg: [1.008, 1.014],
    ibu: [40, 70],
    srm: [6, 14],
  }, // American IPA
  "21B": {
    // Specialty IPA - variable stats per specific substyle
    abv: [5.0, 7.5], // Standard strength range
    og: [1.05, 1.085],
    fg: [1.008, 1.018],
    ibu: [20, 100],
    srm: [4, 40],
  }, // Specialty IPA

  // Individual Specialty IPA substyles
  "21B-Belgian IPA": {
    abv: [6.2, 9.5],
    og: [1.058, 1.08],
    fg: [1.008, 1.016],
    ibu: [50, 100],
    srm: [5, 8],
  }, // Belgian IPA
  "21B-Black IPA": {
    abv: [5.5, 9.0],
    og: [1.05, 1.085],
    fg: [1.01, 1.018],
    ibu: [50, 90],
    srm: [25, 40],
  }, // Black IPA
  "21B-Brown IPA": {
    abv: [5.5, 7.5],
    og: [1.056, 1.07],
    fg: [1.008, 1.016],
    ibu: [40, 70],
    srm: [18, 35],
  }, // Brown IPA
  "21B-Red IPA": {
    abv: [5.5, 7.5],
    og: [1.056, 1.07],
    fg: [1.008, 1.016],
    ibu: [40, 70],
    srm: [11, 17],
  }, // Red IPA
  "21B-Rye IPA": {
    abv: [5.5, 8.0],
    og: [1.056, 1.075],
    fg: [1.008, 1.014],
    ibu: [50, 75],
    srm: [6, 14],
  }, // Rye IPA
  "21B-White IPA": {
    abv: [5.5, 7.0],
    og: [1.056, 1.065],
    fg: [1.01, 1.016],
    ibu: [40, 70],
    srm: [5, 6],
  }, // White IPA
  "21B-Brut IPA": {
    abv: [6.0, 7.5],
    og: [1.046, 1.057],
    fg: [0.99, 1.004],
    ibu: [20, 30],
    srm: [2, 4],
  }, // Brut IPA

  "21C": {
    abv: [6.0, 9.0],
    og: [1.06, 1.085],
    fg: [1.01, 1.015],
    ibu: [25, 60],
    srm: [3, 7],
  }, // Hazy IPA

  // 22. Strong American Ale
  "22A": {
    abv: [7.5, 10.0],
    og: [1.065, 1.085],
    fg: [1.008, 1.018],
    ibu: [60, 100],
    srm: [6, 14],
  }, // Double IPA
  "22B": {
    abv: [6.3, 10.0],
    og: [1.062, 1.09],
    fg: [1.014, 1.024],
    ibu: [50, 100],
    srm: [7, 18],
  }, // American Strong Ale
  "22C": {
    abv: [8.0, 12.0],
    og: [1.08, 1.12],
    fg: [1.016, 1.03],
    ibu: [50, 100],
    srm: [9, 18],
  }, // American Barleywine
  "22D": {
    abv: [8.0, 12.0],
    og: [1.08, 1.12],
    fg: [1.016, 1.03],
    ibu: [30, 60],
    srm: [6, 14],
  }, // Wheatwine

  // 23. European Sour Ale
  "23A": {
    abv: [2.8, 3.8],
    og: [1.028, 1.032],
    fg: [1.003, 1.006],
    ibu: [3, 8],
    srm: [2, 3],
  }, // Berliner Weisse
  "23B": {
    abv: [4.6, 6.5],
    og: [1.048, 1.057],
    fg: [1.002, 1.012],
    ibu: [10, 25],
    srm: [10, 17],
  }, // Flanders Red Ale
  "23C": {
    abv: [4.0, 8.0],
    og: [1.04, 1.074],
    fg: [1.008, 1.012],
    ibu: [20, 25],
    srm: [17, 22],
  }, // Oud Bruin
  "23D": {
    abv: [5.0, 6.5],
    og: [1.04, 1.054],
    fg: [1.001, 1.01],
    ibu: [0, 10],
    srm: [3, 6],
  }, // Lambic
  "23E": {
    abv: [5.0, 8.0],
    og: [1.04, 1.054],
    fg: [1.0, 1.006],
    ibu: [0, 10],
    srm: [5, 6],
  }, // Gueuze
  "23F": {
    abv: [5.0, 7.0],
    og: [1.04, 1.06],
    fg: [1.0, 1.01],
    ibu: [0, 10],
    srm: [3, 7],
  }, // Fruit Lambic
  "23G": {
    abv: [4.2, 4.8],
    og: [1.036, 1.056],
    fg: [1.006, 1.01],
    ibu: [5, 12],
    srm: [3, 4],
  }, // Gose

  // 24. Belgian Ale
  "24A": {
    abv: [4.5, 5.5],
    og: [1.044, 1.052],
    fg: [1.008, 1.012],
    ibu: [8, 20],
    srm: [2, 4],
  }, // Witbier
  "24B": {
    abv: [4.8, 5.5],
    og: [1.048, 1.054],
    fg: [1.01, 1.014],
    ibu: [20, 30],
    srm: [8, 14],
  }, // Belgian Pale Ale
  "24C": {
    abv: [6.0, 8.5],
    og: [1.06, 1.08],
    fg: [1.008, 1.016],
    ibu: [18, 28],
    srm: [6, 19],
  }, // Bière de Garde

  // 25. Strong Belgian Ale
  "25A": {
    abv: [6.0, 7.5],
    og: [1.062, 1.075],
    fg: [1.008, 1.018],
    ibu: [15, 30],
    srm: [4, 6],
  }, // Belgian Blond Ale
  "25B": {
    abv: [5.0, 7.0], // Standard strength
    og: [1.048, 1.065], // Standard
    fg: [1.002, 1.008], // Standard
    ibu: [20, 35],
    srm: [5, 14], // Pale
  }, // Saison (Standard Pale version)
  "25C": {
    abv: [7.5, 10.5],
    og: [1.07, 1.095],
    fg: [1.005, 1.016],
    ibu: [22, 35],
    srm: [3, 6],
  }, // Belgian Golden Strong Ale

  // 26. Monastic Ale
  "26A": {
    abv: [4.8, 6.0],
    og: [1.044, 1.054],
    fg: [1.004, 1.01],
    ibu: [25, 45],
    srm: [3, 5],
  }, // Belgian Single
  "26B": {
    abv: [6.0, 7.6],
    og: [1.062, 1.075],
    fg: [1.008, 1.018],
    ibu: [15, 25],
    srm: [10, 17],
  }, // Belgian Dubbel
  "26C": {
    abv: [7.5, 9.5],
    og: [1.075, 1.085],
    fg: [1.008, 1.014],
    ibu: [20, 40],
    srm: [4.5, 7],
  }, // Belgian Tripel
  "26D": {
    abv: [8.0, 12.0],
    og: [1.075, 1.11],
    fg: [1.01, 1.024],
    ibu: [20, 35],
    srm: [12, 22],
  }, // Belgian Dark Strong Ale

  // 27. Historical Beer - Individual styles
  "27": {
    // Variable by specific historical style
    abv: [2.4, 12.0],
    og: [1.026, 1.12],
    fg: [1.004, 1.038],
    ibu: [0, 40],
    srm: [1.5, 35],
  }, // Historical Beer (general)

  // Individual Historical Beer styles
  "27-Kellerbier": {
    // Same as base style (Pils, Helles, Märzen, or Dunkel)
    abv: [4.4, 6.3],
    og: [1.044, 1.06],
    fg: [1.006, 1.016],
    ibu: [16, 40],
    srm: [2, 28],
  }, // Kellerbier
  "27-Kentucky Common": {
    abv: [4.0, 5.5],
    og: [1.044, 1.055],
    fg: [1.01, 1.018],
    ibu: [15, 30],
    srm: [11, 20],
  }, // Kentucky Common
  "27-Lichtenhainer": {
    abv: [3.5, 4.7],
    og: [1.032, 1.04],
    fg: [1.004, 1.008],
    ibu: [5, 12],
    srm: [3, 6],
  }, // Lichtenhainer
  "27-London Brown Ale": {
    abv: [2.8, 3.6],
    og: [1.033, 1.038],
    fg: [1.012, 1.015],
    ibu: [15, 20],
    srm: [22, 35],
  }, // London Brown Ale
  "27-Piwo Grodziskie": {
    abv: [2.5, 3.3],
    og: [1.028, 1.032],
    fg: [1.006, 1.012],
    ibu: [20, 35],
    srm: [3, 6],
  }, // Piwo Grodziskie
  "27-Pre-Prohibition Lager": {
    abv: [4.5, 6.0],
    og: [1.044, 1.06],
    fg: [1.01, 1.015],
    ibu: [25, 40],
    srm: [3, 6],
  }, // Pre-Prohibition Lager
  "27-Pre-Prohibition Porter": {
    abv: [4.5, 6.0],
    og: [1.046, 1.06],
    fg: [1.01, 1.016],
    ibu: [20, 30],
    srm: [20, 30],
  }, // Pre-Prohibition Porter
  "27-Roggenbier": {
    abv: [4.5, 6.0],
    og: [1.046, 1.056],
    fg: [1.01, 1.014],
    ibu: [10, 20],
    srm: [14, 19],
  }, // Roggenbier
  "27-Sahti": {
    abv: [7.0, 11.0],
    og: [1.076, 1.12],
    fg: [1.016, 1.038],
    ibu: [0, 15],
    srm: [4, 22],
  }, // Sahti

  // 28. American Wild Ale
  "28A": {
    // Variable by base style
    abv: [3.0, 12.0],
    og: [1.03, 1.12],
    fg: [1.0, 1.03],
    ibu: [0, 100],
    srm: [2, 40],
  }, // Brett Beer
  "28B": {
    // Variable by base style
    abv: [3.0, 12.0],
    og: [1.03, 1.12],
    fg: [1.0, 1.03],
    ibu: [0, 100],
    srm: [2, 40],
  }, // Mixed-Fermentation Sour Beer
  "28C": {
    // Variable by base style
    abv: [3.0, 12.0],
    og: [1.03, 1.12],
    fg: [1.0, 1.03],
    ibu: [0, 100],
    srm: [2, 40],
  }, // Wild Specialty Beer
  "28D": {
    abv: [4.5, 7.0],
    og: [1.048, 1.065],
    fg: [1.006, 1.013],
    ibu: [3, 8],
    srm: [2, 3],
  }, // Straight Sour Beer
  "28-Catharina Sour": {
    abv: [4.0, 5.5],
    og: [1.039, 1.048],
    fg: [1.004, 1.012],
    ibu: [2, 8],
    srm: [2, 6],
  }, // Catharina Sour

  // 29. Fruit Beer
  "29A": {
    // Variable by base style
    abv: [2.5, 12.0],
    og: [1.03, 1.12],
    fg: [1.0, 1.03],
    ibu: [0, 100],
    srm: [2, 40],
  }, // Fruit Beer
  "29B": {
    // Variable by base style
    abv: [2.5, 12.0],
    og: [1.03, 1.12],
    fg: [1.0, 1.03],
    ibu: [0, 100],
    srm: [2, 40],
  }, // Fruit and Spice Beer
  "29C": {
    // Variable by base style
    abv: [2.5, 12.0],
    og: [1.03, 1.12],
    fg: [1.0, 1.03],
    ibu: [0, 100],
    srm: [2, 40],
  }, // Specialty Fruit Beer
  "29D": {
    abv: [6.0, 8.5],
    og: [1.059, 1.075],
    fg: [1.004, 1.013],
    ibu: [10, 30],
    srm: [4, 8],
  }, // Grape Ale

  // 30. Spiced Beer
  "30A": {
    // Variable by base style
    abv: [2.5, 12.0],
    og: [1.03, 1.12],
    fg: [1.0, 1.03],
    ibu: [0, 100],
    srm: [2, 40],
  }, // Spice, Herb, or Vegetable Beer
  "30B": {
    // Variable by base style, typically above 5% ABV and amber-copper
    abv: [5.0, 9.0],
    og: [1.05, 1.09],
    fg: [1.008, 1.024],
    ibu: [5, 50],
    srm: [8, 22],
  }, // Autumn Seasonal Beer
  "30C": {
    // Variable by base style, typically above 6% ABV and darker
    abv: [6.0, 10.0],
    og: [1.06, 1.1],
    fg: [1.01, 1.03],
    ibu: [5, 50],
    srm: [10, 30],
  }, // Winter Seasonal Beer
  "30D": {
    // Variable by base style
    abv: [2.5, 12.0],
    og: [1.03, 1.12],
    fg: [1.0, 1.03],
    ibu: [0, 100],
    srm: [2, 40],
  }, // Specialty Spice Beer

  // 31. Alternative Fermentables Beer
  "31A": {
    // Variable by base style
    abv: [2.5, 12.0],
    og: [1.03, 1.12],
    fg: [1.0, 1.03],
    ibu: [0, 100],
    srm: [2, 40],
  }, // Alternative Grain Beer
  "31B": {
    // Variable by base style
    abv: [2.5, 12.0],
    og: [1.03, 1.12],
    fg: [1.0, 1.03],
    ibu: [0, 100],
    srm: [2, 40],
  }, // Alternative Sugar Beer

  // 32. Smoked Beer
  "32A": {
    // Variable by base style
    abv: [2.5, 12.0],
    og: [1.03, 1.12],
    fg: [1.0, 1.03],
    ibu: [0, 100],
    srm: [2, 40],
  }, // Classic Style Smoked Beer
  "32B": {
    // Variable by base style
    abv: [2.5, 12.0],
    og: [1.03, 1.12],
    fg: [1.0, 1.03],
    ibu: [0, 100],
    srm: [2, 40],
  }, // Specialty Smoked Beer

  // 33. Wood Beer
  "33A": {
    // Variable by base style, typically above-average
    abv: [5.0, 12.0],
    og: [1.05, 1.12],
    fg: [1.008, 1.03],
    ibu: [5, 100],
    srm: [3, 40],
  }, // Wood-Aged Beer
  "33B": {
    // Variable by base style, typically above-average
    abv: [5.0, 12.0],
    og: [1.05, 1.12],
    fg: [1.008, 1.03],
    ibu: [5, 100],
    srm: [3, 40],
  }, // Specialty Wood-Aged Beer

  // 34. Specialty Beer
  "34A": {
    // Variable by declared beer
    abv: [2.5, 12.0],
    og: [1.03, 1.12],
    fg: [1.0, 1.03],
    ibu: [0, 100],
    srm: [2, 40],
  }, // Commercial Specialty Beer
  "34B": {
    // Variable by base styles
    abv: [2.5, 12.0],
    og: [1.03, 1.12],
    fg: [1.0, 1.03],
    ibu: [0, 100],
    srm: [2, 40],
  }, // Mixed-Style Beer
  "34C": {
    // Variable - experimental
    abv: [2.5, 12.0],
    og: [1.03, 1.12],
    fg: [1.0, 1.03],
    ibu: [0, 100],
    srm: [2, 40],
  }, // Experimental Beer

  // Local Styles (Appendix B)
  X1: {
    abv: [4.3, 5.5],
    og: [1.042, 1.054],
    fg: [1.009, 1.013],
    ibu: [15, 22],
    srm: [3, 5],
  }, // Dorada Pampeana
  X2: {
    abv: [5.0, 6.5],
    og: [1.055, 1.065],
    fg: [1.008, 1.015],
    ibu: [35, 60],
    srm: [6, 15],
  }, // IPA Argenta
  X3: {
    abv: [4.5, 12.0],
    og: [1.045, 1.1],
    fg: [1.005, 1.015],
    ibu: [6, 30],
    srm: [4, 25],
  }, // Italian Grape Ale
  X4: {
    abv: [4.0, 5.5],
    og: [1.039, 1.048],
    fg: [1.004, 1.012],
    ibu: [2, 8],
    srm: [2, 6],
  }, // Catharina Sour
  X5: {
    abv: [4.5, 5.8],
    og: [1.044, 1.056],
    fg: [1.009, 1.014],
    ibu: [25, 45],
    srm: [2, 6],
  }, // New Zealand Pilsner
};

// Build a full spec map with defaults for every style present in bjcp.ts
const ALL_CODES: string[] = getBjcpCategories().flatMap((c) =>
  c.styles.map((s) => s.code)
);
const DEFAULT_EMPTY: BjcpStyleSpec = {};
const SPEC_MAP: Record<string, BjcpStyleSpec> = {};
for (const code of ALL_CODES) {
  SPEC_MAP[code] = SEEDED_SPECS[code] ?? DEFAULT_EMPTY;
}

function hasAnyRange(spec: BjcpStyleSpec | undefined): boolean {
  if (!spec) return false;
  return Boolean(
    spec.abv || spec.og || spec.fg || spec.ibu || spec.srm || spec.ebc
  );
}

export function getBjcpStyleSpec(code?: string): BjcpStyleSpec | undefined {
  if (!code) return undefined;
  const s = SPEC_MAP[code];
  return hasAnyRange(s) ? s : undefined;
}

export function srmToEbc(srm: number): number {
  // Common approximation
  return Math.max(0, Math.round(srm * 1.97 * 10) / 10);
}
