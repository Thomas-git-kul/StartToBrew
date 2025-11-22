import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import HomePage from "../app/(tabs)/HomePage";
import { NavigationContainer } from "@react-navigation/native";
import { useRouter } from "expo-router";
jest.spyOn(console, "error").mockImplementation(() => {});

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
  const { View } = require("react-native");
  return {
    SafeAreaView: ({ children }: any) => <View>{children}</View>,
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
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
        <Pressable accessibilityLabel={`favorite-${name}`} onPress={onToggleFavorite}>
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

/* ------------------------------
   ROBUUST KETENBARE SUPABASE MOCK
------------------------------- */

function makeThenable(obj: any) {
  // Ensure object has then so awaiting works: return { data, error }
  const wrapper: any = {
    then: (cb: any) => Promise.resolve(obj).then(cb),
    catch: (cb: any) => Promise.resolve(obj).catch(cb),
  };
  // Also expose in/eq for chaining if someone calls them on the thenable
  wrapper.in = (/*...args*/) => Promise.resolve(obj);
  wrapper.eq = (/*...args*/) => Promise.resolve(obj);
  return wrapper;
}

jest.mock("@/supabase", () => {
  // Precompute dataset per table
  const DB: Record<string, any> = {
    recipes: { data: recipesData, error: null },
    recipe_reviews: { data: reviewData, error: null },
    brews: { data: [{ id_brew: 1, name: "Hazy IPA", recipe_slug: "americanipa-den-ballaste-point-sculpin-ipa-60" }], error: null },
    phases: { data: [{ phase_id: "PH1" }], error: null },
    steps: { data: [{ step_id: 1 }, { step_id: 2 }], error: null },
    brew_steps: { data: [{ step_id: 1 }], error: null },
  };

  // Factory that returns chainable objects for select().in().eq()
  const chainable = (tableKey: string) => {
    const tableData = DB[tableKey] ?? { data: [], error: null };

    const select = (_cols?: string) => {
      // returned object supports .in(...) and .eq(...).eq(...)
      const result = {
        in: (_col?: string, _vals?: any[]) => Promise.resolve(tableData),
        eq: (_col?: string, _val?: any) => {
          // Return an object that supports a second .eq call and thenable
          const intermediate = {
            eq: (_col2?: string, _val2?: any) => Promise.resolve(tableData),
            then: (cb: any) => Promise.resolve(tableData).then(cb),
            catch: (cb: any) => Promise.resolve(tableData).catch(cb),
          };
          return intermediate;
        },
        then: (cb: any) => Promise.resolve(tableData).then(cb),
        catch: (cb: any) => Promise.resolve(tableData).catch(cb),
      };
      return result;
    };

    // select sometimes is awaited directly (no chaining), so also provide thenable select
    return { select };
  };

  return {
    supabase: {
      auth: {
        getUser: () => Promise.resolve({ data: { user: { id: "test-user" } } }),
      },
      from: (table: string) => {
        // Some code expects .select().in(...), some expects .select(...).eq(...).eq(...)
        // Provide a chainable API for each table:
        if (["recipes", "recipe_reviews", "brews", "phases", "steps", "brew_steps"].includes(table)) {
          return chainable(table);
        }
        // fallback
        return chainable(table);
      },
    },
  };
});

/* ------------------------------
   TEST UTIL
------------------------------- */

const renderWithNavigation = (ui: React.ReactElement) =>
  render(<NavigationContainer>{ui}</NavigationContainer>);

/* ------------------------------
   TESTS
------------------------------- */

describe("<HomePage />", () => {
  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({ push: pushMock });
    pushMock.mockClear();
  });

  it("rendered hoofdsecties", () => {
    const { getByText } = renderWithNavigation(<HomePage />);

    expect(getByText("StartToBrew")).toBeTruthy();
    expect(getByText("In progress")).toBeTruthy();
    expect(getByText("Popular recipes")).toBeTruthy();
  });

  it("laadt recipes", async () => {
    const { findByText } = renderWithNavigation(<HomePage />);
    expect(await findByText("Den Ballaste Point Sculpin IPA 60")).toBeTruthy();
    expect(await findByText("City of the Sun IPA")).toBeTruthy();
    expect(await findByText("SMaSH Session Pale Ale")).toBeTruthy();
  });

  it("kan favorite togglen zonder crash", async () => {
    const { findByLabelText } = renderWithNavigation(<HomePage />);

    const favBtn = await findByLabelText(
      "favorite-Den Ballaste Point Sculpin IPA 60"
    );
    fireEvent.press(favBtn);
    fireEvent.press(favBtn);

    expect(favBtn).toBeTruthy();
  });

  it("navigates naar /Recipes via FAB", async () => {
    const { findByTestId } = renderWithNavigation(<HomePage />);
    const fab = await findByTestId("fab");

    fireEvent.press(fab);
    expect(pushMock).toHaveBeenCalledWith("/Recipes");
  });

  it("navigates naar SpecificRecipe via beer card", async () => {
    const { findByText } = renderWithNavigation(<HomePage />);

    const card = await findByText("Den Ballaste Point Sculpin IPA 60");
    fireEvent.press(card);

    expect(pushMock).toHaveBeenCalledWith({
      pathname: "/SpecificRecipe",
      params: {
        recipe_slug: "americanipa-den-ballaste-point-sculpin-ipa-60",
      },
    });
  });

  it("toont de in-progress brews in de 'In progress' sectie", async () => {
  const { findByText, getByText, toJSON } = renderWithNavigation(<HomePage />);

  // Titel van de sectie moet bestaan
  const sectionTitle = getByText("In progress");
  expect(sectionTitle).toBeTruthy();

  // De brew moet verschijnen
  const brewCard = await findByText("Hazy IPA");
  expect(brewCard).toBeTruthy();

  // Controle via de uiteindelijke JSON output (veiligste manier)
  const tree = toJSON();
  const renderedText = JSON.stringify(tree);

  const indexSection = renderedText.indexOf("In progress");
  const indexBrew = renderedText.indexOf("Hazy IPA");

  expect(indexSection).toBeGreaterThan(-1);
  expect(indexBrew).toBeGreaterThan(-1);

  // De brew moet ná de sectietitel komen (dus binnen die sectie)
  expect(indexBrew).toBeGreaterThan(indexSection);
});

  it("progress card navigates correctly", async () => {
    const { findByText } = renderWithNavigation(<HomePage />);
    const progressCard = await findByText("Hazy IPA");

    fireEvent.press(progressCard);
    expect(pushMock).toHaveBeenCalledWith({
      pathname: "/progress",
      params: { id: 1 },
    });
  });

  it("snapshot", () => {
    const tree = renderWithNavigation(<HomePage />).toJSON();
    expect(tree).toMatchSnapshot();
  });
});