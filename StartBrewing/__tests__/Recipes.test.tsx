import { render, fireEvent, waitFor } from "@testing-library/react-native";
import Recipes from "../app/(tabs)/Recipes";
import { useRouter } from "expo-router";

/* --------------------------------
   MOCKS
-------------------------------- */

// Mock router
jest.mock("expo-router", () => ({
  useRouter: jest.fn(),
}));

// Mock useFonts
jest.mock("@/hooks/use-fonts", () => ({
  useFonts: jest.fn(),
}));

// Mock Header
jest.mock("@/components/header", () => {
  const { Text } = require("react-native");
  return ({ title }: any) => <Text>{title}</Text>;
});

// Mock BeerCard with onPress
jest.mock("@/components/ui/RecipeCard", () => {
  const { Text, Pressable } = require("react-native");
  return ({ name, onPress }: any) => (
    <Pressable onPress={onPress}>
      <Text>{name}</Text>
    </Pressable>
  );
});

// Mock Supabase data
jest.mock("../supabase", () => ({
  supabase: {
    from: () => ({
      select: () => ({
        limit: () => ({
          data: [
            {
              recipe_slug: "citra-rye",
              name: "CalIPA - Citra Rye",
              description: "Desc",
              rating: 4,
            },
            {
              recipe_slug: "city-of-sun",
              name: "City of the Sun IPA",
              description: "Desc",
              rating: 5,
            },
            {
              recipe_slug: "black-nitro",
              name: "Black Nitro IPA",
              description: "Desc",
              rating: 3,
            }
          ],
          error: null
        }),
      }),
    }),
  },
}));

describe("Recipes screen", () => {
  const pushMock = jest.fn();

  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({ push: pushMock });
    pushMock.mockClear();
  });

  it("renders header, searchbar, and recipes", async () => {
    const { getByText, getByPlaceholderText } = render(<Recipes />);

    expect(getByText("Recipes")).toBeTruthy();
    expect(getByPlaceholderText("Search")).toBeTruthy();

    await waitFor(() => {
      expect(getByText("CalIPA - Citra Rye")).toBeTruthy();
      expect(getByText("City of the Sun IPA")).toBeTruthy();
      expect(getByText("Black Nitro IPA")).toBeTruthy();
    });
  });

  it("filters recipes based on search query", async () => {
    const { getByPlaceholderText, queryByText } = render(<Recipes />);

    await waitFor(() => queryByText("CalIPA - Citra Rye"));

    const searchInput = getByPlaceholderText("Search");

    fireEvent.changeText(searchInput, "Black");

    expect(queryByText("CalIPA - Citra Rye")).toBeNull();
    expect(queryByText("City of the Sun IPA")).toBeNull();
    expect(queryByText("Black Nitro IPA")).toBeTruthy();
  });

  it("clears search when empty string is typed", async () => {
    const { getByPlaceholderText, getByText } = render(<Recipes />);

    const searchInput = getByPlaceholderText("Search");

    await waitFor(() => getByText("CalIPA - Citra Rye"));

    fireEvent.changeText(searchInput, "City");

    expect(getByText("City of the Sun IPA")).toBeTruthy();

    fireEvent.changeText(searchInput, "");

    expect(getByText("CalIPA - Citra Rye")).toBeTruthy();
    expect(getByText("City of the Sun IPA")).toBeTruthy();
    expect(getByText("Black Nitro IPA")).toBeTruthy();
  });

  it("navigates to SpecificRecipe when a beer card is pressed", async () => {
    const { getByText } = render(<Recipes />);

    await waitFor(() => getByText("CalIPA - Citra Rye"));

    fireEvent.press(getByText("CalIPA - Citra Rye"));

    expect(pushMock).toHaveBeenCalledWith({
      pathname: "/SpecificRecipe",
      params: { slug: "citra-rye" }
    });
  });

  it("matches snapshot", async () => {
    const tree = render(<Recipes />).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
