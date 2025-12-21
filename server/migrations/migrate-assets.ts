import { migrateLegacyContent } from "@shared/utils/pixel-asset";
import type { Asset } from "@shared/schema";

/**
 * Migrate legacy asset content format to new PixelAssetContent format
 * Converts { grid: ... } to { version: 1, layers: [...], objects: [], animations: [], activeLayerId: ... }
 */
export function migrateAssetContent(asset: Asset): Asset {
  // Check if already migrated (has version field)
  if (
    asset.content &&
    typeof asset.content === "object" &&
    "version" in asset.content
  ) {
    return asset; // Already migrated
  }

  // Check if legacy format (has grid field)
  if (
    asset.content &&
    typeof asset.content === "object" &&
    "grid" in asset.content
  ) {
    const legacyContent = asset.content as { grid?: Record<string, string> };
    const newContent = migrateLegacyContent(legacyContent);
    return {
      ...asset,
      content: newContent,
    };
  }

  // Unknown format, return as-is
  return asset;
}

/**
 * Migrate multiple assets
 */
export function migrateAssets(assets: Asset[]): Asset[] {
  return assets.map(migrateAssetContent);
}

