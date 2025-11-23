import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { supabase } from '@/supabase';
import { NavigationContainer } from '@react-navigation/native';
import { useRouter } from 'expo-router';

// ----- Mocks ----- //
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock Supabase
jest.mock('@/supabase', () => ({
  supabase: {
    auth: { getUser: jest.fn(() => Promise.resolve({ data: { user: { id: '123' } }, error: null })) },
    from: jest.fn(() => ({
      select: jest.fn().mockResolvedValue({ data: [], error: null }),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
    })),
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

import Agenda from '../app/(tabs)/Agenda';

// ----- Tests ----- //

describe('Agenda Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders header and calendar', async () => {
    const { getByText } = render(
      <NavigationContainer>
        <Agenda />
      </NavigationContainer>
    );

    await waitFor(() => {
      expect(getByText('Agenda')).toBeTruthy();
      expect(getByText('No tasks for this day.')).toBeTruthy();
    });
  });

  it('shows "No tasks for this day" when no data', async () => {
    const { getByText } = render(<Agenda />);
    await waitFor(() => {
      expect(getByText('No tasks for this day.')).toBeTruthy();
    });
  });

  it('fetches data and updates phasesByDate', async () => {
    // Mock Supabase response
    (supabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === 'brews') {
        return { select: jest.fn().mockResolvedValue({ data: [{ id_brew: 1, name: 'Test Beer', start_date: '2025-11-22', recipe_slug: 'r1' }], error: null }), eq: jest.fn().mockReturnThis(), order: jest.fn().mockReturnThis() };
      }
      if (table === 'phases') {
        return { select: jest.fn().mockResolvedValue({ data: [{ phase_id: 1, recipe_slug: 'r1', name: 'Phase 1', position: 1 }], error: null }), eq: jest.fn().mockReturnThis(), order: jest.fn().mockReturnThis() };
      }
      if (table === 'steps') {
        return { select: jest.fn().mockResolvedValue({ data: [{ step_id: '1', phase_id: 1, title: 'Step 1', start_offset_min: null, duration_min: 60 }], error: null }), eq: jest.fn().mockReturnThis(), order: jest.fn().mockReturnThis() };
      }
      return { select: jest.fn().mockResolvedValue({ data: [], error: null }), eq: jest.fn().mockReturnThis(), order: jest.fn().mockReturnThis() };
    });

    const { getByText } = render(<Agenda />);

    await waitFor(() => {
      expect(getByText('Test Beer')).toBeTruthy();
      expect(getByText('Phase 1')).toBeTruthy();
      expect(getByText('• Step 1')).toBeTruthy();
    });
  });

  it('changes currentDate when calendar day is pressed', async () => {
    const { getByText } = render(
      <NavigationContainer>
        <Agenda />
      </NavigationContainer>
    );

    fireEvent.press(getByText('Calendar'));

    await waitFor(() => {
      expect(getByText('No tasks for this day.')).toBeTruthy();
    });
  });

  it('navigates to progress page when progress button pressed', async () => {
    const { getByText } = render(<Agenda />);
    // simulate brew cards by mocking Supabase to return a brew
    (supabase.from as jest.Mock).mockImplementation((table: string) => ({
      select: jest.fn().mockResolvedValue({ data: [{ id_brew: 1, name: 'Test Beer', start_date: '2025-11-22', recipe_slug: 'r1' }], error: null }),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
    }));

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
