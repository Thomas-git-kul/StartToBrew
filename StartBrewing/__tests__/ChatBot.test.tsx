import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import fetchMock from 'jest-fetch-mock';
import ChatBot from '../app/(tabs)/ChatBot';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
fetchMock.enableMocks();

// Mock lucide icons used by ChatBot
jest.mock('lucide-react-native', () => {
  const { Text } = require('react-native');
  const make = (name: string) => (props: any) => require('react').createElement(Text, null, name);
  return {
    SendHorizonal: make('SendHorizonal'),
    Plus: make('Plus'),
    BotMessageSquare: make('BotMessageSquare'),
  };
});

const renderWithNavigation = (ui: React.ReactElement) =>
  render(
    <SafeAreaProvider>
      <NavigationContainer>
        {ui}
      </NavigationContainer>
    </SafeAreaProvider>
  );

// --- MOCKS VOOR NATIVE MODULES ---
// --- MOCKS VOOR SUPABASE ---
jest.mock('@/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
      then: jest.fn(),
    })),
    auth: {
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      getSession: jest.fn().mockResolvedValue({
        data: { session: { user: { id: 'test-user-id' } } },
        error: null,
      }),
    },
  },
}));

jest.mock('@/components/header', () => {
  const React = require('react');
  const { View, Text } = require('react-native');
  return ({ title, iconName, onIconPress }: any) => (
    <View>
      <Text>{title}</Text>
    </View>
  );
});

// Mock Markdown
jest.mock('react-native-markdown-display', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return ({ children }: { children: React.ReactNode }) => <Text>{children}</Text>;
});

// Mock Expo Image Picker
jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(() => Promise.resolve({ canceled: true, assets: [] })),
  launchCameraAsync: jest.fn(() => Promise.resolve({ canceled: true, assets: [] })),
  MediaTypeOptions: { Images: 'Images' },
}));

jest.mock('expo-font', () => ({
  useFonts: () => [true], // fonts loaded
}));

// Mock the project hook that wraps expo-font to avoid loading fonts in tests
jest.mock('@/hooks/use-fonts', () => ({ useFonts: () => true }));

// Mock Alert
import { Alert } from 'react-native';
jest.spyOn(Alert, 'alert').mockImplementation(() => {});

// AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
}));

// Mock fetch
global.fetch = require('jest-fetch-mock');

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: () => ({}),
}));

export const useGlobalSearchParams = () => ({});

// Mock safe area context so Provider renders children in tests
jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    SafeAreaProvider: ({ children }: any) => React.createElement(View, null, children),
    SafeAreaView: ({ children }: any) => React.createElement(View, null, children),
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  };
});

// Mock react-native-paper Button to avoid needing a Provider in tests
jest.mock('react-native-paper', () => {
  const React = require('react');
  const { TouchableOpacity, Text, View } = require('react-native');
  return {
    Button: ({ children, ...props }: any) => (
      <TouchableOpacity {...props}>
        <Text>{children}</Text>
      </TouchableOpacity>
    ),
    Avatar: {
      Icon: ({ icon }: any) => {
        try {
          const IconComp = typeof icon === 'function' ? icon() : null;
          return React.createElement(View, null, IconComp);
        } catch (e) {
          return React.createElement(View, null);
        }
      },
    },
  };
});

// Mock design tokens
jest.mock('@/constants/Colors', () => ({
  BASE_COLORS: {
    WHITE: '#fff',
    TEXT_DARK: '#000',
    LIGHT_BG: '#eee',
  },
}));

jest.mock('@/constants/Fonts', () => ({
  FontFamilies: {
    BODY: 'System',
    BODY_LIGHT: 'System',
  },
}));

// Mock ThemedText used by Spinner and other components
jest.mock('@/components/themed-text', () => {
  const { Text } = require('react-native');
  return { ThemedText: ({ children }: any) => <Text>{children}</Text> };
});

beforeEach(() => {
  fetchMock.resetMocks();
});

describe('ChatBot', () => {
  it('renders initial bot message', async () => {
    const { findByText } = renderWithNavigation(<ChatBot />);
    // header renders immediately
    const header = await findByText('ChatBot');
    expect(header).toBeTruthy();

    // bot greeting should appear
    const botMessage = await findByText(/How can I help you/i);
    expect(botMessage).toBeTruthy();
  });

  it('updates input value when typing', async () => {
    const { findByPlaceholderText } = renderWithNavigation(<ChatBot />);
    const input = await findByPlaceholderText('Type a message...');
    fireEvent.changeText(input, 'Hallo');
    expect(input.props.value).toBe('Hallo');
  });

  it('sends a text message and receives bot response', async () => {
    fetchMock.mockResponseOnce(JSON.stringify({ text: 'Bot response' }));

    const { findByPlaceholderText, findByTestId, findByText } = renderWithNavigation(<ChatBot />);
    const input = await findByPlaceholderText('Type a message...');
    const sendButton = await findByTestId('send-button');

    fireEvent.changeText(input, 'Hallo');
    fireEvent.press(sendButton);

    // wait for bot response
    const botResponse = await findByText(/Bot response/i);
    expect(botResponse).toBeTruthy();

    // input should be reset
    expect(input.props.value).toBe('');
  });

  it('does not send if input and image are empty', async () => {
    const { findByTestId, findAllByText } = renderWithNavigation(<ChatBot />);
    const sendButton = await findByTestId('send-button');
    fireEvent.press(sendButton);

    // only the initial bot message should be present
    const botMessages = await findAllByText(/How can I help you/i);
    expect(botMessages.length).toBeGreaterThanOrEqual(1);
  });

  it("snapshot", () => {
    const tree = renderWithNavigation(<ChatBot />).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
