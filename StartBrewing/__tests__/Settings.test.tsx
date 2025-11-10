import { render, fireEvent } from "@testing-library/react-native";
import { Alert, TextInput } from "react-native";

// Mock router
const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: mockPush,
    back: jest.fn(),
  }),
}));

// Mock hooks
jest.mock("@/hooks/use-fonts", () => ({
  useFonts: jest.fn(),
}));

// Mock Header
jest.mock("@/components/header", () => () => null);

// Mock ThemedText
jest.mock("@/components/themed-text", () => ({
  ThemedText: ({ children }: any) => <>{children}</>,
}));

// Mock TextInput as React Native TextInput
jest.mock("@/components/textInput", () => {
  const { TextInput } = require("react-native");
  return {
    __esModule: true,
    default: ({ value, onChangeText, label }: any) => (
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={label}
        testID={label}
      />
    ),
  };
});

// Spy Alert
jest.spyOn(Alert, "alert");

// Import after mocks
import Settings from "../app/Settings";

describe("<Settings />", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders all inputs and the button", () => {
    const { getByPlaceholderText, getByText } = render(<Settings />);

    // Inputs
    expect(getByPlaceholderText("Lastname")).toBeTruthy();
    expect(getByPlaceholderText("Firstname")).toBeTruthy();
    expect(getByPlaceholderText("DD")).toBeTruthy();
    expect(getByPlaceholderText("MM")).toBeTruthy();
    expect(getByPlaceholderText("YYYY")).toBeTruthy();
    expect(getByPlaceholderText("Email")).toBeTruthy();
    expect(getByPlaceholderText("Username")).toBeTruthy();

    // Button
    expect(getByText("Change Information")).toBeTruthy();
  });

  it("updates input values correctly", () => {
    const { getByPlaceholderText } = render(<Settings />);

    const lastnameInput = getByPlaceholderText("Lastname");
    const firstnameInput = getByPlaceholderText("Firstname");

    fireEvent.changeText(lastnameInput, "Doe");
    fireEvent.changeText(firstnameInput, "John");

    expect(lastnameInput.props.value).toBe("Doe");
    expect(firstnameInput.props.value).toBe("John");
  });

  it("calls Alert when button is pressed", () => {
    const { getByText } = render(<Settings />);
    const button = getByText("Change Information");

    fireEvent.press(button);

    expect(Alert.alert).toHaveBeenCalledWith(
      "Button Pressed!",
      "Information would be saved here."
    );
  });

  it("matches snapshot", () => {
    const tree = render(<Settings />).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
