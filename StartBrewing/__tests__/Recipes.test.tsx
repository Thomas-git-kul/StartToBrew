import React from "react";
import { render, fireEvent, waitFor, act } from "@testing-library/react-native";
import { NavigationContainer } from "@react-navigation/native";
import Recipes from "../app/(tabs)/Recipes";
import { Alert } from "react-native";

// Mock data
const mockRecipes = [
  {
    recipe_slug: "americanipa-sculpin",
    name: "Sculpin IPA",
    description: "A classic American IPA",
    rating: 4.5,
    style: "American IPA",
    abv_target: 7.2,
    ibu_target: 70,
    srm_target: 6,
    haze_level: 1,
    difficulty: 1,
  },
  {
    recipe_slug: "stout-imperial",
    name: "Imperial Stout",
    description: "Rich and bold stout",
    rating: 4.8,
    style: "Stout",
    abv_target: 9.5,
    ibu_target: 50,
    srm_target: 40,
    haze_level: 1,
    difficulty: 3,
  },
  {
    recipe_slug: "neipa-hazy",
    name: "Hazy NEIPA",
    description: "Juicy New England IPA",
    rating: 4.3,
    style: "NEIPA",
    abv_target: 6.5,
    ibu_target: 45,
    srm_target: 5,
    haze_level: 3,
    difficulty: 2,
  },
];

const mockReviews = [
  { recipe_slug: "americanipa-sculpin", rating: 5 },
  { recipe_slug: "americanipa-sculpin", rating: 4 },
  { recipe_slug: "stout-imperial", rating: 5 },
];

let mockUser: any = null;
let mockRecommendedRecipes: any[] = [];

// Mocks
const mockPush = jest.fn();
const mockToggleFavorite = jest.fn();
const mockRefreshKey = 0;

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock("@/hooks/use-fonts", () => ({
  useFonts: () => true,
}));

jest.mock("@/hooks/beer-image", () => ({
  getBeerImageSource: () => ({ uri: "test-beer-image" }),
}));

jest.mock("@/context/FavoritesContext", () => ({
  useFavorites: () => ({
    favoriteSlugs: ["americanipa-sculpin"],
    toggleFavorite: mockToggleFavorite,
  }),
}));

jest.mock("@/context/AppRefreshContext", () => ({
  useAppRefresh: () => ({
    refreshKey: mockRefreshKey,
    triggerRefresh: jest.fn(),
  }),
}));

jest.mock("@/supabase", () => ({
  supabase: {
    auth: {
      getUser: jest.fn(() =>
        Promise.resolve({
          data: { user: mockUser },
          error: null,
        })
      ),
    },
    from: jest.fn((table) => {
      if (table === "recipes") {
        return {
          select: () => ({
            data: mockRecipes,
            error: null,
          }),
        };
      }
      if (table === "recipe_reviews") {
        return {
          select: () => ({
            in: async () => ({
              data: mockReviews,
              error: null,
            }),
          }),
        };
      }
      return { select: () => ({}) };
    }),
    rpc: jest.fn(async (fn, params) => {
      if (fn === "recommend_recipes") {
        return {
          data: mockRecommendedRecipes,
          error: null,
        };
      }
      return { data: [], error: null };
    }),
  },
}));

jest.mock("@/components/themed-text", () => {
  const { Text } = require("react-native");
  return {
    ThemedText: ({ children, ...rest }: any) => (
      <Text {...rest}>{children}</Text>
    ),
  };
});

jest.mock("@/components/header", () => {
  const { View, Text } = require("react-native");
  return ({ title }: any) => (
    <View>
      <Text>{title}</Text>
    </View>
  );
});

jest.mock("react-native-safe-area-context", () => {
  const { View } = require("react-native");
  return {
    SafeAreaView: ({ children }: any) => <View>{children}</View>,
  };
});

jest.mock("@/components/spinner", () => {
  const { View, Text } = require("react-native");
  return ({ title }: any) => (
    <View>
      <Text>{title}</Text>
    </View>
  );
});

jest.mock("@/components/textInput", () => {
  const { TextInput: RNTextInput } = require("react-native");
  return ({ value, onChangeText, ...rest }: any) => (
    <RNTextInput value={value} onChangeText={onChangeText} {...rest} />
  );
});

jest.mock("@/components/ui/RecipeCard", () => {
  const { View, Text, TouchableOpacity } = require("react-native");
  return ({ name, onPress, onToggleFavorite, isFavorite, rating, reviews }: any) => (
    <TouchableOpacity onPress={onPress} testID={`recipe-card-${name}`}>
      <View>
        <Text>{name}</Text>
        <Text>Rating: {rating}</Text>
        <Text>Reviews: {reviews}</Text>
        <TouchableOpacity
          onPress={onToggleFavorite}
          testID={`favorite-btn-${name}`}
        >
          <Text>{isFavorite ? "Favorited" : "Not Favorite"}</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
});

jest.mock("react-native-paper", () => {
  const { View, Text, TouchableOpacity, TextInput: RNTextInput } = require("react-native");
  return {
    Searchbar: ({ value, onChangeText, onClearIconPress, placeholder, ...rest }: any) => (
      <View>
        <RNTextInput
          testID="search-bar"
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          {...rest}
        />
        {value && (
          <TouchableOpacity testID="clear-search" onPress={onClearIconPress}>
            <Text>Clear</Text>
          </TouchableOpacity>
        )}
      </View>
    ),
    Portal: ({ children }: any) => <>{children}</>,
    Modal: ({ visible, children }: any) =>
      visible ? <View testID="filter-modal">{children}</View> : null,
    Chip: ({ children, onPress, selected, testID }: any) => (
      <TouchableOpacity onPress={onPress} testID={testID}>
        <Text>{children} {selected ? "(selected)" : ""}</Text>
      </TouchableOpacity>
    ),
    Button: ({ onPress, children, testID }: any) => (
      <TouchableOpacity onPress={onPress} testID={testID}>
        <Text>{children}</Text>
      </TouchableOpacity>
    ),
    ActivityIndicator: () => {
      const { View } = require("react-native");
      return <View testID="activity-indicator" />;
    },
  };
});

jest.mock("lucide-react-native", () => {
  const { Text } = require("react-native");
  const make = (name: string) => () => <Text>{name}</Text>;
  return {
    Search: make("Search"),
    X: make("X"),
    Check: make("Check"),
  };
});

jest.mock("@/constants/Colors", () => ({
  BASE_COLORS: {
    LIGHT_BG: "#fafafa",
    WHITE: "#ffffff",
    TEXT_DARK: "#000000",
    ACCENT_PRIMARY: "#FF6600",
    ACCENT_LIGHT: "#B45309",
    STONE200: "#E7E5E4",
    STONE300: "#E5E7EB",
    STONE500: "#78716C",
    STONE600: "#57534E",
    STONE700: "#44403C",
  },
}));

jest.mock("@/constants/Fonts", () => ({
  FontFamilies: {
    BODY: "System",
    BODY_LIGHT: "System",
  },
}));

jest.spyOn(Alert, "alert");

const renderWithNavigation = async (ui: React.ReactElement) => {
  const utils = render(<NavigationContainer>{ui}</NavigationContainer>);
  await act(async () => {});
  return utils;
};

describe("<Recipes />", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPush.mockClear();
    mockToggleFavorite.mockClear();
    mockUser = null;
    mockRecommendedRecipes = [];
  });

  describe("Basic rendering", () => {
    it("renders the header", async () => {
      const { findByText } = await renderWithNavigation(<Recipes />);
      expect(await findByText("Recipes")).toBeTruthy();
    });

    it("renders search bar", async () => {
      const { findByTestId } = await renderWithNavigation(<Recipes />);
      expect(await findByTestId("search-bar")).toBeTruthy();
    });

    it("displays recipe cards", async () => {
      const { findByText } = await renderWithNavigation(<Recipes />);
      expect(await findByText("Sculpin IPA")).toBeTruthy();
      expect(await findByText("Imperial Stout")).toBeTruthy();
      expect(await findByText("Hazy NEIPA")).toBeTruthy();
    });

    it("shows All recipes header when no filters", async () => {
      const { findByText } = await renderWithNavigation(<Recipes />);
      expect(await findByText("All recipes")).toBeTruthy();
    });
  });

  describe("Search functionality", () => {
    it("filters recipes by search query", async () => {
      const { findByTestId, findByText, queryByText } = await renderWithNavigation(
        <Recipes />
      );

      const searchBar = await findByTestId("search-bar");
      fireEvent.changeText(searchBar, "IPA");

      await waitFor(() => {
        expect(findByText("Sculpin IPA")).toBeTruthy();
        expect(findByText("Hazy NEIPA")).toBeTruthy();
      });

      expect(queryByText("Imperial Stout")).toBeNull();
    });

    it("clears search when clear button is pressed", async () => {
      const { findByTestId, findByText, queryByTestId } =
        await renderWithNavigation(<Recipes />);

      const searchBar = await findByTestId("search-bar");
      fireEvent.changeText(searchBar, "IPA");

      await waitFor(async () => {
        const clearBtn = await findByTestId("clear-search");
        expect(clearBtn).toBeTruthy();
      });

      const clearBtn = await findByTestId("clear-search");
      fireEvent.press(clearBtn);

      await waitFor(() => {
        expect(findByText("Imperial Stout")).toBeTruthy();
      });
    });

    it("shows no results when search doesn't match", async () => {
      const { findByTestId, findByText } = await renderWithNavigation(<Recipes />);

      const searchBar = await findByTestId("search-bar");
      fireEvent.changeText(searchBar, "NonExistentBeer");

      await waitFor(() => {
        expect(findByText("No recipes match this filter.")).toBeTruthy();
      });
    });
  });

  describe("Favorite functionality", () => {
    it("shows favorite chip", async () => {
      const { findByText } = await renderWithNavigation(<Recipes />);
      expect(await findByText(/Favorites/)).toBeTruthy();
    });

    it("toggles favorite when heart is pressed", async () => {
      const { findByTestId } = await renderWithNavigation(<Recipes />);

      const favoriteBtn = await findByTestId("favorite-btn-Sculpin IPA");
      fireEvent.press(favoriteBtn);

      await waitFor(() => {
        expect(mockToggleFavorite).toHaveBeenCalledWith("americanipa-sculpin");
      });
    });

    it("navigates to recipe when card is pressed", async () => {
      const { findByTestId } = await renderWithNavigation(<Recipes />);

      const recipeCard = await findByTestId("recipe-card-Sculpin IPA");
      fireEvent.press(recipeCard);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith({
          pathname: "/SpecificRecipe",
          params: {
            recipe_slug: "americanipa-sculpin",
            isFavorite: "true",
          },
        });
      });
    });
  });

  describe("Filter chips", () => {
    it("renders all filter chips", async () => {
      const { findAllByText } = await renderWithNavigation(<Recipes />);

      expect((await findAllByText(/Favorites/)).length).toBeGreaterThan(0);
      expect((await findAllByText(/Style/)).length).toBeGreaterThan(0);
      expect((await findAllByText(/ABV/)).length).toBeGreaterThan(0);
      expect((await findAllByText(/IBU/)).length).toBeGreaterThan(0);
      expect((await findAllByText(/SRM/)).length).toBeGreaterThan(0);
      expect((await findAllByText(/Difficulty/)).length).toBeGreaterThan(0);
      expect((await findAllByText(/Haze/)).length).toBeGreaterThan(0);
      expect((await findAllByText(/Rating/)).length).toBeGreaterThan(0);
    });
  });

  describe("Style filter", () => {
    it("opens style filter modal", async () => {
      const { findByText, findByTestId } = await renderWithNavigation(<Recipes />);

      const styleChip = await findByText(/Style/);
      fireEvent.press(styleChip);

      await waitFor(() => {
        expect(findByTestId("filter-modal")).toBeTruthy();
        expect(findByText("Select style(s)")).toBeTruthy();
      });
    });
  });

  describe("ABV filter", () => {
    it("opens ABV filter modal", async () => {
      const { findByText } = await renderWithNavigation(<Recipes />);

      const abvChip = await findByText(/^ABV/);
      fireEvent.press(abvChip);

      await waitFor(() => {
        expect(findByText("ABV range")).toBeTruthy();
      });
    });

    it("filters by ABV range", async () => {
      const { findByText, findByPlaceholderText, queryByText } =
        await renderWithNavigation(<Recipes />);

      const abvChip = await findByText(/^ABV/);
      fireEvent.press(abvChip);

      await findByText("ABV range");
      
      const minInput = await findByPlaceholderText("6.5");
      fireEvent.changeText(minInput, "7");

      const applyBtn = await findByText("Apply");
      fireEvent.press(applyBtn);

      await waitFor(() => {
        expect(findByText("Sculpin IPA")).toBeTruthy();
        expect(findByText("Imperial Stout")).toBeTruthy();
        expect(queryByText("Hazy NEIPA")).toBeNull();
      });
    });
  });

  describe("IBU filter", () => {
    it("opens IBU filter modal", async () => {
      const { findByText } = await renderWithNavigation(<Recipes />);

      const ibuChip = await findByText(/^IBU/);
      fireEvent.press(ibuChip);

      await waitFor(() => {
        expect(findByText("IBU range")).toBeTruthy();
      });
    });

    it("filters by IBU range", async () => {
      const { findByText, findByPlaceholderText, queryByText } =
        await renderWithNavigation(<Recipes />);

      const ibuChip = await findByText(/^IBU/);
      fireEvent.press(ibuChip);

      await findByText("IBU range");
      
      const maxInput = await findByPlaceholderText("70");
      fireEvent.changeText(maxInput, "50");

      const applyBtn = await findByText("Apply");
      fireEvent.press(applyBtn);

      await waitFor(() => {
        expect(findByText("Imperial Stout")).toBeTruthy();
        expect(findByText("Hazy NEIPA")).toBeTruthy();
        expect(queryByText("Sculpin IPA")).toBeNull();
      });
    });
  });

  describe("Difficulty filter", () => {
    it("opens difficulty filter modal", async () => {
      const { findByText } = await renderWithNavigation(<Recipes />);

      const difficultyChip = await findByText(/Difficulty/);
      fireEvent.press(difficultyChip);

      await waitFor(() => {
        expect(findByText("Select difficulty")).toBeTruthy();
      });
    });

    it("filters by difficulty", async () => {
      const { findByText, queryByText } = await renderWithNavigation(<Recipes />);

      const difficultyChip = await findByText(/Difficulty/);
      fireEvent.press(difficultyChip);

      await findByText("Select difficulty");
      const beginnerOption = await findByText("beginner");
      fireEvent.press(beginnerOption);

      const applyBtn = await findByText("Apply");
      fireEvent.press(applyBtn);

      await waitFor(() => {
        expect(findByText("Sculpin IPA")).toBeTruthy();
        expect(queryByText("Imperial Stout")).toBeNull();
        expect(queryByText("Hazy NEIPA")).toBeNull();
      });
    });
  });

  describe("Haze filter", () => {
    it("opens haze filter modal", async () => {
      const { findByText } = await renderWithNavigation(<Recipes />);

      const hazeChip = await findByText(/^Haze/);
      fireEvent.press(hazeChip);

      await waitFor(() => {
        expect(findByText("Select haze(s)")).toBeTruthy();
      });
    });

    it("filters by haze level", async () => {
      const { findByText, queryByText } = await renderWithNavigation(<Recipes />);

      const hazeChip = await findByText(/^Haze/);
      fireEvent.press(hazeChip);

      await findByText("Select haze(s)");
      const hazyOption = await findByText("hazy");
      fireEvent.press(hazyOption);

      const applyBtn = await findByText("Apply");
      fireEvent.press(applyBtn);

      await waitFor(() => {
        expect(findByText("Hazy NEIPA")).toBeTruthy();
        expect(queryByText("Sculpin IPA")).toBeNull();
        expect(queryByText("Imperial Stout")).toBeNull();
      });
    });
  });

  describe("Clear all filters", () => {
    it("shows clear filters button when no recipes match", async () => {
      const { findByText, findByTestId } = await renderWithNavigation(<Recipes />);

      const searchBar = await findByTestId("search-bar");
      fireEvent.changeText(searchBar, "NonExistentBeer");

      await waitFor(() => {
        expect(findByText("No recipes match this filter.")).toBeTruthy();
        expect(findByText("Clear Filters")).toBeTruthy();
      });
    });

    it("clears all filters when button is pressed", async () => {
      const { findByText, findByTestId } = await renderWithNavigation(<Recipes />);

      const searchBar = await findByTestId("search-bar");
      fireEvent.changeText(searchBar, "NonExistent");

      await findByText("No recipes match this filter.");
      const clearBtn = await findByText("Clear Filters");
      fireEvent.press(clearBtn);

      await waitFor(() => {
        expect(findByText("Sculpin IPA")).toBeTruthy();
        expect(findByText("Imperial Stout")).toBeTruthy();
      });
    });
  });

  describe("Recommended recipes", () => {
    it("shows recommended section when user is logged in", async () => {
      mockUser = { id: "user-1" };
      mockRecommendedRecipes = [
        { recipe_slug: "americanipa-sculpin" },
      ];

      const { findByText } = await renderWithNavigation(<Recipes />);

      await waitFor(() => {
        expect(findByText("Recommended for you")).toBeTruthy();
      });
    });

    it("does not show recommended section when no recommendations", async () => {
      mockUser = { id: "user-1" };
      mockRecommendedRecipes = [];

      const { queryByText } = await renderWithNavigation(<Recipes />);

      await waitFor(() => {
        expect(queryByText("Recommended for you")).toBeNull();
      });
    });
  });

  describe("SRM filter", () => {
    it("opens SRM filter modal", async () => {
      const { findByText } = await renderWithNavigation(<Recipes />);

      const srmChip = await findByText(/^SRM/);
      fireEvent.press(srmChip);

      await waitFor(() => {
        expect(findByText("SRM range")).toBeTruthy();
      });
    });
  });

  describe("Edge cases", () => {
    it("handles empty recipe list", async () => {
      (require("@/supabase").supabase.from as jest.Mock).mockReturnValue({
        select: () => ({
          data: [],
          error: null,
          in: async () => ({ data: [], error: null }),
        }),
      });

      const { findByText } = await renderWithNavigation(<Recipes />);

      await waitFor(() => {
        expect(findByText("No recipes match this filter.")).toBeTruthy();
      });
    });

    it("toggles favorites filter", async () => {
      const { findByText, queryByText } = await renderWithNavigation(<Recipes />);

      const favoritesChip = await findByText(/Favorites/);
      fireEvent.press(favoritesChip);

      await waitFor(() => {
        expect(findByText("Sculpin IPA")).toBeTruthy();
        expect(queryByText("Imperial Stout")).toBeNull();
      });
    });

    it("closes modal when clicking outside", async () => {
      const { findByText, queryByTestId } = await renderWithNavigation(<Recipes />);

      const styleChip = await findByText(/Style/);
      fireEvent.press(styleChip);

      await findByText("Select style(s)");
      
      // Click style chip again to close
      fireEvent.press(styleChip);

      await waitFor(() => {
        expect(queryByTestId("filter-modal")).toBeNull();
      });
    });
  });

  describe("Multiple filters combination", () => {
    it("applies search with other filters", async () => {
      const { findByTestId, findByText, queryByText } = await renderWithNavigation(<Recipes />);

      // Apply search
      const searchBar = await findByTestId("search-bar");
      fireEvent.changeText(searchBar, "IPA");

      await waitFor(() => {
        expect(findByText("Sculpin IPA")).toBeTruthy();
        expect(queryByText("Imperial Stout")).toBeNull();
      });
    });
  });
});
