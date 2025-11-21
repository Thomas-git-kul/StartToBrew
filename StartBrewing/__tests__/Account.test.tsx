import { render, fireEvent, waitFor } from "@testing-library/react-native";

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

jest.mock("@/hooks/use-fonts", () => ({
  useFonts: () => {},
}));

jest.mock("@/hooks/beer-image", () => ({
  getBeerImageSource: () => "test-image",
}));

jest.mock("@/constants/Colors", () => ({
  BASE_COLORS: {
    WHITE: "#fff",
    LIGHT_BG: "#fafafa",
    TEXT_DARK: "#000",
    ACCENT_PRIMARY: "#f00",
  },
}));

jest.mock("@/constants/Fonts", () => ({
  FontFamilies: {
    HEADING: "System",
    BODY: "System",
  },
}));

jest.mock("@/components/themed-text", () => {
  const { Text } = require("react-native");
  return {
    ThemedText: ({ children, ...props }: any) => (
      <Text {...props}>{children}</Text>
    ),
  };
});

jest.mock("@/components/header", () => {
  const { View, Text, TouchableOpacity } = require("react-native");
  return ({ title, onIconPress }: any) => (
    <View>
      <TouchableOpacity onPress={onIconPress}>
        <Text>ArrowRight</Text>
      </TouchableOpacity>
      <Text>{title}</Text>
    </View>
  );
});

jest.mock("expo-image", () => {
  const { Text } = require("react-native");
  return { Image: () => <Text>image-placeholder</Text> };
});

export const mockPush = jest.fn();
export const mockReplace = jest.fn();

jest.mock("expo-router", () => ({
  __esModule: true,
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
  router: {
    push: mockPush,
    replace: mockReplace,
  },
}));

jest.mock("@/supabase", () => {
  const mockGetUser = jest.fn().mockResolvedValue({
    data: { user: { id: "user-1" } },
    error: null,
  });

  // ACCOUNT BADGES
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

  // BADGE DEFINITIONS
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

  // PROFILES
  const profilesSelect = {
    select: jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({
          data: {
            id: "user-1",
            username: "testuser",
            full_name: "Test User",
            avatar_url: null,
            bio: "Test bio",
          },
          error: null,
        }),
      }),
    }),
  };

  // RECIPES FOR BREWS IMAGES
  const recipesSelect = {
    select: jest.fn().mockReturnValue({
      in: jest.fn().mockResolvedValue({
        data: [
          {
            recipe_slug: "recipe-1",
            haze_level: 2,
            srm_target: 5,
          },
        ],
        error: null,
      }),
    }),
  };

  const mockFrom = jest.fn((tbl: string) => {
    switch (tbl) {
      case "profiles":
        return profilesSelect;
      case "account_badges":
        return accountBadgesSelect;
      case "badges":
        return badgesSelect;
      case "recipes":
        return recipesSelect;
      default:
        return { select: jest.fn() };
    }
  });

  const mockRpc = jest.fn().mockResolvedValue({
    data: [
      {
        id_brew: 100,
        name: "My Finished Brew",
        recipe_slug: "recipe-1",
        start_date: "2025-01-10T00:00:00Z",
      },
    ],
    error: null,
  });

  return {
    supabase: {
      auth: {
        getUser: mockGetUser,
        signOut: jest.fn(),
      },
      from: mockFrom,
      storage: {
        from: jest.fn(() => ({
          getPublicUrl: jest.fn().mockReturnValue({
            data: { publicUrl: "https://example.com/avatar.png" },
          }),
        })),
      },
      rpc: mockRpc,
    },
  };
});

// IMPORT COMPONENT AFTER MOCKS
import Account from "@/app/(tabs)/Account";

describe("<Account />", () => {
  test("renders profile data + badges", async () => {
    const { getByText, queryByText } = render(<Account />);

    await waitFor(() => {
      expect(getByText("Test User")).toBeTruthy();
      expect(getByText("@testuser")).toBeTruthy();
    });

    // ENSURE BADGES LOADED
    await waitFor(() => {
      expect(queryByText("First Badge")).toBeTruthy();
    });
  });

  test("navigates to account edit", async () => {
    const { getByText } = render(<Account />);

    await waitFor(() => getByText("Change profile"));

    fireEvent.press(getByText("Change profile"));

    expect(mockPush).toHaveBeenCalledWith("/AccountEdit");
  });
});
