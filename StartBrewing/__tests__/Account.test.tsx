// __tests__/Account.test.tsx
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

// 6. Router mock
export const mockPush = jest.fn();
export const mockReplace = jest.fn();

jest.mock("expo-router", () => ({
  __esModule: true,
  // wat de component gebruikt
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
}));

// 7. Supabase inline mock – alles binnen de factory, geen hoisting-issues
jest.mock("@/supabase", () => {
  const mockGetUser = jest.fn().mockResolvedValue({
    data: { user: { id: "user-1" } },
    error: null,
  });

  const profileData = {
    id: "user-1",
    username: "testuser",
    full_name: "Test User",
    avatar_url: null,
    bio: "Test bio",
    updated_at: null,
  };

  const profilesSelect = {
    select: jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({
          data: profileData,
          error: null,
        }),
      }),
    }),
  };

  const accountBadgesSelect = {
    select: jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        order: jest.fn().mockResolvedValue({
          data: [{ badge_id: 1, earned_at: "2025-01-01T00:00:00Z" }],
          error: null,
        }),
      }),
    }),
  };

  const badgesSelect = {
    select: jest.fn().mockReturnValue({
      in: jest.fn().mockResolvedValue({
        data: [
          {
            id_badge: 1,
            code: "FIRST_BREW",
            name: "First Badge",
            description: "Your first brew",
            icon_url: null,
            category: "progression",
          },
        ],
        error: null,
      }),
    }),
  };

  const mockFrom = jest.fn((table: string) => {
    switch (table) {
      case "profiles":
        return profilesSelect;
      case "account_badges":
        return accountBadgesSelect;
      case "badges":
        return badgesSelect;
      default:
        return { select: jest.fn() };
    }
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
import Account from "@/app/(tabs)/Account";

describe("<Account />", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders profile header and badges from backend", async () => {
    const { getByText } = render(<Account />);

    await waitFor(() => {
      expect(getByText("Test User")).toBeTruthy();
    });

    expect(getByText("@testuser")).toBeTruthy();
    expect(getByText("Badges")).toBeTruthy();
    expect(getByText("First Badge")).toBeTruthy();
  });

  it("navigates to edit screen when pressing Change profile", async () => {
    const { getByText } = render(<Account />);

    await waitFor(() => {
      expect(getByText("Change profile")).toBeTruthy();
    });

    fireEvent.press(getByText("Change profile"));
    expect(mockPush).toHaveBeenCalledWith("/AccountEdit");
  });
});
