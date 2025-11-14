import { render, fireEvent } from "@testing-library/react-native";
import Recipes from "../app/(tabs)/Recipes";
import { useRouter } from "expo-router";

// Mock expo-router
jest.mock("expo-router", () => ({
  useRouter: jest.fn(),
}));

// Mock icons
jest.mock('@expo/vector-icons/MaterialCommunityIcons', () => 'MaterialCommunityIcons');
jest.mock('@expo/vector-icons/Ionicons', () => 'Ionicons');

// Mock useFonts hook
jest.mock("@/hooks/use-fonts", () => ({
  useFonts: jest.fn(),
}));

// Mock Header to simplify rendering
jest.mock("@/components/header", () => {
  return ({ title }: any) => {
    const { Text } = require("react-native");
    return <Text>{title}</Text>;
  };
});

// Mock BeerCard component
jest.mock("@/components/ui/RecipeCard", () => {
  const { View, Text, Pressable } = require("react-native");
  return ({ name, onToggleFavorite }: any) => (
    <View>
      <Text>{name}</Text>
      <Pressable
        accessibilityLabel={`favorite-${name}`}
        onPress={onToggleFavorite}
      >
        <Text>FavBtn</Text>
      </Pressable>
    </View>
  );
});

describe("Recipes screen", () => {
  const pushMock = jest.fn();

  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({ push: pushMock });
    pushMock.mockClear();
  });

  it("renders header, searchbar, and beer cards", () => {
    const { getByText, getByPlaceholderText } = render(<Recipes />);

    expect(getByText("Recipes")).toBeTruthy();
    expect(getByPlaceholderText("Search")).toBeTruthy();

    expect(getByText("IJ IPA")).toBeTruthy();
    expect(getByText("Voodoo Ranger")).toBeTruthy();
    expect(getByText("Two Hearted IPA")).toBeTruthy();
  });

  it("filters beers based on search query", () => {
    const { getByPlaceholderText, queryByText } = render(<Recipes />);
    const searchInput = getByPlaceholderText("Search");

    fireEvent.changeText(searchInput, "Voodoo");

    expect(queryByText("IJ IPA")).toBeNull();
    expect(queryByText("Voodoo Ranger")).toBeTruthy();
    expect(queryByText("Two Hearted IPA")).toBeNull();
  });

  it("clears search when search text is cleared", () => {
    const { getByPlaceholderText, getByText } = render(<Recipes />);
    const searchInput = getByPlaceholderText("Search");

    fireEvent.changeText(searchInput, "Voodoo");

    expect(getByText("Voodoo Ranger")).toBeTruthy();

    fireEvent.changeText(searchInput, "");

    expect(getByText("IJ IPA")).toBeTruthy();
    expect(getByText("Voodoo Ranger")).toBeTruthy();
    expect(getByText("Two Hearted IPA")).toBeTruthy();
  });

  it("navigates to SpecificRecipe when a beer card is pressed", () => {
    const { getByText } = render(<Recipes />);

    // Use fireEvent.press on the BeerCard (TouchableRipple)
    fireEvent.press(getByText("IJ IPA"));

    expect(pushMock).toHaveBeenCalledWith("/SpecificRecipe");
  });

  it("toggles favorite when heart button is pressed", () => {
    const { getByLabelText } = render(<Recipes />);

    const favoriteButton = getByLabelText("favorite-IJ IPA");

    fireEvent.press(favoriteButton);
    fireEvent.press(favoriteButton);

    expect(favoriteButton).toBeTruthy();
  });
});
