/** Display amounts stored as minor units (cents/paise). */
export function formatInrFromMinorUnits(minorUnits: number): string {
  const rupees = minorUnits / 100;
  const formatted = rupees.toLocaleString("en-IN", {
    maximumFractionDigits: rupees % 1 === 0 ? 0 : 2,
  });
  return `₹${formatted}`;
}
