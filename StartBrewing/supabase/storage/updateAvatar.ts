import * as ImageManipulator from 'expo-image-manipulator';
import { decode } from "base64-arraybuffer";
import { supabase } from '@/supabase'; // jouw pad

type UpdateAvatarOpts = {
  userId: string;
  fileUri: string;        // uri van ImagePicker of Camera
  bucket?: string;        // default 'avatars'
  quality?: number;       // 0..1
  maxWidth?: number;      // optioneel rescale
  maxHeight?: number;     // optioneel rescale
};

export async function updateAvatar({
  userId,
  fileUri,
  bucket = 'avatars',
  quality = 0.8,
  maxWidth,
  maxHeight,
}: UpdateAvatarOpts): Promise<string> {
  // 1) optioneel resizen, 2) WEBP compressie, 3) Base64 opleveren
  const actions = [];
  if (maxWidth || maxHeight) {
    actions.push({
      resize: { width: maxWidth, height: maxHeight },
    } as ImageManipulator.ActionResize);
  }

  const result = await ImageManipulator.manipulateAsync(
    fileUri,
    actions,
    {
      compress: quality,
      format: ImageManipulator.SaveFormat.WEBP,
      base64: true,                  // <— vervangt readAsStringAsync
    }
  ); // result.base64 en result.uri beschikbaar
  if (!result.base64) throw new Error('Geen base64 ontvangen van ImageManipulator');

  // Base64 → ArrayBuffer voor Supabase
  const bytes = decode(result.base64);

  const path = `${userId}/avatar.webp`;

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(path, bytes, {
      contentType: "image/webp",
      upsert: true,
    });

  if (uploadError) throw uploadError;

  // avatar-pad in profiel opslaan
  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      avatar_url: path,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (profileError) throw profileError;

  // Publieke URL teruggeven voor directe preview
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}



