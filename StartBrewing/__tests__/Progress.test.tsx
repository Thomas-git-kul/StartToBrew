import React from "react";
import { render, fireEvent, waitFor, act } from "@testing-library/react-native";
import Progress from "../app/progress";
import { NavigationContainer } from "@react-navigation/native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { supabase } from "@/supabase";

jest.mock("expo-router", () => ({
  useRouter: jest.fn(),
  useLocalSearchParams: jest.fn(),
}));

jest.mock("@/hooks/use-fonts", () => ({ useFonts: () => true }));

jest.mock("@/components/header", () => {
  const { View, Text } = require("react-native");
  return ({ title }: any) => <View><Text>{title}</Text></View>;
});

jest.mock("@/components/themed-text", () => {
  const { Text } = require("react-native");
  return { ThemedText: ({ children }: any) => <Text>{children}</Text> };
});

// Supabase spies
const mockGetUser = jest.fn().mockResolvedValue({ data: { user: { id: "test-user" } } });

// BREWS chain: select(...).eq(...).single()
const mockBrewsSingle = jest.fn().mockResolvedValue({
  data: { id_brew: 1, recipe_slug: "slug", name: "black IPA", last_step_id: 1, status_id: 1 },
});
const mockBrewsEq = jest.fn(() => ({ single: mockBrewsSingle }));
const mockBrewsSelect = jest.fn(() => ({ eq: mockBrewsEq }));

// brew_steps: eq().eq().update()
const mockBrewStepsUpdate = jest.fn().mockResolvedValue({ data: {} });
const mockBrewStepsChain = {
  eq: jest.fn().mockImplementation(() => ({
    eq: jest.fn().mockImplementation(() => ({
      update: mockBrewStepsUpdate
    }))
  }))
};

// brews: update()
const mockBrewsUpdate = jest.fn().mockResolvedValue({ data: {} });

const mockPhases = [{ phase_id: 1, position: 1 }];
const mockSteps = [{
  step_id: 1,
  title: "60-min Citra",
  title_2: "15-min Mosaic",
  description_md: "At T-60: briefly kill the flame to prevent foam, add hops, then resume boil.",
  description_md_2: "At T-15: briefly kill the flame to prevent foam, add hops, then resume boil.",
  start_offset_min: 0,
  duration_min: 0,
  temp_c_target: 100
}];

const mockBrewsFrom = jest.fn((table: string) => {
  if (table === "brews") {
    return {
      select: mockBrewsSelect,
      update: mockBrewsUpdate, // voor goToNextStep
    };
  }
  if (table === "brew_steps") return mockBrewStepsChain;
  if (table === "phases") return { select: () => ({ data: mockPhases }) };
  if (table === "steps") return { select: () => ({ data: mockSteps }) };
  if (table === "step_tips") return { select: () => ({ data: { tip_md: "Lower the heat", tip_md_2: "Lower the heat" } }) };
  return {};
});

jest.mock("@/supabase", () => ({
  supabase: {
    auth: { getUser: () => mockGetUser() },
    from: mockBrewsFrom,
  },
}));

const pushMock = jest.fn();
const renderWithNavigation = (ui: React.ReactElement) =>
  render(<NavigationContainer>{ui}</NavigationContainer>);

describe("<Progress />", () => {
  jest.setTimeout(15000); // langere timeout

  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({ push: pushMock });
    (useLocalSearchParams as jest.Mock).mockReturnValue({ id: "1" });
    jest.clearAllMocks();
  });

  it("laadt en toont stapgegevens en roept Supabase aan", async () => {
    const { findByText } = renderWithNavigation(<Progress />);
    expect(await findByText("black IPA Progress")).toBeTruthy();
    expect(await findByText("60-min Citra")).toBeTruthy();
  });

  it("toont tips wanneer lightbulb gedrukt wordt", async () => {
    const { findByTestId, findByText } = renderWithNavigation(<Progress />);
    const lightbulb = await findByTestId("lightbulb-button");
    fireEvent.press(lightbulb);
    expect(await findByText(/Lower the heat/)).toBeTruthy();
  });

  it("navigates naar volgende stap via FAB en update Supabase", async () => {
    const { findByTestId } = renderWithNavigation(<Progress />);
    const fab = await findByTestId("fab-button");
    await act(async () => {
        fireEvent.press(fab);
    });

    await waitFor(() => {
      expect(mockBrewStepsUpdate).toHaveBeenCalledWith({
        status: "completed",
        completed_at: expect.any(String),
      });
      expect(mockBrewsUpdate).toHaveBeenCalledWith({ last_step_id: 2 });
    });
  });

  it("snapshot", () => {
      const tree = renderWithNavigation(<Progress />).toJSON();
      expect(tree).toMatchSnapshot();
    });
});