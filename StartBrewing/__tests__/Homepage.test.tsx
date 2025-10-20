// @ts-nocheck
import React from 'react';
import { render } from '@testing-library/react-native';

import HomepageScreen from '../app/(tabs)/HomePage'; // import the component

describe('HomepageScreen', () => {
  it('displays Hello world', () => {
    const { getByText } = render(<HomepageScreen />); // use correct component name
    expect(getByText('Hello world')).toBeTruthy();
  });
});
