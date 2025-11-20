import React from "react";
import { render, fireEvent, act, waitFor } from "@testing-library/react-native";
import { NavigationContainer } from "@react-navigation/native";
import { useRouter} from "expo-router";

/* ------------------------------
   MOCKS
------------------------------- */

// Mock navigation router
const pushMock = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: jest.fn(),
}));

// Mock Supabase (auth + from)
jest.mock("../supabase", () => {
  const supabaseMock = {
    auth: {
      getUser: jest.fn(() => ({
        data: { user: { id: "user-1" } },
        error: null,
      })),
    },
    from: jest.fn((tableName: string) => {
      const dataByTable: Record<string, any[]> = {
        recipes: [
          { recipe_slug: "citra-rye", name: "CalIPA - Citra Rye", description: "Test desc", rating: 4 },
          { recipe_slug: "city-of-sun", name: "City of the Sun IPA", description: "Desc", rating: 5 },
          { recipe_slug: "face-of-boe", name: "Face of Boe - APA #4", description: "Desc", rating: 3 },
          { recipe_slug: "west-coast-ipa", name: "West Coast IPA 2023 v2", description: "Desc", rating: 4 },
          { recipe_slug: "black-nitro-ipa", name: "Black Nitro IPA", description: "Desc", rating: 5 },
        ],
        brews: [
          { id_brew: 1, name: "Hazy IPA", recipe_slug: "citra-rye", user_id: "user-1"},
          { id_brew: 2, name: "Belgian Tripel", recipe_slug: "city-of-sun", user_id: "user-1"},
        ],
        steps: [
          { step_id: "step1", recipe_slug: "citra-rye" },
          { step_id: "step2", recipe_slug: "citra-rye" },
          { step_id: "step1", recipe_slug: "city-of-sun" },
          { step_id: "step2", recipe_slug: "city-of-sun" },
        ],
        brew_steps: [
          { step_id: "step1", id_brew: 1, status: "completed" },
          { step_id: "step2", id_brew: 1, status: "completed" },
          { step_id: "step1", id_brew: 2, status: "completed" },
          { step_id: "step2", id_brew: 2, status: "completed" },
      ],
      };

      const selectMock = jest.fn(() => ({
        eq: jest.fn((field: string, value: any) => {
          if (tableName === "brews") {
            return {
              data: dataByTable.brews.filter(b => b[field] === value),
              error: null,
              eq: jest.fn(() => ({ data: dataByTable[tableName] || [], error: null })),
            };
          }
          return { data: dataByTable[tableName] || [], error: null, eq: jest.fn(() => ({ data: dataByTable[tableName] || [], error: null })) };
        }),
        data: dataByTable[tableName] || [],
        error: null,
      }));

      return { select: selectMock };
    }),
  };

  return { supabase: supabaseMock };
});

// Mock fonts
jest.mock("@/hooks/use-fonts", () => ({
  useFonts: () => true,
}));

// Mock ThemedText
jest.mock("@/components/themed-text", () => {
  const { Text } = require("react-native");
  return { ThemedText: ({ children }: any) => <Text>{children}</Text> };
});

// Mock Header
jest.mock("@/components/header", () => {
  const { Text, View } = require("react-native");
  return ({ title }: any) => (
    <View>
      <Text>{title}</Text>
    </View>
  );
});

// Mock ProgressCard
jest.mock("@/components/ui/ProgressCard", () => {
  const { Text, Pressable } = require("react-native");
  return ({ title, onPress }: any) => (
    <Pressable onPress={onPress}>
      <Text>{title}</Text>
    </Pressable>
  );
});

// Mock RecipeCard
jest.mock("@/components/ui/RecipeCard", () => {
  const { Text, Pressable } = require("react-native");
  return ({ name, onPress, recipe_slug }: any) => (
    <Pressable onPress={onPress?.(recipe_slug)}>
      <Text>{name}</Text>
    </Pressable>
  );
});

// Mock colors
jest.mock("@/constants/Colors", () => ({
  BASE_COLORS: { TEXT_DARK: "#000", LIGHT_BG: "#eee" },
}));

const HomePage = require("../app/(tabs)/HomePage").default;

// --------------------------
// Helper render wrapper
// --------------------------
const renderNav = (ui: any) => render(<NavigationContainer>{ui}</NavigationContainer>);

/* ------------------------------
   TESTS
------------------------------- */
describe("<HomePage />", () => {
  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({ push: pushMock });
    pushMock.mockClear();
  });

  it("renders titles", async () => {
    const { getByText } = renderNav(<HomePage />);
    await waitFor(() => {
      expect(getByText("StartToBrew")).toBeTruthy();
      expect(getByText("In progress")).toBeTruthy();
      expect(getByText("Popular recipes")).toBeTruthy();
    });
  });

  it("renders progress cards", async () => {
    const { getByText } = renderNav(<HomePage />);
    await waitFor(() => {
      expect(getByText("Hazy IPA")).toBeTruthy();
      expect(getByText("Belgian Tripel")).toBeTruthy();
    });
  });

  it("navigates to /progress when progress card pressed", async () => {
    const { getByText } = renderNav(<HomePage />);
    await waitFor(() => getByText("Hazy IPA"));
    await act(async () => {
      fireEvent.press(getByText("Hazy IPA"));
    });
    
    expect(pushMock).toHaveBeenCalledWith({ pathname: "/progress", params: { id: 1 } });
  });

  it("renders popular beers (after supabase mock)", async () => {
    const { getByText } = renderNav(<HomePage />);
    await waitFor(() => {
      expect(getByText("CalIPA - Citra Rye")).toBeTruthy();
      expect(getByText("City of the Sun IPA")).toBeTruthy();
    });
  });

  it("navigates to SpecificRecipe on beer press", async () => {
    const { getByText } = renderNav(<HomePage />);
    await waitFor(() => getByText("CalIPA - Citra Rye"));
    fireEvent.press(getByText("CalIPA - Citra Rye"));
    expect(pushMock).toHaveBeenCalledWith({
      pathname: "/SpecificRecipe",
      params: { slug: "citra-rye" },
    });
  });

  it("navigates to /Recipes when FAB pressed", () => {
    const { getByTestId } = renderNav(<HomePage />);
    fireEvent.press(getByTestId("fab"));
    expect(pushMock).toHaveBeenCalledWith("/Recipes");
  });

  it("matches snapshot", () => {
    const tree = renderNav(<HomePage />).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
