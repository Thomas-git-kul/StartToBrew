// app/index.tsx

import { Redirect } from "expo-router";

export default function Index() {
  // Root "/" is altijd de openbare homepage
  return <Redirect href="/Auth" />;
}
