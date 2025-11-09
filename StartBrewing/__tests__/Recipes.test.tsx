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
});
