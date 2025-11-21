import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import HomePage from "../app/(tabs)/HomePage";
import { NavigationContainer } from "@react-navigation/native";
import { useRouter } from "expo-router";

/* ---------------------------------------------
   MOCKS
---------------------------------------------- */

// mock router
const pushMock = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: jest.fn(),
}));

// mock supabase with correct nested chain + return fields
jest.mock("../supabase", () => ({
  supabase: {
    from: () => ({
      select: () => ({
        not: () => ({
          order: () => ({
            order: () => ({
              limit: () => ({
                data: [
                  {
                    recipe_slug: "citra-rye",
                    name: "CalIPA - Citra Rye",
                    description: "Test desc",
                    rating: 4.2,
                    review_count: 12,
                  },
                  {
                    recipe_slug: "city-of-sun",
                    name: "City of the Sun IPA",
                    description: "Desc",
                    rating: 5,
                    review_count: 24,
                  },
                ],
                error: null,
              }),
            }),
          }),
        }),
      }),
    }),
  },
}));

// fonts mock
jest.mock("@/hooks/use-fonts", () => ({
  useFonts: () => true,
}));

// ThemedText mock
jest.mock("@/components/themed-text", () => {
  const { Text } = require("react-native");
  return { ThemedText: ({ children }: any) => <Text>{children}</Text> };
});

// Header mock
jest.mock("@/components/header", () => {
  const { View, Text } = require("react-native");
  return ({ title }: any) => (
    <View>
      <Text>{title}</Text>
    </View>
  );
});

// ProgressCard mock
jest.mock("@/components/ui/ProgressCard", () => {
  const { Pressable, Text } = require("react-native");
  return ({ title, onPress }: any) => (
    <Pressable onPress={onPress}>
      <Text>{title}</Text>
    </Pressable>
  );
});

// RecipeCard mock
jest.mock("@/components/ui/RecipeCard", () => {
  const { Pressable, Text } = require("react-native");
  return (props: any) => (
    <Pressable onPress={props.onPress}>
      <Text>{props.name}</Text>
    </Pressable>
  );
});

// Colors mock
jest.mock("@/constants/Colors", () => ({
  BASE_COLORS: {
    TEXT_DARK: "#000",
    LIGHT_BG: "#eee",
  },
}));

/* ---------------------------------------------
   Helper render wrapper
---------------------------------------------- */
const renderNav = (ui: any) =>
  render(<NavigationContainer>{ui}</NavigationContainer>);

/* ---------------------------------------------
   TESTS
---------------------------------------------- */

describe("<HomePage />", () => {
  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({ push: pushMock });
    pushMock.mockClear();
  });

  it("renders titles", () => {
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

  it("navigates to /progress when pressing a progress card", () => {
    const { getByText } = renderNav(<HomePage />);

    fireEvent.press(getByText("Hazy IPA"));
    expect(pushMock).toHaveBeenCalledWith("/progress");
  });

  it("renders supabase popular recipes", async () => {
    const { getByText } = renderNav(<HomePage />);

    await waitFor(() => {
      expect(getByText("CalIPA - Citra Rye")).toBeTruthy();
      expect(getByText("City of the Sun IPA")).toBeTruthy();
    });
  });

  it("navigates to SpecificRecipe when recipe is pressed", async () => {
    const { getByText } = renderNav(<HomePage />);

    await waitFor(() => getByText("CalIPA - Citra Rye"));

    fireEvent.press(getByText("CalIPA - Citra Rye"));

    expect(pushMock).toHaveBeenCalledWith({
      pathname: "/SpecificRecipe",
      params: { slug: "citra-rye" },
    });
  });

  it("navigates to /Recipes when FAB is pressed", () => {
    const { getByTestId } = renderNav(<HomePage />);
    fireEvent.press(getByTestId("fab"));

    expect(pushMock).toHaveBeenCalledWith("/Recipes");
  });

  it("matches snapshot", () => {
    const tree = renderNav(<HomePage />).toJSON();
    expect(tree).toMatchSnapshot();
  });
});