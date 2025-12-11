import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet, Image, Platform, Alert, KeyboardAvoidingView, Pressable } from 'react-native';
import { Avatar } from "react-native-paper";
import Markdown from 'react-native-markdown-display';
import * as ImagePicker from 'expo-image-picker';
import { BASE_COLORS } from '@/constants/Colors';
import { FontFamilies } from '@/constants/Fonts';
import { useFonts } from "@/hooks/use-fonts";
import { useRouter } from 'expo-router';
import Header from '@/components/header';
import { Button } from 'react-native-paper';
import Spinner from '@/components/spinner';
import { useLocalSearchParams } from "expo-router";
import { supabase } from '@/supabase';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SendHorizonal, Plus, BotMessageSquare } from "lucide-react-native";

type ChatMessage = {
  from: 'bot' | 'user';
  text?: string;
  type?: 'image' | 'text';
  data?: string;
};

export default function ChatBot() {
  useFonts();

  const [messages, setMessages] = useState<ChatMessage[]>([
    { from: 'bot', text: 'Hey! How can I help you today?' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState<ImagePicker.ImagePickerAsset | null>(null);

  const scrollViewRef = useRef<ScrollView>(null);
  const router = useRouter();

  const params = useLocalSearchParams() as any;
  const recipe_slug = params?.recipe_slug as string | undefined;
  const last_step_id = params?.last_step_id as string | undefined;
  const fromParam = params?.from ?? params?.fromProgress ?? null;

  const [contextData, setContextData] = useState<any | null>(null);
  
  const buildPrompt = (userInput: string, context: any) => {
    if (!context) return userInput;

    const { brew, currentStep, steps, phases } = context;

    let recipeInfo = "";
    if (brew) {
      recipeInfo += `Recipe: ${brew.name || brew.recipe_slug}\n`;
      recipeInfo += `Batch size: ${brew.batch_size_l || 19}L\n\n`;
    }

    // Include all steps organized by phase
    if (steps && steps.length > 0 && phases) {
      recipeInfo += `Complete Recipe Steps:\n`;
      phases.forEach((phase: any) => {
        const phaseSteps = steps.filter((s: any) => s.phase_id === phase.phase_id);
        if (phaseSteps.length > 0) {
          recipeInfo += `\n${phase.name || phase.title || 'Phase'}:\n`;
          phaseSteps.forEach((step: any, idx: number) => {
            recipeInfo += `  ${idx + 1}. ${step.title}`;
            if (step.duration_min) recipeInfo += ` (${step.duration_min} min)`;
            if (step.temp_c_target) recipeInfo += ` [${step.temp_c_target}°C]`;
            recipeInfo += `\n`;
          });
        }
      });
      recipeInfo += `\n`;
    }

    if (currentStep) {
      const phase = phases?.find((p: any) => p.phase_id === currentStep.phase_id);
      recipeInfo += `Current Phase: ${phase?.name || phase?.title || 'Unknown'}\n`;
      recipeInfo += `Current Step: ${currentStep.title || currentStep.step_id}\n`;
      if (currentStep.description_md) {
        recipeInfo += `Step Description: ${currentStep.description_md}\n`;
      }
      if (currentStep.temp_c_target) {
        recipeInfo += `Target Temperature: ${currentStep.temp_c_target}°C\n`;
      }
      if (currentStep.duration_min) {
        recipeInfo += `Duration: ${currentStep.duration_min} minutes\n`;
      }
    }

    const fullPrompt = `
  You are a smart assistant that helps with brewing recipes. Here is the context:
  ${recipeInfo}

  Now answer the user's question based on this context:
  ${userInput}
  `;

    return fullPrompt;
  };

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  useEffect(() => {
    const loadContext = async () => {
      if (!recipe_slug) return;
      try {
        // Find the brew if possible (match recipe_slug + last_step_id if provided)
        let brew: any = null;
        if (last_step_id) {
          const { data: brewRows } = await supabase
            .from('brews')
            .select('*')
            .eq('recipe_slug', recipe_slug)
            .eq('last_step_id', last_step_id)
            .limit(1);
          brew = (brewRows as any[])?.[0] ?? null;
        }

        // Load phases & steps for the recipe
        const { data: phases } = await supabase
          .from('phases')
          .select('*')
          .eq('recipe_slug', recipe_slug)
          .order('position', { ascending: true });

        let allStepsLocal: any[] = [];
        for (const p of (phases ?? []) as any[]) {
          const { data: steps } = await supabase
            .from('steps')
            .select('*')
            .eq('phase_id', p.phase_id)
            .order('step_id', { ascending: true });
          allStepsLocal = [...allStepsLocal, ...(steps ?? [])];
        }

        const currentStep = allStepsLocal.find((s) => s.step_id === last_step_id) ?? null;

        // Load brew_step row for the current step if we have a brew and step
        let brewStep: any = null;
        if (brew?.id_brew && currentStep?.step_id) {
          const { data: brewSteps } = await supabase
            .from('brew_steps')
            .select('*')
            .eq('id_brew', brew.id_brew)
            .eq('step_id', currentStep.step_id)
            .limit(1);
          brewStep = (brewSteps as any[])?.[0] ?? null;
        }

        setContextData({ brew, phases, steps: allStepsLocal, currentStep, brewStep });
      } catch (e) {
        console.error('Failed to load chatbot context', e);
        setContextData(null);
      }
    };

    loadContext();
  }, [recipe_slug, last_step_id]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      base64: true,
    });

    if (!result.canceled && result.assets.length > 0) {
      setImage(result.assets[0]); // assets[0] contains uri and base64
    }
  };

  const takePhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      base64: true,
    });

    if (!result.canceled && result.assets.length > 0) {
      setImage(result.assets[0]); // assets[0] contains uri and base64
    }
  };

  const send = async () => {
  if (!input && !image) return;

  // Maak een lokale copy van image/base64 voor deze message
  const userMessageData = image?.base64 ?? undefined;

  // Voeg de user message toe aan de chat
  const userMsg: ChatMessage = {
    from: 'user',
    // only include text if the user actually typed something; don't add a placeholder like "[image]"
    text: input || undefined,
    type: image ? 'image' : 'text',
    data: userMessageData,
  };
  setMessages(prev => [...prev, userMsg]);

  setLoading(true);

  try {
    const promptText = buildPrompt(input || "[image]", contextData);
    const body: { prompt: string; image?: string } = { prompt: promptText };

    // Stuur base64 afbeelding naar de backend
    if (image?.base64) {
      body.image = image.base64;
    }

    // Voeg context toe als die beschikbaar is
    if (contextData) {
      (body as any).context = contextData;
    }

    console.log("Sending to ChatBot function:", body);

    const res = await fetch(
      "https://neeqemudecnuayqlvohk.supabase.co/functions/v1/ChatBot",
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    );

    const data = await res.json();

    // Voeg bot reactie toe
    setMessages(prev => [...prev, { from: 'bot', text: data.text }]);
  } catch (err) {
    console.error(err);
    setMessages(prev => [...prev, { from: 'bot', text: 'Sorry, something went wrong.' }]);
  } finally {
    setLoading(false);
    setInput('');
    setImage(null);
  }
};

  const pickImageWeb = () => {
    // Guard for non-browser (jest/node) environments
    if (typeof document === 'undefined') return;

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = e => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = () => {
          let uri = reader.result as string;
          let base64 = undefined;
          if (typeof uri === 'string' && uri.startsWith('data:')) {
            base64 = uri.split(',')[1]; // strip "data:image/...;base64,"
          }
          setImage({ uri, base64 } as any);
        };
        reader.readAsDataURL(file); // base64 for web is dataURL
      }
    };
    input.click();
  };

  const pickOrTakePhoto = () => {
    if (Platform.OS === 'web') {
      pickImageWeb();
    } else {
      Alert.alert(
        "Photo",
        "Choose an option",
        [
          { text: "Upload photo", onPress: pickImage },
          { text: "Take photo", onPress: takePhoto },
          { text: "Cancel", style: "cancel" }
        ]
      );
    }
  };

  return (
  <View 
    style={{ flex: 1, backgroundColor: BASE_COLORS.LIGHT_BG }}
  >
    <Header
      title="ChatBot"
      actionTestIDLeft='back-header'
      iconNameLeft='ArrowLeft'
      onIconPressLeft={() => {
        router.back();
      }}
    />

    <KeyboardAvoidingView
      style={{ 
        flex: 1, 
        backgroundColor: BASE_COLORS.LIGHT_BG
      }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <SafeAreaView className='flex-1 mx-3'>
        <ScrollView showsVerticalScrollIndicator={false} ref={scrollViewRef}>
          {messages.map((msg, i) => {
            const isBot = msg.from === 'bot';
            const isImage = msg.type === 'image' && !!msg.data;

            return (
              <View key={i}>
                {isBot && (
                  <View className="flex-row items-center gap-2">
                    <Avatar.Icon 
                      size={32} 
                      icon={() => <BotMessageSquare size={20} color={BASE_COLORS.STONE700} />} 
                      style={{ backgroundColor: "transparent" }} 
                    />
                    <Text
                      style={{
                        fontFamily: FontFamilies.BODY_BOLD,
                        fontSize: 14,
                        color: BASE_COLORS.STONE700,
                      }}
                    >BeerBot</Text>
                  </View>
                )}

                <View
                  testID={isBot ? `bot-msg-${i}` : `user-msg-${i}`}
                  style={[isBot ? styles.botMsg : styles.userMsg, isImage ? styles.imageContainer : undefined]}
                >
                  {/* Only render text when it's not an image-only message */}
                  {msg.text && msg.type !== 'image' && (
                    <Markdown
                      style={{
                        body: {
                          color: msg.from === "user" ? BASE_COLORS.STONE950 : BASE_COLORS.STONE950,
                        },
                      }}
                    >{msg.text}</Markdown>
                  )}

                  {msg.data && (
                    <Image
                      source={{
                        uri:
                          typeof msg.data === "string" && msg.data.startsWith("data:")
                            ? msg.data
                            : `data:image/jpeg;base64,${msg.data}`,
                      }}
                      style={isImage ? {
                        width: 150,
                        height: 150,
                        marginBottom: 12,
                        borderRadius: 8,
                      } : {
                        width: "100%",
                        height: 200,
                        marginBottom: 12,
                        borderRadius: 8,
                      }}
                    />
                  )}
                </View>
              </View>
            );
          })}

          {loading && 
            <Spinner title="Thinking..." size="large" />
          }
        </ScrollView>

        {/* INPUT ROW at the bottom */}
        <View className="flex flex-row items-center justify-between gap-2 py-2">
          <Pressable
            onPress={pickOrTakePhoto}
          >
            <Plus color={BASE_COLORS.STONE700} strokeWidth={3}/>
          </Pressable>

          <TextInput
            testID="chat-input"
            value={input}
            onChangeText={setInput}
            placeholder="Type a message..."
            style={{
              flex: 1,
              borderWidth: 1,
              borderColor: BASE_COLORS.STONE200,
              borderRadius: 20,
              paddingHorizontal: 16,
              paddingVertical: Platform.OS === 'ios' ? 10 : 8,
              backgroundColor: BASE_COLORS.WHITE,
              fontFamily: FontFamilies.BODY_LIGHT,
            }}
          />
            <Button
              testID="send-button"
              onPress={send}
              style={{
                backgroundColor: BASE_COLORS.TEXT_DARK,
                borderRadius: 45,
              }}
            >
              <SendHorizonal color={BASE_COLORS.WHITE}/>
            </Button>
        </View>

        {image && (
          <View className="items-start pb-2">
            <Image
              source={{ uri: image.uri }}
              style={{ width: 150, height: 150, borderRadius: 8 }}
            />
          </View>
        )}
      </SafeAreaView>
    </KeyboardAvoidingView>
  </View>
);
};

const styles = StyleSheet.create({
  userMsg: {
    alignSelf: 'flex-end',
    backgroundColor: BASE_COLORS.STONE200,
    marginBottom: 4,
    paddingInline: 16,
    borderRadius: 24,
    maxWidth: '90%',
  },
  botMsg: {
    alignSelf: 'flex-start',
    marginBottom: 4,
    paddingInline: 16,
    maxWidth: '90%',
  },
  imageContainer: {
    padding: 0,
    borderRadius: 8,
    // center image inside the bubble
    alignItems: 'center',
    justifyContent: 'center',
    // clear inline padding from text-bubble and use equal horizontal padding
    paddingInline: 0,
    paddingHorizontal: 12,
    paddingVertical: 12,
    // container width = image width (150) + horizontal padding (12*2) => 174
    maxWidth: 174,
  },
});