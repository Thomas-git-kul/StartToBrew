import '@testing-library/jest-native/extend-expect';

jest.mock('react-native-safe-area-context', () => {
  return {
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
    SafeAreaProvider: ({ children }) => children,
  };
});

jest.mock('expo-router', () => {
  const React = require('react');
  return {
    Link: ({ children }) => React.createElement('div', null, children),
    Redirect: () => null,
  };
});

jest.mock("@expo/vector-icons", () => {
  const React = require("react");
  return {
    MaterialCommunityIcons: (props) => React.createElement("Icon", props),
    Ionicons: (props) => React.createElement("Icon", props),
    FontAwesome: (props) => React.createElement("Icon", props),
  };
});

// Ensure focus effects run inside act to avoid "not wrapped in act" warnings
try {
  const { act } = require('react-test-renderer');
  jest.mock('@react-navigation/native', () => {
    const actual = jest.requireActual('@react-navigation/native');
    return {
      ...actual,
      useFocusEffect: (cb) => {
        // run the provided callback inside act so state updates are properly batched in tests
        act(() => {
          cb();
        });
      },
    };
  });
} catch (e) {
  // If test renderer isn't available, skip the mock to avoid breaking the setup.
}

// Provide a safe global mock for the Supabase client so components' useEffects
// don't perform unexpected async work during tests. Individual tests may
// override this with their own `jest.mock('@/supabase', ...)` if needed.
try {
  jest.mock('@/supabase', () => {
    const DB = {
      recipes: { data: [], error: null },
      recipe_reviews: { data: [], error: null },
      brews: { data: [], error: null },
      phases: { data: [], error: null },
      steps: { data: [], error: null },
      brew_steps: { data: [], error: null },
    };

    const chainable = (tableKey) => {
      const tableData = DB[tableKey] ?? { data: [], error: null };
      const thenable = {
        then(cb) {
          return Promise.resolve(tableData).then(cb);
        },
        catch(cb) {
          return Promise.resolve(tableData).catch(cb);
        },
        in() {
          return Promise.resolve(tableData);
        },
        eq() {
          return Promise.resolve(tableData);
        },
        select() {
          return thenable;
        },
        insert(payload) {
          return Promise.resolve({ data: payload, error: null });
        },
        delete() {
          return Promise.resolve({ data: null, error: null });
        },
      };
      return thenable;
    };

    return {
      supabase: {
        auth: {
          getUser: () => Promise.resolve({ data: { user: { id: 'test-user' } }, error: null }),
          getSession: () => Promise.resolve({ data: { session: { user: { id: 'test-user' } } }, error: null }),
        },
        from: (table) => chainable(table),
      },
    };
  });
} catch (e) {
  // ignore
}
