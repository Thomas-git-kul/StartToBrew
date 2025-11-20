import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import HomePage from "../app/(tabs)/HomePage";
import { useRouter } from "expo-router";
import { NavigationContainer } from "@react-navigation/native";

/* ------------------------------
   MOCK DATA (uit recipes.csv)
------------------------------- */

const recipesData = [
  {
    recipe_slug: "americanipa-den-ballaste-point-sculpin-ipa-60",
    name: "Den Ballaste Point Sculpin IPA 60",
    description: "Den Ballaste Point Sculpin IPA 60 is a classic American IPA.",
    rating: null,
    haze_level: 1,
    srm_target: 6.0,
    style: "American IPA",
  },
  {
    recipe_slug: "americanipa-city-of-the-sun-ipa",
    name: "City of the Sun IPA",
    description: "City of the Sun IPA is a sunny American IPA.",
    rating: null,
    haze_level: 1,
    srm_target: 5.1,
    style: "American IPA",
  },
  {
    recipe_slug: "sessionipa-smash-session-pale-ale",
    name: "SMaSH Session Pale Ale",
    description: "SMaSH Session Pale Ale is een lichte Session IPA.",
    rating: null,
    haze_level: 2,
    srm_target: 3.4,
    style: "Session IPA",
  },
];

/* ------------------------------
   HELPERS
------------------------------- */

// thenable query object dat zowel
//  - `await supabase.from(...).select(...)`
//  - als `.order(...).limit(5)` ondersteunt
const createRecipesQuery = (listData = recipesData) => {
  const query: any = {
    order: () => ({
      limit: async (count: number) => ({
        data: listData.slice(0, count),
        error: null,
      }),
    }),
    eq: (field: string, value: string) => ({
      single: async () => ({
        data: listData.find((r) => r.recipe_slug === value) || null,
        error: null,
      }),
    }),
    then(onFulfilled: any, onRejected: any) {
      return Promise.resolve({ data: listData, error: null }).then(
        onFulfilled,
        onRejected
      );
    },
  };
  return query;
};

/* ------------------------------
   MOCKS
------------------------------- */

// Router
const pushMock = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: jest.fn(),
}));

// Fonts
jest.mock("@/hooks/use-fonts", () => ({
  useFonts: () => true,
}));

// Supabase
jest.mock("@/supabase", () => ({
  supabase: {
    from: (table: string) => {
      if (table !== "recipes") {
        return {
          select: () => createRecipesQuery([]),
        };
      }
      return {
        select: () => createRecipesQuery(recipesData),
      };
    },
    rpc: jest.fn(),
  },
}));

// Beer-image helper
jest.mock("@/hooks/beer-image", () => ({
  getBeerImageSource: () => ({ uri: "test-beer-image" }),
}));

// Header
jest.mock("@/components/header", () => {
  const { View, Text } = require("react-native");
  return ({ title }: any) => (
    <View>
      <Text>{title}</Text>
    </View>
  );
});

// ThemedText
jest.mock("@/components/themed-text", () => {
  const { Text } = require("react-native");
  return {
    ThemedText: ({ children, ...rest }: any) => (
      <Text {...rest}>{children}</Text>
    ),
  };
});

// Safe area
jest.mock("react-native-safe-area-context", () => {
  const { View } = require("react-native");
  return {
    SafeAreaView: ({ children }: any) => <View>{children}</View>,
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  };
});

// Colors & fonts
jest.mock("@/constants/Colors", () => ({
  BASE_COLORS: {
    WHITE: "#fff",
    TEXT_DARK: "#000",
    ACCENT_PRIMARY: "#f00",
    LIGHT_BG: "#eee",
    STONE300: "#E5E7EB",
    STONE500: "#6B7280",
    STONE700: "#374151",
  },
}));

jest.mock("@/constants/Fonts", () => ({
  FontFamilies: {
    HEADING: "System",
    BODY: "System",
    BODY_BOLD: "System",
  },
}));

// BeerCard
jest.mock("@/components/ui/RecipeCard", () => {
  const { View, Text, Pressable } = require("react-native");
  return ({ name, onToggleFavorite, onPress }: any) => (
    <Pressable onPress={onPress}>
      <View>
        <Text>{name}</Text>
        <Pressable
          accessibilityLabel={`favorite-${name}`}
          onPress={onToggleFavorite}
        >
          <Text>FavBtn</Text>
        </Pressable>
      </View>
    </Pressable>
  );
});

// ProgressCard
jest.mock("@/components/ui/ProgressCard", () => {
  const { View, Text, Pressable } = require("react-native");
  return ({ title, onPress }: any) => (
    <Pressable onPress={onPress}>
      <View>
        <Text>{title}</Text>
      </View>
    </Pressable>
  );
});

// lucide icon
jest.mock("lucide-react-native", () => {
  const { Text } = require("react-native");
  return {
    Plus: ({ size, color }: any) => <Text>{`Plus(${size},${color})`}</Text>,
  };
});

/* ------------------------------
   TESTS
------------------------------- */

const renderWithNavigation = (ui: React.ReactElement) =>
  render(<NavigationContainer>{ui}</NavigationContainer>);

describe("<HomePage />", () => {
  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({ push: pushMock });
    pushMock.mockClear();
  });

  it("rendered hoofdsecties", () => {
    const { getByText } = renderWithNavigation(<HomePage />);

    expect(getByText("StartToBrew")).toBeTruthy();
    expect(getByText("In progress")).toBeTruthy();
    expect(getByText("Popular recipes")).toBeTruthy();
  });

  it("laadt recipes uit Supabase mock", async () => {
    const { findByText } = renderWithNavigation(<HomePage />);

    expect(await findByText("Den Ballaste Point Sculpin IPA 60")).toBeTruthy();
    expect(await findByText("City of the Sun IPA")).toBeTruthy();
    expect(await findByText("SMaSH Session Pale Ale")).toBeTruthy();
  });

  it("kan favorite togglen zonder crash", async () => {
    const { findByLabelText } = renderWithNavigation(<HomePage />);

    const favBtn = await findByLabelText(
      "favorite-Den Ballaste Point Sculpin IPA 60"
    );
    fireEvent.press(favBtn);
    fireEvent.press(favBtn);

    expect(favBtn).toBeTruthy();
  });

  it("navigates naar /Recipes via FAB", async () => {
    const { findByTestId } = renderWithNavigation(<HomePage />);

    const fab = await findByTestId("fab");
    fireEvent.press(fab);

    expect(pushMock).toHaveBeenCalledWith("/Recipes");
  });

  it("navigates naar SpecificRecipe bij klik op beer card", async () => {
    const { findByText } = renderWithNavigation(<HomePage />);

    const card = await findByText("Den Ballaste Point Sculpin IPA 60");
    fireEvent.press(card);

    expect(pushMock).toHaveBeenCalledWith({
      pathname: "/SpecificRecipe",
      params: {
        recipe_slug: "americanipa-den-ballaste-point-sculpin-ipa-60",
      },
    });
  });

  it("rendered progress cards en navigatie werkt", () => {
    const { getByText } = renderWithNavigation(<HomePage />);

    fireEvent.press(getByText("Hazy IPA"));
    fireEvent.press(getByText("Belgian Tripel"));
    fireEvent.press(getByText("American Pale Ale"));

    expect(pushMock).toHaveBeenCalledWith("/progress");
  });

  it("snapshot", () => {
    const tree = renderWithNavigation(<HomePage />).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
