import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import HomePage from "../app/(tabs)/HomePage";
import { NavigationContainer } from "@react-navigation/native";
import { useRouter } from "expo-router";
jest.spyOn(console, "error").mockImplementation(() => {});

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
   HELPERS
------------------------------- */

const createRecipesQuery = (listData = recipesData) => ({
  select: () => ({
    then(
      cb:
        | ((value: {
            data: {
              recipe_slug: string;
              name: string;
              description: string;
              rating: null;
              haze_level: number;
              srm_target: number;
              style: string;
            }[];
            error: null;
          }) =>
            | {
                data: {
                  recipe_slug: string;
                  name: string;
                  description: string;
                  rating: null;
                  haze_level: number;
                  srm_target: number;
                  style: string;
                }[];
                error: null;
              }
            | PromiseLike<{
                data: {
                  recipe_slug: string;
                  name: string;
                  description: string;
                  rating: null;
                  haze_level: number;
                  srm_target: number;
                  style: string;
                }[];
                error: null;
              }>)
        | null
        | undefined
    ) {
      return Promise.resolve({ data: listData, error: null }).then(cb);
    },
  }),
  then(
    cb:
      | ((value: {
          data: {
            recipe_slug: string;
            name: string;
            description: string;
            rating: null;
            haze_level: number;
            srm_target: number;
            style: string;
          }[];
          error: null;
        }) =>
          | {
              data: {
                recipe_slug: string;
                name: string;
                description: string;
                rating: null;
                haze_level: number;
                srm_target: number;
                style: string;
              }[];
              error: null;
            }
          | PromiseLike<{
              data: {
                recipe_slug: string;
                name: string;
                description: string;
                rating: null;
                haze_level: number;
                srm_target: number;
                style: string;
              }[];
              error: null;
            }>)
      | null
      | undefined
  ) {
    return Promise.resolve({ data: listData, error: null }).then(cb);
  },
});

/* ------------------------------
   MOCKS
------------------------------- */

const pushMock = jest.fn();
jest.mock("expo-router", () => ({ useRouter: jest.fn() }));

jest.mock("@/hooks/use-fonts", () => ({ useFonts: () => true }));

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

jest.mock("react-native-safe-area-context", () => {
  const { View } = require("react-native");
  return {
    SafeAreaView: ({ children }: any) => <View>{children}</View>,
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  };
});

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

jest.mock("lucide-react-native", () => {
  const { Text } = require("react-native");
  return { Plus: () => <Text>Plus</Text> };
});

/* ------------------------------
   TEST UTIL
------------------------------- */

const renderWithNavigation = (ui: React.ReactElement) =>
  render(<NavigationContainer>{ui}</NavigationContainer>);

/* ------------------------------
   TESTS
------------------------------- */

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

  it("laadt recipes", async () => {
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

  it("navigates naar SpecificRecipe via beer card", async () => {
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
