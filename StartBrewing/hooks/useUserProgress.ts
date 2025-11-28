// hooks/useUserProgress.ts
import { useState, useCallback, useEffect } from "react";
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

  const fetchProgress = useCallback(async () => {
    setLoading(true);
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) {
        setProgress(null);
        return;
      }

      const { data, error } = await supabase
        .from("account_progress")
        .select("total_xp, level")
        .eq("account_id", user.id)
        .single();

      if (error || !data) return;

      // const prevLevel = progress?.level ?? null;
      const newLevel = data.level as number;
      setProgress((prev) => {
        const prevLevel = prev?.level ?? null;
        if (prevLevel !== null && newLevel > prevLevel) {
          setLevelUp({ from: prevLevel, to: newLevel });
        }
        return {
          level: newLevel,
          total_xp: data.total_xp as number,
        };
      });
    } finally {
      setLoading(false);
    }
  }, []); 

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  const acknowledgeLevelUp = () => setLevelUp(null);

  return {
    progress,
    loading,
    levelUp,
    acknowledgeLevelUp,
    refreshProgress: fetchProgress,
  };
}

