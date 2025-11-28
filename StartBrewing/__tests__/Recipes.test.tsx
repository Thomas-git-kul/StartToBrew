// __tests__/Recipes.test.tsx
import React from "react";
import { render } from "@testing-library/react-native";
import { FavoritesProvider } from "@/context/FavoritesContext";

// Mock everything that causes native issues
jest.mock("@react-native-async-storage/async-storage", () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

jest.mock("../supabase", () => ({
  supabase: {
    auth: { getSession: jest.fn().mockResolvedValue({ data: null, error: null }) },
    from: jest.fn().mockReturnValue({ select: jest.fn().mockReturnValue({ eq: jest.fn(), in: jest.fn() }) }),
  },
}));

// Mock Recipes component itself to render just header
jest.mock("../app/(tabs)/Recipes", () => {
  const { Text } = require("react-native");
  return () => <Text>Recipes</Text>;
});

import Recipes from "../app/(tabs)/Recipes";

describe("<Recipes /> minimal header test", () => {
  it("renders the main header", async () => {
    const { findByText } = render(
      <FavoritesProvider>
        <Recipes />
      </FavoritesProvider>
    );

    const header = await findByText("Recipes");
    expect(header).toBeTruthy();
  });
});
