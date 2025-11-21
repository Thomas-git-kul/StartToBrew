import React from "react";
import { render, fireEvent, act, waitFor } from "@testing-library/react-native";
import { NavigationContainer } from "@react-navigation/native";
import SpecificRecipe from "../app/SpecificRecipe";
import { useRouter, useLocalSearchParams } from "expo-router";

// --------------------------
// Mock expo-router
// --------------------------
const pushMock = jest.fn();

/* ------------------------------
   MOCK DATA (recipes + ingredients)
------------------------------- */

const recipeSlug = "americanipa-den-ballaste-point-sculpin-ipa-60";

const recipeData = {
  recipe_slug: recipeSlug,
  name: "Den Ballaste Point Sculpin IPA 60",
  style: "American IPA",
  batch_size_l: 19,
  abv_target: 7.2,
  ibu_target: 89.3,
  srm_target: 6.0,
  description:
    "Den Ballaste Point Sculpin IPA 60 is a classic American IPA voor hopliefhebbers.",
  difficulty: 1,
  rating: null, // geen rating beschikbaar (valt nu terug op 0.0 / 5)
  haze_level: 1,
};

const ingredientRows = [
  {
    recipe_slug: recipeSlug,
    ingredient_id: "ys-main",
    amount_g: 11.0,
  },
  {
    recipe_slug: recipeSlug,
    ingredient_id: "gr-pale-ale-malt",
    amount_g: 4500.0,
  },
  {
    recipe_slug: recipeSlug,
    ingredient_id: "hp-centennial",
    amount_g: 45.0,
  },
  {
    recipe_slug: recipeSlug,
    ingredient_id: "hp-amarillo",
    amount_g: 45.0,
  },
  {
    recipe_slug: recipeSlug,
    ingredient_id: "hp-simcoe",
    amount_g: 45.0,
  },
  {
    recipe_slug: recipeSlug,
    ingredient_id: "hp-columbus",
    amount_g: 45.0,
  },
  {
    recipe_slug: recipeSlug,
    ingredient_id: "gr-munich",
    amount_g: 500.0,
  },
  {
    recipe_slug: recipeSlug,
    ingredient_id: "gr-crystal-60l",
    amount_g: 250.0,
  },
];

const mapIngredient = (row: (typeof ingredientRows)[number]) => {
  const id = row.ingredient_id;
  let kind = "other";
  if (id.startsWith("gr-")) kind = "grain";
  else if (id.startsWith("hp-")) kind = "hop";
  else if (id.startsWith("ys-")) kind = "yeast";

  const niceName = id
    .replace(/^gr-/, "")
    .replace(/^hp-/, "")
    .replace(/^ys-/, "")
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  return {
    ingredient_id: id,
    ingredient_name: niceName,
    kind,
    amount_g: row.amount_g,
  };
};

/* ------------------------------
   MOCKS
------------------------------- */

// Router + params
const mockPush = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
  useLocalSearchParams: () => ({ recipe_slug: recipeSlug }),
}));

// Fonts
jest.mock("@/hooks/use-fonts", () => ({
  useFonts: () => true,
}));

// ThemedText
jest.mock("@/components/themed-text", () => {
  const { Text } = require("react-native");
  return {
    ThemedText: ({ children, ...rest }: any) => (
      <Text {...rest}>{children}</Text>
    ),
  };
});

// SafeArea
jest.mock("react-native-safe-area-context", () => {
  const { View } = require("react-native");
  return { SafeAreaView: ({ children }: any) => <View>{children}</View> };
});

// --------------------------
// Mock Colors & Fonts
// --------------------------
jest.mock("@/constants/Colors", () => ({
  BASE_COLORS: {
    LIGHT_BG: "#fafafa",
    WHITE: "#ffffff",
    TEXT_DARK: "#000000",
    ACCENT_LIGHT: "#B45309",
    STONE300: "#E5E7EB",
  },
}));

jest.mock("@/constants/Fonts", () => ({
  FontFamilies: { BODY: "System" },
}));

// --------------------------
// Mock Header
// --------------------------
jest.mock("@/components/header", () => {
  const { Text } = require("react-native");
  return ({ title }: any) => <Text>{title}</Text>;
});

// react-native-paper
jest.mock("react-native-paper", () => {
  const { View, Text, TouchableOpacity } = require("react-native");
  return {
    FAB: ({ label, onPress, children, ...rest }: any) => (
      <TouchableOpacity onPress={onPress} {...rest}>
        <Text>{label ?? children}</Text>
      </TouchableOpacity>
    ),
    Portal: ({ children }: any) => <>{children}</>,
    Modal: ({ visible, children }: any) =>
      visible ? <View>{children}</View> : null,
    Chip: ({ children }: any) => (
      <View>
        <Text>{children}</Text>
      </View>
    ),
    ActivityIndicator: () => {
      const { View } = require("react-native");
      return <View />;
    },
  };
});

// lucide Star
jest.mock("lucide-react-native", () => {
  const { Text } = require("react-native");
  return {
    Star: ({ size, color, fill }: any) => (
      <Text>{`Star(${size},${color},${fill})`}</Text>
    ),
  };
});

// beer-image
jest.mock("@/hooks/beer-image", () => ({
  getBeerImageSource: () => ({ uri: "test-beer-image" }),
}));

jest.mock("@/supabase", () => ({
  supabase: {
    auth: {
      getSession: async () => ({
        data: { session: null },
        error: null,
      }),
    },

    from: (table: string) => {
      if (table === "recipes") {
        return {
          select: () => ({
            eq: (field: string, value: string) => ({
              single: async () => {
                if (field === "recipe_slug" && value === recipeSlug) {
                  return { data: recipeData, error: null };
                }
                return { data: null, error: null };
              },
            }),
          }),
        };
      }

      return {
        select: () => ({
          eq: () => ({
            single: async () => ({ data: null, error: null }),
          }),
        }),
      };
    },

    rpc: async (fn: string, args: any) => {
      if (
        fn === "get_recipe_ingredients" &&
        args &&
        args._recipe_slug === recipeSlug
      ) {
        return {
          data: ingredientRows.map(mapIngredient),
          error: null,
        };
      }
      return { data: [], error: null };
    },
  },
}));

/* ------------------------------
   HELPER
------------------------------- */

const renderWithNavigation = (ui: React.ReactElement) =>
  render(<NavigationContainer>{ui}</NavigationContainer>);

/* ------------------------------
   TESTS
------------------------------- */

describe("<SpecificRecipe />", () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  it("rendered titel van het recept", async () => {
    const { findByText } = renderWithNavigation(<SpecificRecipe />);
    expect(await findByText("Den Ballaste Point Sculpin IPA 60")).toBeTruthy();
  });

  it("toont Start Brewing knop", async () => {
    const { findByText } = renderWithNavigation(<SpecificRecipe />);
    expect(await findByText("Start Brewing")).toBeTruthy();
  });

  it("navigates naar /progress bij Start Brewing", async () => {
    const { findByText } = renderWithNavigation(<SpecificRecipe />);
    const btn = await findByText("Start Brewing");
    fireEvent.press(btn);
    expect(mockPush).toHaveBeenCalledWith("../progress");
  });

  it("opent review modal en laat sterren klikken", async () => {
    const { findByText, findAllByTestId, queryByText } = renderWithNavigation(
      <SpecificRecipe />
    );

    // initieel geen modal
    expect(queryByText("Rate this recipe")).toBeNull();

    const addReviewBtn = await findByText("Add Review");
    fireEvent.press(addReviewBtn);

    // Wait for modal to appear
    const modalTitle = await findByText("Rate this recipe");
    expect(modalTitle).toBeTruthy();

    const stars = await findAllByTestId(/star-/);
    fireEvent.press(stars[2]);

    // Modal should still be present after clicking a star (until async closes it)
    expect(queryByText("Rate this recipe")).not.toBeNull();
  });

  it("snapshot", () => {
    const tree = renderWithNavigation(<SpecificRecipe />).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
