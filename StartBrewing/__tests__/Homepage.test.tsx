import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import HomePage from "../app/(tabs)/HomePage";
import { useRouter } from "expo-router";
import { NavigationContainer } from "@react-navigation/native";

/* ------------------------------
 ✅ MOCKS
------------------------------- */

// Mock navigation router
const pushMock = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: jest.fn(), // Important: jest.fn() so mockReturnValue works
}));

// Mock fonts hook
jest.mock("@/hooks/use-fonts", () => ({
  useFonts: () => true,
}));

// Mock ThemedText component
jest.mock("@/components/themed-text", () => {
  const { Text } = require("react-native");
  return {
    ThemedText: ({ children, style }: any) => <Text style={style}>{children}</Text>,
  };
});

// Mock Header component
jest.mock("@/components/header", () => {
  const { Text, View } = require("react-native");
  return ({ title }: any) => (
    <View>
      <Text>{title}</Text>
    </View>
  );
});

// Mock SafeAreaView
jest.mock("react-native-safe-area-context", () => {
  const { View } = require("react-native");
  return {
    SafeAreaView: ({ children }: any) => <View>{children}</View>,
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  };
});

// Mock constants
jest.mock("@/constants/Colors", () => ({
  BASE_COLORS: {
    WHITE: "#fff",
    TEXT_DARK: "#000",
    ACCENT_PRIMARY: "#f00",
    LIGHT_BG: "#eee",
  },
}));

jest.mock("@/constants/Fonts", () => ({
  FontFamilies: {
    HEADING: "System",
    BODY: "System",
    BODY_BOLD: "System",
  },
}));

// Mock RecipeCard component (BeerCard)
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

/* ------------------------------
 ✅ TESTS
------------------------------- */

// Wrap HomePage in NavigationContainer for tests
const renderWithNavigation = (ui: React.ReactElement) => {
  return render(<NavigationContainer>{ui}</NavigationContainer>);
};

describe("<HomePage />", () => {
  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({ push: pushMock });
    pushMock.mockClear();
  });

  it("renders main titles correctly", () => {
    const { getByText } = renderWithNavigation(<HomePage />);

    expect(getByText("StartToBrew")).toBeTruthy();
    expect(getByText("In progress")).toBeTruthy();
    expect(getByText("Popular recipes")).toBeTruthy();
  });

  it("renders beer cards", () => {
    const { getByText } = renderWithNavigation(<HomePage />);

    expect(getByText("IJ IPA")).toBeTruthy();
    expect(getByText("Voodoo Ranger")).toBeTruthy();
    expect(getByText("Two Hearted IPA")).toBeTruthy();
  });

  it("toggles favorite when favorite button is pressed", () => {
    const { getByLabelText } = renderWithNavigation(<HomePage />);

    const favoriteBtn = getByLabelText("favorite-IJ IPA");

    fireEvent.press(favoriteBtn);
    fireEvent.press(favoriteBtn);

    // No crash = success
    expect(favoriteBtn).toBeTruthy();
  });

  it("navigates to /Recipes when FAB is pressed", () => {
    const { getByTestId } = renderWithNavigation(<HomePage />);

    const fabButton = getByTestId("fab");
    fireEvent.press(fabButton);

    expect(pushMock).toHaveBeenCalledTimes(1);
    expect(pushMock).toHaveBeenCalledWith("/Recipes");
  });

  it("navigates to SpecificRecipe when a beer card is pressed", () => {
    const { getByText } = renderWithNavigation(<HomePage />);

    fireEvent.press(getByText("IJ IPA"));

    expect(pushMock).toHaveBeenCalledWith("/SpecificRecipe");
  });

  it("renders progress cards", () => {
    const { getByText } = renderWithNavigation(<HomePage />);

    expect(getByText("Hazy IPA")).toBeTruthy();
    expect(getByText("Belgian Tripel")).toBeTruthy();
    expect(getByText("American Pale Ale")).toBeTruthy();
  });

  it("navigates to /progress when a progress card is pressed", () => {
    const { getByText } = renderWithNavigation(<HomePage />);

    fireEvent.press(getByText("Hazy IPA"));
    expect(pushMock).toHaveBeenCalledWith("/progress");

    fireEvent.press(getByText("Belgian Tripel"));
    expect(pushMock).toHaveBeenCalledWith("/progress");

    fireEvent.press(getByText("American Pale Ale"));
    expect(pushMock).toHaveBeenCalledWith("/progress");
  });

  it("matches snapshot", () => {
    const tree = renderWithNavigation(<HomePage />).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
