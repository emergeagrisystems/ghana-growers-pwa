"use client";

import { CalendarDays, Leaf, MessageCircle, PackageCheck, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { HOME_DRAFT_LIMIT, prepareHomeDraft } from "@/lib/farmmate/home-draft";
import styles from "./Stage1Homepage.module.css";

export function HomeAskEntry() {
  const [question, setQuestion] = useState("");
  const router = useRouter();

  function continueWithDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!question.trim()) {
      setQuestion("");
      router.push("/farmer-hub");
      return;
    }
    const receipt = prepareHomeDraft(question);
    setQuestion("");
    router.push("/farmer-hub#draft-" + receipt);
  }

  return <form className={styles.homeAsk} onSubmit={continueWithDraft} action="/farmer-hub">
    <label htmlFor="home-adviser-question"><MessageCircle size={23} aria-hidden="true" />
      <strong>Ask Mama G</strong>
    </label>
    <ul className={styles.askBenefits}>
      <li><Leaf aria-hidden="true" />Check crop problems</li>
      <li><CalendarDays aria-hidden="true" />Plan planting</li>
      <li><PackageCheck aria-hidden="true" />Get storage tips</li>
    </ul>
    <div className={styles.draftRow}>
      <input id="home-adviser-question" value={question} maxLength={HOME_DRAFT_LIMIT}
        onChange={event => setQuestion(event.target.value)} autoComplete="off"
        placeholder="Ask a farming question…" />
      <button type="submit"><Zap size={16} aria-hidden="true" />Try for free</button>
    </div>
  </form>;
}
