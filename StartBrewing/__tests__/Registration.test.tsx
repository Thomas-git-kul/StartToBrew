import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import Registration from "../app/Registration";

// --- Mocks --- //
jest.mock("expo-checkbox", () => {
  const { View, Text } = require("react-native");
  return ({ value, onValueChange }: any) =>
    <Text onPress={() => onValueChange(!value)}>
      checkbox-{value ? "checked" : "unchecked"}
    </Text>;
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

// --- Tests --- //
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
    expect(checkbox).toBeTruthy();

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
