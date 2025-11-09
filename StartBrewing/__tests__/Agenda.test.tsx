import React from "react";
import { render, fireEvent, waitFor, act } from "@testing-library/react-native";
import { NavigationContainer } from "@react-navigation/native";
import Agenda from "../app/(tabs)/Agenda";

// --- Mocks --- //
jest.mock("@/hooks/use-fonts", () => ({
  useFonts: () => true, // ✅ Avoided early return
}));

jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

jest.mock("@/components/themed-text", () => {
  const { Text } = require("react-native");
  return {
    ThemedText: ({ children }: any) => <Text>{children}</Text>,
  };
});

jest.mock("react-native-safe-area-context", () => {
  const { View } = require("react-native");
  return {
    SafeAreaView: ({ children }: any) => <View>{children}</View>,
  };
});

// Fix static date for Calendar + hook logic
const FIXED_DATE = new Date("2025-11-10T12:00:00Z");
jest.spyOn(global, "Date").mockImplementation(() => FIXED_DATE) as unknown as jest.SpyInstance<
  Date,
  []
>;

// Calendar mock
jest.mock("react-native-calendars", () => {
  const { View, Text, TouchableOpacity } = require("react-native");
  return {
    Calendar: ({ current, onDayPress }: any) => (
      <TouchableOpacity onPress={() => onDayPress({ dateString: current })}>
        <Text>Mock Calendar ({current})</Text>
      </TouchableOpacity>
    ),
  };
});

// AsyncStorage mock
jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(() => Promise.resolve(null)), // return null = first load uses initialPhases
  setItem: jest.fn(() => Promise.resolve()),
}));

jest.mock("@/constants/Colors", () => ({
  BASE_COLORS: {
    WHITE: "#fff",
    ACCENT_PRIMARY: "#f00",
    LIGHT_BG: "#eee",
  },
}));

jest.mock("@/constants/Fonts", () => ({
  FontFamilies: {},
}));

jest.mock("react-native-paper", () => {
  const { View, Text, TouchableOpacity } = require("react-native");

  return {
    Appbar: {
      Header: ({ children, style }: any) => <View style={style}>{children}</View>,
      Content: ({ title, titleStyle, ...props }: any) => (
        <View {...props}><Text style={titleStyle}>{title}</Text></View>
      ),
      Action: ({ onPress, icon }: any) => (
        <TouchableOpacity onPress={onPress}>
          {typeof icon === "function" ? icon() : <Text>{icon}</Text>}
        </TouchableOpacity>
      ),
    },
    Surface: ({ children }: any) => <View>{children}</View>,
    Text: ({ children }: any) => <Text>{children}</Text>,
  };
});

jest.mock("expo-checkbox", () => {
  const { TouchableOpacity, Text } = require("react-native");

  return ({ value, onValueChange }: any) => (
    <TouchableOpacity onPress={() => onValueChange(!value)}>
      <Text>{value ? "☑️" : "⬜"}</Text>
    </TouchableOpacity>
  );
});

global.requestAnimationFrame = (cb) => setTimeout(cb, 0) as unknown as number;

const renderWithNav = (ui: React.ReactElement) =>
  render(<NavigationContainer>{ui}</NavigationContainer>);

// === TESTS === //
describe("<Agenda />", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders title + todo section", async () => {
    const { getByText } = renderWithNav(<Agenda />);

    await waitFor(() => {
      expect(getByText("Agenda")).toBeTruthy();
      expect(getByText("To do")).toBeTruthy();
    });
  });

  it("renders the mock calendar", async () => {
    const { getByText } = renderWithNav(<Agenda />);
    await waitFor(() => expect(getByText(/Mock Calendar/)).toBeTruthy());
  });

  it("toggles a checkbox when pressed", async () => {
    const { getByText, getAllByText } = renderWithNav(<Agenda />);

    await waitFor(() => {
      expect(getByText("Phase 1: Mash")).toBeTruthy();
    });

    const firstCheckbox = getAllByText("⬜")[0];

    act(() => {
      fireEvent.press(firstCheckbox);
    });

    await waitFor(() => {
      expect(getAllByText("☑️").length).toBeGreaterThan(0);
    });
  });

  it("matches snapshot", async () => {
    const tree = renderWithNav(<Agenda />).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
