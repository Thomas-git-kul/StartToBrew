// hooks/useUserProgress.ts
import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/supabase";

type Progress = {
  level: number;
  total_xp: number;
};

type LevelUp = {
  from: number;
  to: number;
};

export function useUserProgress() {
  const [progress, setProgress] = useState<Progress | null>(null);
  const [levelUp, setLevelUp] = useState<LevelUp | null>(null);
  const [loading, setLoading] = useState(false);

  // vorige level, onafhankelijk van React-state
  const lastLevelRef = useRef<number | null>(null);

  const loadProgress = useCallback(async () => {
    setLoading(true);
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setProgress(null);
        lastLevelRef.current = null;
        return;
      }

      const { data, error } = await supabase
        .from("account_progress")
        .select("total_xp, level")
        .eq("account_id", user.id)
        .single();

      if (error || !data) {
        return;
      }

      const newLevel = data.level as number;
      const prevLevel = lastLevelRef.current;

      // level-up detectie: alleen als we al een level kenden
      if (prevLevel !== null && newLevel > prevLevel) {
        setLevelUp({ from: prevLevel, to: newLevel });
      }

      lastLevelRef.current = newLevel;

      setProgress({
        level: newLevel,
        total_xp: data.total_xp as number,
      });
    } finally {
      setLoading(false);
    }
  }, []); // ⬅︎ LET OP: GEEN progress/levelUp in deps

  // éénmalig initial load
  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  const acknowledgeLevelUp = () => setLevelUp(null);

  return {
    progress,
    loading,
    levelUp,
    acknowledgeLevelUp,
    refreshProgress: loadProgress, // stabiele functie, door useCallback
  };
}
