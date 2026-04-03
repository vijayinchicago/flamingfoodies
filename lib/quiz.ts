export function getQuizResult(values: number[]) {
  const weight = values.reduce((total, value) => total + value, 0);

  if (weight <= 5) return "mild-adventurer";
  if (weight <= 9) return "balanced-burn";
  if (weight <= 13) return "heat-hunter";
  return "reaper-chaser";
}
