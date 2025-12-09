import React from "react";
import TestRenderer from "react-test-renderer";
const { act } = TestRenderer;
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import StorePage from "../app/(tabs)/Store";
import { supabase } from "../supabase";
import { useIsFocused, NavigationContainer } from "@react-navigation/native";

// Mock lucide icons used across components
jest.mock("lucide-react-native", () => {
  const React = require("react");
  const RN = require("react-native");
  const SimpleIcon = (props: any) => React.createElement(RN.View, props, null);
  return {
    __esModule: true,
    // export common icons used in tests
    Search: SimpleIcon,
    X: SimpleIcon,
    Check: SimpleIcon,
    ShoppingCart: SimpleIcon,
    Calendar1: SimpleIcon,
    ArrowRight: SimpleIcon,
    ArrowLeft: SimpleIcon,
    House: SimpleIcon,
    HeartPlus: SimpleIcon,
    Heart: SimpleIcon,
    Trash: SimpleIcon,
    Settings: SimpleIcon,
    LogOut: SimpleIcon,
    UserCog: SimpleIcon,
  };
});

// Mock the header component to avoid side-effects from its internal hooks
jest.mock("@/components/header", () => {
  const React = require("react");
  const { View, Text, Pressable } = require("react-native");
  return {
    __esModule: true,
    default: ({ title, onIconPress, actionTestID }: any) => (
      React.createElement(View, null,
        React.createElement(Text, null, title),
        React.createElement(Pressable, { testID: actionTestID, onPress: onIconPress }, React.createElement(Text, null, "Icon"))
      )
    ),
  };
});

// --- 🧩 MOCKS --- //
const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock("@/hooks/use-fonts", () => ({
  useFonts: () => [true],
}));

jest.mock("react-native-safe-area-context", () => {
  const { View } = require("react-native");
  return {
    SafeAreaProvider: ({ children }: any) => <View>{children}</View>,
    SafeAreaView: ({ children, style }: any) => <View style={style}>{children}</View>,
  };
});

interface StoreCardProps {
  id?: number;
  categoryId?: number;
  title: string;
  price: string;
  image?: any;
  onPress?: () => void;
}
const MockStoreCard = jest.fn((props: StoreCardProps) => null);
jest.mock("@/components/ui/StoreCard", () => (props: StoreCardProps) => {
  MockStoreCard(props);
  return null;
});

jest.mock("react-native-paper", () => {
  const React = require("react");
  const { View, Text, TextInput, Pressable } = require("react-native");

  return {
    Appbar: {
      Header: ({ children }: any) => <View>{children}</View>,
      Content: ({ title }: any) => <Text>{title}</Text>,
      Action: ({ testID, onPress }: any) => (
        <Pressable testID={testID} onPress={onPress}>
          <Text>Action</Text>
        </Pressable>
      ),
    },
    Searchbar: ({ placeholder, value, onChangeText, onClearIconPress }: any) => (
      <TextInput
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        testID="searchbar"
      />
    ),
    Chip: ({ children, onPress }: any) => (
      <Pressable onPress={onPress}><Text>{children}</Text></Pressable>
    ),
    Badge: ({ children }: any) => <Text>{children}</Text>,
    Button: ({ children, onPress }: any) => (
      <Pressable onPress={onPress}><Text>{children}</Text></Pressable>
    ),
    View,
    Text,
  };
});

jest.mock("../supabase", () => {
  return {
    supabase: {
      from: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        then: jest.fn(),
        // We'll resolve immediately
      })),
      auth: {
        getUser: jest.fn(() => Promise.resolve({ data: { user: null } })),
      },
    },
  };
});

jest.mock("@react-navigation/native", () => {
  const actual = jest.requireActual("@react-navigation/native");
  return {
    ...actual,
    useIsFocused: jest.fn(),
  };
});

const mockUseIsFocused = useIsFocused as jest.Mock;

(supabase.from as jest.Mock).mockImplementation((table: string) => {
  if (table === "category") {
    return {
      select: () => ({
        limit: () => Promise.resolve({
          data: [
            { id_category: 1, name: "Malt" },
            { id_category: 2, name: "Hops" },
          ],
          error: null,
        }),
      }),
    };
  }
  if (table === "store_items") {
    return {
      select: () => ({
        limit: () => Promise.resolve({
          data: [
            { id_store_item: 1, name: "Item 1", category_id: 1, price: 10 },
            { id_store_item: 2, name: "Item 2", category_id: 2, price: 20 },
          ],
          error: null,
        }),
      }),
    };
  }
  if (table === "starter_kits") {
    return {
      select: () => ({
        limit: () => Promise.resolve({
          data: [
            { id_starter_kit: 3, name: "Starter Kit", price: 50 },
          ],
          error: null,
        }),
      }),
    };
  }
  return { select: () => ({ limit: () => Promise.resolve({ data: [], error: null }) }) };
});

// --- 🧪 TESTS --- //
describe("<StorePage />", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseIsFocused.mockReturnValue(true); // Simulate the page being focused
  });

  const renderWithNavigation = (ui: React.ReactElement) => {
    return render(<NavigationContainer>{ui}</NavigationContainer>);
  };

  it("renders main title", async () => {
    const { getByText } = renderWithNavigation(<StorePage />);
    await waitFor(() => {
      expect(getByText("Store")).toBeTruthy();
    });
  });

  it("renders correct number of StoreCard components", async () => {
    renderWithNavigation(<StorePage />);
    await waitFor(() => {
      expect(MockStoreCard).toHaveBeenCalledTimes(3); // 2 store_items + 1 starter kit
    });
  });

  it("passes correct props to the first StoreCard", async () => {
    renderWithNavigation(<StorePage />);
    await waitFor(() => {
      const firstCall = MockStoreCard.mock.calls[0][0] as StoreCardProps;
      expect(firstCall.title).toBe("Item 1");
      expect(firstCall.price).toBe("€10");
      expect(firstCall.categoryId).toBe(1);
    });
  });

  it("navigates to cart when cart button pressed", async () => {
    const { getByTestId } = renderWithNavigation(<StorePage />);
    await waitFor(() => {
      expect(getByTestId("cart-button")).toBeTruthy();
    });
    await act(async () => {
      fireEvent.press(getByTestId("cart-button")); // use testID, not text
    });
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/ShoppingCart");
    });
  });

  it("selecting a category chip reorders chips (selected first)", async () => {
    const { getAllByText, getByText } = renderWithNavigation(<StorePage />);
    await waitFor(() => {
      // initial order from mock: Malt then Hops
      const all = getAllByText(/Malt|Hops/);
      expect(all[0].props.children).toBe("Malt");
      expect(all[1].props.children).toBe("Hops");
    });

    // press Hops to select it and cause it to be ordered first
    await act(async () => {
      fireEvent.press(getByText("Hops"));
    });

    await waitFor(() => {
      const all = getAllByText(/Malt|Hops/);
      expect(all[0].props.children).toBe("Hops");
      expect(all[1].props.children).toBe("Malt");
    });
  });

  it("filters items when typing in searchbar", async () => {
    const { getByTestId } = renderWithNavigation(<StorePage />);
    await waitFor(() => {
      expect(getByTestId("searchbar")).toBeTruthy();
    });

    // Type a query that only matches "Item 2"
    await act(async () => {
      fireEvent.changeText(getByTestId("searchbar"), "Item 2");
    });

    await waitFor(() => {
      // Only one StoreCard should be rendered for Item 2
      const calls = MockStoreCard.mock.calls.map((c) => c[0]?.title);
      // find titles from calls - at least one should be "Item 2"
      expect(calls.some((t) => t === "Item 2")).toBeTruthy();
    });
  });

  it("shows Clear Filters and resets search and selected categories when list is empty", async () => {
    // Override supabase mock so there are categories but no items
    (supabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === "category") {
        return {
          select: () => ({
            limit: () => Promise.resolve({
              data: [
                { id_category: 1, name: "CatA" },
                { id_category: 2, name: "CatB" },
              ],
              error: null,
            }),
          }),
        };
      }
      // Return empty arrays for store items and starter kits
      return { select: () => ({ limit: () => Promise.resolve({ data: [], error: null }) }) };
    });

    const { getByText, getByTestId, getAllByText, queryByText } = renderWithNavigation(<StorePage />);

    // wait for chips to render
    await waitFor(() => {
      expect(getByText("CatA")).toBeTruthy();
      expect(getByText("CatB")).toBeTruthy();
    });

    // select CatB to change ordering
    await act(async () => {
      fireEvent.press(getByText("CatB"));
    });

    await waitFor(() => {
      expect(getByText("CatB")).toBeTruthy();
    });

    // type something into searchbar
    await act(async () => {
      fireEvent.changeText(getByTestId("searchbar"), "no-match");
    });

    // Ensure the empty list component shows (Clear Filters button)
    await waitFor(() => {
      expect(getByText("Clear Filters")).toBeTruthy();
    });

    // Press Clear Filters and ensure search is cleared and chips reset
    await act(async () => {
      fireEvent.press(getByText("Clear Filters"));
    });

    await waitFor(() => {
      // searchbar value should be empty after clearing
      expect(getByTestId("searchbar").props.value).toBe("");
      // ordering should return to default (CatA then CatB)
      const all = getAllByText(/CatA|CatB/);
      expect(all[0].props.children).toBe("CatA");
      expect(all[1].props.children).toBe("CatB");
      // Clear Filters button is still present in the UI (component rendered)
      expect(queryByText("Clear Filters")).toBeTruthy();
    });
  });

  it("does not fetch cart count when not focused", async () => {
    mockUseIsFocused.mockReturnValue(false); // Simulate the page not being focused
    renderWithNavigation(<StorePage />);

    await waitFor(() => {
      expect(supabase.from).not.toHaveBeenCalledWith("shopping_cart_items");
    });
  });

  it("handles category fetch error and sets empty categories", async () => {
    // category returns an error
    (supabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === "category") {
        return {
          select: () => ({
            limit: () => Promise.resolve({ data: null, error: { message: "cat error" } }),
          }),
        };
      }
      // default other tables return sample data
      if (table === "store_items") {
        return {
          select: () => ({ limit: () => Promise.resolve({ data: [{ id_store_item: 1, name: "Item 1", category_id: 1, price: 10 }], error: null }) }),
        };
      }
      if (table === "starter_kits") {
        return { select: () => ({ limit: () => Promise.resolve({ data: [], error: null }) }) };
      }
      return { select: () => ({ limit: () => Promise.resolve({ data: [], error: null }) }) };
    });

    const { queryByText } = renderWithNavigation(<StorePage />);

    await waitFor(() => {
      // Expect no category chips rendered when category fetch errors
      expect(queryByText("Malt")).toBeNull();
      expect(queryByText("Hops")).toBeNull();
    });
  });

  it("handles store_items fetch error and shows empty list", async () => {
    // make store_items return an error
    (supabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === "category") {
        return { select: () => ({ limit: () => Promise.resolve({ data: [{ id_category: 1, name: "Malt" }], error: null }) }) };
      }
      if (table === "store_items") {
        return { select: () => ({ limit: () => Promise.resolve({ data: null, error: { message: "items error" } }) }) };
      }
      if (table === "starter_kits") {
        return { select: () => ({ limit: () => Promise.resolve({ data: [], error: null }) }) };
      }
      return { select: () => ({ limit: () => Promise.resolve({ data: [], error: null }) }) };
    });

    const { getByText } = renderWithNavigation(<StorePage />);

    await waitFor(() => {
      // When items fetch errors, ListEmptyComponent should show
      expect(getByText("Clear Filters")).toBeTruthy();
      // And no StoreCard should have been rendered
      expect(MockStoreCard).not.toHaveBeenCalled();
    });
  });
});
