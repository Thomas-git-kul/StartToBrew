// __tests__/Registration.test.tsx

import React from "react";
import { render, fireEvent } from "@testing-library/react-native";

// 1. AsyncStorage mock zodat client.native geen NativeModule error triggert
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

// 2. Supabase mocken zodat createClient NIET met env vars runt
jest.mock("@/supabase", () => ({
  supabase: {
    auth: {
      signUp: jest.fn().mockResolvedValue({
        data: { session: null }, // triggert "Check your inbox..." pad
        error: null,
      }),
    },
  },
}));

// 3. Router mocken zodat router.replace geen echte navigatie nodig heeft
jest.mock("expo-router", () => ({
  router: {
    replace: jest.fn(),
    push: jest.fn(),
    back: jest.fn(),
  },
}));

// 4. Andere UI afhankelijke dingen mocken

jest.mock("expo-checkbox", () => {
  const { Text } = require("react-native");
  return ({ value, onValueChange }: any) => (
    <Text onPress={() => onValueChange(!value)}>
      checkbox-{value ? "checked" : "unchecked"}
    </Text>
  );
});

jest.mock("react-native-safe-area-context", () => {
  const { View } = require("react-native");
  return {
    SafeAreaView: ({ children }: any) => <View>{children}</View>,
  };
});

jest.mock("@/constants/Colors", () => ({
  BASE_COLORS: {
    WHITE: "#fff",
    LIGHT_BG: "#fafafa",
    TEXT_DARK: "#000",
    TEXT_BODY: "#111",
    ACCENT_PRIMARY: "#f00",
    STONE_DARK: "#333",
  },
}));

jest.mock("@/constants/Fonts", () => ({
  FontFamilies: {
    HEADING: "System",
    BODY: "System",
    BODY_BOLD: "System",
  },
}));

// 5. Pas NA alle mocks de component importeren
import Registration from "../app/Registration";

describe("<Registration />", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders the title correctly", () => {
    const { getByText } = render(<Registration />);
    expect(getByText("No account yet? Register here!")).toBeTruthy();
  });

  it("renders all main labels correctly", () => {
    const { getByText } = render(<Registration />);

    expect(getByText("Lastname")).toBeTruthy();
    expect(getByText("Firstname")).toBeTruthy();
    expect(getByText("Day")).toBeTruthy();
    expect(getByText("Month")).toBeTruthy();
    expect(getByText("Year")).toBeTruthy();
    expect(getByText("Email")).toBeTruthy();
    expect(getByText("Username")).toBeTruthy();
    expect(getByText("Password")).toBeTruthy();
    expect(getByText("Confirm Password")).toBeTruthy();
  });

  it("renders the checkbox and toggles it", () => {
    const { getByText } = render(<Registration />);
    const checkbox = getByText("checkbox-unchecked");
    fireEvent.press(checkbox);
    expect(getByText("checkbox-checked")).toBeTruthy();
  });

  it("renders the create account button", () => {
    const { getByText } = render(<Registration />);
    expect(getByText("Create account")).toBeTruthy();
  });

  it("matches the snapshot", () => {
    const tree = render(<Registration />).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
