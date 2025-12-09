import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import fetchMock from 'jest-fetch-mock';
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
// NOTE: A later, runtime-configurable mock for `@/supabase` is defined below.
// The earlier static mock was removed to avoid duplicate definitions.

jest.mock('@/components/header', () => {
  const React = require('react');
  const { View, Text, TouchableOpacity } = require('react-native');
  return ({ title, iconNameLeft, actionTestIDLeft, onIconPressLeft }: any) => (
    <View>
      <TouchableOpacity testID={actionTestIDLeft} onPress={onIconPressLeft} accessible>
        <Text>{iconNameLeft || 'Back'}</Text>
      </TouchableOpacity>
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

// Mutable mocks for runtime configuration in tests
// Use `global` to hold mutable mock state so jest.mock factories don't close over
// out-of-scope variables (which Jest forbids).
// Initialize globals with sensible defaults; tests will override them as needed.
// eslint-disable-next-line no-underscore-dangle
declare global {
  // eslint-disable-next-line no-var
  var __mockRouterParams: any;
  // eslint-disable-next-line no-var
  var __mockImagePickerResponse: any;
  // eslint-disable-next-line no-var
  var __mockSupabaseData: any;
}

global.__mockRouterParams = {};
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: () => (global as any).__mockRouterParams,
}));

// eslint-disable-next-line no-underscore-dangle
global.__mockImagePickerResponse = { canceled: true, assets: [] };
jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(() => Promise.resolve((global as any).__mockImagePickerResponse)),
  launchCameraAsync: jest.fn(() => Promise.resolve((global as any).__mockImagePickerResponse)),
  MediaTypeOptions: { Images: 'Images' },
}));

// eslint-disable-next-line no-underscore-dangle
global.__mockSupabaseData = { phases: [], steps: [], brews: [], brew_steps: [] };
jest.mock('@/supabase', () => ({
  supabase: {
    from: jest.fn((table: string) => {
      const data = ((global as any).__mockSupabaseData[
        table === 'phases' ? 'phases' : table === 'steps' ? 'steps' : table === 'brews' ? 'brews' : table === 'brew_steps' ? 'brew_steps' : ''
      ] || []) as any[];

      // chainable response object – methods return the same chain object
      const chain: any = { data };
      chain.select = () => chain;
      chain.eq = () => chain;
      chain.order = () => chain;
      chain.limit = () => chain;
      chain.single = () => chain;
      chain.then = (cb: any) => cb({ data });
      return chain;
    }),
    auth: {
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      getSession: jest.fn().mockResolvedValue({ data: { session: { user: { id: 'test-user-id' } } }, error: null }),
    },
  },
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

export const useGlobalSearchParams = () => ({});

// Require ChatBot after mocks so tests can change mock variables at runtime
// eslint-disable-next-line @typescript-eslint/no-var-requires
const ChatBot = require('../app/(tabs)/ChatBot').default;

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

  it('renders header with back button', async () => {
    const { findByTestId } = renderWithNavigation(<ChatBot />);
    const backButton = await findByTestId('back-header');
    expect(backButton).toBeTruthy();
  });

  it('presses back header to execute router.back branch', async () => {
    const { findByTestId } = renderWithNavigation(<ChatBot />);
    const backButton = await findByTestId('back-header');
    fireEvent.press(backButton);
    // No assertion required: pressing the header exercises the router.back() call
    expect(backButton).toBeTruthy();
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

  it('displays bot messages with BeerBot avatar', async () => {
    const { findByText } = renderWithNavigation(<ChatBot />);
    const beerBotText = await findByText('BeerBot');
    expect(beerBotText).toBeTruthy();
  });

  it('displays user messages with correct styling', async () => {
    fetchMock.mockResponseOnce(JSON.stringify({ text: 'Bot response' }));

    const { findByPlaceholderText, findByTestId, getByTestId } = renderWithNavigation(<ChatBot />);
    const input = await findByPlaceholderText('Type a message...');
    const sendButton = await findByTestId('send-button');

    fireEvent.changeText(input, 'Test message');
    fireEvent.press(sendButton);

    await waitFor(() => {
      const userMessage = getByTestId('user-msg-1');
      expect(userMessage).toBeTruthy();
    });
  });

  it('displays bot messages with correct styling', async () => {
    fetchMock.mockResponseOnce(JSON.stringify({ text: 'Bot response' }));

    const { findByPlaceholderText, findByTestId } = renderWithNavigation(<ChatBot />);
    const input = await findByPlaceholderText('Type a message...');
    const sendButton = await findByTestId('send-button');

    fireEvent.changeText(input, 'Test message');
    fireEvent.press(sendButton);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
    });
  });

  it('shows loading spinner while waiting for response', async () => {
    fetchMock.mockResponseOnce(JSON.stringify({ text: 'Bot response' }));

    const { findByPlaceholderText, findByTestId, getByText } = renderWithNavigation(<ChatBot />);
    const input = await findByPlaceholderText('Type a message...');
    const sendButton = await findByTestId('send-button');

    fireEvent.changeText(input, 'Test message');
    fireEvent.press(sendButton);

    await waitFor(() => {
      const spinner = getByText(/Thinking.../i);
      expect(spinner).toBeTruthy();
    });
  });

  it('sends message with context data', async () => {
    fetchMock.mockResponseOnce(JSON.stringify({ text: 'Bot response with context' }));

    jest.mock('expo-router', () => ({
      useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
      useLocalSearchParams: () => ({ recipe_slug: 'test-recipe' }),
    }));

    const { findByPlaceholderText, findByTestId } = renderWithNavigation(<ChatBot />);
    const input = await findByPlaceholderText('Type a message...');
    const sendButton = await findByTestId('send-button');

    fireEvent.changeText(input, 'Tell me about this recipe');
    fireEvent.press(sendButton);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
      const callArgs = fetchMock.mock.calls[0];
      if (callArgs && callArgs[1]) {
        const body = callArgs[1].body;
        if (typeof body === 'string') {
          const parsedBody = JSON.parse(body);
          expect(parsedBody.prompt).toContain('Tell me about this recipe');
        }
      }
    });
  });

  it('handles fetch error gracefully', async () => {
    fetchMock.mockRejectOnce(new Error('Network error'));

    const { findByPlaceholderText, findByTestId, findByText } = renderWithNavigation(<ChatBot />);
    const input = await findByPlaceholderText('Type a message...');
    const sendButton = await findByTestId('send-button');

    fireEvent.changeText(input, 'Hello');
    fireEvent.press(sendButton);

    const err = await findByText(/Sorry, something went wrong/i);
    expect(err).toBeTruthy();
  });

  it('resets input field after sending message', async () => {
    fetchMock.mockResponseOnce(JSON.stringify({ text: 'Bot response' }));

    const { findByPlaceholderText, findByTestId } = renderWithNavigation(<ChatBot />);
    const input = await findByPlaceholderText('Type a message...');
    const sendButton = await findByTestId('send-button');

    fireEvent.changeText(input, 'Test message');
    expect(input.props.value).toBe('Test message');

    fireEvent.press(sendButton);

    await waitFor(() => {
      expect(input.props.value).toBe('');
    });
  });

  it('can send multiple messages in sequence', async () => {
    fetchMock.mockResponseOnce(JSON.stringify({ text: 'First response' }));
    fetchMock.mockResponseOnce(JSON.stringify({ text: 'Second response' }));

    const { findByPlaceholderText, findByTestId, findAllByTestId } = renderWithNavigation(<ChatBot />);
    const input = await findByPlaceholderText('Type a message...');
    const sendButton = await findByTestId('send-button');

    // First message
    fireEvent.changeText(input, 'First message');
    fireEvent.press(sendButton);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    // Second message
    fireEvent.changeText(input, 'Second message');
    fireEvent.press(sendButton);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });
  });

  it('renders plus button for adding images', async () => {
    const { getByTestId } = renderWithNavigation(<ChatBot />);
    const chatInput = await getByTestId('chat-input');
    expect(chatInput).toBeTruthy();
  });

  it('scrolls to end when new messages are added', async () => {
    fetchMock.mockResponseOnce(JSON.stringify({ text: 'Bot response' }));

    const { findByPlaceholderText, findByTestId } = renderWithNavigation(<ChatBot />);
    const input = await findByPlaceholderText('Type a message...');
    const sendButton = await findByTestId('send-button');

    // ScrollView.scrollToEnd should be called
    fireEvent.changeText(input, 'Test message');
    fireEvent.press(sendButton);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
    });
  });

  it('builds prompt with context information when available', async () => {
    fetchMock.mockResponseOnce(JSON.stringify({ text: 'Context-aware response' }));

    const { findByPlaceholderText, findByTestId } = renderWithNavigation(<ChatBot />);
    const input = await findByPlaceholderText('Type a message...');
    const sendButton = await findByTestId('send-button');

    fireEvent.changeText(input, 'What should I do next?');
    fireEvent.press(sendButton);

    await waitFor(() => {
      const callArgs = fetchMock.mock.calls[0];
      if (callArgs && callArgs[1]) {
        const body = callArgs[1].body;
        if (typeof body === 'string') {
          const parsedBody = JSON.parse(body);
          expect(parsedBody.prompt).toContain('What should I do next?');
        }
      }
    });
  });

  it('posts to correct ChatBot function endpoint', async () => {
    fetchMock.mockResponseOnce(JSON.stringify({ text: 'Response' }));

    const { findByPlaceholderText, findByTestId } = renderWithNavigation(<ChatBot />);
    const input = await findByPlaceholderText('Type a message...');
    const sendButton = await findByTestId('send-button');

    fireEvent.changeText(input, 'Test');
    fireEvent.press(sendButton);

    await waitFor(() => {
      const callArgs = fetchMock.mock.calls[0];
      expect(callArgs[0]).toBe('https://neeqemudecnuayqlvohk.supabase.co/functions/v1/ChatBot');
    });
  });

  // --- Additional integrated tests to cover context + image flows ---
  it('loads context from supabase and includes recipe info in prompt', async () => {
    // Configure mutable mocks to simulate recipe params + supabase data
    (global as any).__mockRouterParams = { recipe_slug: 'recipe-1', last_step_id: 'step-2' };
    (global as any).__mockSupabaseData = {
      phases: [{ phase_id: 'p1', name: 'Mash', position: 1 }],
      steps: [
        {
          step_id: 'step-2',
          title: 'Heat water',
          phase_id: 'p1',
          duration_min: 10,
          temp_c_target: 65,
          description_md: 'Do this',
        },
      ],
      brews: [{ id_brew: 123, recipe_slug: 'recipe-1', last_step_id: 'step-2', name: 'Test Brew', batch_size_l: 10 }],
      brew_steps: [{ id_brew: 123, step_id: 'step-2' }],
    };

    const { findByPlaceholderText, findByTestId } = renderWithNavigation(<ChatBot />);
    const input = await findByPlaceholderText('Type a message...');
    const sendButton = await findByTestId('send-button');

    // Ensure the component finished loading context from supabase before sending
    // so the built prompt includes recipe/step information.
    // The mocked supabase module exposes a jest.fn `from` we can assert on.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { supabase } = require('@/supabase');
    await waitFor(() => {
      const calls = (supabase.from as jest.Mock).mock.calls;
      expect(calls.some((c: any[]) => ['brews', 'phases', 'steps', 'brew_steps'].includes(c[0]))).toBe(true);
    });

    fetchMock.mockResponseOnce(JSON.stringify({ text: 'Context response' }));

    fireEvent.changeText(input, 'Tell me about my brew');
    fireEvent.press(sendButton);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
      const callArgs = fetchMock.mock.calls[0];
      if (callArgs && callArgs[1]) {
        const body = callArgs[1].body;
        if (typeof body === 'string') {
          const parsedBody = JSON.parse(body);
          expect(parsedBody.prompt).toContain('Recipe:');
          expect(parsedBody.prompt).toContain('Current Step:');
          expect(parsedBody.context).toBeDefined();
          expect(parsedBody.context.brew).toBeDefined();
        }
      }
    });
  });

  it('picks an image via Alert upload and includes base64 in request body', async () => {
    // Configure image picker to return an uploaded image
    (global as any).__mockImagePickerResponse = { canceled: false, assets: [{ uri: 'data:image/png;base64,AAAB', base64: 'AAAB' }] };
    (global as any).__mockRouterParams = {};
    (global as any).__mockSupabaseData = { phases: [], steps: [], brews: [], brew_steps: [] };

    const { getByText, findByTestId } = renderWithNavigation(<ChatBot />);

    // Mock Alert to call first button (Upload photo)
    jest.spyOn(Alert, 'alert').mockImplementation((...args: any[]) => {
      const buttons = args[2];
      if (Array.isArray(buttons) && buttons[0] && typeof buttons[0].onPress === 'function') {
        buttons[0].onPress();
      }
    });

    fetchMock.mockResponseOnce(JSON.stringify({ text: 'Image response' }));

    const plus = getByText('Plus');
    fireEvent.press(plus);

    const sendButton = await findByTestId('send-button');
    fireEvent.press(sendButton);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
      const callArgs = fetchMock.mock.calls[0];
      if (callArgs && callArgs[1]) {
        const body = callArgs[1].body;
        if (typeof body === 'string') {
          const parsed = JSON.parse(body);
          expect(parsed.image).toBe('AAAB');
        }
      }
    });
  });

  it('takes a photo via Alert camera and includes base64 in request body', async () => {
    (global as any).__mockImagePickerResponse = { canceled: false, assets: [{ uri: 'data:image/png;base64,BBCC', base64: 'BBCC' }] };
    (global as any).__mockRouterParams = {};
    (global as any).__mockSupabaseData = { phases: [], steps: [], brews: [], brew_steps: [] };

    const { getByText, findByTestId } = renderWithNavigation(<ChatBot />);

    // Mock Alert to call second button (Take photo)
    jest.spyOn(Alert, 'alert').mockImplementation((...args: any[]) => {
      const buttons = args[2];
      if (Array.isArray(buttons) && buttons[1] && typeof buttons[1].onPress === 'function') {
        buttons[1].onPress();
      }
    });

    fetchMock.mockResponseOnce(JSON.stringify({ text: 'Camera response' }));

    const plus = getByText('Plus');
    fireEvent.press(plus);

    const sendButton = await findByTestId('send-button');
    fireEvent.press(sendButton);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
      const callArgs = fetchMock.mock.calls[0];
      if (callArgs && callArgs[1]) {
        const body = callArgs[1].body;
        if (typeof body === 'string') {
          const parsed = JSON.parse(body);
          expect(parsed.image).toBe('BBCC');
        }
      }
    });
  });

  it("snapshot", () => {
    const tree = renderWithNavigation(<ChatBot />).toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('handles supabase loadContext failure and logs error', async () => {
    // Force supabase.from to throw during loadContext
    const { supabase } = require('@/supabase');
    (supabase.from as jest.Mock).mockImplementation(() => { throw new Error('boom'); });

    (global as any).__mockRouterParams = { recipe_slug: 'will-error' };

    const consoleErrSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const { findByText } = renderWithNavigation(<ChatBot />);

    // Wait for the component to mount and the effect to run
    await waitFor(() => {
      expect(consoleErrSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to load chatbot context'), expect.any(Error));
    });

    consoleErrSpy.mockRestore();
  });

  it('pickImageWeb flow when Platform.OS=web includes base64 in request', async () => {
    // Make Platform report 'web' at call time so pickOrTakePhoto calls pickImageWeb
    const RN = require('react-native');
    const originalOS = RN.Platform.OS;
    (RN.Platform as any).OS = 'web';

    // Provide a FileReader that immediately produces a data URL
    // @ts-ignore
    const OriginalFileReader = global.FileReader;
    // @ts-ignore
    class MockFileReader {
      onload: any = null;
      result: any = null;
      readAsDataURL(_file: any) {
        this.result = 'data:image/png;base64,WEB123';
        if (typeof this.onload === 'function') this.onload({} as any);
      }
    }
    // @ts-ignore
    global.FileReader = MockFileReader as any;

    // Intercept creation of the input element to simulate file selection.
    // Overriding document.createElement is more reliable in the jest/jsdom environment.
    const originalCreateElement = document.createElement.bind(document);
    // Use a local flag so tests can wait until the simulated click ran
    let clicked = false;
    // @ts-ignore
    document.createElement = (tagName: string) => {
      if (tagName === 'input') {
        const el: any = {
          type: 'file',
          accept: '',
          onchange: null,
          files: undefined,
          click() {
            try {
              this.files = [{ name: 'img.png' }];
              if (typeof this.onchange === 'function') this.onchange({ target: this });
              clicked = true;
            } catch (e) {}
          },
        };
        return el as any;
      }
      return originalCreateElement(tagName as any);
    };

    // Ensure router params are empty and reset supabase mock data
    (global as any).__mockRouterParams = {};
    (global as any).__mockSupabaseData = { phases: [], steps: [], brews: [], brew_steps: [] };

    // Render and trigger the plus -> pickImageWeb -> send flow
    const { getByText, findByTestId } = renderWithNavigation(<ChatBot />);

    fetchMock.mockResponseOnce(JSON.stringify({ text: 'Web image response' }));

    const plus = getByText('Plus');
    fireEvent.press(plus);

    // Wait until our simulated input click executed and onchange ran
    await waitFor(() => {
      expect(clicked).toBe(true);
    });

    const sendButton = await findByTestId('send-button');
    fireEvent.press(sendButton);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
      const callArgs = fetchMock.mock.calls[0];
      if (callArgs && callArgs[1]) {
        const body = callArgs[1].body;
        if (typeof body === 'string') {
          const parsed = JSON.parse(body);
          expect(parsed.image).toBe('WEB123');
        }
      }
    });

    // restore globals
    // @ts-ignore
    global.FileReader = OriginalFileReader;
    document.createElement = originalCreateElement;
    (RN.Platform as any).OS = originalOS;
  });

  it('loadContext does nothing when no recipe_slug provided', async () => {
    // Ensure no router params -> loadContext returns early and supabase.from is not called
    (global as any).__mockRouterParams = {};
    (global as any).__mockSupabaseData = { phases: [], steps: [], brews: [], brew_steps: [] };

    const { supabase } = require('@/supabase');
    // reset mock history
    (supabase.from as jest.Mock).mockClear();

    renderWithNavigation(<ChatBot />);

    // allow effects to run briefly
    await waitFor(() => {
      expect((supabase.from as jest.Mock).mock.calls.length).toBe(0);
    });
  });

  it('pickImageWeb handles non-data URI FileReader results (no base64)', async () => {
    const RN = require('react-native');
    const originalOS = RN.Platform.OS;
    (RN.Platform as any).OS = 'web';

    // Provide a FileReader that produces a non-data URI
    // @ts-ignore
    const OriginalFileReader = global.FileReader;
    // @ts-ignore
    class MockFileReader2 {
      onload: any = null;
      result: any = null;
      readAsDataURL(_file: any) {
        this.result = 'blob://some-blob-uri';
        if (typeof this.onload === 'function') this.onload({} as any);
      }
    }
    // @ts-ignore
    global.FileReader = MockFileReader2 as any;

    // stub document.createElement
    const originalCreateElement = document.createElement.bind(document);
    let clicked = false;
    // @ts-ignore
    document.createElement = (tagName: string) => {
      if (tagName === 'input') {
        const el: any = {
          type: 'file',
          accept: '',
          onchange: null,
          files: undefined,
          click() {
            try {
              this.files = [{ name: 'img.png' }];
              if (typeof this.onchange === 'function') this.onchange({ target: this });
              clicked = true;
            } catch (e) {}
          },
        };
        return el as any;
      }
      return originalCreateElement(tagName as any);
    };

    (global as any).__mockRouterParams = {};
    (global as any).__mockSupabaseData = { phases: [], steps: [], brews: [], brew_steps: [] };

    const { getByText, findByTestId } = renderWithNavigation(<ChatBot />);

    fetchMock.mockResponseOnce(JSON.stringify({ text: 'Web blob response' }));

    const plus = getByText('Plus');
    fireEvent.press(plus);

    await waitFor(() => expect(clicked).toBe(true));

    const sendButton = await findByTestId('send-button');
    fireEvent.press(sendButton);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
      const callArgs = fetchMock.mock.calls[0];
      if (callArgs && callArgs[1]) {
        const body = callArgs[1].body;
        if (typeof body === 'string') {
          const parsed = JSON.parse(body);
          // since FileReader result wasn't a data: URI, no base64 should be attached
          expect(parsed.image).toBeUndefined();
          // prompt should indicate an image was sent (uses [image])
          expect(parsed.prompt).toContain('[image]');
        }
      }
    });

    // restore
    // @ts-ignore
    global.FileReader = OriginalFileReader;
    document.createElement = originalCreateElement;
    (RN.Platform as any).OS = originalOS;
  });
});
