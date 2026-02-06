import bcrypt from "bcrypt";
import { db } from "./db";
import { users } from "./schema";
import { eq } from "drizzle-orm";

async function seedAdmin() {
  const email = "admin@daralibenzid.dz";
  const password = "assater123"; // بدّلها
  const hash = await bcrypt.hash(password, 10);

  const existing = await db
    .select()
    .from(users)
    .where(eq(users.email, email));

  if (existing.length === 0) {
    await db.insert(users).values({
      email,
      password: hash,
      role: "admin",
    });

    console.log("✅ Admin created:", email);
  } else {
    console.log("ℹ️ Admin already exists");
  }
}

seedAdmin();
