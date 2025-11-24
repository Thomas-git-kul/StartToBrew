import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import fetchMock from 'jest-fetch-mock';
import ChatBot from '../app/(tabs)/ChatBot';
import { NavigationContainer } from '@react-navigation/native';
import { FavoritesProvider } from '@/context/FavoritesContext';

fetchMock.enableMocks();

const renderWithNavigation = (ui: React.ReactElement) =>
  render(
    <NavigationContainer>
      <FavoritesProvider>{ui}</FavoritesProvider>
    </NavigationContainer>
  );

// --- MOCKS VOOR NATIVE MODULES ---

// --- MOCKS VOOR SUPABASE ---
jest.mock('@/supabase/client', () => {
  return {
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
  };
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

beforeEach(() => {
  fetchMock.resetMocks();
});

describe('HomeScreen', () => {
  it('renders initial bot message', () => {
    const { getByText } = renderWithNavigation(<ChatBot />);
    expect(getByText('Hey! Where can I help you with?')).toBeTruthy();
  });

  it('updates input value when typing', () => {
    const { getByPlaceholderText } = renderWithNavigation(<ChatBot />);
    const input = getByPlaceholderText('Typ een bericht...');
    fireEvent.changeText(input, 'Hallo');
    expect(input.props.value).toBe('Hallo');
  });

  it('sends a text message and receives bot response', async () => {
    fetchMock.mockResponseOnce(JSON.stringify({ text: 'Bot antwoord' }));

    const { getByPlaceholderText, getByText, queryByText } = renderWithNavigation(<ChatBot />);
    const input = getByPlaceholderText('Typ een bericht...');
    const sendButton = getByText('Stuur');

    // Typen
    fireEvent.changeText(input, 'Hallo');
    expect(input.props.value).toBe('Hallo');

    // Versturen
    fireEvent.press(sendButton);

    // Loading indicator verschijnt
    expect(queryByText('Stuur')).toBeTruthy();

    // Wacht op bot antwoord
    await waitFor(() => {
      expect(getByText('Bot antwoord')).toBeTruthy();
    });

    // Input wordt gereset
    expect(input.props.value).toBe('');
  });

  it('does not send if input and image are empty', () => {
    const { getByText, queryByText } = renderWithNavigation(<ChatBot />);
    const sendButton = getByText('Stuur');

    fireEvent.press(sendButton);

    // Geen nieuwe messages toegevoegd
    expect(queryByText('Hey! Where can I help you with?')).toBeTruthy();
  });

  it("snapshot", () => {
      const tree = renderWithNavigation(<ChatBot />).toJSON();
      expect(tree).toMatchSnapshot();
    });
});
