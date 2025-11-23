import { render, fireEvent, waitFor } from "@testing-library/react-native";

// Mock expo-router
jest.mock("expo-router", () => {
  return {
    router: {
      push: jest.fn(),
      replace: jest.fn(),
    },
  };
});

import { router } from "expo-router";

// AsyncStorage mock
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

// useFonts mock
jest.mock("@/hooks/use-fonts", () => ({
  useFonts: () => {},
}));

jest.mock("../global.css", () => {});

// Colors mock
jest.mock("@/constants/Colors", () => ({
  BASE_COLORS: {
    WHITE: "#fff",
    LIGHT_BG: "#fafafa",
    TEXT_DARK: "#000",
    TEXT_BODY: "#111",
    ACCENT_PRIMARY: "#f00",
    STONE_DARK: "#333",
    STONE600: "#666",
  },
}));

// Fonts mock
jest.mock("@/constants/Fonts", () => ({
  FontFamilies: {
    BODY: "System",
  },
}));

// SafeAreaView mock
jest.mock("react-native-safe-area-context", () => ({
  SafeAreaView: ({ children }: any) => children,
  SafeAreaProvider: ({ children }: any) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

// ThemedText mock
jest.mock("@/components/themed-text", () => {
  const { Text } = require("react-native");
  return {
    ThemedText: ({ children, ...props }: any) => <Text {...props}>{children}</Text>,
  };
});

// TextInput mock
jest.mock("@/components/textInput", () => {
  const { TextInput } = require("react-native");
  return ({ value, onChangeText, ...props }: any) => (
    <TextInput value={value} onChangeText={onChangeText} {...props} />
  );
});

// ErrorChip mock
jest.mock("@/components/errorChip", () => {
  const { Text } = require("react-native");
  return ({ text }: any) => <Text>{text}</Text>;
});

// Supabase mock
jest.mock("@/supabase", () => {
  const signInMock = jest.fn().mockResolvedValue({ error: null });

  const profilesMock = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(() =>
      Promise.resolve({ data: { mail: "test@example.com" }, error: null })
    ),
  };

  return {
    supabase: {
      auth: {
        signInWithPassword: signInMock,
        startAutoRefresh: jest.fn(),
        stopAutoRefresh: jest.fn(),
      },
      from: jest.fn(() => profilesMock),
    },
  };
});

import Auth from "@/app/Auth";

describe("<Auth />", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders inputs and buttons correctly", () => {
    const { getByPlaceholderText, getByText } = render(<Auth />);

    expect(getByPlaceholderText("Email or Username")).toBeTruthy();
    expect(getByPlaceholderText("Password")).toBeTruthy();
    expect(getByText("Log In")).toBeTruthy();
    expect(getByText("Sign Up")).toBeTruthy();
    expect(getByText("Sign In as Test User")).toBeTruthy();
  });

  it("logs in with email and password", async () => {
    const { getByPlaceholderText, getByText } = render(<Auth />);

    const identifierInput = getByPlaceholderText("Email or Username");
    const passwordInput = getByPlaceholderText("Password");

    fireEvent.changeText(identifierInput, "testuser");
    fireEvent.changeText(passwordInput, "password123");

    fireEvent.press(getByText("Log In"));

    await waitFor(() => {
      const { supabase } = require("@/supabase");
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
      });
    });
    await waitFor(() => {
      expect(router.push).toHaveBeenCalledWith("/(tabs)/HomePage");
    });
  });

  it("shows login error if incorrect username", async () => {
    const { getByPlaceholderText, getByText, queryByText } = render(<Auth />);
    const { supabase } = require("@/supabase");

    supabase.from().single.mockResolvedValueOnce({ data: null, error: true });

    fireEvent.changeText(getByPlaceholderText("Email or Username"), "wronguser");
    fireEvent.changeText(getByPlaceholderText("Password"), "password123");
    fireEvent.press(getByText("Log In"));

    await waitFor(() => {
      expect(queryByText("Incorrect username")).toBeTruthy();
    });
  });

  it("navigates to registration page on Sign Up", async () => {
    const { getByText } = render(<Auth />);

    fireEvent.press(getByText("Sign Up"));

    await waitFor(() => {
      expect(router.push).toHaveBeenCalledWith("../Registration");
    });
  });
});
