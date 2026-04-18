import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

const isNative = Capacitor.isNativePlatform();

function impact(style: ImpactStyle): void {
  if (isNative) {
    Haptics.impact({ style }).catch(() => {});
  }
}

export function useHaptics() {
  return {
    light: () => impact(ImpactStyle.Light),
    medium: () => impact(ImpactStyle.Medium),
  };
}
