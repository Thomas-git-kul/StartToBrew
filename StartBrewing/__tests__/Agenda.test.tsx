import React from "react";
import { render, fireEvent, waitFor, act } from "@testing-library/react-native";
import { NavigationContainer } from "@react-navigation/native";
import Agenda from "../app/(tabs)/Agenda";

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

jest.mock("react-native-safe-area-context", () => {
  const { View } = require("react-native");
  return {
    SafeAreaView: ({ children }: any) => <View>{children}</View>,
  };
});

const FIXED_DATE = new Date("2025-11-10T12:00:00Z");
jest.spyOn(global, "Date").mockImplementation(() => FIXED_DATE) as unknown as jest.SpyInstance<Date, []>;

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

jest.mock("expo-checkbox", () => {
  const { TouchableOpacity, Text } = require("react-native");
  return ({ value, onValueChange }: any) => (
    <TouchableOpacity onPress={onValueChange}>
      <Text>{value ? "☑️" : "⬜"}</Text>
    </TouchableOpacity>
  );
});

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn((key: string) => {
    return Promise.resolve(JSON.stringify({
      [key]: [
        { name: "Phase 1: Mash", done: false },
        { name: "Phase 2: Boil", done: false },
      ],
    }));
  }),
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

global.requestAnimationFrame = (cb) => setTimeout(cb, 0) as unknown as number;

const renderWithNavigation = (ui: React.ReactElement) =>
  render(<NavigationContainer>{ui}</NavigationContainer>);

// --- Tests --- //
describe("<Agenda />", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders the title and main sections", async () => {
    const { getByText } = renderWithNavigation(<Agenda />);

    await act(async () => {
        await waitFor(() => {
            expect(getByText("Agenda")).toBeTruthy();
            expect(getByText("Today")).toBeTruthy();
            expect(getByText("Progress")).toBeTruthy();
            expect(getByText("To do")).toBeTruthy();
        });
    });
  });

  it("navigates to /progress when Progress button is pressed", async () => {
    const { getByText } = renderWithNavigation(<Agenda />);
    const progressButton = getByText("Progress");

    await act(async () => {
        fireEvent.press(progressButton);
    });
    

    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith("/progress");
  });

  it("toggles a checkbox when pressed", async () => {
  const { getAllByText, getByText } = renderWithNavigation(<Agenda />);

  // Wacht tot de fases geladen en gerenderd zijn
  await waitFor(() => {
    expect(getByText("Phase 1: Mash")).toBeTruthy();
  });

  const firstCheckbox = getAllByText("⬜")[0];

  await act(async () => {
    fireEvent.press(firstCheckbox);
  });

  // Controleer dat checkbox is veranderd
  await waitFor(() => {
    expect(getAllByText("☑️").length).toBeGreaterThanOrEqual(1);
  });
});

/*
  it("toggles a checkbox when pressed", async () => {
    const { getAllByText, getByText } = renderWithNavigation(<Agenda />);

    // Wacht even tot de fases gerenderd zijn
    await waitFor(async () => {
        const phaseText = await getByText("Phase 1: Mash");
        expect(phaseText).toBeTruthy();
    });

    const firstCheckbox = getAllByText("⬜")[0];
    await act(async () => {
        fireEvent.press(firstCheckbox);
    });
    

    // Checkbox zou moeten togglen (waarde verandert in de mock)
    await waitFor(() => {
      expect(getAllByText("☑️").length).toBeGreaterThanOrEqual(1);
    });
  });
  */

  it("renders a mock calendar", async () => {
    const { getByText } = renderWithNavigation(<Agenda />);
    await waitFor(() => expect(getByText(/Mock Calendar/)).toBeTruthy());
  });

  it("matches snapshot", async () => {
    const tree = renderWithNavigation(<Agenda />).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
