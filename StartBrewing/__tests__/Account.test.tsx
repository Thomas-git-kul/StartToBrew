import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { NavigationContainer } from "@react-navigation/native";

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
  return ({ title, onIconPress, onIconPressLeft }: any) => (
    <View>
      <TouchableOpacity onPress={onIconPress}>
        <Text>ArrowRight</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onIconPressLeft}>
        <Text>Settings</Text>
      </TouchableOpacity>
      <Text>{title}</Text>
    </View>
  );
});

// expo-image vervangen door simpele placeholder
jest.mock("expo-image", () => {
  const { Text } = require("react-native");
  return { Image: () => <Text>image-placeholder</Text> };
});

// mock react-native-paper to avoid needing Provider in tests
jest.mock("react-native-paper", () => {
  const React = require("react");
  const { View, Text, TouchableOpacity } = require("react-native");

  const Avatar = {
    Image: (props: any) => React.createElement(View, props, React.createElement(Text, null, "avatar-image")),
    Text: (props: any) => React.createElement(View, props, React.createElement(Text, null, props.label ?? "avatar-text")),
  };

  const Dialog = (props: any) => React.createElement(View, props, props.children);
  Dialog.Title = (props: any) => React.createElement(Text, props, props.children);
  Dialog.Content = (props: any) => React.createElement(View, props, props.children);
  Dialog.Actions = (props: any) => React.createElement(View, props, props.children);

  return {
    Portal: ({ children }: any) => <>{children}</>,
    Modal: ({ visible, children }: any) => (visible ? <View>{children}</View> : null),
    ActivityIndicator: () => <View />,
    Card: ({ children, ...rest }: any) => React.createElement(View, rest, children),
    Dialog,
    Button: ({ onPress, children }: any) => (
      <TouchableOpacity onPress={onPress}>
        <Text>{children}</Text>
      </TouchableOpacity>
    ),
    Avatar,
  };
});

// router mocks
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

// supabase mock
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
            name: "First Brew",
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

  // RECIPES (voor completed brews)
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

// component NA de mocks importeren
import Account from "@/app/(tabs)/Account";

const renderWithNavigation = (ui: React.ReactElement) => {
  return render(<NavigationContainer>{ui}</NavigationContainer>);
};

describe("<Account />", () => {
  test("renders profile data + badges section + completed brews", async () => {
    const { getByText } = renderWithNavigation(<Account />);

    // profiel
    await waitFor(() => {
      expect(getByText("Test User")).toBeTruthy();
      expect(getByText("testuser")).toBeTruthy();
    });

    // badges sectie
    await waitFor(() => {
      expect(getByText("Badges")).toBeTruthy();
      expect(getByText("Earned badges")).toBeTruthy();
    });

    // completed brews (op basis van RPC-mock)
    await waitFor(() => {
      expect(getByText("Completed")).toBeTruthy();
      expect(getByText("My Finished Brew")).toBeTruthy();
    });
  });

  test("navigates to account edit", async () => {
    const { getByText } = renderWithNavigation(<Account />);

    await waitFor(() => getByText("Settings"));

    fireEvent.press(getByText("Settings"));

    expect(mockPush).toHaveBeenCalledWith("/AccountEdit");
  });
});