import React from "react";
import { render, fireEvent, act, waitFor } from "@testing-library/react-native";
import { NavigationContainer } from "@react-navigation/native";
import SpecificRecipe from "../app/(tabs)/SpecificRecipe";
import { useRouter, useLocalSearchParams } from "expo-router";

jest.mock("@/hooks/use-fonts", () => ({ useFonts: () => true }));
jest.mock("@/hooks/beer-image", () => ({
  getBeerImageSource: () => ({ uri: "test-beer-image" }),
}));

// ⬇️ NIEUW: mock de user progress context, zodat useUserProgressContext geen error gooit
jest.mock("@/context/UserProgressContext", () => ({
  useUserProgressContext: () => ({
    progress: null,
    loading: false,
    levelUp: null,
    acknowledgeLevelUp: jest.fn(),
    refreshProgress: jest.fn(),
  }),
}));

jest.mock("@/context/ClickCounterContext", () => ({
  useClickCounter: () => ({
    clickCount: 0,
    increment: jest.fn(),
    get: jest.fn(() => 0),
    reset: jest.fn(),
  }),
}));

// Mock AppRefresh context zodat useAppRefresh niet crasht
jest.mock("@/context/AppRefreshContext", () => ({
  useAppRefresh: () => ({
    triggerRefresh: jest.fn(),
  }),
}));

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
  useLocalSearchParams: () => ({ recipe_slug: recipeSlug, slug: recipeSlug }),
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
    ACCENT_PRIMARY: "#FF6600",
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
    TextInput: ({ value, onChangeText, ...rest }: any) => {
      const { TextInput: RNTextInput } = require("react-native");
      return (
        <RNTextInput value={value} onChangeText={onChangeText} {...rest} />
      );
    },
    Button: ({ onPress, children }: any) => (
      <TouchableOpacity onPress={onPress}>
        <Text>{children}</Text>
      </TouchableOpacity>
    ),
  };
});

// lucide Star
jest.mock("lucide-react-native", () => {
  const { Text } = require("react-native");
  const make =
    (name: string) =>
    ({ size, color, fill, stroke }: any) => <Text>{`${name}`}</Text>;
  return {
    Star: make("Star"),
    Heart: make("Heart"),
    HeartPlus: make("HeartPlus"),
  };
});

// beer-image
jest.mock("@/hooks/beer-image", () => ({
  getBeerImageSource: () => ({ uri: "test-beer-image" }),
}));

jest.mock("@/supabase", () => ({
  supabase: {
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: "user-1" } },
        error: null,
      }),
      // Geen actieve sessie -> user moet ingelogd zijn voor review
      getSession: jest.fn().mockResolvedValue({
        data: { session: null },
        error: null,
      }),
    },

    from: jest.fn((table) => {
      switch (table) {
        case "recipes":
          return {
            select: () => ({
              eq: () => ({
                single: async () => ({
                  data: recipeData,
                  error: null,
                }),
              }),
            }),
          };

        case "recipe_reviews":
          return {
            select: () => ({
              // select("rating").eq("recipe_slug", ...) -> we gebruiken hier alleen de data niet
              eq: () => ({
                maybeSingle: async () => ({
                  data: null,
                  error: null,
                }),
                order: () => ({
                  limit: async () => ({ data: [], error: null }),
                }),
              }),
              order: () => ({
                limit: async () => ({ data: [], error: null }),
              }),
              limit: async () => ({ data: [], error: null }),
            }),
          };

        case "phases":
          return {
            select: () => ({
              eq: () => ({
                order: async () => ({
                  data: [{ phase_id: "phase-1" }, { phase_id: "phase-2" }],
                  error: null,
                }),
              }),
            }),
          };

        case "steps":
          const steps = [
            { step_id: "step-1", after_step_id: null, phase_id: "phase-1" },
            { step_id: "step-2", after_step_id: "step-1", phase_id: "phase-1" },
            { step_id: "step-3", after_step_id: null, phase_id: "phase-2" },
          ];

          return {
            select: () => ({
              eq: () => ({
                is: () => ({
                  limit: () => ({
                    single: async () => ({
                      data: { step_id: "step-1" },
                      error: null,
                    }),
                  }),
                }),
              }),

              in: async () => ({
                data: steps,
                error: null,
              }),
            }),
          };

        case "brews":
          return {
            insert: () => ({
              select: async () => ({
                data: [{ id_brew: 123 }],
                error: null,
              }),
            }),
          };

        case "brew_steps":
          return {
            insert: async () => ({ data: null, error: null }),
          };

        case "profiles":
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: { username: "testuser" },
                  error: null,
                }),
              }),
            }),
          };

        case "recipe_kits":
          // return empty list for starter kits by default so tests don't fail
          return {
            select: () => ({
              eq: async () => ({ data: [], error: null }),
            }),
          };

        default:
          return { select: () => ({}) };
      }
    }),

    rpc: jest.fn(async (fn, args) => {
      if (fn === "get_recipe_ingredients" && args._recipe_slug === recipeSlug) {
        return {
          data: ingredientRows.map(mapIngredient),
          error: null,
        };
      }
      return { data: [], error: null };
    }),
  },
}));

// FavoritesContext mock
jest.mock("@/context/FavoritesContext", () => ({
  useFavorites: () => ({
    favoriteSlugs: [],
    toggleFavorite: jest.fn(),
  }),
}));

/* ------------------------------
   HELPER
------------------------------- */

const renderWithNavigation = async (ui: React.ReactElement) => {
  const utils = render(<NavigationContainer>{ui}</NavigationContainer>);
  await act(async () => {});
  return utils;
};

/* ------------------------------
   TESTS
------------------------------- */

describe("<SpecificRecipe />", () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  it("renders the title of the recipe", async () => {
    const { findByText } = await renderWithNavigation(<SpecificRecipe />);
    expect(await findByText("Den Ballaste Point Sculpin IPA 60")).toBeTruthy();
  });

  it("show startbrewing button", async () => {
    const { findByText } = await renderWithNavigation(<SpecificRecipe />);
    expect(await findByText("Start Brewing")).toBeTruthy();
  });

  it("opens batch size modal first and then the starterkit modal", async () => {
    const { findByText, queryByText } = await renderWithNavigation(
      <SpecificRecipe />
    );

    // Initieel geen modals
    expect(queryByText("Choose batch size")).toBeNull();
    expect(queryByText("Get your StarterKit now!")).toBeNull();

    // Start Brewing -> batch size modal
    const startBtn = await findByText("Start Brewing");
    fireEvent.press(startBtn);

    const batchTitle = await findByText("Choose batch size");
    expect(batchTitle).toBeTruthy();

    // Confirm -> StarterKit modal
    const confirmBtn = await findByText("Confirm");
    fireEvent.press(confirmBtn);

    const kitsTitle = await findByText("Get your StarterKit now!");
    expect(kitsTitle).toBeTruthy();
  });

  it("opens review modal and star press keeps it open when user is not logged in", async () => {
    const { findByText, findAllByTestId, queryByText } =
      await renderWithNavigation(<SpecificRecipe />);

    // Modal is initieel gesloten
    expect(queryByText("Rate this recipe")).toBeNull();

    // Open de reviewmodal
    const addReviewBtn = await findByText("Add Review");
    fireEvent.press(addReviewBtn);

    const modalTitle = await findByText("Rate this recipe");
    expect(modalTitle).toBeTruthy();

    // Klik op een ster – zonder sessie blijft de modal open
    const stars = await findAllByTestId(/star-/);
    fireEvent.press(stars[2]);

    expect(queryByText("Rate this recipe")).toBeTruthy();
  });

  it.skip("snapshot", async () => {
    const tree = (await renderWithNavigation(<SpecificRecipe />)).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
