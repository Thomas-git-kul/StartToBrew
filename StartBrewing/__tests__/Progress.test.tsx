import React from "react";
import { render, fireEvent, waitFor, act } from "@testing-library/react-native";
import { NavigationContainer } from "@react-navigation/native";
import Progress from "../app/progress";
import {View} from 'react-native';

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
  getItem: jest.fn(() =>
    Promise.resolve(
      JSON.stringify({
        "2025-11-10": [
          { name: "Phase 1: Mash", done: true },
          { name: "Phase 2: Boil", done: false },
        ],
      })
    )
  ),
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
    const { getByText } = renderWithNavigation(<Progress />);

    await act(async () => {
      await waitFor(() => {
        expect(getByText("Progress")).toBeTruthy();
        expect(getByText("To do")).toBeTruthy();
        expect(getByText("Phase 1: Mash")).toBeTruthy();
        expect(getByText("Phase 2: Boil")).toBeTruthy();
      });
    });
  });

  it("renders the progress percentage and bar", async () => {
    const { getByText, getByTestId } = renderWithNavigation(<Progress />);

    await act(async () => {
      await waitFor(() => {
        expect(getByText(/\d+%/)).toBeTruthy();
        expect(getByTestId("progress-bar")).toBeTruthy();
      });
    });
  });

  it("toggles a step when pressed", async () => {
    const { getByText } = renderWithNavigation(<Progress />);

    await waitFor(() => {
      expect(getByText("Bring to boil")).toBeTruthy();
    });

    const step = getByText("Bring to boil");

    await act(async () => {
      fireEvent.press(step);
    });

    await waitFor(() => {
      // controleer of toggle een line-through en opacity toepast
      expect(step.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            textDecorationLine: "line-through",
            opacity: 0.5,
          }),
        ])
      );
    });
  });

  it("matches snapshot", async () => {
    const tree = renderWithNavigation(<Progress />).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
