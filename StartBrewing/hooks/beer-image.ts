import { ImageSourcePropType } from "react-native";

// Let op: paden exact zoals je mapstructuur
const clearImages: ImageSourcePropType[] = [
  require("@/assets/images/clear ipa/clear_1.webp"),
  require("@/assets/images/clear ipa/clear_2.webp"),
  require("@/assets/images/clear ipa/clear_3.webp"),
  require("@/assets/images/clear ipa/clear_4.webp"),
  require("@/assets/images/clear ipa/clear_5.webp"),
  require("@/assets/images/clear ipa/clear_6.webp"),
];

const lightHazeImages: ImageSourcePropType[] = [
  require("@/assets/images/light haze ipa/light_haze_1.webp"),
  require("@/assets/images/light haze ipa/light_haze_2.webp"),
  require("@/assets/images/light haze ipa/light_haze_3.webp"),
  require("@/assets/images/light haze ipa/light_haze_4.webp"),
  require("@/assets/images/light haze ipa/light_haze_5.webp"),
  require("@/assets/images/light haze ipa/light_haze_6.webp"),
];

const hazyImages: ImageSourcePropType[] = [
  require("@/assets/images/hazy ipa/hazy_1.webp"),
  require("@/assets/images/hazy ipa/hazy_2.webp"),
  require("@/assets/images/hazy ipa/hazy_3.webp"),
  require("@/assets/images/hazy ipa/hazy_4.webp"),
  require("@/assets/images/hazy ipa/hazy_5.webp"),
  require("@/assets/images/hazy ipa/hazy_6.webp"),
];

const defaultImage: ImageSourcePropType = require("@/assets/images/default-beer.png"); // Oude default image

/**
 * Map SRM naar index 0–5 (1–6 in jouw naming, licht → donker).
 * Pas thresholds aan als je andere grenzen wil.
 */
function srmToIndex(srm: number | null | undefined): number {
  if (srm == null || Number.isNaN(srm)) return 2; // midden als fallback

  if (srm <= 4) return 0;          // heel licht
  if (srm <= 6) return 1;
  if (srm <= 9) return 2;
  if (srm <= 13) return 3;
  if (srm <= 20) return 4;
  return 5;                        // heel donker
}

/**
 * hazeLevel:
 * 1 = clear ipa
 * 2 = light haze ipa
 * 3 = hazy ipa
 */
export function getBeerImageSource(
  hazeLevel: number | null | undefined,
  srm: number | null | undefined
): ImageSourcePropType {
  const index = srmToIndex(srm);

  let imageSet: ImageSourcePropType[];

  switch (hazeLevel) {
    case 3:
      imageSet = hazyImages;
      break;
    case 2:
      imageSet = lightHazeImages;
      break;
    case 1:
    default:
      imageSet = clearImages;
      break;
  }
 
  if (!imageSet[index]) return defaultImage; //normaal niet nodig. 
  return imageSet[index];
  
}
