"use client";

// "Bolt, why?" — the button a stuck child presses.
//
// The written feedback above it is fixed and cannot see what this child
// wrote; this can. It never shows code, which is the whole point: a child
// handed the answer learns that asking is how you finish a level.

import { useState } from "react";
import { askBolt } from "@/lib/api/kidsAi";
import { getErrorMessage } from "@/lib/api/client";
import { useAiLanguage } from "@/hooks/useAiLanguage";
import { Mascot } from "./Mascot";
import ui from "./kidsUi.module.css";
import styles from "./AskBolt.module.css";

interface AskBoltProps {
  levelTitle: string;
  goal: string;
  kind: "python" | "puzzle";
  program: string;
  expected?: string;
  actual?: string;
  error?: string;
}

export function AskBolt({ levelTitle, goal, kind, program, expected, actual, error }: AskBoltProps) {
  const { language } = useAiLanguage();
  const [answer, setAnswer] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [failure, setFailure] = useState("");

  const ask = async () => {
    setStatus("loading");
    setFailure("");
    try {
      const result = await askBolt({ levelTitle, goal, kind, program, expected, actual, error, language });
      setAnswer(result.explanation);
      setStatus("idle");
    } catch (askError) {
      setFailure(getErrorMessage(askError, "Bolt did not hear that. Try again."));
      setStatus("error");
    }
  };

  if (answer) {
    return (
      <div className={styles.answer}>
        <Mascot mood="think" size={64} animated={false} />
        <p className={`${ui.bubble} ${styles.bubble}`}>{answer}</p>
      </div>
    );
  }

  return (
    <div className={styles.ask}>
      <button type="button" className={`${ui.btn} ${ui.btnSoft} ${ui.btnSmall}`} onClick={ask} disabled={status === "loading" || !program.trim()}>
        {status === "loading" ? "Bolt is looking…" : "Bolt, why?"}
      </button>
      {status === "error" && <p className={styles.failure}>{failure}</p>}
    </div>
  );
}
