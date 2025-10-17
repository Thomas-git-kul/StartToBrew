//this is the router of the app, it redirects to the homepage
import { Redirect } from "expo-router";

export default function TabsIndex() {
  // Redirect to the HomePage tab
  return <Redirect href="/(tabs)/HomePage" />;
}
