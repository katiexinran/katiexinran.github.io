import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTimeWithAMPM(time?: string): string {
  if (!time) return '';
  
  // Parse 24-hour time (format: HH:MM:SS or HH:MM)
  const timeParts = time.split(':');
  if (timeParts.length < 2) return time;
  
  const hours = parseInt(timeParts[0], 10);
  const minutes = timeParts[1];
  
  if (isNaN(hours)) return time;
  
  // Convert to 12-hour format
  const period = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12; // 0 becomes 12
  const formattedHours = String(hours12).padStart(2, '0');
  
  return `${formattedHours}:${minutes} ${period}`;
}

export function formatEventDate(localDate: string | undefined, localTime: string | undefined): string {
  if (!localDate) return '';
  
  // Parse the date (format: YYYY-MM-DD)
  const dateParts = localDate.split('-');
  if (dateParts.length !== 3) return localDate;
  
  const year = parseInt(dateParts[0], 10);
  const month = parseInt(dateParts[1], 10) - 1; // JS months are 0-indexed
  const day = parseInt(dateParts[2], 10);
  
  if (isNaN(year) || isNaN(month) || isNaN(day)) return localDate;
  
  const date = new Date(year, month, day);
  
  // Format: Oct 25, 2026
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const formattedDate = `${monthNames[month]} ${day}, ${year}`;
  
  // Add time if available
  const formattedTime = formatTimeWithAMPM(localTime);
  
  return formattedTime ? `${formattedDate}, ${formattedTime}` : formattedDate;
}

export function formatNumberWithCommas(num: number) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
