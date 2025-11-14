import { render, fireEvent, act } from "@testing-library/react-native";
import SpecificRecipe from "../app/SpecificRecipe";

// --- Mock router --- //
const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
}));

// --- Mock fonts --- //
jest.mock("@/hooks/use-fonts", () => ({
  useFonts: () => true,
}));

// --- Mock ThemedText --- //
jest.mock("@/components/themed-text", () => {
  const { Text } = require("react-native");
  return {
    ThemedText: ({ children, style }: any) => <Text style={style}>{children}</Text>,
  };
});

// --- Mock SafeAreaView --- //
jest.mock("react-native-safe-area-context", () => {
  const { View } = require("react-native");
  return {
    SafeAreaView: ({ children }: any) => <View>{children}</View>,
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  };
});

// --- Mock Colors & Fonts --- //
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
  FontFamilies: {
    HEADING: "System",
    BODY: "System",
    BODY_BOLD: "System",
    BODY_LIGHT: "System",
  },
}));

// --- Mock Header component --- //
jest.mock("@/components/header", () => {
  const { View, Text } = require("react-native");
  return ({ title }: any) => (
    <View>
      <Text>{title}</Text>
    </View>
  );
});

// --- Mock react-native-paper --- //
jest.mock("react-native-paper", () => {
  const { View, Text, TouchableOpacity } = require("react-native");
  return {
    FAB: ({ label, onPress, style }: any) => (
      <TouchableOpacity onPress={onPress} style={style}>
        <Text>{label}</Text>
      </TouchableOpacity>
    ),
    Portal: ({ children }: any) => <>{children}</>,
    Modal: ({ visible, children }: any) => (visible ? <View>{children}</View> : null),
    Button: ({ children, onPress }: any) => (
      <TouchableOpacity onPress={onPress}>
        <Text>{children}</Text>
      </TouchableOpacity>
    ),
  };
});

// --- Tests --- //
describe("<SpecificRecipe />", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
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
    fireEvent.press(getByText("Start Brewing"));
    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith("../progress");
  });

  jest.useFakeTimers();
  it("opens the review modal and sets rating when a star is pressed", () => {
    const { getByText, queryByText, getAllByTestId } = render(<SpecificRecipe />);

    // Modal should not be visible initially
    expect(queryByText("Rate this recipe")).toBeNull();

    // Open modal
    const addReviewButton = getByText("Add Review");
    fireEvent.press(addReviewButton);
    expect(getByText("Rate this recipe")).toBeTruthy();

    // Press 3rd star wrapped in act
    const stars = getAllByTestId(/star-/);
    act(() => {
      fireEvent.press(stars[2]);

      // Advance fake timers so setTimeout runs
      jest.advanceTimersByTime(300);
    });

    // Modal should now be closed
    expect(queryByText("Rate this recipe")).toBeNull();
  });

  it("matches the snapshot", () => {
    const tree = render(<SpecificRecipe />).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
