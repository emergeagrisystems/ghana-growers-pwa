"use client";

import { useEffect, useState } from "react";

function greetingForHour(hour: number) {
  if (hour >= 5 && hour < 12) {
    return "Good morning";
  }

  if (hour >= 12 && hour < 17) {
    return "Good afternoon";
  }

  if (hour >= 17 && hour < 21) {
    return "Good evening";
  }

  return "Good night";
}

export function FarmMateGreeting() {
  const [greeting, setGreeting] = useState("Good morning");

  useEffect(() => {
    setGreeting(greetingForHour(new Date().getHours()));
  }, []);

  return <p className="mt-6 text-lg font-black text-leaf-700 sm:text-xl">{greeting}</p>;
}
