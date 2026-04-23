import { canUseCapacitorBridge, createCapacitorBeaconBridge } from './capacitorBridge';
import { createBrowserKnowledgeBridge } from './browserKnowledgeBridge';
import type { BeaconBridge } from './beaconBridge';

let bridge: BeaconBridge | null = null;

export function getBeaconBridge(): BeaconBridge {
  if (window.beaconBridge) {
    bridge = window.beaconBridge;
    return bridge;
  }

  if (bridge) {
    return bridge;
  }

  bridge = canUseCapacitorBridge()
    ? createCapacitorBeaconBridge()
    : createBrowserKnowledgeBridge();
  return bridge;
}
