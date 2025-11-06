import React from "react";
import { render, fireEvent, waitFor, act } from "@testing-library/react-native";
import { NavigationContainer } from "@react-navigation/native";
import Progress from "../app/progress";
import { View } from 'react-native';

// --- Mocks --- //
const mockPush = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

jest.mock("@/components/themed-text", () => {
  const { Text } = require("react-native");
  return {
    ThemedText: ({ children, style }: any) => <Text style={style}>{children}</Text>,
  };
});

jest.mock("@/hooks/use-fonts", () => ({
  useFonts: () => true, // fontsLoaded = true
}));

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
}));

jest.mock("@/constants/Colors", () => ({
  BASE_COLORS: {
    WHITE: "#fff",
    TEXT_DARK: "#000",
    ACCENT_PRIMARY: "#f00",
  },
}));

jest.mock("@/constants/Fonts", () => ({
  FontFamilies: {
    HEADING: "System",
    BODY: "System",
    BODY_LIGHT: "System",
  },
}));

jest.mock("react-native-paper", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    ProgressBar: ({ testID, progress, color, style }: any) => (
      <View testID={testID} style={style} />
    ),
  };
});

global.requestAnimationFrame = (cb) => setTimeout(cb, 0) as unknown as number;

const renderWithNavigation = (ui: React.ReactElement) =>
  render(<NavigationContainer>{ui}</NavigationContainer>);

export const ProgressBar = ({testID}: {testID?: string}) => <View testID={testID} />

// --- Tests --- //
describe("<Progress />", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders the header and phases", async () => {
    const { findByText } = renderWithNavigation(<Progress />);

    expect(await findByText("Progress")).toBeTruthy();
    expect(await findByText("To do")).toBeTruthy();
    expect(await findByText("Phase 1: Mash")).toBeTruthy();
    expect(await findByText("Phase 2: Boil")).toBeTruthy();
  });

  it("renders the progress percentage and bar", async () => {
    const { findByText, findByTestId } = renderWithNavigation(<Progress />);

    // 4 completed steps out of 15 total = 27%
    expect(await findByText("27%")).toBeTruthy();
    expect(await findByTestId("progress-bar")).toBeTruthy();
  });

  it("toggles a step when pressed", async () => {
    const { findByText } = renderWithNavigation(<Progress />);

    const step = await findByText("Bring to boil");
    
    // Initial state
    expect(step.props.style).not.toContainEqual(
      expect.objectContaining({
        textDecorationLine: "line-through",
        opacity: 0.5,
      })
    );

    // Press the step
    fireEvent.press(step);

    // Check if style was updated
    expect(step.props.style).toContainEqual(
      expect.objectContaining({
        textDecorationLine: "line-through",
        opacity: 0.5,
      })
    );
  });

  it("matches snapshot", async () => {
    const tree = renderWithNavigation(<Progress />).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
