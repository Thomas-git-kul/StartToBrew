// __tests__/EditAccount.test.tsx
import { render, fireEvent, waitFor } from "@testing-library/react-native";

// AsyncStorage mock
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

// useFonts mock
jest.mock("@/hooks/use-fonts", () => ({
  useFonts: () => {},
}));

// Colors mock
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

// Fonts mock
jest.mock("@/constants/Fonts", () => ({
  FontFamilies: {
    HEADING: "System",
  },
}));

// Safe area mock
jest.mock("react-native-safe-area-context", () => ({
  SafeAreaView: ({ children }: any) => children,
  SafeAreaProvider: ({ children }: any) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

// ThemedText mock
jest.mock("@/components/themed-text", () => {
  const { Text } = require("react-native");
  return {
    ThemedText: ({ children, ...props }: any) => (
      <Text {...props}>{children}</Text>
    ),
  };
});

// Header mock
export const mockBack = jest.fn();

jest.mock("@/components/header", () => {
  const { View, Text, TouchableOpacity } = require("react-native");
  return ({ onIconPress, title }: any) => (
    <View>
      <TouchableOpacity
        onPress={onIconPress}
        testID="edit-account-back-button"
      >
        <Text>ArrowLeft</Text>
      </TouchableOpacity>
      <Text>{title}</Text>
    </View>
  );
});

// expo-image mock
jest.mock("expo-image", () => {
  const { Text } = require("react-native");
  return {
    Image: () => <Text>image-placeholder</Text>,
  };
});

// expo-image-picker mock
jest.mock("expo-image-picker", () => ({
  requestMediaLibraryPermissionsAsync: jest
    .fn()
    .mockResolvedValue({ granted: true }),
  launchImageLibraryAsync: jest.fn().mockResolvedValue({
    canceled: true,
  }),
}));

// updateAvatar mock
const mockUpdateAvatar = jest.fn().mockResolvedValue("https://example.com/new.png");
jest.mock("@/supabase/storage/updateAvatar", () => ({
  updateAvatar: mockUpdateAvatar,
}));

// Router mock
export const mockPush = jest.fn();
export const mockReplace = jest.fn();

jest.mock("expo-router", () => ({
  __esModule: true,
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
}));

// Supabase mock
jest.mock("@/supabase", () => {
  const profileData = {
    id: "user-1",
    username: "testuser",
    full_name: "Test User",
    bio: "Test bio",
    mail: "test@example.com",
    firstname: "Test",
    lastname: "User",
    avatar_url: null,
    updated_at: null,
  };

  return {
    supabase: {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: "user-1", email: "test@example.com" } },
          error: null,
        }),
        signOut: jest.fn().mockResolvedValue({ error: null }),
        signInWithPassword: jest.fn().mockResolvedValue({
          data: { session: {} },
          error: null,
        }),
        updateUser: jest.fn().mockResolvedValue({ error: null }),
      },
      from: jest.fn((table: string) => {
        if (table === "profiles") {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: profileData,
                  error: null,
                }),
              }),
            }),
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ error: null }),
            }),
          };
        }
        return {};
      }),
      storage: {
        from: jest.fn(() => ({
          getPublicUrl: jest.fn().mockReturnValue({
            data: { publicUrl: "https://example.com/img.png" },
            error: null,
          }),
        })),
      },
    },
  };
});

// ⬇️ IMPORT COMPONENT ONDERAAN
import EditAccount from "@/app/AccountEdit";

// ==============================
// TESTS
// ==============================

describe("<EditAccount />", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("laadt profielgegevens in de velden", async () => {
    const { getByPlaceholderText } = render(<EditAccount />);

    const username = await waitFor(() =>
      getByPlaceholderText("jouw_naam")
    );

    const firstname = getByPlaceholderText("Voornaam");
    const lastname = getByPlaceholderText("Achternaam");
    const bio = getByPlaceholderText("Vertel iets over jezelf");

    expect(username.props.value).toBe("testuser");
    expect(firstname.props.value).toBe("Test");
    expect(lastname.props.value).toBe("User");
    expect(bio.props.value).toBe("Test bio");
  });

  it("navigates to Account on save", async () => {
    const { getByText, getByPlaceholderText } = render(<EditAccount />);

    const username = await waitFor(() =>
      getByPlaceholderText("jouw_naam")
    );

    fireEvent.changeText(username, "updatedUser");

    fireEvent.press(getByText("Opslaan"));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("../Account");
    });
  });
});
