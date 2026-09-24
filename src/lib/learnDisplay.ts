// Preserve the stored category value and filters; change only its public label.
export function displayLearnCategory(category: string): string {
  return category === "FarmMate Guides" ? "Mama G Guides" : category;
}
