"use client";

import { useEffect, useState } from "react";
import { getFarmMateGreetingForHour } from "@/lib/farmmate/daily-summary";

export function FarmMateGreeting() {
  const [greeting, setGreeting] = useState("Good morning");

  useEffect(() => {
    setGreeting(getFarmMateGreetingForHour(new Date().getHours()));
  }, []);

  return <p className="mt-6 text-lg font-black text-leaf-700 sm:text-xl">{greeting}</p>;
}
