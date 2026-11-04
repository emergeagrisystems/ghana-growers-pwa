"use client";

import { ArrowRight, MessageCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { HOME_DRAFT_LIMIT, prepareHomeDraft } from "@/lib/farmmate/home-draft";
import styles from "./Stage1Homepage.module.css";

export function HomeAskEntry() {
  const [question, setQuestion] = useState("");
  const router = useRouter();

  function continueWithDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!question.trim()) return;
    const receipt = prepareHomeDraft(question);
    setQuestion("");
    router.push("/farmer-hub#draft-" + receipt);
  }

  return <form className={styles.homeAsk} onSubmit={continueWithDraft} action="/farmer-hub">
    <label htmlFor="home-adviser-question"><MessageCircle size={23} aria-hidden="true" />
      <strong>Ask Mama G</strong>
    </label>
    <p><b>Your agricultural adviser.</b> Get help with crops, planting and everyday farming decisions.</p>
    <div className={styles.draftRow}>
      <input id="home-adviser-question" value={question} maxLength={HOME_DRAFT_LIMIT}
        onChange={event => setQuestion(event.target.value)} autoComplete="off" required
        placeholder="Ask a farming question…" />
      <button type="submit" disabled={!question.trim()}>Ask Mama G <ArrowRight size={16} aria-hidden="true" /></button>
    </div>
  </form>;
}
