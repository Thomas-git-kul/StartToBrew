// Account.test.tsx
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { NavigationContainer } from "@react-navigation/native";

// ───────────────────────────────────────────────────────────
// BASE MOCKS
// ───────────────────────────────────────────────────────────

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

// Fonts → must return a stable boolean
jest.mock("@/hooks/use-fonts", () => ({
  useFonts: () => true,
}));

// Beer image util
jest.mock("@/hooks/beer-image", () => ({
  getBeerImageSource: () => "test-image",
}));

// Colors
jest.mock("@/constants/Colors", () => ({
  BASE_COLORS: {
    WHITE: "#fff",
    LIGHT_BG: "#fafafa",
    TEXT_DARK: "#000",
    ACCENT_PRIMARY: "#f00",
  },
}));

// Fonts
jest.mock("@/constants/Fonts", () => ({
  FontFamilies: {
    HEADING: "System",
    BODY: "System",
  },
}));

// ThemedText → simple RN Text
jest.mock("@/components/themed-text", () => {
  const { Text } = require("react-native");
  return {
    ThemedText: ({ children, ...props }: any) => (
      <Text {...props}>{children}</Text>
    ),
  };
});

// Header mock (right + left icons)
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

// expo-image → placeholder
jest.mock("expo-image", () => {
  const { Text } = require("react-native");
  return { Image: () => <Text>image-placeholder</Text> };
});

// react-native-paper → simplified mock
jest.mock("react-native-paper", () => {
  const React = require("react");
  const { View, Text, TouchableOpacity } = require("react-native");

  return {
    Portal: ({ children }: any) => <>{children}</>,
    Modal: ({ visible, children }: any) => (visible ? <View>{children}</View> : null),
    ActivityIndicator: () => <View />,
    Card: ({ children }: any) => <View>{children}</View>,

    Dialog: Object.assign(
      ({ children }: any) => <View>{children}</View>,
      {
        Title: ({ children }: any) => <Text>{children}</Text>,
        Content: ({ children }: any) => <View>{children}</View>,
        Actions: ({ children }: any) => <View>{children}</View>,
      }
    ),

    Button: ({ onPress, children }: any) => (
      <TouchableOpacity onPress={onPress}>
        <Text>{children}</Text>
      </TouchableOpacity>
    ),

    Avatar: {
      Image: () => <View><Text>avatar-image</Text></View>,
      Text: ({ label }: any) => <View><Text>{label}</Text></View>,
    },
  };
});

// ───────────────────────────────────────────────────────────
// ROUTING MOCKS
// ───────────────────────────────────────────────────────────

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

// ───────────────────────────────────────────────────────────
// SUPABASE MOCK (optimized + stable)
// ───────────────────────────────────────────────────────────

jest.mock("@/supabase", () => {
  // helpers for repeated patterns
  const select = (result: any) => ({
    select: jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({ data: result, error: null }),
      }),
    }),
  });

  const listResult = (result: any) => ({
    select: jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        order: jest.fn().mockResolvedValue({ data: result, error: null }),
      }),
    }),
  });

  return {
    supabase: {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: "user-1" } },
          error: null,
        }),
        signOut: jest.fn(),
      },

      from: jest.fn((table: string) => {
        switch (table) {
          case "profiles":
            return select({
              id: "user-1",
              username: "testuser",
              full_name: "Test User",
              avatar_url: null,
              bio: "Test bio",
            });
          case "account_badges":
            return listResult([
              { badge_id: 1, earned_at: "2025-01-01T00:00:00Z" },
            ]);
          case "badges":
            return {
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
          case "recipes":
            return {
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
          default:
            return { select: jest.fn() };
        }
      }),

      rpc: jest.fn().mockResolvedValue({
        data: [
          {
            id_brew: 100,
            name: "My Finished Brew",
            recipe_slug: "recipe-1",
            start_date: "2025-01-10T00:00:00Z",
          },
        ],
        error: null,
      }),

      storage: {
        from: jest.fn(() => ({
          getPublicUrl: jest.fn().mockReturnValue({
            data: { publicUrl: "https://example.com/avatar.png" },
          }),
        })),
      },
    },
  };
});

// ───────────────────────────────────────────────────────────
// IMPORT COMPONENT AFTER MOCKS
// ───────────────────────────────────────────────────────────

import Account from "@/app/(tabs)/Account";

const renderWithNavigation = (ui: React.ReactElement) =>
  render(<NavigationContainer>{ui}</NavigationContainer>);

// ───────────────────────────────────────────────────────────
// TEST SUITE
// ───────────────────────────────────────────────────────────

describe("<Account />", () => {
  test("renders profile, badges, and completed brews", async () => {
    const { getByText } = renderWithNavigation(<Account />);

    // Profile
    await waitFor(() => {
      expect(getByText("Test User")).toBeTruthy();
      expect(getByText("testuser")).toBeTruthy();
    });

    // Badges
    await waitFor(() => {
      expect(getByText("Badges")).toBeTruthy();
      expect(getByText("Earned badges")).toBeTruthy();
      expect(getByText("First Brew")).toBeTruthy();
    });

    // Completed brews
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
