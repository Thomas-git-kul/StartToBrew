// __tests__/AccountEdit.test.tsx
import { render, fireEvent, waitFor } from "@testing-library/react-native";

// 1. AsyncStorage mock
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

// 2. useFonts-hook mock
jest.mock("@/hooks/use-fonts", () => ({
  useFonts: () => {},
}));

// 3. UI / styling mocks
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

// 4. ThemedText + Header mocks
jest.mock("@/components/themed-text", () => {
  const { Text } = require("react-native");
  return {
    ThemedText: ({ children, ...props }: any) => (
      <Text {...props}>{children}</Text>
    ),
  };
});

jest.mock("@/components/header", () => {
  const { Text, View, TouchableOpacity } = require("react-native");
  return ({ title, iconName, onIconPress }: any) => (
    <View>
      <TouchableOpacity onPress={onIconPress}>
        <Text>{iconName}</Text>
      </TouchableOpacity>
      <Text>{title}</Text>
    </View>
  );
});

// 5. expo-image mock
jest.mock("expo-image", () => {
  const { Text } = require("react-native");
  return {
    Image: () => <Text>image-placeholder</Text>,
  };
});

// 6. expo-image-picker mock
jest.mock("expo-image-picker", () => ({
  requestMediaLibraryPermissionsAsync: jest
    .fn()
    .mockResolvedValue({ granted: true }),
  launchImageLibraryAsync: jest.fn().mockResolvedValue({
    canceled: true,
    assets: [],
  }),
}));

// 7. updateAvatar mock
const mockUpdateAvatar = jest
  .fn()
  .mockResolvedValue("https://example.com/new-avatar.png");
jest.mock("@/supabase/storage/updateAvatar", () => ({
  updateAvatar: mockUpdateAvatar,
}));

export const mockPush = jest.fn();
export const mockReplace = jest.fn();

jest.mock("expo-router", () => ({
  __esModule: true,
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
}));

// 9. Supabase inline mock
jest.mock("@/supabase", () => {
  const profileData = {
    id: "user-1",
    username: "testuser",
    full_name: "Test User",
    avatar_url: null,
    bio: "Test bio",
    updated_at: null,
  };

  const mockGetUser = jest.fn().mockResolvedValue({
    data: { user: { id: "user-1" } },
    error: null,
  });

  const mockSelect = jest.fn().mockReturnValue({
    eq: jest.fn().mockReturnValue({
      single: jest.fn().mockResolvedValue({
        data: profileData,
        error: null,
      }),
    }),
  });

  const mockUpdate = jest.fn().mockReturnValue({
    eq: jest.fn().mockResolvedValue({ error: null }),
  });

  const mockFrom = jest.fn((table: string) => {
    if (table === "profiles") {
      return {
        select: mockSelect,
        update: mockUpdate,
      };
    }
    return { select: jest.fn(), update: jest.fn() };
  });

  const mockStorageFrom = jest.fn(() => ({
    getPublicUrl: jest.fn().mockReturnValue({
      data: { publicUrl: "https://example.com/avatar.png" },
      error: null,
    }),
  }));

  return {
    supabase: {
      auth: {
        getUser: mockGetUser,
        signOut: jest.fn().mockResolvedValue({ error: null }),
      },
      from: mockFrom,
      storage: {
        from: mockStorageFrom,
      },
    },
  };
});

// Component NA alle mocks importeren
import AccountEdit from "@/app/AccountEdit";

describe("<AccountEdit />", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders loaded profile data into inputs", async () => {
    const { getByPlaceholderText } = render(<AccountEdit />);

    const usernameInput = await waitFor(() =>
      getByPlaceholderText("jouw_naam")
    );
    const fullNameInput = getByPlaceholderText("Volledige naam");
    const bioInput = getByPlaceholderText("Vertel iets over jezelf");

    expect(usernameInput.props.value).toBe("testuser");
    expect(fullNameInput.props.value).toBe("Test User");
    expect(bioInput.props.value).toBe("Test bio");
  });

  it("navigates back to Account on save", async () => {
    const { getByPlaceholderText, getByText } = render(<AccountEdit />);

    const usernameInput = await waitFor(() =>
      getByPlaceholderText("jouw_naam")
    );
    fireEvent.changeText(usernameInput, "updatedUser");

    fireEvent.press(getByText("Opslaan"));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("../Account");
    });
  });
});
