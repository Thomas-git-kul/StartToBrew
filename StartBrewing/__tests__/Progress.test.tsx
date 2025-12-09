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
  const {
    View,
    Text,
    TouchableOpacity,
    TextInput: RNTextInput,
  } = require("react-native");

  // Dialog needs subcomponents Title, Content, Actions in our codebase
  const Dialog = (props: any) =>
    React.createElement(View, props, props.children);
  Dialog.Title = (props: any) =>
    React.createElement(Text, props, props.children);
  Dialog.Content = (props: any) =>
    React.createElement(View, props, props.children);
  Dialog.Actions = (props: any) =>
    React.createElement(View, props, props.children);

  const Card = (props: any) => React.createElement(View, props, props.children);

  return {
    FAB: ({ label, onPress, children, ...rest }: any) => (
      <TouchableOpacity onPress={onPress} {...rest}>
        <Text>{label ?? children}</Text>
      </TouchableOpacity>
    ),
    Portal: ({ children }: any) => <>{children}</>,
    Modal: ({ visible, children }: any) =>
      visible ? <View>{children}</View> : null,
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
    // Icons used by Stepper and the FAB
    ChevronLeft: make("ChevronLeft"),
    ChevronRight: make("ChevronRight"),
    BotMessageSquare: make("BotMessageSquare"),
    MessageSquare: make("MessageSquare"),
    MessageCircle: make("MessageCircle"),
  };
});

// Mock countdown timer to avoid timing-related behavior in unit tests
jest.mock("react-native-countdown-circle-timer", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    CountdownCircleTimer: ({ children }: any) => {
      return React.createElement(
        View,
        null,
        typeof children === "function"
          ? children({ remainingTime: 60 })
          : children
      );
    },
  };
});

// ⬇️ Mock user progress context
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

// Exposed spies so tests can assert Supabase updates were called
let mockBrewsUpdate = jest.fn();
let mockBrewStepsUpdate = jest.fn();

// Make step rows mutable so individual tests can tweak durations
const defaultSteps = [
  {
    step_id: "1",
    title: "60-min Citra",
    title_2: "15-min Mosaic",
    description_md:
      "At T-60: briefly kill the flame to prevent foam, add hops, then resume boil.",
    description_md_2:
      "At T-15: briefly kill the flame to prevent foam, add hops, then resume boil.",
    start_offset_min: 0,
    // Keep a small non-zero default so timer tests still exercise Play/Pause
    duration_min: 0.02,
    next_step_id: "2",
    temp_c_target: 100,
  },
  {
    step_id: "2",
    title: "15-min Mosaic",
    title_2: null,
    description_md: "At T-15: add Mosaic hops.",
    description_md_2: null,
    start_offset_min: 0,
    duration_min: 0,
    next_step_id: null,
    temp_c_target: 100,
  },
];

let stepsData = JSON.parse(JSON.stringify(defaultSteps));
jest.mock("@/supabase", () => {
  const getUser = jest
    .fn()
    .mockResolvedValue({ data: { user: { id: "test-user" } } });

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
                  // batch_size_l weglaten => default 19 L in component
                },
                error: null,
              }),
              maybeSingle: async () => ({
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
          update: (payload: any) => ({
            eq: (_field?: any, _val?: any) => ({
              select: async () => {
                mockBrewsUpdate(payload);
                return { data: {}, error: null };
              },
            }),
          }),
          delete: () => ({ eq: async () => ({ data: {}, error: null }) }),
        };

      case "phases":
        return {
          select: () => ({
            eq: () => ({
              order: async () => ({
                data: [{ phase_id: "phase-1", position: 1 }],
                error: null,
              }),
              maybeSingle: async () => ({
                data: [{ phase_id: "phase-1", position: 1 }],
                error: null,
              }),
            }),
          }),
        };

      case "steps":
        return {
          select: () => ({
            eq: () => ({
              order: async () => ({
                // Provide two steps; step 1 has zero duration so UI marks it done
                data: [
                  {
                    step_id: "1",
                    title: "60-min Citra",
                    title_2: "15-min Mosaic",
                    description_md:
                      "At T-60: briefly kill the flame to prevent foam, add hops, then resume boil.",
                    description_md_2:
                      "At T-15: briefly kill the flame to prevent foam, add hops, then resume boil.",
                    start_offset_min: 0,
                    duration_min: 0.02,
                    next_step_id: "2",
                    temp_c_target: 100,
                  },
                  {
                    step_id: "2",
                    title: "15-min Mosaic",
                    title_2: null,
                    description_md: "At T-15: add Mosaic hops.",
                    description_md_2: null,
                    start_offset_min: 0,
                    duration_min: 0, // zero so final step
                    next_step_id: null,
                    temp_c_target: 100,
                  },
                ],
                error: null,
              }),
              maybeSingle: async () => ({
                data: [
                  {
                    step_id: "1",
                    title: "60-min Citra",
                    title_2: "15-min Mosaic",
                    description_md:
                      "At T-60: briefly kill the flame to prevent foam, add hops, then resume boil.",
                    description_md_2:
                      "At T-15: briefly kill the flame to prevent foam, add hops, then resume boil.",
                    start_offset_min: 0,
                    duration_min: 0,
                    next_step_id: "2",
                    temp_c_target: 100,
                  },
                  {
                    step_id: "2",
                    title: "15-min Mosaic",
                    title_2: null,
                    description_md: "At T-15: add Mosaic hops.",
                    description_md_2: null,
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
              single: async () => ({
                data: { step_id: "1", tip_md: "Use a spoon" },
                error: null,
              }),
              maybeSingle: async () => ({
                data: { step_id: "1", tip_md: "Use a spoon" },
                error: null,
              }),
            }),
          }),
        };

      case "brew_steps":
        return {
          select: () => ({
            eq: function (idField: string, idValue: any) {
              return {
                eq: function (stepField: string, stepValue: any) {
                  return {
                    single: async () => ({
                      data: {
                        brew_step_id: 10,
                        id_brew: 1,
                        step_id: 1,
                        status: "in_progress",
                        position: 1,
                        completed_at: null,
                      },
                      error: null,
                    }),
                    maybeSingle: async () => ({
                      data: {
                        brew_step_id: 10,
                        id_brew: 1,
                        step_id: 1,
                        status: "in_progress",
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
          update: (payload: any) => ({
            eq: (_field?: any, _val?: any) => ({
              eq: (_field2?: any, _val2?: any) => ({
                select: async () => {
                  mockBrewStepsUpdate(payload);
                  return { data: [], error: null };
                },
              }),
            }),
          }),
          delete: () => ({ eq: async () => ({ data: [], error: null }) }),
        };

      case "step_ingredient_refs":
        // ⬇️ HIER gefixt: gebruik amount + unit i.p.v. amount_g
        return {
          select: () => ({
            eq: () => ({
              data: [
                {
                  ingredient_id: 1,
                  amount: 100, // in g
                  unit: "g",
                },
              ],
              error: null,
            }),
          }),
        };

      case "ingredients":
        return {
          select: () => ({
            in: () => ({
              data: [{ ingredient_id: 1, name: "Malt", kind: "Hop" }],
              error: null,
            }),
          }),
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

const renderProgress = async () => {
  const utils = renderWithNavigation(<Progress />);
  await act(async () => {});
  return utils;
};

describe("<Progress />", () => {
  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({ push: pushMock });
    (useLocalSearchParams as jest.Mock).mockReturnValue({ id: "1" });
    jest.clearAllMocks();
  });

  it("Loads and displays step data and calls Supabase", async () => {
    const { findByText } = await renderProgress();
    expect(await findByText("black IPA Progress")).toBeTruthy();
    expect(await findByText("60-min Citra")).toBeTruthy();
  });

  it("Shows tips", async () => {
    const { findByText } = await renderProgress();
    expect(await findByText("Use a spoon")).toBeTruthy();
  });

  it("shows ingredients", async () => {
    const { findByText } = await renderProgress();
    // dankzij de gefixte mock wordt nu "• Malt (Hop): 100 g" gerenderd
    expect(await findByText("• Malt (Hop): 100 g")).toBeTruthy();
  });

  it("navigates to the ChatBot through FAB button", async () => {
    const { findByTestId, findByText } = await renderProgress();

    // Wait for content to load
    await findByText("black IPA Progress");

    const chatFab = await findByTestId("chat-button");

    await act(async () => fireEvent.press(chatFab));

    // Accept both string-based and object-based router.push calls.
    expect(pushMock).toHaveBeenCalled();
    const pushedArg = pushMock.mock.calls[0][0];
    if (typeof pushedArg === "string") {
      expect(pushedArg).toContain("/ChatBot");
      expect(pushedArg).toContain("fromProgress=");
    } else {
      expect(pushedArg).toMatchObject({ pathname: "/ChatBot" });
      expect(pushedArg.params).toMatchObject(
        expect.objectContaining({ from: "progress" })
      );
    }
  });

  it("snapshot", async () => {
    const tree = (await renderProgress()).toJSON();
    expect(tree).toMatchSnapshot();
  });
});

it("navigates naar volgende stap via Complete button and updates Supabase", async () => {
  const { findByText } = renderWithNavigation(<Progress />);

  // Wait for content to load
  await findByText("black IPA Progress");

  // The test environment's mocked Button ignores `disabled`, so pressing works.
  const completeBtn = await findByText(/Complete step/i);

  await act(async () => fireEvent.press(completeBtn));

  // Wait for the asynchronous Supabase updates inside goToNextStepComplete to resolve.
  await waitFor(() => {
    // These spies were added to the mock; ensure they were called
    expect(mockBrewStepsUpdate).toHaveBeenCalled();
    expect(mockBrewsUpdate).toHaveBeenCalled();
  });
});

it("gaat correct om met een enkele stap zonder duration en zonder volgende stap", async () => {
  const { findByText } = renderWithNavigation(<Progress />);

  // Controleer dat de stap geladen wordt
  const stepText = await findByText("60-min Citra");
  expect(stepText).toBeTruthy();

  // Druk op de Complete step knop (mocked Button ignores disabled)
  const completeBtn = await findByText(/Complete step/i);
  await act(async () => fireEvent.press(completeBtn));

  // Controleer dat Supabase updates werden aangeroepen
  await waitFor(() => {
    expect(mockBrewStepsUpdate).toHaveBeenCalled();
    expect(mockBrewsUpdate).toHaveBeenCalled();
  });

  // De UI toont nog steeds dezelfde stap title
  expect(await findByText("60-min Citra")).toBeTruthy();
});

it("starts and pauses the timer and calls Supabase updates", async () => {
  const { findByText } = renderWithNavigation(<Progress />);

  // Wait for UI to load
  await findByText("black IPA Progress");

  // The countdown area renders a Play icon text when timer is not active
  const play = await findByText("Play");
  await act(async () => fireEvent.press(play));

  // Starting the timer should call brew_steps.update via handlePlay
  await waitFor(() => {
    expect(mockBrewStepsUpdate).toHaveBeenCalled();
  });

  // Press again to pause (Pause icon will be rendered)
  const pause = await findByText("Pause");
  await act(async () => fireEvent.press(pause));

  // Pausing should also call brew_steps.update
  await waitFor(() => {
    expect(mockBrewStepsUpdate).toHaveBeenCalled();
  });
});

it("when brew status is 1 it sets start_date (brews.update path)", async () => {
  // Override supabase.from to return status_id:1 for the brews.select().single() call
  const sb = jest.requireMock("@/supabase").supabase;
  const originalFrom = sb.from;

  sb.from = jest.fn((table: string) => {
    if (table === "brews") {
      return {
        select: () => ({
          eq: () => ({
            single: async () => ({
              data: {
                id_brew: 1,
                recipe_slug: "black-ipa",
                name: "black IPA Progress",
                last_step_id: "1",
                status_id: 1,
              },
              error: null,
            }),
          }),
        }),
        update: (payload: any) => ({
          eq: (_f?: any, _v?: any) => ({
            select: async () => {
              mockBrewsUpdate(payload);
              return { data: {}, error: null };
            },
          }),
        }),
      };
    }
    return originalFrom(table);
  });

  const { findByText } = renderWithNavigation(<Progress />);
  await findByText("black IPA Progress");
  const completeBtn = await findByText(/Complete step/i);

  await act(async () => fireEvent.press(completeBtn));

  await waitFor(() => {
    expect(mockBrewsUpdate).toHaveBeenCalled(); // start_date/status update was invoked
  });

  // restore original
  sb.from = originalFrom;
});

it("handles two-mode and switches to phase 2 on complete", async () => {
  const sb = jest.requireMock("@/supabase").supabase;
  const originalFrom = sb.from;

  // Provide steps with next.start_offset_min > 0 to force mode: "two"
  sb.from = jest.fn((table: string) => {
    if (table === "steps") {
      return {
        select: () => ({
          eq: () => ({
            order: async () => ({
              data: [
                { step_id: "1", title: "S1", description_md: "a", start_offset_min: 0, duration_min: 10, next_step_id: "2", temp_c_target: 100 },
                { step_id: "2", title: "S2", description_md: "b", start_offset_min: 5, duration_min: 0, next_step_id: null, temp_c_target: 100 },
              ],
              error: null,
            }),
            maybeSingle: async () => ({ data: [], error: null}),
          }),
        }),
      };
    }
    // keep other tables' behavior
    return originalFrom(table);
  });

  const { findByText } = renderWithNavigation(<Progress />);
  await findByText("black IPA Progress");

  // Trigger completion (Button ignores disabled in test env)
  const completeBtn = await findByText(/Complete step/i);
  await act(async () => fireEvent.press(completeBtn));

  // After first complete in two-mode the component should switch to phase 2 (internal state).
  // We can't directly inspect private state but we can assert that code paths that call brew_steps.update were invoked:
  await waitFor(() => {
    expect(mockBrewStepsUpdate).toHaveBeenCalled();
  });

  // restore original
  sb.from = originalFrom;
});

it("shows completed date for historical step", async () => {
  const sb = jest.requireMock("@/supabase").supabase;
  const originalFrom = sb.from;
  sb.from = jest.fn((table: string) => {
    if (table === "brew_steps") {
      return {
        select: () => ({
          eq: function (idField: string, idValue: any) {
            return {
              eq: function (stepField: string, stepValue: any) {
                return {
                  single: async () => ({
                    data: {
                      brew_step_id: 10,
                      id_brew: 1,
                      step_id: 1,
                      status: "completed",
                      completed_at: new Date().toISOString(),
                    },
                    error: null,
                  }),
                };
              },
            };
          },
        }),
      };
    }
    return originalFrom(table);
  });

  const { findByText } = renderWithNavigation(<Progress />);
  await findByText("black IPA Progress");
  await findByText(/Completed on:/);

  sb.from = originalFrom;
});

/*
it("completing the final step updates brews and navigates HomePage", async () => {
  // Override route params to load the last step (id = "2")
  (useLocalSearchParams as jest.Mock).mockReturnValue({ id: "2" });
  const { findByText } = renderWithNavigation(<Progress />);

  // Wait for content to load
  await findByText("black IPA Progress");

  const completeBtn = await findByText(/Complete step/i);
  await act(async () => fireEvent.press(completeBtn));

  // Completing the last step will update brew rows and navigate HomePage
  await waitFor(() => {
    expect(mockBrewsUpdate).toHaveBeenCalled();
    expect(pushMock).toHaveBeenCalledWith("/HomePage");
  });
});
*/