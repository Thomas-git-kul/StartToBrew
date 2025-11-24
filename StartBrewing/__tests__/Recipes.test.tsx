import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import Recipes from "../app/(tabs)/Recipes";

// --- 🧩 MOCKS --- //
const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock("@/hooks/use-fonts", () => ({
  useFonts: () => [true],
}));

jest.mock("react-native-safe-area-context", () => {
  const { View } = require("react-native");
  return { SafeAreaProvider: ({ children }: any) => <View>{children}</View> };
});

interface RecipeCardProps {
  id: number;
  name: string;
  isFavorite: boolean;
  onPress?: () => void;
  onToggleFavorite?: () => void;
}
const MockRecipeCard = jest.fn((props: RecipeCardProps) => null);
jest.mock("@/components/ui/RecipeCard", () => (props: RecipeCardProps) => {
  MockRecipeCard(props);
  return null;
});

jest.mock("react-native-paper", () => {
  const React = require("react");
  const { View, Text, TextInput, Pressable } = require("react-native");

  return {
    Appbar: {
      Header: ({ children }: any) => <View>{children}</View>,
      Content: ({ title }: any) => <Text>{title}</Text>,
    },
    Searchbar: ({ placeholder, value, onChangeText, onClearIconPress }: any) => (
      <TextInput
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        testID="search-input"
      />
    ),
    View,
    Text,
    Pressable,
  };
});

// Mock beers data directly
jest.mock("../data/beers", () => ({
  beers: [
    { id: 1, name: "City of the Sun IPA", isFavorite: false },
    { id: 2, name: "Den Ballaste Point Sculpin IPA 60", isFavorite: false },
  ],
}));

// --- 🧪 TESTS --- //
describe("<Recipes />", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders header, searchbar, and recipe cards", async () => {
    const { getByText, getByTestId } = render(<Recipes />);
    await waitFor(() => {
      expect(getByText("Recipes")).toBeTruthy();
      expect(getByTestId("search-input")).toBeTruthy();
      expect(MockRecipeCard).toHaveBeenCalledTimes(2); // 2 beers
    });
  });

  it("filters beers by name", async () => {
    const { getByTestId } = render(<Recipes />);
    const searchInput = getByTestId("search-input");
    fireEvent.changeText(searchInput, "City");
    await waitFor(() => {
      expect(MockRecipeCard).toHaveBeenCalledWith(
        expect.objectContaining({ name: "City of the Sun IPA" }),
        expect.anything()
      );
      expect(MockRecipeCard).not.toHaveBeenCalledWith(
        expect.objectContaining({ name: "Den Ballaste Point Sculpin IPA 60" }),
        expect.anything()
      );
    });
  });

  it("resets search and shows all beers", async () => {
    const { getByTestId } = render(<Recipes />);
    const searchInput = getByTestId("search-input");
    fireEvent.changeText(searchInput, "City");
    fireEvent.changeText(searchInput, "");
    await waitFor(() => {
      expect(MockRecipeCard).toHaveBeenCalledWith(
        expect.objectContaining({ name: "City of the Sun IPA" }),
        expect.anything()
      );
      expect(MockRecipeCard).toHaveBeenCalledWith(
        expect.objectContaining({ name: "Den Ballaste Point Sculpin IPA 60" }),
        expect.anything()
      );
    });
  });

  it("navigates to SpecificRecipe on card press", async () => {
    const { getByTestId } = render(<Recipes />);
    const firstCard = MockRecipeCard.mock.calls[0][0];
    firstCard.onPress?.();
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(`/SpecificRecipe/${firstCard.id}`);
    });
  });

  it("toggles favorite without crashing", async () => {
    const { getByTestId } = render(<Recipes />);
    const firstCard = MockRecipeCard.mock.calls[0][0];
    firstCard.onToggleFavorite?.();
    await waitFor(() => {
      expect(firstCard.isFavorite).toBe(false); // initial mocked value
    });
  });
});
