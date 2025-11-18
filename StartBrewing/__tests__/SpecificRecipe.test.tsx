import React from "react";
import { render, fireEvent, act, waitFor } from "@testing-library/react-native";
import { NavigationContainer } from "@react-navigation/native";
import SpecificRecipe from "../app/SpecificRecipe";
import { useRouter, useLocalSearchParams } from "expo-router";

// --------------------------
// Mock expo-router
// --------------------------
const pushMock = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: jest.fn(),
  useLocalSearchParams: jest.fn(),
}));

// --------------------------
// Mock Supabase
// --------------------------
jest.mock("../supabase", () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({
            data: {
              name: "Test Beer",
              description: "A very tasty beer",
              rating: 4.8,
            },
            error: null,
          }),
        }),
      }),
    }),
  },
}));

// --------------------------
// Mock useFonts
// --------------------------
jest.mock("@/hooks/use-fonts", () => ({
  useFonts: () => true,
}));

// --------------------------
// Mock ThemedText
// --------------------------
jest.mock("@/components/themed-text", () => {
  const { Text } = require("react-native");
  return { ThemedText: ({ children }: any) => <Text>{children}</Text> };
});

// --------------------------
// Mock SafeAreaView
// --------------------------
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
    STONE300: "#E5E7EB",
  },
}));

jest.mock("@/constants/Fonts", () => ({
  FontFamilies: { BODY: "System" },
}));

// --------------------------
// Mock Header
// --------------------------
jest.mock("@/components/header", () => {
  const { Text } = require("react-native");
  return ({ title }: any) => <Text>{title}</Text>;
});

// --------------------------
// Mock react-native-paper
// --------------------------
jest.mock("react-native-paper", () => {
  const { View, Text, TouchableOpacity } = require("react-native");
  return {
    FAB: ({ label, onPress }: any) => (
      <TouchableOpacity onPress={onPress}>
        <Text>{label}</Text>
      </TouchableOpacity>
    ),
    Portal: ({ children }: any) => <>{children}</>,
    Modal: ({ visible, children }: any) => (visible ? <View>{children}</View> : null),
  };
});

// --------------------------
// Helper render wrapper
// --------------------------
const renderWithNav = (ui: React.ReactElement) =>
  render(<NavigationContainer>{ui}</NavigationContainer>);

// --------------------------
// TESTS
// --------------------------
describe("<SpecificRecipe />", () => {
  beforeEach(() => {
    pushMock.mockClear();
    (useRouter as jest.Mock).mockReturnValue({ push: pushMock });
    (useLocalSearchParams as jest.Mock).mockReturnValue({ slug: "test-slug" });
  });

  afterEach(() => {
    // cleanup
  });

  it("renders recipe title from supabase", async () => {
    const { getByText } = renderWithNav(<SpecificRecipe />);

    await waitFor(() => expect(getByText("Test Beer")).toBeTruthy());
  });

  it("shows rating correctly", async () => {
    const { getByText } = renderWithNav(<SpecificRecipe />);

    await waitFor(() => {
      expect(getByText("4.8 / 5")).toBeTruthy();
      expect(getByText("(0 reviews)")).toBeTruthy();
    });
  });

  it("navigates to progress on Start Brewing press", async () => {
    const { getByText } = renderWithNav(<SpecificRecipe />);
    await waitFor(() => getByText("Start Brewing"));
    fireEvent.press(getByText("Start Brewing"));
    expect(pushMock).toHaveBeenCalledWith("../progress");
  });

  it("opens modal and selects a rating", async () => {
    const { getByText, getAllByTestId, queryByText } = renderWithNav(<SpecificRecipe />);

    // wait until loading is finished and the Add Review button is present
    await waitFor(() => getByText("Add Review"));

    expect(queryByText("Rate this recipe")).toBeNull();

    fireEvent.press(getByText("Add Review"));
    expect(getByText("Rate this recipe")).toBeTruthy();

    const stars = getAllByTestId(/star-/);

      await act(async () => {
        fireEvent.press(stars[2]);
        await new Promise((res) => setTimeout(res, 350));
      });

      expect(queryByText("Rate this recipe")).toBeNull();

    expect(queryByText("Rate this recipe")).toBeNull();
  });

  it("matches snapshot", () => {
    const tree = renderWithNav(<SpecificRecipe />).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
