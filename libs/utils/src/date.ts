export const getDateString = (timestamp: number) => {
  const date = new Date(timestamp);
  return `${date.getDate()} ${date.toLocaleString("default", {
    month: "short",
  })} ${date.getFullYear()}`;
};

export const getTimeString = (timestamp: number) => {
  const date = new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const seconds = date.getSeconds().toString().padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
};

export const getTimezoneString = () => {
  const date = new Date();
  const offsetMinutes = date.getTimezoneOffset();
  const hours = Math.floor(Math.abs(offsetMinutes) / 60);
  const minutes = Math.abs(offsetMinutes) % 60;
  const sign = offsetMinutes <= 0 ? "+" : "-";

  const hoursString = hours.toString().padStart(2, "0");
  const minutesString = minutes.toString().padStart(2, "0");
  return `${sign}${hoursString}${minutes > 0 ? `:${minutesString}` : ""}`;
};

export const getDateDifference = (dateString: string): string => {
  const oldDate = new Date(dateString);
  const today = new Date();

  const isSameDay =
    oldDate.getDate() === today.getDate() &&
    oldDate.getMonth() === today.getMonth() &&
    oldDate.getFullYear() === today.getFullYear();

  if (isSameDay) {
    return "Today";
  }

  // Calculate difference in days
  const diffTime = Math.abs(today.getTime() - oldDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
};
