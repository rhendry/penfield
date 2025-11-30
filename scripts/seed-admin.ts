import "dotenv/config";
import { storage } from "../server/storage";
import { hashPassword } from "../server/auth";

async function seedAdmin() {
    const username = "admin";
    const password = "admin123";

    const existing = await storage.getUserByUsername(username);
    if (existing) {
        console.log("Admin user already exists");
        process.exit(0);
    }

    const hashedPassword = await hashPassword(password);
    await storage.createUser({
        username,
        password: hashedPassword,
        role: "admin",
    });

    console.log("Admin user created successfully");
    console.log("Username: admin");
    console.log("Password: admin123");
    process.exit(0);
}

seedAdmin().catch((err) => {
    console.error("Error seeding admin:", err);
    process.exit(1);
});
