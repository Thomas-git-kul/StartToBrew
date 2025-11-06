import React from "react";
import { render, fireEvent, act } from "@testing-library/react-native";
import Recipes from "../app/(tabs)/Recipes";

// ------------------ MOCKS ------------------ //

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock("@/components/themed-text", () => {
  const { Text } = require("react-native");
  return {
    ThemedText: ({ children, style }: any) => <Text style={style}>{children}</Text>,
  };
});

jest.mock("@/constants/Colors", () => ({
  BASE_COLORS: { WHITE: "#fff", TEXT_DARK: "#000", LIGHT_BG: "#fafafa" },
}));

jest.mock("@/constants/Fonts", () => ({
  FontFamilies: { HEADING: "System", BODY: "System" },
}));

jest.mock("@expo/vector-icons", () => ({
  Ionicons: () => null,
}));

// Mock the BeerCard UI component so we can check props
interface BeerCardProps {
  name: string;
  rating: number;
  reviews: number;
  image: any;
  description: string;
}

const MockBeerCard = jest.fn((props: BeerCardProps) => null);

jest.mock("@/components/ui/IPAcomponent", () => (props: BeerCardProps) => {
  MockBeerCard(props);
  return null;
});

// ------------------ TESTS ------------------ //

describe("<Recipes />", () => {
  beforeEach(() => jest.clearAllMocks());

  it("renders both titles 'Recipes' (screen + section)", () => {
    const { getAllByText } = render(<Recipes />);
    const titles = getAllByText("Recipes");
    expect(titles.length).toBe(2);
  });

  it("renders 3 popular + 3 all recipes → total 6 BeerCards", () => {
    render(<Recipes />);
    expect(MockBeerCard).toHaveBeenCalledTimes(6);
  });

  it("passes correct props to the first BeerCard", () => {
    render(<Recipes />);
    const first = MockBeerCard.mock.calls[0][0];

    expect(first.name).toBe("IJ IPA");
    expect(first.rating).toBe(4.8);
  });

  it("filters correctly when searching", () => {
    const screen = render(<Recipes />);
    const search = screen.getByPlaceholderText("Search");

    // clear old calls first
    MockBeerCard.mockClear();

    act(() => {
      fireEvent.changeText(search, "voodoo");
    });

    const calls = MockBeerCard.mock.calls;
    expect(calls.length).toBe(1);
    expect(calls[0][0].name).toBe("Voodoo Ranger");
  });

  it("matches snapshot", () => {
    const tree = render(<Recipes />).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
