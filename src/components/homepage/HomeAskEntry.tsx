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
    <label htmlFor="home-adviser-question"><MessageCircle size={24} aria-hidden="true" />
      <span><strong>Ask Mama G</strong><small>Your agricultural adviser</small></span>
    </label>
    <div className={styles.draftRow}>
      <input id="home-adviser-question" value={question} maxLength={HOME_DRAFT_LIMIT}
        onChange={event => setQuestion(event.target.value)} autoComplete="off" required
        aria-describedby="home-ask-hint" placeholder="What is happening on your farm?" />
      <button type="submit" disabled={!question.trim()} aria-label="Continue with my draft"><ArrowRight size={21} /></button>
    </div>
    <p id="home-ask-hint">Review and edit your question before sending.</p>
  </form>;
}
