import type { BrowserSupportResult } from "@/lib/types/video-recording";

// Battery API types (not in standard TypeScript lib)
interface BatteryManager {
  level: number;
  charging: boolean;
}

interface NavigatorWithBattery extends Navigator {
  getBattery?: () => Promise<BatteryManager>;
}

// Network Information API types
interface NetworkInformation {
  effectiveType?: string;
}

interface NavigatorWithConnection extends Navigator {
  connection?: NetworkInformation;
}

/**
 * Check if the browser supports video recording
 */
export function checkVideoSupport(): BrowserSupportResult {
  // Check if getUserMedia is available
  if (!navigator.mediaDevices?.getUserMedia) {
    return {
      supported: false,
      message:
        "Your browser doesn't support video recording. Please use a modern browser like Chrome, Firefox, Safari, or Edge.",
    };
  }

  // Check if MediaRecorder is available
  if (!window.MediaRecorder) {
    return {
      supported: false,
      message:
        "MediaRecorder API is not available in your browser. Please update your browser to the latest version.",
    };
  }

  // Check for supported MIME types
  const types = [
    "video/webm;codecs=vp9",
    "video/webm;codecs=vp8",
    "video/webm",
    "video/mp4",
  ];

  const supportedTypes = types.filter((type) =>
    MediaRecorder.isTypeSupported(type)
  );

  if (supportedTypes.length === 0) {
    return {
      supported: false,
      message:
        "No supported video formats available. Please update your browser or try a different one.",
    };
  }

  return {
    supported: true,
    supportedMimeTypes: supportedTypes,
  };
}

/**
 * Check device battery status (for mobile)
 */
export async function checkBatteryStatus(): Promise<{
  level: number;
  charging: boolean;
  lowBattery: boolean;
}> {
  try {
    if ("getBattery" in navigator) {
      const battery = await (navigator as NavigatorWithBattery).getBattery!();
      return {
        level: battery.level,
        charging: battery.charging,
        lowBattery: battery.level < 0.2 && !battery.charging,
      };
    }
  } catch (error) {
    console.error("Battery status not available:", error);
  }

  return {
    level: 1,
    charging: false,
    lowBattery: false,
  };
}

/**
 * Get network connection type (for adaptive quality)
 */
export function getConnectionType(): string {
  const connection = (navigator as NavigatorWithConnection).connection;
  if (connection) {
    return connection.effectiveType || "unknown";
  }
  return "unknown";
}

/**
 * Check if device is mobile
 */
export function isMobileDevice(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}
