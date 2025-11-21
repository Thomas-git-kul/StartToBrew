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

// --- Supabase mock chain setup ---

// brew_steps chain
const mockBrewStepsEq2 = jest.fn(() => Promise.resolve({ data: {} }));
const mockBrewStepsEq1 = jest.fn(() => ({ eq: mockBrewStepsEq2 }));
export const mockBrewStepsUpdate = jest.fn(() => ({ eq: mockBrewStepsEq1 }));

// brews chain
const mockBrewsEq = jest.fn(() => Promise.resolve({ data: {} }));
export const mockBrewsUpdate = jest.fn(() => ({ eq: mockBrewsEq }));

// supabase.from mock
jest.mock("@/supabase", () => {
  const mockGetUser = jest.fn().mockResolvedValue({ data: { user: { id: "test-user" } } });

  return {
    supabase: {
      auth: { getUser: mockGetUser },
      from: jest.fn((table) => {
        if (table === "brew_steps") return { update: mockBrewStepsUpdate };
        if (table === "brews") return { update: mockBrewsUpdate };
        if (table === "phases") return { select: jest.fn().mockResolvedValue({ data: [{ phase_id: 1, position: 1 }] }) };
        if (table === "steps") return { select: jest.fn().mockResolvedValue({
          data: [{
            step_id: 1,
            title: "60-min Citra",
            title_2: "15-min Mosaic",
            description_md: "At T-60: briefly kill the flame to prevent foam, add hops, then resume boil.",
            description_md_2: "At T-15: briefly kill the flame to prevent foam, add hops, then resume boil.",
            start_offset_min: 0,
            duration_min: 0.02,
            next_step_id: "2",
            temp_c_target: 100
          }]
        })};
        if (table === "step_tips") return { select: jest.fn().mockResolvedValue({ data: { tip_md: "Lower the heat", tip_md_2: "Lower the heat" } }) };
        return {};
      }),
    },
  };
});

const pushMock = jest.fn();
const renderWithNavigation = (ui: React.ReactElement) =>
  render(<NavigationContainer>{ui}</NavigationContainer>);

describe("<Progress />", () => {
  //jest.setTimeout(15000);

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
    // 1. Enable fake timers
    jest.useFakeTimers();

    const { findByTestId } = renderWithNavigation(<Progress />);
    const fab = await findByTestId("fab-button");

    // Press 1: Start Timer (sets timerActive = true)
    await act(async () => fireEvent.press(fab));
    
    // 2. Advance time past the 0.02 minute (1.2 second) duration
    // Advance by 1500ms (1.5 seconds) to ensure the 1200ms timer completes.
    await act(async () => {
      jest.advanceTimersByTime(1500); // <-- CHANGED from 15000 to 1500
    });
    // The component's useEffect should now have set phaseDone to true.

    // 3. Press 2: Go to Next Step (calls goToNextStep)
    await act(async () => fireEvent.press(fab));

    // Wait for the asynchronous Supabase updates inside goToNextStep to resolve.
    await waitFor(() => {
      expect(mockBrewStepsUpdate).toHaveBeenCalled();
      expect(mockBrewsUpdate).toHaveBeenCalled();
    });
    
    // 4. RESTORE real timers for subsequent tests
    jest.useRealTimers();
  });

  it("snapshot", () => {
    const tree = renderWithNavigation(<Progress />).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
