import React from 'react';
import { render } from '@testing-library/react-native';
import HomePage from '../app/(tabs)/HomePage'; // pas dit pad aan als nodig

// Mock de expo-router zodat router.push niet echt navigeert
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

describe('HomePage', () => {
  it('rendert de homepagina zonder fouten', () => {
    const { getByText } = render(<HomePage />);

    // controleer of belangrijke elementen zichtbaar zijn
    expect(getByText('StartToBrew')).toBeTruthy();
    expect(getByText('In progress')).toBeTruthy();
    expect(getByText('Start a new brew')).toBeTruthy();
    expect(getByText('Here')).toBeTruthy();
    expect(getByText('Popular recipes')).toBeTruthy();
  });
});
