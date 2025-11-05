import React from "react";
import { render } from "@testing-library/react-native";
import Recipes from "../app/(tabs)/Recipes";

// --- 🧩 MOCKS --- //

// Mock Expo Router
jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock ThemedText → vervang door gewoon <Text>
jest.mock("@/components/themed-text", () => {
  const { Text } = require("react-native");
  return {
    ThemedText: ({ children, style }: any) => <Text style={style}>{children}</Text>,
  };
});

// Mock SafeAreaView
jest.mock("react-native-safe-area-context", () => {
  const { View } = require("react-native");
  return {
    SafeAreaView: ({ children }: any) => <View>{children}</View>,
  };
});

// Mock Colors & Fonts constants
jest.mock("@/constants/Colors", () => ({
  BASE_COLORS: {
    WHITE: "#fff",
    TEXT_DARK: "#000",
  },
}));

jest.mock("@/constants/Fonts", () => ({
  FontFamilies: {
    HEADING: "System",
    BODY: "System",
  },
}));

// Mock asset requires
jest.mock("@/assets/images/default-beer.png", () => "mock-image-path", { virtual: true });

interface BeerCardProps {
  name: string;
  rating: number;
  reviews: number;
  image: any;
  description: string;
}

// Mock BeerCard zodat we kunnen testen dat hij 3x gerenderd wordt
const MockBeerCard = jest.fn((props: BeerCardProps) => null);
jest.mock("@/components/ui/IPAcomponent", () => (props: BeerCardProps) => {
  MockBeerCard(props);
  return null;
});

// --- 🧪 TESTS --- //
describe("<Recipes />", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the main titles correctly", () => {
    const { getAllByText, getByText } = render(<Recipes />);

    // Controleer of de titels zichtbaar zijn
    const recipesTexts = getAllByText("Recipes");
    expect(recipesTexts.length).toBe(2); // Verwacht exact 2 'Recipes' teksten
    expect(getByText("Popular Recipes")).toBeTruthy();

    // Test of de hoofdtitel de juiste stijl heeft
    expect(recipesTexts[0].props.style).toEqual(expect.objectContaining({ 
      fontSize: 50,
      fontFamily: "System" 
    }));
  });

  it("renders exactly three BeerCard components", () => {
    render(<Recipes />);
    expect(MockBeerCard).toHaveBeenCalledTimes(3);
  });

  it("passes correct props to the first BeerCard", () => {
    render(<Recipes />);
    const calls = MockBeerCard.mock.calls;
    expect(calls.length).toBeGreaterThan(0);
    
    const firstCall = calls[0][0] as BeerCardProps;
    expect(firstCall.name).toBe("IJ IPA");
    expect(firstCall.rating).toBe(4.8);
    expect(firstCall.reviews).toBe(256);
    expect(firstCall.description).toContain("bitterness");
  });

  it("passes correct beer names to all BeerCards", () => {
    render(<Recipes />);
    const calls = MockBeerCard.mock.calls;
    const beerNames = calls.map((call) => (call[0] as BeerCardProps).name);
    expect(beerNames).toEqual(["IJ IPA", "Voodoo Ranger", "Two Hearted IPA"]);
  });

  it("matches snapshot for layout consistency", () => {
    const tree = render(<Recipes />).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
