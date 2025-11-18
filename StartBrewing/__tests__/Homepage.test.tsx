import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import HomePage from "../app/(tabs)/HomePage";
import { NavigationContainer } from "@react-navigation/native";
import { useRouter } from "expo-router";

/* ------------------------------
   MOCKS
------------------------------- */

// Mock navigation router
const pushMock = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: jest.fn(),
}));

// Mock Supabase
jest.mock("../supabase", () => ({
  supabase: {
    from: () => ({
      select: () => ({
        limit: () => ({
          data: [
            { recipe_slug: "citra-rye", name: "CalIPA - Citra Rye", description: "Test desc", rating: 4 },
            { recipe_slug: "city-of-sun", name: "City of the Sun IPA", description: "Desc", rating: 5 },
          ],
          error: null,
        }),
      }),
    }),
  },
}));

// Mock fonts
jest.mock("@/hooks/use-fonts", () => ({
  useFonts: () => true,
}));

// Mock ThemedText
jest.mock("@/components/themed-text", () => {
  const { Text } = require("react-native");
  return { ThemedText: ({ children }: any) => <Text>{children}</Text> };
});

// Mock Header
jest.mock("@/components/header", () => {
  const { Text, View } = require("react-native");
  return ({ title }: any) => (
    <View>
      <Text>{title}</Text>
    </View>
  );
});

// Mock ProgressCard
jest.mock("@/components/ui/ProgressCard", () => {
  const { Text, Pressable } = require("react-native");
  return ({ title, onPress }: any) => (
    <Pressable onPress={onPress}>
      <Text>{title}</Text>
    </Pressable>
  );
});

// Mock RecipeCard
jest.mock("@/components/ui/RecipeCard", () => {
  const { Text, Pressable } = require("react-native");
  return ({ name, onPress }: any) => (
    <Pressable onPress={onPress}>
      <Text>{name}</Text>
    </Pressable>
  );
});

// Mock colors
jest.mock("@/constants/Colors", () => ({
  BASE_COLORS: { TEXT_DARK: "#000", LIGHT_BG: "#eee" },
}));

// --------------------------
// Helper render wrapper
// --------------------------
const renderNav = (ui: any) => render(<NavigationContainer>{ui}</NavigationContainer>);

/* ------------------------------
   TESTS
------------------------------- */
describe("<HomePage />", () => {
  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({ push: pushMock });
    pushMock.mockClear();
  });

  it("renders titles", async () => {
    const { getByText } = renderNav(<HomePage />);
    expect(getByText("StartToBrew")).toBeTruthy();
    expect(getByText("In progress")).toBeTruthy();
    expect(getByText("Popular recipes")).toBeTruthy();
  });

  it("renders progress cards", () => {
    const { getByText } = renderNav(<HomePage />);
    expect(getByText("Hazy IPA")).toBeTruthy();
    expect(getByText("Belgian Tripel")).toBeTruthy();
    expect(getByText("American Pale Ale")).toBeTruthy();
  });

  it("navigates to /progress when progress card pressed", () => {
    const { getByText } = renderNav(<HomePage />);
    fireEvent.press(getByText("Hazy IPA"));
    expect(pushMock).toHaveBeenCalledWith("/progress");
  });

  it("renders popular beers (after supabase mock)", async () => {
    const { getByText } = renderNav(<HomePage />);
    await waitFor(() => {
      expect(getByText("CalIPA - Citra Rye")).toBeTruthy();
      expect(getByText("City of the Sun IPA")).toBeTruthy();
    });
  });

  it("navigates to SpecificRecipe on beer press", async () => {
    const { getByText } = renderNav(<HomePage />);
    await waitFor(() => getByText("CalIPA - Citra Rye"));
    fireEvent.press(getByText("CalIPA - Citra Rye"));
    expect(pushMock).toHaveBeenCalledWith({
      pathname: "/SpecificRecipe",
      params: { slug: "citra-rye" },
    });
  });

  it("navigates to /Recipes when FAB pressed", () => {
    const { getByTestId } = renderNav(<HomePage />);
    fireEvent.press(getByTestId("fab"));
    expect(pushMock).toHaveBeenCalledWith("/Recipes");
  });

  it("matches snapshot", () => {
    const tree = renderNav(<HomePage />).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
