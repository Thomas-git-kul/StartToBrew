import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native"; // ← waitFor toegevoegd
import { FavoritesProvider } from "@/context/FavoritesContext";
// `NavigationContainer` will be required after mocks so it uses the mocked implementation
// allow console.error so we can see underlying render errors while debugging
// jest.spyOn(console, "error").mockImplementation(() => {});

/* ------------------------------
   MOCK DATA
------------------------------- */

const recipesData = [
  {
    recipe_slug: "americanipa-den-ballaste-point-sculpin-ipa-60",
    name: "Den Ballaste Point Sculpin IPA 60",
    description: "Den Ballaste Point Sculpin IPA 60 is a classic American IPA.",
    rating: null,
    haze_level: 1,
    srm_target: 6.0,
    style: "American IPA",
  },
  {
    recipe_slug: "americanipa-city-of-the-sun-ipa",
    name: "City of the Sun IPA",
    description: "City of the Sun IPA is a sunny American IPA.",
    rating: null,
    haze_level: 1,
    srm_target: 5.1,
    style: "American IPA",
  },
  {
    recipe_slug: "sessionipa-smash-session-pale-ale",
    name: "SMaSH Session Pale Ale",
    description: "SMaSH Session Pale Ale is een lichte Session IPA.",
    rating: null,
    haze_level: 2,
    srm_target: 3.4,
    style: "Session IPA",
  },
];

const reviewData = [
  { recipe_slug: "americanipa-den-ballaste-point-sculpin-ipa-60", rating: 4 },
  { recipe_slug: "americanipa-city-of-the-sun-ipa", rating: 3 },
  { recipe_slug: "sessionipa-smash-session-pale-ale", rating: 5 },
];

/* ------------------------------
   HELPERS
------------------------------- */

type RecipesDataType = typeof recipesData;

const createRecipesQuery = (listData: RecipesDataType = recipesData) => ({
  select: () => ({
    then(
      cb:
        | ((value: {
            data: {
              recipe_slug: string;
              name: string;
              description: string;
              rating: null;
              haze_level: number;
              srm_target: number;
              style: string;
            }[];
            error: null;
          }) =>
            | {
                data: {
                  recipe_slug: string;
                  name: string;
                  description: string;
                  rating: null;
                  haze_level: number;
                  srm_target: number;
                  style: string;
                }[];
                error: null;
              }
            | PromiseLike<{
                data: {
                  recipe_slug: string;
                  name: string;
                  description: string;
                  rating: null;
                  haze_level: number;
                  srm_target: number;
                  style: string;
                }[];
                error: null;
              }>)
        | null
        | undefined
    ) {
      return Promise.resolve({ data: listData, error: null }).then(cb);
    },
  }),
  then(
    cb:
      | ((value: {
          data: {
            recipe_slug: string;
            name: string;
            description: string;
            rating: null;
            haze_level: number;
            srm_target: number;
            style: string;
          }[];
          error: null;
        }) =>
          | {
              data: {
                recipe_slug: string;
                name: string;
                description: string;
                rating: null;
                haze_level: number;
                srm_target: number;
                style: string;
              }[];
              error: null;
            }
          | PromiseLike<{
              data: {
                recipe_slug: string;
                name: string;
                description: string;
                rating: null;
                haze_level: number;
                srm_target: number;
                style: string;
              }[];
              error: null;
            }>)
      | null
      | undefined
  ) {
    return Promise.resolve({ data: listData, error: null }).then(cb);
  },
});

/* ------------------------------
   MOCKS
------------------------------- */

const pushMock = jest.fn();
jest.mock("expo-router", () => ({ useRouter: jest.fn() }));

jest.mock("@/hooks/use-fonts", () => ({ useFonts: () => true }));
jest.mock("@/hooks/beer-image", () => ({
  getBeerImageSource: () => ({ uri: "test-beer-image" }),
}));

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

jest.mock("react-native-safe-area-context", () => {
  const React = require("react");
  const { View } = require("react-native");
  const SafeAreaContext = React.createContext({ top: 0, bottom: 0, left: 0, right: 0 });
  const SafeAreaInsetsContext = SafeAreaContext; // react-native-paper expects this named export
  return {
    SafeAreaView: ({ children }: any) => <View>{children}</View>,
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
    SafeAreaProvider: ({ children }: any) => children,
    SafeAreaContext,
    SafeAreaInsetsContext,
    initialWindowMetrics: null,
  };
});

jest.mock("@/constants/Colors", () => ({
  BASE_COLORS: {
    WHITE: "#fff",
    TEXT_DARK: "#000",
    ACCENT_PRIMARY: "#f00",
    LIGHT_BG: "#eee",
    STONE300: "#E5E7EB",
    STONE500: "#6B7280",
    STONE700: "#374151",
  },
}));

jest.mock("@/constants/Fonts", () => ({
  FontFamilies: {
    HEADING: "System",
    BODY: "System",
    BODY_BOLD: "System",
  },
}));

jest.mock("@/components/ui/RecipeCard", () => {
  const { View, Text, Pressable } = require("react-native");
  return ({ name, onToggleFavorite, onPress }: any) => (
    <Pressable onPress={onPress}>
      <View>
        <Text>{name}</Text>
        <Pressable
          accessibilityLabel={`favorite-${name}`}
          onPress={onToggleFavorite}
        >
          <Text>FavBtn</Text>
        </Pressable>
      </View>
    </Pressable>
  );
});

jest.mock("@/components/ui/ProgressCard", () => {
  const { View, Text, Pressable } = require("react-native");
  return ({ title, onPress }: any) => (
    <Pressable onPress={onPress}>
      <View>
        <Text>{title}</Text>
      </View>
    </Pressable>
  );
});

jest.mock("lucide-react-native", () => {
  const { Text } = require("react-native");
  return { Plus: () => <Text>Plus</Text> };
});

// Ensure focus effects run inside React's effect lifecycle during tests
jest.mock("@react-navigation/native", () => {
  const React = require("react");
  return {
    useFocusEffect: (cb: any) => React.useEffect(cb, []),
    NavigationContainer: ({ children }: any) => children,
  };
});

/* ------------------------------
   ROBUUST KETENBARE SUPABASE MOCK
------------------------------- */

function makeThenable(obj: any) {
  const wrapper: any = {
    then: (cb: any) => Promise.resolve(obj).then(cb),
    catch: (cb: any) => Promise.resolve(obj).catch(cb),
  };
  wrapper.in = () => Promise.resolve(obj);
  wrapper.eq = () => Promise.resolve(obj);
  return wrapper;
}

jest.mock("@/supabase", () => {
  const DB: Record<string, any> = {
    recipes: { data: recipesData, error: null },
    recipe_reviews: { data: reviewData, error: null },
    brews: {
      data: [
        {
          id_brew: 1,
          name: "Hazy IPA",
          recipe_slug: "americanipa-den-ballaste-point-sculpin-ipa-60",
          user_id: "test-user",
          status_id: 1,
        },
      ],
      error: null,
    },
    phases: { data: [{ phase_id: "PH1" }], error: null },
    steps: { data: [{ step_id: 1 }, { step_id: 2 }], error: null },
    brew_steps: { data: [{ step_id: 1 }], error: null },
  };

  const chainable = (tableKey: string) => {
    const tableData = DB[tableKey] ?? { data: [], error: null };
    const result = {
      select: () => {
        const sel = {
          in: () => Promise.resolve(tableData),
          eq: () => {
            const intermediate = {
              eq: () => Promise.resolve(tableData),
              in: () => Promise.resolve(tableData),
              then: (cb: any) => Promise.resolve(tableData).then(cb),
              catch: (cb: any) => Promise.resolve(tableData).catch(cb),
            };
            return intermediate;
          },
          then: (cb: any) => Promise.resolve(tableData).then(cb),
          catch: (cb: any) => Promise.resolve(tableData).catch(cb),
        };
        return sel;
      },
      insert: (payload?: any) =>
        Promise.resolve({ data: payload, error: null }),
      delete: () => Promise.resolve({ data: null, error: null }),
      in: () => Promise.resolve(tableData),
      eq: () => Promise.resolve(tableData),
      then: (cb: any) => Promise.resolve(tableData).then(cb),
      catch: (cb: any) => Promise.resolve(tableData).catch(cb),
    };

    return result;
  };

  return {
    supabase: {
      auth: {
        getUser: () => Promise.resolve({ data: { user: { id: "test-user" } } }),
        getSession: () =>
          Promise.resolve({
            data: { session: { user: { id: "test-user" } } },
          }),
      },
      from: (table: string) => {
        if (
          [
            "recipes",
            "recipe_reviews",
            "brews",
            "phases",
            "steps",
            "brew_steps",
          ].includes(table)
        ) {
          return chainable(table);
        }
        return chainable(table);
      },
    },
  };
});

// Require router/component/navigation after mocks so they use the mocked modules
const { useRouter } = require("expo-router");
const HomePage = require("../app/(tabs)/HomePage").default;
const NavigationContainer = require("@react-navigation/native").NavigationContainer;

/* ------------------------------
   TEST UTIL
------------------------------- */

const { render: renderWithAct, fireEvent: fireEventWithAct } = require('../tests/test-utils');

const renderWithNavigation = async (ui: React.ReactElement) => {
  const { Provider: PaperProvider } = require('react-native-paper');
  return renderWithAct(
    <NavigationContainer>
      <PaperProvider>
        <FavoritesProvider>{ui}</FavoritesProvider>
      </PaperProvider>
    </NavigationContainer>
  );
};

/* ------------------------------
   TESTS
------------------------------- */

describe("<HomePage />", () => {
  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({ push: pushMock });
    pushMock.mockClear();
  });

  it("rendered hoofdsecties", async () => {
    const { getByText } = await renderWithNavigation(<HomePage />);

    expect(getByText("StartToBrew")).toBeTruthy();
    expect(getByText("In progress")).toBeTruthy();
    expect(getByText("Popular recipes")).toBeTruthy();
  });

  it("laadt recipes", async () => {
    const { findByText } = await renderWithNavigation(<HomePage />);
    expect(await findByText("Den Ballaste Point Sculpin IPA 60")).toBeTruthy();
    expect(await findByText("City of the Sun IPA")).toBeTruthy();
    expect(await findByText("SMaSH Session Pale Ale")).toBeTruthy();
  });

  it("kan favorite togglen zonder crash", async () => {
    const { findByLabelText } = await renderWithNavigation(<HomePage />);

    const favBtn = await findByLabelText(
      "favorite-Den Ballaste Point Sculpin IPA 60"
    );
    fireEvent.press(favBtn);
    fireEvent.press(favBtn);

    expect(favBtn).toBeTruthy();
  });

  it("navigates naar /Recipes via FAB", async () => {
    const { findByTestId } = await renderWithNavigation(<HomePage />);
    const fab = await findByTestId("fab");

    fireEvent.press(fab);

    // ← wachten tot async withAuthGuard klaar is
    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/Recipes");
    });
  });

  it("navigates naar SpecificRecipe via beer card", async () => {
    const { findByText } = await renderWithNavigation(<HomePage />);

    const card = await findByText("Den Ballaste Point Sculpin IPA 60");
    fireEvent.press(card);

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith(
        expect.objectContaining({
          pathname: "/SpecificRecipe",
          params: expect.objectContaining({
            recipe_slug: "americanipa-den-ballaste-point-sculpin-ipa-60",
          }),
        })
      );
    });
  });

  it("toont de in-progress brews in de 'In progress' sectie", async () => {
    const { findByText, getByText, toJSON } = await renderWithNavigation(
      <HomePage />
    );

    const sectionTitle = getByText("In progress");
    expect(sectionTitle).toBeTruthy();

    const brewCard = await findByText("Hazy IPA");
    expect(brewCard).toBeTruthy();

    const tree = toJSON();
    const renderedText = JSON.stringify(tree);

    const indexSection = renderedText.indexOf("In progress");
    const indexBrew = renderedText.indexOf("Hazy IPA");

    expect(indexSection).toBeGreaterThan(-1);
    expect(indexBrew).toBeGreaterThan(-1);
    expect(indexBrew).toBeGreaterThan(indexSection);
  });

  it("progress card navigates correctly", async () => {
    const { findByText } = await renderWithNavigation(<HomePage />);
    const progressCard = await findByText("Hazy IPA");

    fireEvent.press(progressCard);

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith({
        pathname: "/progress",
        params: { id: 1 },
      });
    });
  });

  it("snapshot", async () => {
    const tree = (await renderWithNavigation(<HomePage />)).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
