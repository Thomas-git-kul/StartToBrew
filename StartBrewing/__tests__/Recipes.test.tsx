import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import Recipes from "@/app/(tabs)/Recipes";
import { useRouter } from "expo-router";

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

const createRecipesQuery = (listData = recipesData) => {
  const query: any = {
    order: () => ({
      limit: async (count: number) => ({
        data: listData.slice(0, count),
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

// Beer image
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

// Colors
jest.mock("@/constants/Colors", () => ({
  BASE_COLORS: {
    LIGHT_BG: "#fafafa",
    WHITE: "#ffffff",
    TEXT_DARK: "#000000",
    STONE300: "#E5E7EB",
    STONE500: "#6B7280",
    STONE700: "#374151",
  },
}));

// Icons (lucide)
jest.mock("lucide-react-native", () => {
  const { Text } = require("react-native");
  return {
    Search: () => <Text>SearchIcon</Text>,
    X: () => <Text>XIcon</Text>,
  };
});

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

describe("Recipes screen", () => {
  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({ push: pushMock });
    pushMock.mockClear();
  });

  it("rendered header, searchbar en beer cards uit Supabase mock", async () => {
    const { findByText, findByPlaceholderText } = render(<Recipes />);

    expect(await findByText("Recipes")).toBeTruthy();
    expect(await findByPlaceholderText("Search")).toBeTruthy();

    expect(await findByText("Den Ballaste Point Sculpin IPA 60")).toBeTruthy();
    expect(await findByText("City of the Sun IPA")).toBeTruthy();
    expect(await findByText("SMaSH Session Pale Ale")).toBeTruthy();
  });

  it("filtert beers op naam", async () => {
    const { findByPlaceholderText, findByText, queryByText } = render(
      <Recipes />
    );

    const searchInput = await findByPlaceholderText("Search");
    // zorg dat data geladen is
    await findByText("City of the Sun IPA");

    fireEvent.changeText(searchInput, "City");

    expect(queryByText("Den Ballaste Point Sculpin IPA 60")).toBeNull();
    expect(await findByText("City of the Sun IPA")).toBeTruthy();
    expect(queryByText("SMaSH Session Pale Ale")).toBeNull();
  });

  it("reset search toont weer alle beers", async () => {
    const { findByPlaceholderText, findByText } = render(<Recipes />);
    const searchInput = await findByPlaceholderText("Search");

    await findByText("City of the Sun IPA");

    fireEvent.changeText(searchInput, "City");
    await findByText("City of the Sun IPA");

    fireEvent.changeText(searchInput, "");

    expect(await findByText("Den Ballaste Point Sculpin IPA 60")).toBeTruthy();
    expect(await findByText("City of the Sun IPA")).toBeTruthy();
    expect(await findByText("SMaSH Session Pale Ale")).toBeTruthy();
  });

  it("navigates naar SpecificRecipe bij klik op card", async () => {
    const { findByText } = render(<Recipes />);

    const card = await findByText("Den Ballaste Point Sculpin IPA 60");
    fireEvent.press(card);

    expect(pushMock).toHaveBeenCalledWith({
      pathname: "/SpecificRecipe",
      params: {
        recipe_slug: "americanipa-den-ballaste-point-sculpin-ipa-60",
      },
    });
  });

  it("kan favorite togglen zonder crash", async () => {
    const { findByLabelText } = render(<Recipes />);

    const favBtn = await findByLabelText(
      "favorite-Den Ballaste Point Sculpin IPA 60"
    );
    fireEvent.press(favBtn);
    fireEvent.press(favBtn);

    expect(favBtn).toBeTruthy();
  });
});
