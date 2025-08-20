export type BjcpStyle = {
  code: string; // e.g., "21A", "12C", "27-Kellerbier", "21B-Belgian IPA", "X5"
  name: string; // e.g., "American IPA"
};

export type BjcpCategory = {
  code: string; // e.g., "21"
  name: string; // e.g., "IPA"
  styles: BjcpStyle[];
};

// 2021 BJCP Beer Style Guidelines (condensed list; names verbatim)
// Source: https://www.bjcp.org/wp-content/uploads/2025/02/2021_Guidelines_Beer_1.25.pdf
export const BJCP_CATEGORIES: BjcpCategory[] = [
  {
    code: "1",
    name: "Standard American Beer",
    styles: [
      { code: "1A", name: "American Light Lager" },
      { code: "1B", name: "American Lager" },
      { code: "1C", name: "Cream Ale" },
      { code: "1D", name: "American Wheat Beer" },
    ],
  },
  {
    code: "2",
    name: "International Lager",
    styles: [
      { code: "2A", name: "International Pale Lager" },
      { code: "2B", name: "International Amber Lager" },
      { code: "2C", name: "International Dark Lager" },
    ],
  },
  {
    code: "3",
    name: "Czech Lager",
    styles: [
      { code: "3A", name: "Czech Pale Lager" },
      { code: "3B", name: "Czech Premium Pale Lager" },
      { code: "3C", name: "Czech Amber Lager" },
      { code: "3D", name: "Czech Dark Lager" },
    ],
  },
  {
    code: "4",
    name: "Pale Malty European Lager",
    styles: [
      { code: "4A", name: "Munich Helles" },
      { code: "4B", name: "Festbier" },
      { code: "4C", name: "Helles Bock" },
    ],
  },
  {
    code: "5",
    name: "Pale Bitter European Beer",
    styles: [
      { code: "5A", name: "German Leichtbier" },
      { code: "5B", name: "Kölsch" },
      { code: "5C", name: "German Helles Exportbier" },
      { code: "5D", name: "German Pils" },
    ],
  },
  {
    code: "6",
    name: "Amber Malty European Lager",
    styles: [
      { code: "6A", name: "Märzen" },
      { code: "6B", name: "Rauchbier" },
      { code: "6C", name: "Dunkles Bock" },
    ],
  },
  {
    code: "7",
    name: "Amber Bitter European Beer",
    styles: [
      { code: "7A", name: "Vienna Lager" },
      { code: "7B", name: "Altbier" },
    ],
  },
  {
    code: "8",
    name: "Dark European Lager",
    styles: [
      { code: "8A", name: "Munich Dunkel" },
      { code: "8B", name: "Schwarzbier" },
    ],
  },
  {
    code: "9",
    name: "Strong European Beer",
    styles: [
      { code: "9A", name: "Doppelbock" },
      { code: "9B", name: "Eisbock" },
      { code: "9C", name: "Baltic Porter" },
    ],
  },
  {
    code: "10",
    name: "German Wheat Beer",
    styles: [
      { code: "10A", name: "Weissbier" },
      { code: "10B", name: "Dunkles Weissbier" },
      { code: "10C", name: "Weizenbock" },
    ],
  },
  {
    code: "11",
    name: "British Bitter",
    styles: [
      { code: "11A", name: "Ordinary Bitter" },
      { code: "11B", name: "Best Bitter" },
      { code: "11C", name: "Strong Bitter" },
    ],
  },
  {
    code: "12",
    name: "Pale Commonwealth Beer",
    styles: [
      { code: "12A", name: "British Golden Ale" },
      { code: "12B", name: "Australian Sparkling Ale" },
      { code: "12C", name: "English IPA" },
    ],
  },
  {
    code: "13",
    name: "Brown British Beer",
    styles: [
      { code: "13A", name: "Dark Mild" },
      { code: "13B", name: "British Brown Ale" },
      { code: "13C", name: "English Porter" },
    ],
  },
  {
    code: "14",
    name: "Scottish Ale",
    styles: [
      { code: "14A", name: "Scottish Light" },
      { code: "14B", name: "Scottish Heavy" },
      { code: "14C", name: "Scottish Export" },
    ],
  },
  {
    code: "15",
    name: "Irish Beer",
    styles: [
      { code: "15A", name: "Irish Red Ale" },
      { code: "15B", name: "Irish Stout" },
      { code: "15C", name: "Irish Extra Stout" },
    ],
  },
  {
    code: "16",
    name: "Dark British Beer",
    styles: [
      { code: "16A", name: "Sweet Stout" },
      { code: "16B", name: "Oatmeal Stout" },
      { code: "16C", name: "Tropical Stout" },
      { code: "16D", name: "Foreign Extra Stout" },
    ],
  },
  {
    code: "17",
    name: "Strong British Ale",
    styles: [
      { code: "17A", name: "British Strong Ale" },
      { code: "17B", name: "Old Ale" },
      { code: "17C", name: "Wee Heavy" },
      { code: "17D", name: "English Barley Wine" },
    ],
  },
  {
    code: "18",
    name: "Pale American Ale",
    styles: [
      { code: "18A", name: "Blonde Ale" },
      { code: "18B", name: "American Pale Ale" },
    ],
  },
  {
    code: "19",
    name: "Amber and Brown American Beer",
    styles: [
      { code: "19A", name: "American Amber Ale" },
      { code: "19B", name: "California Common" },
      { code: "19C", name: "American Brown Ale" },
    ],
  },
  {
    code: "20",
    name: "American Porter and Stout",
    styles: [
      { code: "20A", name: "American Porter" },
      { code: "20B", name: "American Stout" },
      { code: "20C", name: "Imperial Stout" },
    ],
  },
  {
    code: "21",
    name: "IPA",
    styles: [
      { code: "21A", name: "American IPA" },
      { code: "21B", name: "Specialty IPA" },
      // Enumerate Specialty IPA substyles for convenience
      { code: "21B-Belgian IPA", name: "Specialty IPA: Belgian IPA" },
      { code: "21B-Black IPA", name: "Specialty IPA: Black IPA" },
      { code: "21B-Brown IPA", name: "Specialty IPA: Brown IPA" },
      { code: "21B-Red IPA", name: "Specialty IPA: Red IPA" },
      { code: "21B-Rye IPA", name: "Specialty IPA: Rye IPA" },
      { code: "21B-White IPA", name: "Specialty IPA: White IPA" },
      { code: "21B-Brut IPA", name: "Specialty IPA: Brut IPA" },
      { code: "21C", name: "Hazy IPA" },
    ],
  },
  {
    code: "22",
    name: "Strong American Ale",
    styles: [
      { code: "22A", name: "Double IPA" },
      { code: "22B", name: "American Strong Ale" },
      { code: "22C", name: "American Barleywine" },
      { code: "22D", name: "Wheatwine" },
    ],
  },
  {
    code: "23",
    name: "European Sour Ale",
    styles: [
      { code: "23A", name: "Berliner Weisse" },
      { code: "23B", name: "Flanders Red Ale" },
      { code: "23C", name: "Oud Bruin" },
      { code: "23D", name: "Lambic" },
      { code: "23E", name: "Gueuze" },
      { code: "23F", name: "Fruit Lambic" },
      { code: "23G", name: "Gose" },
    ],
  },
  {
    code: "24",
    name: "Belgian Ale",
    styles: [
      { code: "24A", name: "Witbier" },
      { code: "24B", name: "Belgian Pale Ale" },
      { code: "24C", name: "Bière de Garde" },
    ],
  },
  {
    code: "25",
    name: "Strong Belgian Ale",
    styles: [
      { code: "25A", name: "Belgian Blond Ale" },
      { code: "25B", name: "Saison" },
      { code: "25C", name: "Belgian Golden Strong Ale" },
    ],
  },
  {
    code: "26",
    name: "Monastic Ale",
    styles: [
      { code: "26A", name: "Belgian Single" },
      { code: "26B", name: "Belgian Dubbel" },
      { code: "26C", name: "Belgian Tripel" },
      { code: "26D", name: "Belgian Dark Strong Ale" },
    ],
  },
  {
    code: "27",
    name: "Historical Beer",
    styles: [
      { code: "27-Kellerbier", name: "Kellerbier" },
      { code: "27-Kentucky Common", name: "Kentucky Common" },
      { code: "27-Lichtenhainer", name: "Lichtenhainer" },
      { code: "27-London Brown Ale", name: "London Brown Ale" },
      { code: "27-Piwo Grodziskie", name: "Piwo Grodziskie" },
      { code: "27-Pre-Prohibition Lager", name: "Pre-Prohibition Lager" },
      { code: "27-Pre-Prohibition Porter", name: "Pre-Prohibition Porter" },
      { code: "27-Roggenbier", name: "Roggenbier" },
      { code: "27-Sahti", name: "Sahti" },
    ],
  },
  {
    code: "28",
    name: "American Wild Ale",
    styles: [
      { code: "28A", name: "Brett Beer" },
      { code: "28B", name: "Mixed-Fermentation Sour Beer" },
      { code: "28C", name: "Wild Specialty Beer" },
      { code: "28D", name: "Straight Sour Beer" },
      // Common modern entry
      { code: "28-Catharina Sour", name: "Catharina Sour" },
    ],
  },
  {
    code: "29",
    name: "Fruit Beer",
    styles: [
      { code: "29A", name: "Fruit Beer" },
      { code: "29B", name: "Fruit and Spice Beer" },
      { code: "29C", name: "Specialty Fruit Beer" },
      { code: "29D", name: "Grape Ale" },
    ],
  },
  {
    code: "30",
    name: "Spice, Herb, or Vegetable Beer",
    styles: [
      { code: "30A", name: "Spice, Herb, or Vegetable Beer" },
      { code: "30B", name: "Autumn Seasonal Beer" },
      { code: "30C", name: "Winter Seasonal Beer" },
      { code: "30D", name: "Specialty Spice Beer" },
    ],
  },
  {
    code: "31",
    name: "Alternative Fermentables Beer",
    styles: [
      { code: "31A", name: "Alternative Grain Beer" },
      { code: "31B", name: "Alternative Sugar Beer" },
    ],
  },
  {
    code: "32",
    name: "Smoked Beer",
    styles: [
      { code: "32A", name: "Classic Style Smoked Beer" },
      { code: "32B", name: "Specialty Smoked Beer" },
    ],
  },
  {
    code: "33",
    name: "Wood Beer",
    styles: [
      { code: "33A", name: "Wood-Aged Beer" },
      { code: "33B", name: "Specialty Wood-Aged Beer" },
    ],
  },
  {
    code: "34",
    name: "Specialty Beer",
    styles: [
      { code: "34A", name: "Commercial Specialty Beer" },
      { code: "34B", name: "Mixed-Style Beer" },
    ],
  },
  // Provisional / Appendix styles referenced in 2021 doc
  {
    code: "X",
    name: "Provisional / Appendix",
    styles: [{ code: "X5", name: "New Zealand Pilsner" }],
  },
];

export function flatBjcpStyles(): {
  code: string;
  name: string;
  categoryCode: string;
  categoryName: string;
}[] {
  const list: {
    code: string;
    name: string;
    categoryCode: string;
    categoryName: string;
  }[] = [];
  for (const cat of BJCP_CATEGORIES) {
    for (const s of cat.styles) {
      list.push({
        code: s.code,
        name: s.name,
        categoryCode: cat.code,
        categoryName: cat.name,
      });
    }
  }
  return list;
}

export function getBjcpCategories(): BjcpCategory[] {
  return BJCP_CATEGORIES;
}

export function findBjcpStyleByCode(
  code: string
):
  | { code: string; name: string; categoryCode: string; categoryName: string }
  | undefined {
  if (!code) return undefined;
  for (const cat of BJCP_CATEGORIES) {
    const s = cat.styles.find((x) => x.code === code);
    if (s)
      return {
        code: s.code,
        name: s.name,
        categoryCode: cat.code,
        categoryName: cat.name,
      };
  }
  return undefined;
}
