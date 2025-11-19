import React from "react";
import { render, fireEvent, act, waitFor } from "@testing-library/react-native";
import { NavigationContainer } from "@react-navigation/native";
import { useRouter, useLocalSearchParams } from "expo-router";

// --------------------------
// Mock expo-router
// --------------------------
const pushMock = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: jest.fn(),
  useLocalSearchParams: jest.fn(),
}));

// --------------------------
// Mock Supabase
// --------------------------
jest.mock("../supabase", () => ({
  supabase: {
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: "user-1" } },
        error: null,
      }),
    },
    from: jest.fn((table) => {
      switch (table) {
        case "recipes":
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn(async () => ({
                  data: { name: "Test Beer", description: "A very tasty beer", rating: 4.8 },
                  error: null,
                })),
              })),
            })),
          };

        case "phases":
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                order: jest.fn(async () => ({
                  data: [
                    { phase_id: "phase-1" },
                    { phase_id: "phase-2" },
                  ],
                  error: null,
                })),
              })),
            })),
          };

        case "steps":
          const steps = [
            { step_id: "step-1", after_step_id: null, phase_id: "phase-1" },
            { step_id: "step-2", after_step_id: "step-1", phase_id: "phase-1" },
            { step_id: "step-3", after_step_id: null, phase_id: "phase-2" },
          ];
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                is: jest.fn(() => ({
                  limit: jest.fn(() => ({
                    single: jest.fn(async () => ({
                      data: { step_id: "step-1" },
                      error: null,
                    })),
                  })),
                })),
              })),
              in: jest.fn(async () => ({
                data: steps,
                error: null,
              })),
            })),
          };

        case "brews":
          return {
            insert: jest.fn(() => ({
              select: jest.fn(async () => ({ data: [{ id_brew: 123 }], error: null })),
            })),
          };

        case "brew_steps":
          return { insert: jest.fn(() => ({ error: null })) };

        default:
          return { select: jest.fn() };
      }
    }),
  },
}));

// --------------------------
// Mock andere dependencies
// --------------------------
jest.mock("@/hooks/use-fonts", () => ({ useFonts: () => true }));
jest.mock("@/components/themed-text", () => {
  const { Text } = require("react-native");
  return { ThemedText: ({ children }: any) => <Text>{children}</Text> };
});
jest.mock("react-native-safe-area-context", () => {
  const { View } = require("react-native");
  return { SafeAreaView: ({ children }: any) => <View>{children}</View> };
});
jest.mock("@/constants/Colors", () => ({
  BASE_COLORS: { LIGHT_BG: "#fafafa", WHITE: "#fff", TEXT_DARK: "#000", ACCENT_LIGHT: "#B45309", STONE300: "#E5E7EB" },
}));
jest.mock("@/constants/Fonts", () => ({ FontFamilies: { BODY: "System" } }));
jest.mock("@/components/header", () => {
  const { Text } = require("react-native");
  return ({ title }: any) => <Text>{title}</Text>;
});
jest.mock("react-native-paper", () => {
  const { View, Text, TouchableOpacity } = require("react-native");
  return {
    FAB: ({ label, onPress }: any) => (
      <TouchableOpacity onPress={() => { console.log("FAB pressed!"); onPress(); }}>
        <Text>{label}</Text>
      </TouchableOpacity>
    ),
    Portal: ({ children }: any) => <>{children}</>,
    Modal: ({ visible, children }: any) => (visible ? <View>{children}</View> : null),
  };
});

// --------------------------
// Component import
// --------------------------
const SpecificRecipe = require("../app/SpecificRecipe").default;

const renderWithNav = (ui: React.ReactElement) =>
  render(<NavigationContainer>{ui}</NavigationContainer>);

// --------------------------
// TESTS
// --------------------------
describe("<SpecificRecipe />", () => {
  beforeEach(() => {
    pushMock.mockClear();
    (useRouter as jest.Mock).mockReturnValue({ push: pushMock });
    (useLocalSearchParams as jest.Mock).mockReturnValue({ slug: "test-slug" });
  });

  it("renders recipe title from supabase", async () => {
    const { getByText } = renderWithNav(<SpecificRecipe />);
    await waitFor(() => expect(getByText("Test Beer")).toBeTruthy());
  });

  it("shows rating correctly", async () => {
    const { getByText } = renderWithNav(<SpecificRecipe />);
    await waitFor(() => {
      expect(getByText("4.8 / 5")).toBeTruthy();
      expect(getByText("(0 reviews)")).toBeTruthy();
    });
  });

  it("navigates to progress on Start Brewing press", async () => {
    const { getByText } = renderWithNav(<SpecificRecipe />);
    await waitFor(() => getByText("Start Brewing"));

    await act(async () => {
      fireEvent.press(getByText("Start Brewing"));
      // wacht even voor de async Supabase calls
      await new Promise((res) => setTimeout(res, 10));
    });

    expect(pushMock).toHaveBeenCalledWith("../progress");
  });

  it("opens modal and selects a rating", async () => {
    const { getByText, getAllByTestId, queryByText } = renderWithNav(<SpecificRecipe />);
    await waitFor(() => getByText("Add Review"));

    expect(queryByText("Rate this recipe")).toBeNull();

    fireEvent.press(getByText("Add Review"));
    expect(getByText("Rate this recipe")).toBeTruthy();

    const stars = getAllByTestId(/star-/);

    await act(async () => {
      fireEvent.press(stars[2]);
      await new Promise((res) => setTimeout(res, 350));
    });

    expect(queryByText("Rate this recipe")).toBeNull();
  });

  it("matches snapshot", () => {
    const tree = renderWithNav(<SpecificRecipe />).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
