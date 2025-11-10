import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import SpecificRecipe from "../app/SpecificRecipe";

// --- Mocks --- //
const mockPush = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

jest.mock("@/hooks/use-fonts", () => ({
  useFonts: () => true,
}));

jest.mock("@/components/themed-text", () => {
  const { Text } = require("react-native");
  return {
    ThemedText: ({ children, style }: any) => (
      <Text style={style}>{children}</Text>
    ),
  };
});

jest.mock("react-native-safe-area-context", () => {
  const { View } = require("react-native");
  return {
    SafeAreaView: ({ children }: any) => <View>{children}</View>,
  };
});

jest.mock("@/constants/Colors", () => ({
  BASE_COLORS: {
    LIGHT_BG: "#fafafa",
    WHITE: "#ffffff",
    TEXT_DARK: "#000000",
    TEXT_BODY: "#44403B",
    ACCENT_PRIMARY: "#B45309",
    STONE_DARK: "#0C0A09",
  },
}));

jest.mock("@/constants/Fonts", () => ({
  FontFamilies: {
    HEADING: "System",
    BODY: "System",
    BODY_BOLD: "System",
    BODY_LIGHT: "System",
  },
}));

jest.mock("@/components/ui/icon-symbol", () => {
  const { Text } = require("react-native");
  return {
    IconSymbol: ({ name }: any) => <Text testID="mock-icon">icon-{name}</Text>,
  };
});

jest.mock("react-native-safe-area-context", () => {
  const { View } = require("react-native");
  return {
    SafeAreaView: ({ children }: any) => <View>{children}</View>,
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  };
});

// --- Tests --- //
describe("<SpecificRecipe />", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders the title correctly", () => {
    const { getByText } = render(<SpecificRecipe />);
    expect(getByText("IJ IPA")).toBeTruthy();
  });

  it("renders the rating correctly", () => {
    const { getByText } = render(<SpecificRecipe />);
    expect(getByText("4.8/5")).toBeTruthy();
    expect(getByText("(265 reviews)")).toBeTruthy();
  });

  it("renders the 'Ingredients:' section", () => {
    const { getByText } = render(<SpecificRecipe />);
    expect(getByText("Ingredients:")).toBeTruthy();
  });

  it("renders the Start Brewing button", () => {
    const { getByText } = render(<SpecificRecipe />);
    expect(getByText("Start Brewing")).toBeTruthy();
  });

  it("navigates to /progress when Start Brewing is pressed", () => {
    const { getByText } = render(<SpecificRecipe />);
    const button = getByText("Start Brewing");

    fireEvent.press(button);

    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith("../progress");
  });

  it("matches the snapshot", () => {
    const tree = render(<SpecificRecipe />).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
