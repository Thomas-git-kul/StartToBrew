import { render } from '@testing-library/react-native';
import HomePage from '../app/(tabs)/HomePage';
import { useRouter } from 'expo-router';
import { Text } from 'react-native';

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

import * as ThemedTextModule from '@/components/themed-text';
jest.spyOn(ThemedTextModule, 'ThemedText').mockImplementation(({ children }: any) => <Text>{children}</Text>);

jest.mock('@/constants/Colors', () => ({
  BASE_COLORS: { WHITE: '#fff', TEXT_DARK: '#000', ACCENT_PRIMARY: '#f00' },
}));

jest.mock('@/constants/Fonts', () => ({
  FontFamilies: { HEADING: 'System' },
}));

describe('<HomePage />', () => {
  it('renders main title text', () => {
    const { getByText } = render(<HomePage />);
    expect(getByText('StartToBrew')).toBeTruthy();
  });
});