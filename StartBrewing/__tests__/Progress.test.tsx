import React from "react";
import { render, fireEvent, waitFor, act } from "@testing-library/react-native";
import Progress from "../app/(tabs)/progress";
import { NavigationContainer } from "@react-navigation/native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { supabase } from "@/supabase";

jest.mock("expo-router", () => {
  const React = require("react");
  return {
    useRouter: jest.fn(),
    useLocalSearchParams: jest.fn(),
    useFocusEffect: (callback: any) => React.useEffect(() => callback(), []),
  };
});

jest.mock("@/hooks/use-fonts", () => ({ useFonts: () => true }));

jest.mock("@/components/header", () => {
  const { View, Text } = require("react-native");
  return ({ title }: any) => (
    <View>
      <Text>{title}</Text>
    </View>
  );
});

jest.mock("@/components/themed-text", () => {
  const { Text } = require("react-native");
  return { ThemedText: ({ children }: any) => <Text>{children}</Text> };
});

// Mock react-native-paper to avoid needing Provider in tests
jest.mock("react-native-paper", () => {
  const React = require("react");
  const { View, Text, TouchableOpacity, TextInput: RNTextInput } = require("react-native");

  // Dialog needs subcomponents Title, Content, Actions in our codebase
  const Dialog = (props: any) => React.createElement(View, props, props.children);
  Dialog.Title = (props: any) => React.createElement(Text, props, props.children);
  Dialog.Content = (props: any) => React.createElement(View, props, props.children);
  Dialog.Actions = (props: any) => React.createElement(View, props, props.children);

  const Card = (props: any) => React.createElement(View, props, props.children);

  return {
    FAB: ({ label, onPress, children, ...rest }: any) => (
      <TouchableOpacity onPress={onPress} {...rest}>
        <Text>{label ?? children}</Text>
      </TouchableOpacity>
    ),
    Portal: ({ children }: any) => <>{children}</>,
    Modal: ({ visible, children }: any) => (visible ? <View>{children}</View> : null),
    Chip: ({ children }: any) => (
      <View>
        <Text>{children}</Text>
      </View>
    ),
    ActivityIndicator: () => <View />,
    TextInput: ({ value, onChangeText, ...rest }: any) => (
      <RNTextInput value={value} onChangeText={onChangeText} {...rest} />
    ),
    Button: ({ onPress, children }: any) => (
      <TouchableOpacity onPress={onPress}>
        <Text>{children}</Text>
      </TouchableOpacity>
    ),
    Dialog,
    Card,
  };
});

// Mock lucide icons used in Progress
jest.mock("lucide-react-native", () => {
  const { Text } = require("react-native");
  const make = (name: string) => (props: any) => <Text>{name}</Text>;
  return {
    Pause: make("Pause"),
    Thermometer: make("Thermometer"),
    Play: make("Play"),
    CheckCheck: make("CheckCheck"),
    Lightbulb: make("Lightbulb"),
  };
});

// Mock countdown timer to avoid timing-related behavior in unit tests
jest.mock("react-native-countdown-circle-timer", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    CountdownCircleTimer: ({ children }: any) => {
      return React.createElement(View, null, typeof children === "function" ? children({ remainingTime: 60 }) : children);
    },
  };
});

// ⬇️ NIEUW: mock de user progress context
jest.mock("@/context/UserProgressContext", () => ({
  useUserProgressContext: () => ({
    progress: null,
    loading: false,
    levelUp: null,
    acknowledgeLevelUp: jest.fn(),
    refreshProgress: jest.fn(),
  }),
}));

// --- Supabase mock chain setup ---

jest.mock("@/supabase", () => {
  const getUser = jest.fn().mockResolvedValue({ data: { user: { id: "test-user" } } });

  const from = jest.fn((table: string) => {
    switch (table) {
      case "brews":
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({
                data: {
                  id_brew: 1,
                  recipe_slug: "black-ipa",
                  name: "black IPA Progress",
                  last_step_id: "1",
                  status_id: 2,
                },
                error: null,
              }),
            }),
          }),
          update: () => ({
            eq: async () => ({ data: {}, error: null }),
          }),
          delete: () => ({ eq: async () => ({ data: {}, error: null }) }),
        };

      case "phases":
        return {
          select: () => ({
            eq: () => ({
              order: async () => ({ data: [{ phase_id: "phase-1", position: 1 }], error: null }),
            }),
          }),
        };

      case "steps":
        return {
          select: () => ({
            eq: () => ({
              order: async () => ({
                data: [
                  {
                    step_id: "1",
                    title: "60-min Citra",
                    title_2: "15-min Mosaic",
                    description_md: "At T-60: briefly kill the flame to prevent foam, add hops, then resume boil.",
                    description_md_2: "At T-15: briefly kill the flame to prevent foam, add hops, then resume boil.",
                    start_offset_min: 0,
                    duration_min: 0.02,
                    next_step_id: null,
                    temp_c_target: 100,
                  },
                ],
                error: null,
              }),
            }),
          }),
        };

      case "step_tips":
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({ data: { step_id: "1", tip_md: "Use a spoon" }, error: null }),
            }),
          }),
        };

      case "brew_steps":
        return {
          select: () => ({
            eq: function(idField: string, idValue: any) {
              // return another object that supports .eq(step_id, ...) and .single()
              return {
                eq: function(stepField: string, stepValue: any) {
                  return {
                    single: async () => ({
                      data: {
                        brew_step_id: 10,
                        id_brew: 1,
                        step_id: 1,
                        status: "in_progress",  // <- belangrijk, want loadStep checkt dit
                        position: 1,
                        completed_at: null,
                      },
                      error: null,
                    }),
                  };
                },
              };
            },
          }),
          update: () => ({ eq: () => ({ eq: async () => ({ data: [], error: null }) }) }),
          delete: () => ({ eq: async () => ({ data: [], error: null }) }),
        };

      default:
        return {
          select: () => ({ eq: async () => ({ data: [], error: null }) }),
          update: () => ({ eq: async () => ({ data: [], error: null }) }),
          delete: () => ({ eq: async () => ({ data: [], error: null }) }),
        };
    }
  });

  return { supabase: { auth: { getUser }, from } };
});

const pushMock = jest.fn();
const renderWithNavigation = (ui: React.ReactElement) =>
  render(<NavigationContainer>{ui}</NavigationContainer>);

describe("<Progress />", () => {
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

  it("toont tips", async () => {
    const { findByText } = renderWithNavigation(<Progress />);
    // our mock returns a tip for step 1 (see supabase mock), assert it shows
    expect(await findByText("Use a spoon")).toBeTruthy();
  });

  it("snapshot", () => {
    const tree = renderWithNavigation(<Progress />).toJSON();
    expect(tree).toMatchSnapshot();
  });
});

/*
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

  it("gaat correct om met een enkele stap zonder duration en zonder volgende stap", async () => {
  const { findByTestId, findByText } = renderWithNavigation(<Progress />);

  // Controleer dat de stap geladen wordt
  const stepText = await findByText("60-min Citra");
  console.log("Step loaded in UI:", stepText.props.children);

  // Druk op de FAB/Next Step knop
  const fab = await findByTestId("fab-button");
  console.log("Pressing FAB button");
  await act(async () => fireEvent.press(fab));

  console.log("Waiting for Supabase updates...");

  // Controleer dat Supabase updates werden aangeroepen
  await waitFor(() => {
    console.log("mockBrewStepsUpdate call count:", mockBrewStepsUpdate.mock.calls.length);
    console.log("mockBrewsUpdate call count:", mockBrewsUpdate.mock.calls.length);
    expect(mockBrewStepsUpdate).toHaveBeenCalled();
    expect(mockBrewsUpdate).toHaveBeenCalled();
  });

  // De UI toont nog steeds dezelfde stap
  expect(await findByText("60-min Citra")).toBeTruthy();
});
*/
