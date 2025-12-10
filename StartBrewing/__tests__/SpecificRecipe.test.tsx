// __tests__/SpecificRecipe.test.tsx
import { NavigationContainer } from "@react-navigation/native";
import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import React from "react";
import { Alert } from "react-native";
import SpecificRecipe from "../app/(tabs)/SpecificRecipe";

// ---------- BASIS MOCKS ----------
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

// UserProgressContext
jest.mock("@/context/UserProgressContext", () => ({
  useUserProgressContext: () => ({
    progress: null,
    loading: false,
    levelUp: null,
    acknowledgeLevelUp: jest.fn(),
    refreshProgress: mockRefreshProgress,
  }),
}));

// ClickCounterContext
jest.mock("@/context/ClickCounterContext", () => ({
  useClickCounter: () => ({
    clickCount: 0,
    increment: mockIncrement,
    get: mockGet,
    reset: mockReset,
  }),
}));

// AppRefreshContext
jest.mock("@/context/AppRefreshContext", () => ({
  useAppRefresh: () => ({
    triggerRefresh: mockTriggerRefresh,
  }),
}));

// --------- NIEUW: BADGE FUNCTIONALITEIT MOCKS ----------

// fetchLatestBadge mock
const mockFetchLatestBadge = jest.fn();
jest.mock("@/supabase/queries/badges", () => ({
  fetchLatestBadge: (...args: any[]) => mockFetchLatestBadge(...args),
}));

// BadgeEarnedModal mock – simpele view met testID
jest.mock("@/components/BadgeEarnedModal", () => {
  const { View, Text, TouchableOpacity } = require("react-native");
  return {
    BadgeEarnedModal: ({ visible, badgeName, onClose }: any) =>
      visible ? (
        <View testID="badge-earned-modal">
          <Text>{badgeName || "Badge earned!"}</Text>
          <TouchableOpacity
            testID="badge-earned-close"
            onPress={onClose}
          >
            <Text>Close</Text>
          </TouchableOpacity>
        </View>
      ) : null,
  };
});

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
  rating: null,
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
   ROUTER + PARAMS MOCKS
------------------------------- */

const mockPush = jest.fn();
let mockRecipeSlug: string | undefined = recipeSlug;
let mockFrom: string | undefined = undefined;

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
  useLocalSearchParams: () => ({
    recipe_slug: mockRecipeSlug,
    slug: mockRecipeSlug,
    from: mockFrom,
  }),
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

// Colors & Fonts
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

// Header
jest.mock("@/components/header", () => {
  const { View, Text, TouchableOpacity } = require("react-native");
  return ({
    title,
    onIconPress,
    onIconPressLeft,
    actionTestID,
    actionTestIDLeft,
  }: any) => (
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
    ({ size, color, fill, stroke }: any) =>
      <Text>{`${name}`}</Text>;
  return {
    Star: make("Star"),
    Heart: make("Heart"),
    HeartPlus: make("HeartPlus"),
  };
});

// Supabase mocks
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
            select: () => {
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
                order: () => ({
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
                eq: () => eqChain,
              };
            },
            insert: () => ({
              select: async () => ({ data: null, error: null }),
            }),
            delete: () => ({
              eq: () => ({
                eq: async () => ({
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

// StoreCard & ReviewCard
jest.mock("@/components/ui/StoreCard", () => {
  const { Text, TouchableOpacity } = require("react-native");
  return ({ title, price, onPress }: any) => (
    <TouchableOpacity onPress={onPress} testID="store-card">
      <Text>{title}</Text>
      <Text>{price}</Text>
    </TouchableOpacity>
  );
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

// Spinner
jest.mock("@/components/spinner", () => {
  const { View, Text } = require("react-native");
  return ({ title }: any) => (
    <View>
      <Text>{title}</Text>
    </View>
  );
});

// custom TextInput
jest.mock("@/components/textInput", () => {
  const { TextInput: RNTextInput } = require("react-native");
  return ({ value, onChangeText, ...rest }: any) => (
    <RNTextInput value={value} onChangeText={onChangeText} {...rest} />
  );
});

// PrimaryButton
jest.mock("@/components/primaryButton", () => {
  const { TouchableOpacity, Text } = require("react-native");
  return ({ title, testID, onPress }: any) => (
    <TouchableOpacity testID={testID} onPress={onPress}>
      <Text>{title}</Text>
    </TouchableOpacity>
  );
});

// SecondaryButton
jest.mock("@/components/secondaryButton", () => {
  const { TouchableOpacity, Text } = require("react-native");
  return ({ title, testID, onPress }: any) => (
    <TouchableOpacity testID={testID} onPress={onPress}>
      <Text>{title}</Text>
    </TouchableOpacity>
  );
});

// Alert
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
    mockFetchLatestBadge.mockReset();
    mockFetchLatestBadge.mockResolvedValue(null); // default: geen badge
  });

  describe("Basic rendering", () => {
    it("renders the title of the recipe", async () => {
      const { findByText } = await renderWithNavigation(<SpecificRecipe />);
      expect(
        await findByText("Den Ballaste Point Sculpin IPA 60")
      ).toBeTruthy();
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
      expect(await findByText(/Main.*Yeast/i)).toBeTruthy();
      expect(await findByText(/Pale Ale Malt/i)).toBeTruthy();
    });

    it("shows default rating when no reviews", async () => {
      const { findByText } = await renderWithNavigation(<SpecificRecipe />);
      expect(await findByText("0.00 / 5")).toBeTruthy();
      expect(await findByText("(0 reviews)")).toBeTruthy();
    });

    it("shows no reviews message when there are no reviews", async () => {
      const { findByText } = await renderWithNavigation(<SpecificRecipe />);
      expect(
        await findByText("This beer has no reviews yet.")
      ).toBeTruthy();
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
      const { findByText, queryByText } = await renderWithNavigation(
        <SpecificRecipe />
      );

      const startBtn = await findByText("Start Brewing");
      fireEvent.press(startBtn);

      const confirmBtn = await findByText("Confirm");
      fireEvent.press(confirmBtn);

      await findByText("Get your StarterKit now!");

      await waitFor(() => {
        expect(queryByText(/Basic Kit/)).toBeTruthy();
      });
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

      fireEvent.press(stars[3]); // 4 sterren
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

      const { findByTestId } = await renderWithNavigation(<SpecificRecipe />);

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
      const { findByTestId } = await renderWithNavigation(<SpecificRecipe />);

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
      mockRecipeSlug = undefined;

      const result = await renderWithNavigation(<SpecificRecipe />);

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

  // ---------- NIEUW: BADGE MODAL TEST ----------
  describe("Badge earned modal", () => {
    it("shows badge modal after submitting review when a new badge is earned", async () => {
      mockSession = { user: { id: "user-1" } };

      // Eerste call (initLatestBadge) -> badge id 1
      // Tweede call (checkForNewBadge na review) -> badge id 2 (nieuw)
      mockFetchLatestBadge
        .mockResolvedValueOnce({
          id: 1,
          name: "Old Badge",
          imageUrl: "old.png",
        })
        .mockResolvedValueOnce({
          id: 2,
          name: "New Badge",
          imageUrl: "new.png",
        });

      const { findByText, findAllByTestId, findByTestId } =
        await renderWithNavigation(<SpecificRecipe />);

      const addReviewBtn = await findByText("Add review");
      fireEvent.press(addReviewBtn);

      await findByText("Rate this recipe");
      const stars = await findAllByTestId(/star-/);
      fireEvent.press(stars[4]);

      const submitBtn = await findByText("Submit");
      fireEvent.press(submitBtn);

      const modal = await waitFor(() =>
        findByTestId("badge-earned-modal")
      );
      expect(modal).toBeTruthy();
      expect(await findByText("New Badge")).toBeTruthy();
    });
  });

  describe("Snapshot", () => {
    it("matches snapshot", async () => {
      const tree = (await renderWithNavigation(<SpecificRecipe />)).toJSON();
      expect(tree).toMatchSnapshot();
    });
  });
});
