import "dotenv/config";
import { storage } from "../server/storage";

async function seedFeatureFlags() {
    const flags = [
        {
            name: "object-explorer",
            enabled: "false",
            description: "Enable the object explorer tool for managing pixel art objects and layers",
        },
    ];

    for (const flag of flags) {
        const existing = await storage.getFeatureFlag_async(flag.name);
        if (existing) {
            console.log(`Feature flag "${flag.name}" already exists, skipping...`);
            continue;
        }

        await storage.createFeatureFlag_async(flag);
        console.log(`Created feature flag: ${flag.name}`);
    }

    console.log("Feature flags seeded successfully");
    process.exit(0);
}

seedFeatureFlags().catch((err) => {
    console.error("Error seeding feature flags:", err);
    process.exit(1);
});

