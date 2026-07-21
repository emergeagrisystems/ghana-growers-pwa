import {
  detectFarmMateCropLibraryEntry,
  findFarmMateCropLibraryEntry
} from "./crop-library";

export function detectFarmMateCropFromQuestion(question: string) {
  return detectFarmMateCropLibraryEntry(question);
}

export function resolveFarmMateCropForQuestion(question: string, previousCropName?: string) {
  return detectFarmMateCropFromQuestion(question) ?? findFarmMateCropLibraryEntry(previousCropName);
}
