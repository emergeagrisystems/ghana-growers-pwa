"use client";

import { farmMateCreditLine } from "./rules";

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

export { farmMateCreditLine };
