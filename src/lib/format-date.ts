// Post dates are YYYY-MM-DD calendar days; format in UTC so they never shift.
export function formatPostDate(date: string, month: "short" | "long" = "short") {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-US", {
    year: "numeric",
    month,
    day: "numeric",
    timeZone: "UTC",
  });
}
