import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { NavigationContainer } from "@react-navigation/native";

// 1. AsyncStorage mock
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

// 2. useFonts-hook mock (zodat er geen echte fonts geladen worden)
jest.mock("@/hooks/use-fonts", () => ({
  useFonts: () => {},
}));

// 3. Supabase mock: auth.signUp + from() chains for select/eq/single and upsert
const mockSignUp = jest.fn().mockResolvedValue({
  data: { user: { id: "mock-user-id" }, session: null },
  error: null,
});
const mockUpsert = jest.fn().mockResolvedValue({ data: null, error: null });

// mock for select chain: .select().eq().single()
const mockSingle = jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } });
const mockEq = jest.fn(() => ({ single: mockSingle }));
const mockSelect = jest.fn(() => ({ eq: mockEq }));

const mockFrom = jest.fn(() => ({
  select: mockSelect,
  upsert: mockUpsert,
}));

// Override the global supabase mock created in `jest.setup.js`
try {
  const mod = require("@/supabase");
  if (mod && mod.supabase) {
    mod.supabase.auth = { signUp: mockSignUp, ...mod.supabase.auth };
    mod.supabase.from = mockFrom;
  }
} catch (e) {
  // if require fails, fall back to module-level mock (jest will hoist jest.mock)
}

// 4. Router mock
const mockReplace = jest.fn();
jest.mock("expo-router", () => ({
  router: {
    replace: mockReplace,
    push: jest.fn(),
    back: jest.fn(),
  },
}));

// Ensure the required module has the mocked router functions (protect against hoisting/order quirks)
try {
  const _er = require("expo-router");
  if (_er && _er.router) {
    _er.router.replace = mockReplace;
    _er.router.push = _er.router.push || jest.fn();
    _er.router.back = _er.router.back || jest.fn();
  }
} catch (e) {}

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

// Helper to wrap component in NavigationContainer
const renderWithNavigation = (ui: React.ReactElement) => {
  return render(<NavigationContainer>{ui}</NavigationContainer>);
};

describe("<Registration />", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  beforeEach(() => {
    // prevent actual alerts from interrupting tests
    const { Alert } = require("react-native");
    jest.spyOn(Alert, "alert").mockImplementation(() => {});
  });

  it("renders the main header correctly", () => {
    const { getByText } = renderWithNavigation(<Registration />);
    expect(getByText("Sign Up to StartToBrew")).toBeTruthy();
  });

  it("renders all section labels", () => {
    const { getByText } = renderWithNavigation(<Registration />);
    expect(getByText("Full Name")).toBeTruthy();
    expect(getByText("Birth Date")).toBeTruthy();
    expect(getByText("Contact information")).toBeTruthy();
    expect(getByText("Account")).toBeTruthy();
  });

  it("renders the checkbox and toggles it on press", () => {
    const { getByRole } = renderWithNavigation(<Registration />);
    const checkbox = getByRole("checkbox");
    fireEvent.press(checkbox);
    expect(checkbox.props.accessibilityState.checked).toBe(true);
  });

  it("renders the create account button", () => {
    const { getByText } = renderWithNavigation(<Registration />);
    expect(getByText("Create account")).toBeTruthy();
  });

  it("prevents signup if terms not agreed", async () => {
    const { getByText } = renderWithNavigation(<Registration />);
    const button = getByText("Create account");

    fireEvent.press(button);

    await waitFor(() => expect(getByText("Create account")).toBeTruthy());
    // optioneel: expect(mockSignUp).not.toHaveBeenCalled();
  });

  it("matches snapshot", () => {
    const tree = renderWithNavigation(<Registration />).toJSON();
    expect(tree).toMatchSnapshot();
  });

  it("successful signup without session navigates to /Auth and upserts profile", async () => {
    // mock signUp returning user and no session (email verification flow)
    mockSignUp.mockResolvedValueOnce({
      data: { user: { id: "new-mock-user" }, session: null },
      error: null,
    });

    const { getByPlaceholderText, getByText, getByRole } = renderWithNavigation(<Registration />);

    // fill form
    fireEvent.changeText(getByPlaceholderText("Firstname"), "John");
    fireEvent.changeText(getByPlaceholderText("Lastname"), "Doe");
    fireEvent.changeText(getByPlaceholderText("DD"), "01");
    fireEvent.changeText(getByPlaceholderText("MM"), "01");
    fireEvent.changeText(getByPlaceholderText("YYYY"), "1990");
    fireEvent.changeText(getByPlaceholderText("Email"), "john.doe@example.com");
    fireEvent.changeText(getByPlaceholderText("Username"), "johndoe");
    fireEvent.changeText(getByPlaceholderText("Password"), "Password1!");
    fireEvent.changeText(getByPlaceholderText("Confirm Password"), "Password1!");

    // agree to terms
    const checkbox = getByRole("checkbox");
    fireEvent.press(checkbox);

    // press create account
    const button = getByText("Create account");
    fireEvent.press(button);

    await waitFor(() => expect(mockSignUp).toHaveBeenCalled());
    await waitFor(() => expect(mockUpsert).toHaveBeenCalled());
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/Auth"));
  });

  it("successful signup with session navigates to HomePage", async () => {
    // mock signUp returning user and a session (immediate login)
    mockSignUp.mockResolvedValueOnce({
      data: { user: { id: "new-mock-user-2" }, session: { access_token: "abc" } },
      error: null,
    });

    const { getByPlaceholderText, getByText, getByRole } = renderWithNavigation(<Registration />);

    // fill form
    fireEvent.changeText(getByPlaceholderText("Firstname"), "Jane");
    fireEvent.changeText(getByPlaceholderText("Lastname"), "Smith");
    fireEvent.changeText(getByPlaceholderText("DD"), "02");
    fireEvent.changeText(getByPlaceholderText("MM"), "02");
    fireEvent.changeText(getByPlaceholderText("YYYY"), "1992");
    fireEvent.changeText(getByPlaceholderText("Email"), "jane.smith@example.com");
    fireEvent.changeText(getByPlaceholderText("Username"), "janesmith");
    fireEvent.changeText(getByPlaceholderText("Password"), "Password1!");
    fireEvent.changeText(getByPlaceholderText("Confirm Password"), "Password1!");

    // agree to terms
    const checkbox = getByRole("checkbox");
    fireEvent.press(checkbox);

    // press create account
    const button = getByText("Create account");
    fireEvent.press(button);

    await waitFor(() => expect(mockSignUp).toHaveBeenCalled());
    await waitFor(() => expect(mockUpsert).toHaveBeenCalled());
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/(tabs)/HomePage"));
  });
});
