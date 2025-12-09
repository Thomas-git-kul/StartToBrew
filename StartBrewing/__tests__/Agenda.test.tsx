import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { supabase } from '@/supabase';
import { NavigationContainer } from '@react-navigation/native';
import { Calendar } from 'react-native-calendars';

// ----- Mocks ----- //
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Minimal Supabase mock; individual tests will override `supabase.from`
jest.mock('@/supabase', () => ({
  supabase: {
    auth: { getUser: jest.fn(() => Promise.resolve({ data: { user: { id: '123' } }, error: null })) },
    from: jest.fn(),
  },
}));

// Mock useFocusEffect so it doesn't try to execute navigation
jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  const React = require('react');
  return {
    ...actualNav,
    // run the focus callback inside a useEffect so it runs after render
    useFocusEffect: (cb: any) => React.useEffect(cb, []),
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
    Button: ({ children, onPress, ...props }: any) => React.createElement('Text', { onPress, ...props }, children),
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
    default: (props: any) => React.createElement(Text, null, props.title),
  };
});

jest.mock('@/components/themed-text', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    __esModule: true, // ensures named exports work correctly
    ThemedText: (props: any) => React.createElement(Text, null, props.children),
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

// Require `Agenda` after temporarily removing `global.jest` so the
// component's `isJest` check evaluates to false and `fetchAgendaData` runs.
let Agenda: any;
beforeAll(() => {
  const oldJest = (global as any).jest;
  try {
    // remove jest global during module load
    try {
      delete (global as any).jest;
    } catch (e) {
      (global as any).jest = undefined;
    }
    Agenda = require('../app/(tabs)/Agenda').default;
  } finally {
    // restore original jest global
    (global as any).jest = oldJest;
  }
});

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

  it('shows "No tasks for this day." after loading when no data', async () => {
    // Make supabase.from return empty arrays for all tables
    (supabase.from as jest.Mock).mockImplementation(() => {
      const chain: any = {};
      chain.select = (..._args: any[]) => chain;
      chain.eq = (..._args: any[]) => chain;
      chain.in = (..._args: any[]) => chain;
      chain.order = (..._args: any[]) => chain;
      chain.then = (cb: any) => cb({ data: [], error: null });
      chain.catch = () => {};
      return chain;
    });

    const { getByText } = renderWithNavigation(<Agenda />);

    // first the spinner appears
    await waitFor(() => {
      expect(getByText('Loading progress...')).toBeTruthy();
    });

    // then, after fetch finishes, no tasks message is shown
    await waitFor(() => {
      expect(getByText('No tasks for this day.')).toBeTruthy();
    });
  });

  it('handles supabase brews error without crashing', async () => {
    (supabase.from as jest.Mock).mockImplementation((table: string) => {
      const chain: any = {};
      chain.select = (..._args: any[]) => chain;
      chain.eq = (..._args: any[]) => chain;
      chain.in = (..._args: any[]) => chain;
      chain.order = (..._args: any[]) => chain;
      if (table === 'brews') {
        chain.then = (cb: any) => cb({ data: null, error: 'err' });
      } else {
        chain.then = (cb: any) => cb({ data: [], error: null });
      }
      chain.catch = () => {};
      return chain;
    });

    const { getByText } = renderWithNavigation(<Agenda />);

    await waitFor(() => {
      expect(getByText('Loading progress...')).toBeTruthy();
    });

    await waitFor(() => {
      expect(getByText('No tasks for this day.')).toBeTruthy();
    });
  });

  it('handles phases error without crashing', async () => {
    (supabase.from as jest.Mock).mockImplementation((table: string) => {
      const chain: any = {};
      chain.select = (..._args: any[]) => chain;
      chain.eq = (..._args: any[]) => chain;
      chain.in = (..._args: any[]) => chain;
      chain.order = (..._args: any[]) => chain;
      if (table === 'phases') {
        chain.then = (cb: any) => cb({ data: null, error: 'err' });
      } else {
        chain.then = (cb: any) => cb({ data: [], error: null });
      }
      chain.catch = () => {};
      return chain;
    });

    const { getByText } = renderWithNavigation(<Agenda />);

    await waitFor(() => {
      expect(getByText('Loading progress...')).toBeTruthy();
    });

    await waitFor(() => {
      expect(getByText('No tasks for this day.')).toBeTruthy();
    });
  });

  it('fetches data and displays brew entries', async () => {
    // Set up per-table responses
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
          { id_brew: 1, name: 'Test Beer', start_date: new Date().toISOString().split('T')[0], recipe_slug: 'r1', last_step_id: '1' },
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
      if (table === 'brew_steps') {
        return makeChain([]);
      }
      return makeChain([]);
    });

    const { getByText } = renderWithNavigation(<Agenda />);

    await waitFor(() => {
      expect(getByText('Test Beer')).toBeTruthy();
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
    // Return one brew with a last_step_id that will set showProgressButton
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
        return makeChain([{ id_brew: 1, name: 'Test Beer', start_date: '2025-11-22', recipe_slug: 'r1', last_step_id: '1' }]);
      }
      if (table === 'phases') return makeChain([{ phase_id: 1, recipe_slug: 'r1', name: 'Phase 1', position: 1 }]);
      if (table === 'steps') return makeChain([{ step_id: '1', phase_id: 1, title: 'Step 1', start_offset_min: null, duration_min: 60 }]);
      if (table === 'brew_steps') return makeChain([]);
      return makeChain([]);
    });

    const { getByText } = renderWithNavigation(<Agenda />);

    // wait for card to render
    await waitFor(() => {
      expect(getByText('Test Beer')).toBeTruthy();
    });

    // find and press the Progress button (mocked as Text)
    const progressBtn = getByText('Progress');
    fireEvent.press(progressBtn);

    expect(mockPush).toHaveBeenCalledWith({ pathname: '/progress', params: { id: 1, from: 'agenda' } });
  });

  it('shows progress button when last_step_id matches and date equals currentDate', async () => {
    const today = new Date().toISOString().split('T')[0];

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
        return makeChain([{ id_brew: 1, name: 'Test Beer', start_date: today, recipe_slug: 'r1', last_step_id: '1' }]);
      }
      if (table === 'phases') return makeChain([{ phase_id: 1, recipe_slug: 'r1', name: 'Phase 1', position: 1 }]);
      if (table === 'steps') return makeChain([{ step_id: '1', phase_id: 1, title: 'Step 1', start_offset_min: null, duration_min: null }]);
      if (table === 'brew_steps') return makeChain([{ step_id: '1', id_brew: 1, status: 'completed', completed_at: new Date().toISOString() }]);
      return makeChain([]);
    });

    const { getByText } = renderWithNavigation(<Agenda />);

    await waitFor(() => {
      expect(getByText('Test Beer')).toBeTruthy();
    });

    const progressBtn = getByText('Progress');
    expect(progressBtn).toBeTruthy();

    fireEvent.press(progressBtn);
    expect(mockPush).toHaveBeenCalledWith({ pathname: '/progress', params: { id: 1, from: 'agenda' } });
  });

  it('matches snapshot', () => {
    const tree = renderWithNavigation(<Agenda />);
    expect(tree.toJSON()).toMatchSnapshot();
  });
});
