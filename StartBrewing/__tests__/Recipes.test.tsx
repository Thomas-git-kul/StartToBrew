import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import Recipes from "@/app/(tabs)/Recipes";
import { useRouter } from "expo-router";

/* ------------------------------
   MOCK DATA
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

const reviewData = [
  { recipe_slug: "americanipa-den-ballaste-point-sculpin-ipa-60", rating: 4 },
  { recipe_slug: "americanipa-city-of-the-sun-ipa", rating: 3 },
  { recipe_slug: "sessionipa-smash-session-pale-ale", rating: 5 },
];

/* ------------------------------
   MOCKS
------------------------------- */

const pushMock = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: jest.fn(),
}));

jest.mock("@/hooks/use-fonts", () => ({
  useFonts: () => true,
}));

jest.mock("@/supabase", () => ({
  supabase: {
    from: (table: string) => {
      if (table === "recipes") {
        return {
          select: () =>
            Promise.resolve({
              data: recipesData,
              error: null,
            }),
        };
      }
      if (table === "recipe_reviews") {
        return {
          select: () => ({
            in: () =>
              Promise.resolve({
                data: reviewData,
                error: null,
              }),
          }),
        };
      }
      return {
        select: () => Promise.resolve({ data: [], error: null }),
      };
    },
  },
}));

jest.mock("@/hooks/beer-image", () => ({
  getBeerImageSource: () => ({ uri: "test-beer-image" }),
}));

jest.mock("@/components/header", () => {
  const { View, Text } = require("react-native");
  return ({ title }: any) => (
    <View>
      <Text>{title}</Text>
    </View>
  );
});

jest.mock("@/components/themed-text", () => {
  const { Text } = require("react-native");
  return {
    ThemedText: ({ children }: any) => <Text>{children}</Text>,
  };
});

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

jest.mock("lucide-react-native", () => {
  const { Text } = require("react-native");
  return {
    Search: () => <Text>SearchIcon</Text>,
    X: () => <Text>XIcon</Text>,
  };
});

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

/* Required mock for Searchbar clear icon */
jest.mock("react-native-paper", () => {
  const actual = jest.requireActual("react-native-paper");
  const { TextInput, View, Text } = require("react-native");
  return {
    ...actual,
    Searchbar: ({ placeholder, value, onChangeText, onClearIconPress }: any) => (
      <View>
        <Text>{placeholder}</Text>
        <TextInput
          testID="search-input"
          value={value}
          onChangeText={onChangeText}
        />
        <Text onPress={onClearIconPress}>Clear</Text>
      </View>
    ),
    ActivityIndicator: () => <Text>Loading...</Text>,
  };
});

/* ------------------------------
   TESTS
------------------------------- */

describe("Recipes screen", () => {
  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({ push: pushMock });
    pushMock.mockClear();
  });

  it("rendered header, searchbar en beer cards", async () => {
    const { findByText, findByTestId } = render(<Recipes />);

    expect(await findByText("Recipes")).toBeTruthy();
    expect(await findByText("Search")).toBeTruthy();

    expect(await findByText("Den Ballaste Point Sculpin IPA 60")).toBeTruthy();
    expect(await findByText("City of the Sun IPA")).toBeTruthy();
    expect(await findByText("SMaSH Session Pale Ale")).toBeTruthy();
  });

  it("filtert beers op naam", async () => {
    const { findByTestId, findByText, queryByText } = render(<Recipes />);

    await findByText("City of the Sun IPA");

    const searchInput = await findByTestId("search-input");

    fireEvent.changeText(searchInput, "City");

    expect(queryByText("Den Ballaste Point Sculpin IPA 60")).toBeNull();
    expect(await findByText("City of the Sun IPA")).toBeTruthy();
    expect(queryByText("SMaSH Session Pale Ale")).toBeNull();
  });

  it("reset search toont weer alle beers", async () => {
    const { findByTestId, findByText } = render(<Recipes />);

    const searchInput = await findByTestId("search-input");

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
