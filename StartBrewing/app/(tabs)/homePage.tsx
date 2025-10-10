import React, { useState } from 'react';
import { StyleSheet, TextInput, Pressable, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function HomepageScreen() {
  const insets = useSafeAreaInsets();
  const [text, setText] = useState('');
  const [submitted, setSubmitted] = useState<string | null>(null);

  return (
    <ThemedView style={[styles.container, { paddingTop: (insets.top ?? 0) + 12 }]}>
      <ThemedText type="title">Hello world</ThemedText>
      <ThemedText>some random words</ThemedText>

      <TextInput
        value={text}
        onChangeText={setText}
        placeholder="Text message"
        style={styles.input}
        accessibilityLabel="first-input"
      />

      <Link href="/popUpWindow" asChild>
        <Pressable style={styles.button}>
          <Text style={styles.buttonText}>Go to popUpWindow</Text>
        </Pressable>
      </Link>

      {submitted !== null && (
        <ThemedText style={styles.result}>You submitted: {submitted}</ThemedText>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 12,
    padding: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 8,
    borderRadius: 6,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  result: {
    marginTop: 12,
  },
});
