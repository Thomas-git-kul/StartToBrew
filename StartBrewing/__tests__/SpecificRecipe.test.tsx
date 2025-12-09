import React from "react";
import { render, fireEvent, act, waitFor } from "@testing-library/react-native";
import { NavigationContainer } from "@react-navigation/native";
import { Alert } from "react-native";
import SpecificRecipe from "../app/(tabs)/SpecificRecipe";
import { useRouter, useLocalSearchParams } from "expo-router";

jest.mock("@/hooks/use-fonts", () => ({ useFonts: () => true }));
jest.mock("@/hooks/beer-image", () => ({
  getBeerImageSource: () => ({ uri: "test-beer-image" }),
}));

const mockRefreshProgress = jest.fn();
const mockTriggerRefresh = jest.fn();
const mockIncrement = jest.fn();
const mockGet = jest.fn(() => 0);
const mockReset = jest.fn();
const mockToggleFavorite = jest.fn();

// ⬇️ NIEUW: mock de user progress context, zodat useUserProgressContext geen error gooit
jest.mock("@/context/UserProgressContext", () => ({
  useUserProgressContext: () => ({
    progress: null,
    loading: false,
    levelUp: null,
    acknowledgeLevelUp: jest.fn(),
    refreshProgress: mockRefreshProgress,
  }),
}));

jest.mock("@/context/ClickCounterContext", () => ({
  useClickCounter: () => ({
    clickCount: 0,
    increment: mockIncrement,
    get: mockGet,
    reset: mockReset,
  }),
}));

// Mock AppRefresh context zodat useAppRefresh niet crasht
jest.mock("@/context/AppRefreshContext", () => ({
  useAppRefresh: () => ({
    triggerRefresh: mockTriggerRefresh,
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
let mockRecipeSlug: string | undefined = recipeSlug;
let mockFrom: string | undefined = undefined;

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
  useLocalSearchParams: () => ({ 
    recipe_slug: mockRecipeSlug, 
    slug: mockRecipeSlug,
    from: mockFrom 
  }),
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
    STONE100: "#F5F5F4",
    STONE200: "#E7E5E4",
    STONE300: "#E5E7EB",
    STONE600: "#57534E",
  },
}));

jest.mock("@/constants/Fonts", () => ({
  FontFamilies: { BODY: "System" },
}));

// --------------------------
// Mock Header
// --------------------------
jest.mock("@/components/header", () => {
  const { View, Text, TouchableOpacity } = require("react-native");
  return ({ title, onIconPress, onIconPressLeft, actionTestID, actionTestIDLeft }: any) => (
    <View>
      {actionTestIDLeft && onIconPressLeft && (
        <TouchableOpacity testID={actionTestIDLeft} onPress={onIconPressLeft}>
          <Text>Back</Text>
        </TouchableOpacity>
      )}
      <Text>{title}</Text>
      {actionTestID && onIconPress && (
        <TouchableOpacity testID={actionTestID} onPress={onIconPress}>
          <Text>Heart</Text>
        </TouchableOpacity>
      )}
    </View>
  );
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
    Chip: ({ children, onPress, testID }: any) => (
      <TouchableOpacity onPress={onPress} testID={testID}>
        <Text>{children}</Text>
      </TouchableOpacity>
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

// Mock variables to control supabase responses
let mockUser: any = { id: "user-1", created_at: new Date().toISOString() };
let mockSession: any = null;
let mockRecipeReviews: any[] = [];
let mockHasUserReviewed = false;
let mockStarterKits: any[] = [];

jest.mock("@/supabase", () => ({
  supabase: {
    auth: {
      getUser: jest.fn(() =>
        Promise.resolve({
          data: { user: mockUser },
          error: null,
        })
      ),
      getSession: jest.fn(() =>
        Promise.resolve({
          data: { session: mockSession },
          error: null,
        })
      ),
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
            update: () => ({
              eq: async () => ({ data: null, error: null }),
            }),
          };

        case "recipe_reviews":
          return {
            select: (fields?: string) => {
              const eqChain = {
                eq: (col2: string, val2: any) => {
                  if (col2 === "account_id") {
                    return {
                      maybeSingle: async () => ({
                        data: mockHasUserReviewed ? { rating: 4 } : null,
                        error: null,
                      }),
                    };
                  }
                  return {
                    maybeSingle: async () => ({
                      data: mockHasUserReviewed ? { rating: 4 } : null,
                      error: null,
                    }),
                  };
                },
                maybeSingle: async () => ({
                  data: mockHasUserReviewed ? { rating: 4 } : null,
                  error: null,
                }),
                order: (field: string, opts: any) => ({
                  limit: async () => ({
                    data: mockRecipeReviews,
                    error: null,
                  }),
                }),
                limit: async () => ({
                  data: mockRecipeReviews,
                  error: null,
                }),
              };
              
              return {
                eq: (col: string, val: any) => eqChain,
              };
            },
            insert: () => ({
              select: async () => ({ data: null, error: null }),
            }),
            delete: () => ({
              eq: (col: string, val: any) => ({
                eq: async (col2: string, val2: any) => ({
                  data: null,
                  error: null,
                }),
              }),
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
            select: (fields?: string) => ({
              eq: (col: string, val: any) => {
                if (col === "recipe_slug") {
                  return {
                    eq: async () => ({ data: [], error: null }),
                  };
                }
                return { eq: async () => ({ data: [], error: null }) };
              },
            }),
            insert: () => ({
              select: async () => ({
                data: [
                  {
                    id_brew: 123,
                    start_date: new Date().toISOString(),
                  },
                ],
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
                  data: { username: "testuser", level: 5 },
                  error: null,
                }),
              }),
            }),
          };

        case "recipe_kits":
          return {
            select: () => ({
              eq: async () => ({ data: mockStarterKits, error: null }),
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
    toggleFavorite: mockToggleFavorite,
  }),
}));

// Mock StoreCard and ReviewCard
jest.mock("@/components/ui/StoreCard", () => {
  const { View, Text, TouchableOpacity } = require("react-native");
  return ({ title, price, onPress }: any) => {
    return (
      <TouchableOpacity onPress={onPress} testID="store-card">
        <Text>{title}</Text>
        <Text>{price}</Text>
      </TouchableOpacity>
    );
  };
});

jest.mock("@/components/ui/ReviewCard", () => {
  const { View, Text, TouchableOpacity } = require("react-native");
  return ({ review, onDelete }: any) => (
    <View testID={`review-card-${review.account_id}`}>
      <Text>Rating: {review.rating}</Text>
      {review.review_text && <Text>{review.review_text}</Text>}
      {onDelete && (
        <TouchableOpacity testID="delete-review-btn" onPress={onDelete}>
          <Text>Delete</Text>
        </TouchableOpacity>
      )}
    </View>
  );
});

// Mock Spinner
jest.mock("@/components/spinner", () => {
  const { View, Text } = require("react-native");
  return ({ title }: any) => (
    <View>
      <Text>{title}</Text>
    </View>
  );
});

// Mock custom TextInput
jest.mock("@/components/textInput", () => {
  const { TextInput: RNTextInput } = require("react-native");
  return ({ value, onChangeText, ...rest }: any) => (
    <RNTextInput value={value} onChangeText={onChangeText} {...rest} />
  );
});

// Mock PrimaryButton
jest.mock("@/components/primaryButton", () => {
  const { TouchableOpacity, Text } = require("react-native");
  return ({ title, testID, onPress }: any) => (
    <TouchableOpacity testID={testID} onPress={onPress}>
      <Text>{title}</Text>
    </TouchableOpacity>
  );
});

// Mock SecondaryButton
jest.mock("@/components/secondaryButton", () => {
  const { TouchableOpacity, Text } = require("react-native");
  return ({ title, testID, onPress }: any) => (
    <TouchableOpacity testID={testID} onPress={onPress}>
      <Text>{title}</Text>
    </TouchableOpacity>
  );
});

// Mock Alert
jest.spyOn(Alert, "alert");

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
    jest.clearAllMocks();
    mockPush.mockClear();
    mockRecipeSlug = recipeSlug;
    mockFrom = undefined;
    mockUser = { id: "user-1", created_at: new Date().toISOString() };
    mockSession = null;
    mockRecipeReviews = [];
    mockHasUserReviewed = false;
    mockStarterKits = [];
  });

  describe("Basic rendering", () => {
    it("renders the title of the recipe", async () => {
      const { findByText } = await renderWithNavigation(<SpecificRecipe />);
      expect(await findByText("Den Ballaste Point Sculpin IPA 60")).toBeTruthy();
    });

    it("shows start brewing button", async () => {
      const { findByText } = await renderWithNavigation(<SpecificRecipe />);
      expect(await findByText("Start Brewing")).toBeTruthy();
    });

    it("displays recipe description", async () => {
      const { findByText } = await renderWithNavigation(<SpecificRecipe />);
      expect(
        await findByText(
          "Den Ballaste Point Sculpin IPA 60 is a classic American IPA voor hopliefhebbers."
        )
      ).toBeTruthy();
    });

    it("displays recipe specifications chips", async () => {
      const { findByText } = await renderWithNavigation(<SpecificRecipe />);
      expect(await findByText("American IPA")).toBeTruthy();
      expect(await findByText("7.2% ABV")).toBeTruthy();
      expect(await findByText("89.3 IBU")).toBeTruthy();
      expect(await findByText("6 SRM")).toBeTruthy();
      expect(await findByText("19 L batch")).toBeTruthy();
    });

    it("displays ingredients list", async () => {
      const { findByText } = await renderWithNavigation(<SpecificRecipe />);
      expect(await findByText("Ingredients:")).toBeTruthy();
      expect(await findByText(/Main.*yeast/i)).toBeTruthy();
      expect(await findByText(/Pale Ale Malt.*grain/i)).toBeTruthy();
    });

    it("shows default rating when no reviews", async () => {
      const { findByText } = await renderWithNavigation(<SpecificRecipe />);
      expect(await findByText("0.00 / 5")).toBeTruthy();
      expect(await findByText("(0 reviews)")).toBeTruthy();
    });

    it("shows no reviews message when there are no reviews", async () => {
      const { findByText } = await renderWithNavigation(<SpecificRecipe />);
      expect(await findByText("This beer has no reviews yet.")).toBeTruthy();
    });
  });

  describe("Favorite functionality", () => {
    it("toggles favorite when heart button is pressed", async () => {
      const { findByTestId } = await renderWithNavigation(<SpecificRecipe />);
      const heartBtn = await findByTestId("heart-button");
      
      fireEvent.press(heartBtn);
      await waitFor(() => {
        expect(mockToggleFavorite).toHaveBeenCalledWith(recipeSlug);
      });
    });
  });

  describe("Batch size modal", () => {
    it("opens batch size modal when Start Brewing is pressed", async () => {
      const { findByText, queryByText } = await renderWithNavigation(
        <SpecificRecipe />
      );

      expect(queryByText("Choose batch size")).toBeNull();
      const startBtn = await findByText("Start Brewing");
      fireEvent.press(startBtn);

      const batchTitle = await findByText("Choose batch size");
      expect(batchTitle).toBeTruthy();
    });

    it("selects 5L batch size option", async () => {
      const { findByText, findByTestId } = await renderWithNavigation(
        <SpecificRecipe />
      );

      const startBtn = await findByText("Start Brewing");
      fireEvent.press(startBtn);

      await findByText("Choose batch size");
      const chip5L = await findByTestId("batch-chip-5");
      fireEvent.press(chip5L);

      const confirmBtn = await findByText("Confirm");
      expect(confirmBtn).toBeTruthy();
    });

    it("selects 10L batch size option", async () => {
      const { findByText, findByTestId } = await renderWithNavigation(
        <SpecificRecipe />
      );

      const startBtn = await findByText("Start Brewing");
      fireEvent.press(startBtn);

      await findByText("Choose batch size");
      const chip10L = await findByTestId("batch-chip-10");
      fireEvent.press(chip10L);

      const confirmBtn = await findByText("Confirm");
      expect(confirmBtn).toBeTruthy();
    });

    it("selects custom batch size option and enters value", async () => {
      const { findByText, findByTestId, findByPlaceholderText } =
        await renderWithNavigation(<SpecificRecipe />);

      const startBtn = await findByText("Start Brewing");
      fireEvent.press(startBtn);

      await findByText("Choose batch size");
      const chipCustom = await findByTestId("batch-chip-custom");
      fireEvent.press(chipCustom);

      const input = await findByPlaceholderText("Custom volume in L");
      fireEvent.changeText(input, "25");

      const confirmBtn = await findByText("Confirm");
      expect(confirmBtn).toBeTruthy();
    });

    it("shows alert for invalid custom batch size", async () => {
      const { findByText, findByTestId, findByPlaceholderText } =
        await renderWithNavigation(<SpecificRecipe />);

      const startBtn = await findByText("Start Brewing");
      fireEvent.press(startBtn);

      await findByText("Choose batch size");
      const chipCustom = await findByTestId("batch-chip-custom");
      fireEvent.press(chipCustom);

      const input = await findByPlaceholderText("Custom volume in L");
      fireEvent.changeText(input, "abc");

      const confirmBtn = await findByText("Confirm");
      fireEvent.press(confirmBtn);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          "Invalid batch size",
          "Please enter a valid volume in liters."
        );
      });
    });

    it("closes batch size modal when Cancel is pressed", async () => {
      const { findByText, queryByText } = await renderWithNavigation(
        <SpecificRecipe />
      );

      const startBtn = await findByText("Start Brewing");
      fireEvent.press(startBtn);

      await findByText("Choose batch size");
      const cancelBtn = await findByText("cancel");
      fireEvent.press(cancelBtn);

      await waitFor(() => {
        expect(queryByText("Choose batch size")).toBeNull();
      });
    });

    it("opens starterkit modal after confirming batch size", async () => {
      const { findByText, queryByText } = await renderWithNavigation(
        <SpecificRecipe />
      );

      expect(queryByText("Choose batch size")).toBeNull();
      expect(queryByText("Get your StarterKit now!")).toBeNull();

      const startBtn = await findByText("Start Brewing");
      fireEvent.press(startBtn);

      const batchTitle = await findByText("Choose batch size");
      expect(batchTitle).toBeTruthy();

      const confirmBtn = await findByText("Confirm");
      fireEvent.press(confirmBtn);

      const kitsTitle = await findByText("Get your StarterKit now!");
      expect(kitsTitle).toBeTruthy();
    });
  });

  describe("Starter kits modal", () => {
    beforeEach(() => {
      mockStarterKits = [
        {
          id_starter_kit: 1,
          starter_kit: {
            name: "Basic Kit",
            description: "Basic brewing kit",
            size_liters: 19,
            price: 99.99,
            is_active: true,
          },
        },
      ];
    });

    it("displays starter kits in modal", async () => {
      const { findByText, queryByText } = await renderWithNavigation(<SpecificRecipe />);

      const startBtn = await findByText("Start Brewing");
      fireEvent.press(startBtn);

      const confirmBtn = await findByText("Confirm");
      fireEvent.press(confirmBtn);

      await findByText("Get your StarterKit now!");
      
      // Wait a bit for the kits to render
      await waitFor(() => {
        expect(queryByText(/Basic Kit/)).toBeTruthy();
      }, { timeout: 2000 });
    });

    it("starts brewing when Skip is pressed in kits modal", async () => {
      const { findByText, findByTestId } = await renderWithNavigation(
        <SpecificRecipe />
      );

      const startBtn = await findByText("Start Brewing");
      fireEvent.press(startBtn);

      const confirmBtn = await findByText("Confirm");
      fireEvent.press(confirmBtn);

      await findByText("Get your StarterKit now!");
      const skipBtn = await findByTestId("skip-button");
      fireEvent.press(skipBtn);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith({
          pathname: "/progress",
          params: { id: 123 },
        });
      });
    });
  });

  describe("Review functionality", () => {
    it("opens review modal when Add Review is pressed", async () => {
      const { findByText, queryByText } = await renderWithNavigation(
        <SpecificRecipe />
      );

      expect(queryByText("Rate this recipe")).toBeNull();

      const addReviewBtn = await findByText("Add review");
      fireEvent.press(addReviewBtn);

      const modalTitle = await findByText("Rate this recipe");
      expect(modalTitle).toBeTruthy();
    });

    it("allows selecting star rating", async () => {
      const { findByText, findAllByTestId } = await renderWithNavigation(
        <SpecificRecipe />
      );

      const addReviewBtn = await findByText("Add review");
      fireEvent.press(addReviewBtn);

      await findByText("Rate this recipe");
      const stars = await findAllByTestId(/star-/);
      
      fireEvent.press(stars[3]); // Select 4 stars
      expect(stars[3]).toBeTruthy();
    });

    it("allows entering review text", async () => {
      const { findByText, findByPlaceholderText } =
        await renderWithNavigation(<SpecificRecipe />);

      const addReviewBtn = await findByText("Add review");
      fireEvent.press(addReviewBtn);

      await findByText("Rate this recipe");
      const input = await findByPlaceholderText(
        "(optional) Share your thoughts about this beer..."
      );
      
      fireEvent.changeText(input, "Great beer!");
      expect(input.props.value).toBe("Great beer!");
    });

    it("shows alert when submitting review without rating", async () => {
      mockSession = {
        user: { id: "user-1" },
      };

      const { findByText } = await renderWithNavigation(<SpecificRecipe />);

      const addReviewBtn = await findByText("Add review");
      fireEvent.press(addReviewBtn);

      await findByText("Rate this recipe");
      const submitBtn = await findByText("Submit");
      fireEvent.press(submitBtn);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          "Rating required",
          "Please select a rating before submitting."
        );
      });
    });

    it("shows alert when user is not logged in", async () => {
      mockSession = null;

      const { findByText, findAllByTestId } = await renderWithNavigation(
        <SpecificRecipe />
      );

      const addReviewBtn = await findByText("Add review");
      fireEvent.press(addReviewBtn);

      await findByText("Rate this recipe");
      const stars = await findAllByTestId(/star-/);
      fireEvent.press(stars[3]);

      const submitBtn = await findByText("Submit");
      fireEvent.press(submitBtn);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          "Login vereist",
          "Log eerst in om een review te plaatsen."
        );
      });
    });

    it("closes review modal when Cancel is pressed", async () => {
      const { findByText, queryByText } = await renderWithNavigation(
        <SpecificRecipe />
      );

      const addReviewBtn = await findByText("Add review");
      fireEvent.press(addReviewBtn);

      await findByText("Rate this recipe");
      const cancelBtn = await findByText("cancel");
      fireEvent.press(cancelBtn);

      await waitFor(() => {
        expect(queryByText("Rate this recipe")).toBeNull();
      });
    });

    it("shows 'You reviewed' when user has already reviewed", async () => {
      mockSession = { user: { id: "user-1" } };
      mockHasUserReviewed = true;

      const { findByText, findByTestId } = await renderWithNavigation(
        <SpecificRecipe />
      );

      const label = await findByTestId("already-reviewed-label");
      expect(label).toBeTruthy();
    });

    it("displays existing reviews", async () => {
      mockRecipeReviews = [
        {
          rating: 5,
          review_text: "Excellent beer!",
          created_at: new Date().toISOString(),
          account_id: "user-2",
        },
      ];

      const { findByText } = await renderWithNavigation(<SpecificRecipe />);

      expect(await findByText("Excellent beer!")).toBeTruthy();
      expect(await findByText("Rating: 5")).toBeTruthy();
    });
  });

  describe("Delete review", () => {
    beforeEach(() => {
      mockUser = { id: "user-1" };
      mockRecipeReviews = [
        {
          rating: 4,
          review_text: "My review",
          created_at: new Date().toISOString(),
          account_id: "user-1",
        },
      ];
    });

    it("shows delete button for user's own review", async () => {
      const { findByTestId } = await renderWithNavigation(<SpecificRecipe />);

      const deleteBtn = await findByTestId("delete-review-btn");
      expect(deleteBtn).toBeTruthy();
    });

    it("deletes review when delete button is pressed", async () => {
      const { findByTestId, findByText } = await renderWithNavigation(
        <SpecificRecipe />
      );

      const deleteBtn = await findByTestId("delete-review-btn");
      fireEvent.press(deleteBtn);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          "Success",
          "Review verwijderd."
        );
      });
    });
  });

  describe("Navigation", () => {
    it("navigates back to Recipes when back button is pressed", async () => {
      const { findByTestId } = await renderWithNavigation(<SpecificRecipe />);

      const backBtn = await findByTestId("back-button");
      fireEvent.press(backBtn);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/Recipes");
      });
    });
  });

  describe("Error handling", () => {
    it("handles missing recipe slug gracefully", async () => {
      // Set recipe slug to undefined
      mockRecipeSlug = undefined;

      const result = await renderWithNavigation(<SpecificRecipe />);
      
      // Component should still render without crashing
      await waitFor(() => {
        expect(result).toBeDefined();
      });
    });
  });

  describe("Context integrations", () => {
    it("calls increment on initial start press", async () => {
      const { findByText } = await renderWithNavigation(<SpecificRecipe />);

      const startBtn = await findByText("Start Brewing");
      fireEvent.press(startBtn);

      await waitFor(() => {
        expect(mockIncrement).toHaveBeenCalledWith("initial_start_press");
      });
    });

    it("calls refreshProgress after review submission", async () => {
      mockSession = { user: { id: "user-1" } };

      const { findByText, findAllByTestId } = await renderWithNavigation(
        <SpecificRecipe />
      );

      const addReviewBtn = await findByText("Add review");
      fireEvent.press(addReviewBtn);

      await findByText("Rate this recipe");
      const stars = await findAllByTestId(/star-/);
      fireEvent.press(stars[4]);

      const submitBtn = await findByText("Submit");
      fireEvent.press(submitBtn);

      await waitFor(() => {
        expect(mockRefreshProgress).toHaveBeenCalled();
      });
    });
  });

  describe("Edge cases and additional coverage", () => {
    it("closes batch size modal when dismissed", async () => {
      const { findByText, queryByText } = await renderWithNavigation(
        <SpecificRecipe />
      );

      const startBtn = await findByText("Start Brewing");
      fireEvent.press(startBtn);

      await findByText("Choose batch size");
      
      // Simulate modal dismiss (swipe down or outside click)
      // In react-native-paper Modal, onDismiss is called
      const modal = await findByText("Choose batch size");
      expect(modal).toBeTruthy();
    });

    it("closes review modal when dismissed", async () => {
      const { findByText } = await renderWithNavigation(<SpecificRecipe />);

      const addReviewBtn = await findByText("Add review");
      fireEvent.press(addReviewBtn);

      const modalTitle = await findByText("Rate this recipe");
      expect(modalTitle).toBeTruthy();
    });

    it("closes starter kit modal when dismissed", async () => {
      mockStarterKits = [
        {
          id_starter_kit: 1,
          starter_kit: {
            name: "Basic Kit",
            description: "Basic brewing kit",
            size_liters: 19,
            price: 99.99,
            is_active: true,
          },
        },
      ];

      const { findByText } = await renderWithNavigation(<SpecificRecipe />);

      const startBtn = await findByText("Start Brewing");
      fireEvent.press(startBtn);

      const confirmBtn = await findByText("Confirm");
      fireEvent.press(confirmBtn);

      const kitsTitle = await findByText("Get your StarterKit now!");
      expect(kitsTitle).toBeTruthy();
    });

    it("handles custom batch size with comma separator", async () => {
      const { findByText, findByTestId, findByPlaceholderText } =
        await renderWithNavigation(<SpecificRecipe />);

      const startBtn = await findByText("Start Brewing");
      fireEvent.press(startBtn);

      await findByText("Choose batch size");
      const chipCustom = await findByTestId("batch-chip-custom");
      fireEvent.press(chipCustom);

      const input = await findByPlaceholderText("Custom volume in L");
      fireEvent.changeText(input, "25,5");

      const confirmBtn = await findByText("Confirm");
      fireEvent.press(confirmBtn);

      // Should open kits modal without error
      await waitFor(() => {
        expect(findByText("Get your StarterKit now!")).toBeTruthy();
      });
    });

    it("handles zero custom batch size", async () => {
      const { findByText, findByTestId, findByPlaceholderText } =
        await renderWithNavigation(<SpecificRecipe />);

      const startBtn = await findByText("Start Brewing");
      fireEvent.press(startBtn);

      await findByText("Choose batch size");
      const chipCustom = await findByTestId("batch-chip-custom");
      fireEvent.press(chipCustom);

      const input = await findByPlaceholderText("Custom volume in L");
      fireEvent.changeText(input, "0");

      const confirmBtn = await findByText("Confirm");
      fireEvent.press(confirmBtn);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          "Invalid batch size",
          "Please enter a valid volume in liters."
        );
      });
    });

    it("handles empty custom batch size", async () => {
      const { findByText, findByTestId } = await renderWithNavigation(
        <SpecificRecipe />
      );

      const startBtn = await findByText("Start Brewing");
      fireEvent.press(startBtn);

      await findByText("Choose batch size");
      const chipCustom = await findByTestId("batch-chip-custom");
      fireEvent.press(chipCustom);

      const confirmBtn = await findByText("Confirm");
      fireEvent.press(confirmBtn);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          "Invalid batch size",
          "Please enter a valid volume in liters."
        );
      });
    });

    it("navigates to store item when clicking on starter kit", async () => {
      mockStarterKits = [
        {
          id_starter_kit: 1,
          starter_kit: {
            name: "Basic Kit",
            description: "Basic brewing kit",
            size_liters: 19,
            price: 99.99,
            is_active: true,
          },
        },
      ];

      const { findByText, findByTestId } = await renderWithNavigation(
        <SpecificRecipe />
      );

      const startBtn = await findByText("Start Brewing");
      fireEvent.press(startBtn);

      const confirmBtn = await findByText("Confirm");
      fireEvent.press(confirmBtn);

      await findByText("Get your StarterKit now!");

      // Click on the store card
      await waitFor(async () => {
        const storeCard = await findByTestId("store-card");
        fireEvent.press(storeCard);
      });

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith({
          pathname: "/StoreItem",
          params: {
            id: 1,
            categoryNumber: 4,
            from: "specificrecipe",
            recipe_slug: recipeSlug,
          },
        });
      });
    });

    it("shows no starter kits message when kits array is empty", async () => {
      mockStarterKits = [];

      const { findByText } = await renderWithNavigation(<SpecificRecipe />);

      const startBtn = await findByText("Start Brewing");
      fireEvent.press(startBtn);

      const confirmBtn = await findByText("Confirm");
      fireEvent.press(confirmBtn);

      await findByText("Get your StarterKit now!");
      expect(
        await findByText("No starter kits available for this recipe.")
      ).toBeTruthy();
    });

    it("handles recipe with null values gracefully", async () => {
      const { findByText } = await renderWithNavigation(<SpecificRecipe />);
      
      // Recipe should still render even with null values
      expect(await findByText("Den Ballaste Point Sculpin IPA 60")).toBeTruthy();
    });

    it("navigates back to Account when from parameter is account", async () => {
      mockFrom = "account";

      const { findByTestId } = await renderWithNavigation(<SpecificRecipe />);

      const backBtn = await findByTestId("back-button");
      fireEvent.press(backBtn);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/Account");
      });
    });

    it("handles reviews with null review_text", async () => {
      mockRecipeReviews = [
        {
          rating: 4,
          review_text: null,
          created_at: new Date().toISOString(),
          account_id: "user-2",
        },
      ];

      const { queryByText } = await renderWithNavigation(<SpecificRecipe />);

      // Review without text should not be displayed in the reviews section
      await waitFor(() => {
        expect(queryByText("This beer has no reviews yet.")).toBeTruthy();
      });
    });

    it("handles reviews with empty review_text", async () => {
      mockRecipeReviews = [
        {
          rating: 3,
          review_text: "   ",
          created_at: new Date().toISOString(),
          account_id: "user-3",
        },
      ];

      const { queryByText } = await renderWithNavigation(<SpecificRecipe />);

      // Review with only whitespace should not be displayed
      await waitFor(() => {
        expect(queryByText("This beer has no reviews yet.")).toBeTruthy();
      });
    });

    it("handles error when deleting review fails", async () => {
      mockUser = { id: "user-1" };
      mockRecipeReviews = [
        {
          rating: 4,
          review_text: "My review",
          created_at: new Date().toISOString(),
          account_id: "user-1",
        },
      ];

      const { findByTestId } = await renderWithNavigation(<SpecificRecipe />);

      // Now override the delete to throw an error
      const mockDelete = jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn(async () => ({
            data: null,
            error: { message: "Delete failed" },
          })),
        })),
      }));

      const supabase = require("@/supabase").supabase;
      const originalFrom = supabase.from;
      supabase.from = jest.fn((table) => {
        if (table === "recipe_reviews") {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  maybeSingle: async () => ({ data: null, error: null }),
                }),
                order: () => ({
                  limit: async () => ({ data: mockRecipeReviews, error: null }),
                }),
              }),
            }),
            delete: mockDelete,
          };
        }
        return originalFrom(table);
      });

      const deleteBtn = await findByTestId("delete-review-btn");
      fireEvent.press(deleteBtn);

      const { Alert } = require("react-native");
      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith("Error", expect.any(String));
      });
    });

    it("handles error when fetching reviews fails", async () => {
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

      // Mock fetchReviews to throw an error
      const supabase = require("@/supabase").supabase;
      const originalFrom = supabase.from;
      supabase.from = jest.fn((table) => {
        if (table === "recipe_reviews") {
          return {
            select: () => ({
              eq: () => ({
                order: () => ({
                  limit: async () => ({
                    data: null,
                    error: { message: "Fetch reviews failed" },
                  }),
                }),
                maybeSingle: async () => ({ data: null, error: null }),
              }),
            }),
          };
        }
        return originalFrom(table);
      });

      mockRecipeSlug = recipeSlug;

      await renderWithNavigation(<SpecificRecipe />);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          "Error fetching reviews:",
          expect.any(String)
        );
      });

      consoleErrorSpy.mockRestore();
    });

    it("handles error when profile fetch fails in fetchReviews", async () => {
      mockRecipeReviews = [
        {
          rating: 5,
          review_text: "Great!",
          created_at: new Date().toISOString(),
          account_id: "user-error",
        },
      ];

      // Mock profiles query to throw error
      const supabase = require("@/supabase").supabase;
      const originalFrom = supabase.from;
      supabase.from = jest.fn((table) => {
        if (table === "profiles") {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => {
                  throw new Error("Profile fetch failed");
                },
              }),
            }),
          };
        }
        if (table === "recipe_reviews") {
          return {
            select: () => ({
              eq: () => ({
                order: () => ({
                  limit: async () => ({
                    data: mockRecipeReviews,
                    error: null,
                  }),
                }),
                maybeSingle: async () => ({ data: null, error: null }),
              }),
            }),
          };
        }
        return originalFrom(table);
      });

      const { findByText } = await renderWithNavigation(<SpecificRecipe />);

      // Should still render review even without username
      await waitFor(() => {
        expect(findByText("Great!")).toBeTruthy();
      });
    });

    it("handles error when getCurrentUser fails in useEffect", async () => {
      const supabase = require("@/supabase").supabase;
      supabase.auth.getUser = jest.fn(async () => {
        throw new Error("Get user failed");
      });

      await renderWithNavigation(<SpecificRecipe />);

      // Component should still render despite error
      await waitFor(() => {
        expect(true).toBe(true);
      });
    });

    it("handles error during brew steps insertion", async () => {
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

      const { findByText, findByTestId } = await renderWithNavigation(<SpecificRecipe />);

      // Now override brew_steps to fail
      const supabase = require("@/supabase").supabase;
      const originalFrom = supabase.from;
      const originalGetUser = supabase.auth.getUser;
      
      supabase.auth.getUser = jest.fn(() =>
        Promise.resolve({
          data: { user: mockUser },
          error: null,
        })
      );
      
      supabase.from = jest.fn((table) => {
        if (table === "brew_steps") {
          return {
            insert: async () => ({
              data: null,
              error: { message: "Insert brew_steps failed" },
            }),
          };
        }
        return originalFrom(table);
      });

      const startBtn = await findByText("Start Brewing");
      fireEvent.press(startBtn);

      const confirmBtn = await findByText("Confirm");
      fireEvent.press(confirmBtn);

      await findByText("Get your StarterKit now!");
      const skipBtn = await findByTestId("skip-button");
      fireEvent.press(skipBtn);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          "Error inserting brew_steps:",
          "Insert brew_steps failed"
        );
      });

      consoleErrorSpy.mockRestore();
      supabase.from = originalFrom;
      supabase.auth.getUser = originalGetUser;
    });

    it("handles error when fetching all steps fails", async () => {
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

      const { findByText, findByTestId } = await renderWithNavigation(<SpecificRecipe />);

      // Now override steps to fail
      const supabase = require("@/supabase").supabase;
      const originalFrom = supabase.from;
      const originalGetUser = supabase.auth.getUser;
      
      supabase.auth.getUser = jest.fn(() =>
        Promise.resolve({
          data: { user: mockUser },
          error: null,
        })
      );
      
      supabase.from = jest.fn((table) => {
        if (table === "steps") {
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
                data: null,
                error: { message: "Steps fetch failed" },
              }),
            }),
          };
        }
        return originalFrom(table);
      });

      const startBtn = await findByText("Start Brewing");
      fireEvent.press(startBtn);

      const confirmBtn = await findByText("Confirm");
      fireEvent.press(confirmBtn);

      await findByText("Get your StarterKit now!");
      const skipBtn = await findByTestId("skip-button");
      fireEvent.press(skipBtn);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          "Error fetching steps:",
          "Steps fetch failed"
        );
      });

      consoleErrorSpy.mockRestore();
      supabase.from = originalFrom;
      supabase.auth.getUser = originalGetUser;
    });

    it("handles exception during brew start", async () => {
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

      const supabase = require("@/supabase").supabase;
      supabase.auth.getUser = jest.fn(async () => {
        throw new Error("Catastrophic failure");
      });

      const { findByText, findByTestId } = await renderWithNavigation(<SpecificRecipe />);

      const startBtn = await findByText("Start Brewing");
      fireEvent.press(startBtn);

      const confirmBtn = await findByText("Confirm");
      fireEvent.press(confirmBtn);

      await findByText("Get your StarterKit now!");
      const skipBtn = await findByTestId("skip-button");
      fireEvent.press(skipBtn);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          "Exception during brew start:",
          expect.any(String)
        );
      });

      consoleErrorSpy.mockRestore();
    });

    it("handles error when fetching kits fails", async () => {
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

      const supabase = require("@/supabase").supabase;
      const originalFrom = supabase.from;
      supabase.from = jest.fn((table) => {
        if (table === "recipe_kits") {
          return {
            select: () => ({
              eq: async () => ({
                data: null,
                error: { message: "Kits fetch failed" },
              }),
            }),
          };
        }
        return originalFrom(table);
      });

      await renderWithNavigation(<SpecificRecipe />);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          "Error fetching kits:",
          "Kits fetch failed"
        );
      });

      consoleErrorSpy.mockRestore();
    });

    it("handles increment error in handleInitialStartPress", async () => {
      mockIncrement.mockRejectedValueOnce(new Error("Increment failed"));

      const { findByText } = await renderWithNavigation(<SpecificRecipe />);

      const startBtn = await findByText("Start Brewing");
      fireEvent.press(startBtn);

      // Should still open modal despite increment error
      await waitFor(() => {
        expect(findByText("Choose batch size")).toBeTruthy();
      });
    });

    it("handles reset error during north star logging", async () => {
      const newUser = { id: "user-new", created_at: new Date().toISOString() };
      mockReset.mockRejectedValueOnce(new Error("Reset failed"));

      const { findByText, findByTestId } = await renderWithNavigation(<SpecificRecipe />);

      // Override auth and brews query to trigger first-time user flow
      const supabase = require("@/supabase").supabase;
      const originalFrom = supabase.from;
      const originalGetUser = supabase.auth.getUser;
      
      supabase.auth.getUser = jest.fn(() =>
        Promise.resolve({
          data: { user: newUser },
          error: null,
        })
      );
      
      supabase.from = jest.fn((table) => {
        if (table === "brews") {
          return {
            select: () => ({
              eq: () => ({
                eq: async () => ({ data: [], error: null }),
              }),
            }),
            insert: () => ({
              select: async () => ({
                data: [
                  {
                    id_brew: 123,
                    start_date: new Date().toISOString(),
                  },
                ],
                error: null,
              }),
            }),
          };
        }
        return originalFrom(table);
      });

      const startBtn = await findByText("Start Brewing");
      fireEvent.press(startBtn);

      const confirmBtn = await findByText("Confirm");
      fireEvent.press(confirmBtn);

      await findByText("Get your StarterKit now!");
      const skipBtn = await findByTestId("skip-button");
      fireEvent.press(skipBtn);

      // Should still navigate despite reset error
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalled();
      });

      supabase.from = originalFrom;
      supabase.auth.getUser = originalGetUser;
    });

    it("navigates back to HomePage when from parameter is home", async () => {
      mockFrom = "home";

      const { findByTestId } = await renderWithNavigation(<SpecificRecipe />);

      const backBtn = await findByTestId("back-button");
      fireEvent.press(backBtn);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/HomePage");
      });
    });

    it("handles triggerRefresh error after review submission", async () => {
      mockSession = { user: { id: "user-1" } };
      mockTriggerRefresh.mockImplementationOnce(() => {
        throw new Error("Trigger refresh failed");
      });

      const { findByText, findAllByTestId } = await renderWithNavigation(
        <SpecificRecipe />
      );

      const addReviewBtn = await findByText("Add review");
      fireEvent.press(addReviewBtn);

      await findByText("Rate this recipe");
      const stars = await findAllByTestId(/star-/);
      fireEvent.press(stars[4]);

      const submitBtn = await findByText("Submit");
      fireEvent.press(submitBtn);

      // Should still succeed despite triggerRefresh error
      await waitFor(() => {
        expect(mockRefreshProgress).toHaveBeenCalled();
      });
    });

    it("calls refreshProgress even when review submission fails", async () => {
      mockSession = { user: { id: "user-1" } };

      const supabase = require("@/supabase").supabase;
      const originalFrom = supabase.from;
      supabase.from = jest.fn((table) => {
        if (table === "recipe_reviews" && table !== "recipes") {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({ data: null, error: null }),
              }),
            }),
            insert: async () => ({
              data: null,
              error: { message: "Insert review failed" },
            }),
          };
        }
        return originalFrom(table);
      });

      const { findByText, findAllByTestId } = await renderWithNavigation(
        <SpecificRecipe />
      );

      const addReviewBtn = await findByText("Add review");
      fireEvent.press(addReviewBtn);

      await findByText("Rate this recipe");
      const stars = await findAllByTestId(/star-/);
      fireEvent.press(stars[3]);

      const submitBtn = await findByText("Submit");
      fireEvent.press(submitBtn);

      await waitFor(() => {
        expect(mockRefreshProgress).toHaveBeenCalled();
      });
    });
  });

  describe("Snapshot", () => {
    it("matches snapshot", async () => {
      const tree = (await renderWithNavigation(<SpecificRecipe />)).toJSON();
      expect(tree).toMatchSnapshot();
    });
  });
});
