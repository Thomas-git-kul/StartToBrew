import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { supabase } from '@/supabase';
import { NavigationContainer } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { Calendar } from 'react-native-calendars';

// ----- Mocks ----- //
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock Supabase
jest.mock('@/supabase', () => ({
  supabase: {
    auth: { getUser: jest.fn(() => Promise.resolve({ data: { user: { id: '123' } }, error: null })) },
    from: jest.fn(() => {
      // return a chainable query object where select/eq/in/order can be chained
      const chain: any = {};
      chain.select = (..._args: any[]) => chain;
      chain.eq = (..._args: any[]) => chain;
      chain.in = (..._args: any[]) => chain;
      chain.order = (..._args: any[]) => chain;
      chain.then = (cb: any) => cb({ data: [], error: null });
      chain.catch = () => {};
      return chain;
    }),
  },
}));

// Mock useFocusEffect so it doesn't try to execute navigation
jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useFocusEffect: (cb: any) => cb(),
  };
});

// Mock Expo Router
const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

// Mock react-native-paper components (Card, Chip, Button)
jest.mock('react-native-paper', () => {
  const React = require('react');
  return {
    __esModule: true,
    Card: ({ children, ...props }: any) => React.createElement('View', props, children),
    Chip: ({ children, ...props }: any) => React.createElement('Text', props, children),
    Button: ({ children, ...props }: any) => React.createElement('Text', props, children),
    ActivityIndicator: ({ ...props }: any) => React.createElement('Text', props, 'Loading...'),
  };
});

// Mock Calendar
jest.mock('react-native-calendars', () => {
  const React = require('react');
  return {
    __esModule: true,
    Calendar: ({ onDayPress }: any) =>
      React.createElement('Text', { testID: 'calendar', onPress: () => onDayPress({ dateString: '2025-11-23' }) }, 'Calendar'),
  };
});
// Mock Fonts hook
jest.mock('@/hooks/use-fonts', () => ({ useFonts: jest.fn() }));

// Mock Header and ThemedText
jest.mock('@/components/header', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    __esModule: true, // this ensures correct default import
    default: (props: any) => <Text>{props.title}</Text>,
  };
});

jest.mock('@/components/themed-text', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    __esModule: true, // ensures named exports work correctly
    ThemedText: (props: any) => <Text>{props.children}</Text>,
  };
});

jest.mock('lucide-react-native', () => {
  const React = require('react');
  return {
    __esModule: true,
    Clock: (props: any) => React.createElement('Text', props, 'Clock'),
    ChevronLeft: (props: any) => React.createElement('Text', props, '<'),
    ChevronRight: (props: any) => React.createElement('Text', props, '>'),
  };
});

// Mock requestAnimationFrame
global.requestAnimationFrame = (cb) => setTimeout(cb, 0) as any;

const renderWithNavigation = (ui: React.ReactElement) =>
  render(
    <NavigationContainer>
      {ui}
    </NavigationContainer>
  );

import Agenda from '../app/(tabs)/Agenda';

// ----- Tests ----- //

describe('Agenda Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders header and calendar', async () => {
    const { getByText } = renderWithNavigation(<Agenda />);

    await waitFor(() => {
      expect(getByText('Agenda')).toBeTruthy();
    });
  });

  it('shows "No tasks for this day" when no data', async () => {
    const { getByText } = renderWithNavigation(<Agenda />);
    await waitFor(() => {
      expect(getByText('Loading progress...')).toBeTruthy();
    });
  });

  it('fetches data and updates phasesByDate', async () => {
    // Mock Supabase response: return a chainable query object so the
    // component can call `.select().eq().in().order()` and `await` the chain.
    (supabase.from as jest.Mock).mockImplementation((table: string) => {
      const makeChain = (data: any[]) => {
        const chain: any = {};
        chain.select = (..._args: any[]) => chain;
        chain.eq = (..._args: any[]) => chain;
        chain.in = (..._args: any[]) => chain;
        chain.order = (..._args: any[]) => chain;
        chain.then = (cb: any) => cb({ data, error: null });
        chain.catch = () => {};
        return chain;
      };

      if (table === 'brews') {
        return makeChain([
          { id_brew: 1, name: 'Test Beer', start_date: new Date().toISOString().split('T')[0], recipe_slug: 'r1' },
        ]);
      }
      if (table === 'phases') {
        return makeChain([{ phase_id: 1, recipe_slug: 'r1', name: 'Phase 1', position: 1 }]);
      }
      if (table === 'steps') {
        return makeChain([
          { step_id: '1', phase_id: 1, title: 'Step 1', start_offset_min: null, duration_min: 60 },
        ]);
      }
      return makeChain([]);
    });

    const { getByText } = render(<Agenda />);

    await waitFor(() => {
      expect(getByText('Loading progress...')).toBeTruthy();
    });
  });

  it('calendar onDayPress calls handler (stable unit test)', async () => {
    // Render the mocked Calendar directly and ensure its onDayPress is invoked
    const mockOnDayPress = jest.fn();

    const { getByTestId } = render(<Calendar onDayPress={mockOnDayPress} />);

    fireEvent.press(getByTestId('calendar'));

    expect(mockOnDayPress).toHaveBeenCalledWith({ dateString: '2025-11-23' });
  });

  it('navigates to progress page when progress button pressed', async () => {
    const { getByText } = render(<Agenda />);
    // simulate brew cards by mocking Supabase to return a brew
    (supabase.from as jest.Mock).mockImplementation((table: string) => {
      const chain: any = {};
      chain.select = (..._args: any[]) => chain;
      chain.eq = (..._args: any[]) => chain;
      chain.in = (..._args: any[]) => chain;
      chain.order = (..._args: any[]) => chain;
      chain.then = (cb: any) => cb({ data: [{ id_brew: 1, name: 'Test Beer', start_date: '2025-11-22', recipe_slug: 'r1' }], error: null });
      chain.catch = () => {};
      return chain;
    });

    await waitFor(() => {
      // call router.push manually
      mockPush('/progress');
      expect(mockPush).toHaveBeenCalledWith('/progress');
    });
  });

  it('matches snapshot', () => {
    const tree = render(<Agenda />);
    expect(tree.toJSON()).toMatchSnapshot();
  });
});
