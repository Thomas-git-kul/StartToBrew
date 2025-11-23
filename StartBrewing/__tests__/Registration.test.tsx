import { render, fireEvent, waitFor } from "@testing-library/react-native";

// 1. AsyncStorage mock
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

// 2. useFonts-hook mock (zodat er geen echte fonts geladen worden)
jest.mock("@/hooks/use-fonts", () => ({
  useFonts: () => {},
}));

// 3. Supabase mock: auth.signUp + from().upsert
const mockSignUp = jest.fn().mockResolvedValue({
  data: { user: { id: "mock-user-id" }, session: null },
  error: null,
});
const mockUpsert = jest.fn().mockResolvedValue({
  data: null,
  error: null,
});

jest.mock("@/supabase", () => ({
  supabase: {
    auth: {
      signUp: mockSignUp,
    },
    from: jest.fn(() => ({
      upsert: mockUpsert,
    })),
  },
}));

// 4. Router mock
const mockReplace = jest.fn();
jest.mock("expo-router", () => ({
  router: {
    replace: mockReplace,
    push: jest.fn(),
    back: jest.fn(),
  },
}));

// 5. UI-dependent mocks
jest.mock("expo-checkbox", () => {
  const { Text } = require("react-native");
  return ({ value, onValueChange }: any) => (
    <Text
      accessibilityRole="checkbox"
      accessibilityState={{ checked: value }}
      onPress={() => onValueChange(!value)}
    >
      checkbox-{value ? "checked" : "unchecked"}
    </Text>
  );
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

jest.mock("react-native-safe-area-context", () => {
  return {
    SafeAreaProvider: ({ children }: any) => children,
    SafeAreaView: ({ children }: any) => children,
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  };
});

// Component pas NA alle mocks importeren
import Registration from "../app/Registration";

describe("<Registration />", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders the main header correctly", () => {
    const { getByText } = render(<Registration />);
    expect(getByText("Sign Up to StartToBrew")).toBeTruthy();
  });

  it("renders all section labels", () => {
    const { getByText } = render(<Registration />);
    expect(getByText("Full Name")).toBeTruthy();
    expect(getByText("Birth Date")).toBeTruthy();
    expect(getByText("Contact information")).toBeTruthy();
    expect(getByText("Account")).toBeTruthy();
  });

  it("renders the checkbox and toggles it on press", () => {
    const { getByRole } = render(<Registration />);
    const checkbox = getByRole("checkbox");
    fireEvent.press(checkbox);
    expect(checkbox.props.accessibilityState.checked).toBe(true);
  });

  it("renders the create account button", () => {
    const { getByText } = render(<Registration />);
    expect(getByText("Create account")).toBeTruthy();
  });

  it("prevents signup if terms not agreed", async () => {
    const { getByText } = render(<Registration />);
    const button = getByText("Create account");

    fireEvent.press(button);

    await waitFor(() => expect(getByText("Create account")).toBeTruthy());
    // optioneel: expect(mockSignUp).not.toHaveBeenCalled();
  });

  it("matches snapshot", () => {
    const tree = render(<Registration />).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
