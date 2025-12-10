import { useState } from "react";
import { View, TouchableOpacity, Alert } from "react-native";
import { Modal, Portal } from "react-native-paper";
import { Star } from "lucide-react-native";
import { ThemedText } from "@/components/themed-text";
import { BASE_COLORS } from "@/constants/Colors";
import TextInput from "@/components/textInput";
import PrimaryButton from "@/components/primaryButton";
import SecondaryButton from "@/components/secondaryButton";
import { supabase } from "@/supabase";

type Props = {
  visible: boolean;
  onDismiss: () => void;
  recipe_slug: string;
  onSuccess?: () => void;
};

export function ReviewModal({
  visible,
  onDismiss,
  recipe_slug,
  onSuccess,
}: Props) {
  const [reviewText, setReviewText] = useState("");
  const [rating, setRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleStarPress = (value: number) => {
    setRating(value);
  };

  const handleCancel = () => {
    onDismiss();
    setRating(0);
    setReviewText("");
  };

  const handleSubmit = async () => {
    if (!recipe_slug) return;
    if (rating === 0) {
      Alert.alert("Rating required", "Please select a rating before submitting.");
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      const user = sessionData?.session?.user;
      if (!user) {
        Alert.alert("Login vereist", "Log eerst in om een review te plaatsen.");
        return;
      }

      // Check if user already reviewed
      const { data: existingReview, error: existingError } = await supabase
        .from("recipe_reviews")
        .select("rating")
        .eq("recipe_slug", recipe_slug)
        .eq("account_id", user.id)
        .maybeSingle();
      if (existingError) throw existingError;
      if (existingReview) {
        Alert.alert("Review bestaat al", "Je hebt dit recept al beoordeeld.");
        handleCancel();
        return;
      }

      // Insert review
      const { error: insertError } = await supabase
        .from("recipe_reviews")
        .insert({
          recipe_slug: recipe_slug,
          rating: rating,
          account_id: user.id,
          review_text: reviewText && reviewText.length > 0 ? reviewText : null,
        });
      if (insertError) {
        throw insertError;
      }

      // Calculate new average rating
      const { data: reviewsData, error: reviewsError } = await supabase
        .from("recipe_reviews")
        .select("rating")
        .eq("recipe_slug", recipe_slug);
      if (reviewsError) throw reviewsError;

      const count = (reviewsData || []).length;
      const avg = count
        ? reviewsData!.reduce((s: any, r: any) => s + (r.rating ?? 0), 0) /
          count
        : null;

      // Update recipe with new rating
      const updatePayload: any = {};
      if (avg != null) updatePayload.rating = parseFloat(avg.toFixed(2));
      updatePayload.review_count = count;

      const { error: updateError } = await supabase
        .from("recipes")
        .update(updatePayload)
        .eq("recipe_slug", recipe_slug);
      if (updateError) throw updateError;

      // Success - reset and close
      setReviewText("");
      setRating(0);
      onDismiss();

      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }

      Alert.alert("Success", "Your review has been submitted!");
    } catch (e: any) {
      Alert.alert(
        "Review mislukt",
        e.message ?? "Onbekende fout bij opslaan review"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={handleCancel}
        contentContainerStyle={{
          backgroundColor: BASE_COLORS.LIGHT_BG,
          padding: 20,
          borderRadius: 12,
          marginHorizontal: 30,
        }}
      >
        <ThemedText type="title" className="text-center mb-4">
          Rate this recipe
        </ThemedText>
        <TextInput
          placeholder="(optional) Share your thoughts about this beer..."
          value={reviewText}
          onChangeText={setReviewText}
          multiline
          numberOfLines={4}
        />

        <View className="flex-row justify-center gap-3 mb-4">
          {[1, 2, 3, 4, 5].map((value) => (
            <TouchableOpacity
              key={value}
              onPress={() => handleStarPress(value)}
              testID={`star-${value}`}
              disabled={isSubmitting}
            >
              <Star
                size={36}
                stroke={
                  value <= rating
                    ? BASE_COLORS.ACCENT_LIGHT
                    : BASE_COLORS.ACCENT_PRIMARY
                }
                fill={
                  value <= rating ? BASE_COLORS.ACCENT_LIGHT : "transparent"
                }
              />
            </TouchableOpacity>
          ))}
        </View>

        <View className="flex-row justify-between gap-3">
          <SecondaryButton
            title="cancel"
            testID="cancel-review"
            onPress={handleCancel}
            size={14}
          />
          <PrimaryButton
            title={isSubmitting ? "Submitting..." : "Submit"}
            onPress={handleSubmit}
            testID="submit-review"
            size={14}
            disabled={isSubmitting}
          />
        </View>
      </Modal>
    </Portal>
  );
}
