"use client";

import type { FarmMateCreditStatus, FarmMateUsageTool } from "./types";

const FARM_MATE_DEVICE_ID_KEY = "gg-farmmate-anonymous-device-id";

function randomSegment() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

export function getFarmMateAnonymousDeviceId() {
  if (typeof window === "undefined") {
    return "";
  }

  const existing = window.localStorage.getItem(FARM_MATE_DEVICE_ID_KEY);

  if (existing) {
    return existing;
  }

  const nextDeviceId = `farmmate-${randomSegment()}`;
  window.localStorage.setItem(FARM_MATE_DEVICE_ID_KEY, nextDeviceId);

  return nextDeviceId;
}

export function farmMateCreditLine(tool: FarmMateUsageTool, status?: FarmMateCreditStatus | null) {
  if (!status) {
    return tool === "ask_farmmate" ? "FarmMate Credits: checking Ask questions..." : "Crop Doctor Credits: checking analyses...";
  }

  if (tool === "ask_farmmate") {
    return `FarmMate Credits: ${status.remaining} Ask question${status.remaining === 1 ? "" : "s"} remaining`;
  }

  return `Crop Doctor Credits: ${status.remaining} ${status.remaining === 1 ? "analysis" : "analyses"} remaining`;
}
