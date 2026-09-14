import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getAppUrl(path: string = "/"): string {
  const base = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  if (cleanPath === "/" && base !== "") {
    return base + "/";
  }
  return `${base}${cleanPath}`;
}

export function navigateTo(path: string): void {
  const targetUrl = getAppUrl(path);
  if (typeof window !== "undefined") {
    window.location.href = targetUrl;
  }
}

