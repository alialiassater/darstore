import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, hashPassword } from "./auth";
import { api } from "@shared/routes";
import { insertOrderSchema } from "@shared/schema";
import { z } from "zod";
import passport from "passport";
import type { User } from "@shared/schema";
import { algerianWilayas } from "@shared/algeria-data";

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    res.status(401).json({ message: "Login required" });
    return;
  }
  next();
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated() || !["admin", "employee"].includes((req.user as User).role)) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
  next();
}

async function logAdminAction(req: Request, action: string, entityType?: string, entityId?: number, details?: string) {
  const user = req.user as User;
  if (user) {
    await storage.logActivity({
      adminId: user.id,
      adminEmail: user.email,
      action,
      entityType: entityType || null,
      entityId: entityId || null,
      details: details || null,
    });
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  const { hashPassword } = setupAuth(app);

  // === AUTH ===
  app.post(api.auth.register.path, async (req, res) => {
    try {
      const input = api.auth.register.input.parse(req.body);
      const existing = await storage.getUserByUsername(input.email);
      if (existing) {
        return res.status(400).json({ message: "Email already registered" });
      }
      const hashedPassword = await hashPassword(input.password);
      const user = await storage.createUser({
        email: input.email,
        password: hashedPassword,
        role: "user",
        name: input.name,
        phone: input.phone || null,
      });
      req.login(user, (err) => {
        if (err) return res.status(500).json({ message: "Login failed after registration" });
        res.status(201).json(user);
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.post(api.auth.login.path, (req, res, next) => {
    const result = api.auth.login.input.safeParse(req.body);
    if (!result.success) return res.status(400).json({ message: "Invalid input" });
    next();
  }, (req, res, next) => {
    passport.authenticate("local", (err: any, user: any) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: "Invalid credentials" });
      req.login(user, (err) => {
        if (err) return next(err);
        res.json(user);
      });
    })(req, res, next);
  });

  app.post(api.auth.logout.path, (req, res) => {
    req.logout((err) => {
      if (err) return res.status(500).json({ message: "Logout failed" });
      res.status(200).send();
    });
  });

  app.get(api.auth.me.path, (req, res) => {
    if (req.isAuthenticated()) {
      res.json(req.user);
    } else {
      res.json(null);
    }
  });

  // === BOOKS ===
  app.get(api.books.list.path, async (req, res) => {
    const category = req.query.category as string | undefined;
    const search = req.query.search as string | undefined;
    const allBooks = await storage.getBooks(category, search);
    res.json(allBooks);
  });

  app.get(api.books.get.path, async (req, res) => {
    const book = await storage.getBook(Number(req.params.id));
    if (!book) return res.status(404).json({ message: "Book not found" });
    res.json(book);
  });

  app.post(api.books.create.path, requireAdmin, async (req, res) => {
    try {
      const input = api.books.create.input.parse(req.body);
      const book = await storage.createBook(input);
      await logAdminAction(req, "Created book", "book", book.id, `${input.titleEn}`);
      res.status(201).json(book);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: "Validation error" });
      } else {
        res.status(500).json({ message: "Server error" });
      }
    }
  });

  app.put(api.books.update.path, requireAdmin, async (req, res) => {
    try {
      const input = api.books.update.input.parse(req.body);
      const updated = await storage.updateBook(Number(req.params.id), input);
      await logAdminAction(req, "Updated book", "book", updated.id, `${updated.titleEn}`);
      res.json(updated);
    } catch (err) {
      res.status(400).json({ message: "Update failed" });
    }
  });

  app.delete(api.books.delete.path, requireAdmin, async (req, res) => {
    const id = Number(req.params.id);
    await storage.deleteBook(id);
    await logAdminAction(req, "Deleted book", "book", id);
    res.status(204).send();
  });

  // === CATEGORIES ===
  app.get(api.categories.list.path, async (_req, res) => {
    const cats = await storage.getCategories();
    res.json(cats);
  });

  app.post(api.categories.create.path, requireAdmin, async (req, res) => {
    try {
      const input = api.categories.create.input.parse(req.body);
      const cat = await storage.createCategory(input);
      await logAdminAction(req, "Created category", "category", cat.id, cat.nameEn);
      res.status(201).json(cat);
    } catch (err) {
      res.status(400).json({ message: "Validation error" });
    }
  });

  app.put(api.categories.update.path, requireAdmin, async (req, res) => {
    try {
      const input = api.categories.update.input.parse(req.body);
      const cat = await storage.updateCategory(Number(req.params.id), input);
      await logAdminAction(req, "Updated category", "category", cat.id, cat.nameEn);
      res.json(cat);
    } catch (err) {
      res.status(400).json({ message: "Update failed" });
    }
  });

  app.delete(api.categories.delete.path, requireAdmin, async (req, res) => {
    const id = Number(req.params.id);
    await storage.deleteCategory(id);
    await logAdminAction(req, "Deleted category", "category", id);
    res.status(204).send();
  });

  // === CUSTOMER PROFILE ===
  app.get(api.profile.get.path, requireAuth, async (req, res) => {
    const user = req.user as User;
    const { password, ...safeUser } = user as any;
    res.json(safeUser);
  });

  app.put(api.profile.update.path, requireAuth, async (req, res) => {
    try {
      const user = req.user as User;
      const input = api.profile.update.input.parse(req.body);
      const updates: Partial<User> = {};
      if (input.name !== undefined) updates.name = input.name;
      if (input.phone !== undefined) updates.phone = input.phone;
      if (input.address !== undefined) updates.address = input.address;
      if (input.city !== undefined) updates.city = input.city;
      if (input.password && input.password.length >= 6) {
        updates.password = await hashPassword(input.password);
      }
      const updated = await storage.updateUser(user.id, updates);
      const { password: _, ...safeUser } = updated as any;
      res.json(safeUser);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      console.error("Profile update error:", err);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  app.get(api.profile.orders.path, requireAuth, async (req, res) => {
    const user = req.user as User;
    const orders = await storage.getUserOrders(user.id);
    res.json(orders);
  });

  // === ORDERS ===
  app.post(api.orders.create.path, async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "يجب تسجيل الدخول لإتمام الطلب / You must be logged in to place an order" });
      }

      const input = insertOrderSchema.parse(req.body);
      const bookPrices: { bookId: number; quantity: number; unitPrice: number }[] = [];
      let subtotal = 0;

      for (const item of input.items) {
        const book = await storage.getBook(item.bookId);
        if (!book) return res.status(400).json({ message: `Book not found: ${item.bookId}` });
        const price = Number(book.price);
        bookPrices.push({ bookId: item.bookId, quantity: item.quantity, unitPrice: price });
        subtotal += price * item.quantity;
      }

      let shippingPrice = 0;
      if (input.wilayaCode) {
        const wilaya = await storage.getWilayaByCode(input.wilayaCode);
        if (wilaya && wilaya.isActive) {
          shippingPrice = Number(wilaya.shippingPrice);
        }
      }

      const total = subtotal + shippingPrice;
      const userId = (req.user as User).id;
      const order = await storage.createOrder(userId, input.customerName, input.phone, input.address, input.city, input.notes, total, bookPrices, input.wilayaCode, input.wilayaName, input.baladiya, shippingPrice);
      res.status(201).json(order);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        console.error("Order creation error:", err);
        res.status(500).json({ message: "Failed to create order" });
      }
    }
  });

  app.get(api.orders.list.path, async (req, res) => {
    if (req.isAuthenticated() && (req.user as User).role === "admin") {
      const allOrders = await storage.getOrders();
      return res.json(allOrders);
    }
    if (req.isAuthenticated()) {
      const userOrders = await storage.getUserOrders((req.user as User).id);
      return res.json(userOrders);
    }
    return res.status(401).json({ message: "Login required" });
  });

  app.get(api.orders.get.path, async (req, res) => {
    const order = await storage.getOrder(Number(req.params.id));
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json(order);
  });

  app.put(api.orders.updateStatus.path, requireAdmin, async (req, res) => {
    try {
      const { status } = req.body;
      const orderId = Number(req.params.id);
      const existingOrder = await storage.getOrder(orderId);
      if (!existingOrder) return res.status(404).json({ message: "Order not found" });

      const order = await storage.updateOrderStatus(orderId, status);

      if (status === "confirmed" && !existingOrder.pointsAwarded && existingOrder.userId) {
        const orderTotal = Number(existingOrder.total) - Number(existingOrder.shippingPrice || 0);
        const pointsToAward = Math.floor(orderTotal / 350);
        if (pointsToAward > 0) {
          const customer = await storage.getUser(existingOrder.userId);
          if (customer) {
            await storage.updateUser(customer.id, { points: customer.points + pointsToAward });
            await storage.updateOrderPointsAwarded(orderId, true);
            await logAdminAction(req, `Awarded ${pointsToAward} points`, "order", orderId);
          }
        }
      }

      await logAdminAction(req, `Updated order status to ${status}`, "order", order.id);
      res.json(order);
    } catch (err) {
      res.status(400).json({ message: "Update failed" });
    }
  });

  app.delete(api.orders.delete.path, requireAdmin, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const order = await storage.getOrder(id);
      if (!order) return res.status(404).json({ message: "Order not found" });
      await storage.deleteOrder(id);
      await logAdminAction(req, "Deleted order", "order", id, order.customerName);
      res.status(204).send();
    } catch (err) {
      res.status(400).json({ message: "Delete failed" });
    }
  });

  // === ADMIN CUSTOMERS ===
  app.get(api.customers.list.path, requireAdmin, async (_req, res) => {
    const allUsers = await storage.getUsers();
    res.json(allUsers.map(u => ({ ...u, password: undefined })));
  });

  app.get(api.customers.get.path, requireAdmin, async (req, res) => {
    const id = Number(req.params.id);
    const user = await storage.getUser(id);
    if (!user) return res.status(404).json({ message: "Customer not found" });
    res.json({ ...user, password: undefined });
  });

  app.get(api.customers.orders.path, requireAdmin, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const user = await storage.getUser(id);
      if (!user) return res.status(404).json({ message: "Customer not found" });
      const userOrders = await storage.getUserOrders(id);
      res.json(userOrders);
    } catch (err) {
      res.status(400).json({ message: "Failed to fetch orders" });
    }
  });

  app.post(api.customers.create.path, requireAdmin, async (req, res) => {
    try {
      const { email, password, name, phone, address, city } = req.body;
      const existing = await storage.getUserByUsername(email);
      if (existing) return res.status(400).json({ message: "Email already in use" });
      const hashedPassword = await hashPassword(password);
      const user = await storage.createUser({ email, password: hashedPassword, name, phone, address, city, role: "user" });
      await logAdminAction(req, "Created customer", "user", user.id, user.email);
      res.status(201).json({ ...user, password: undefined });
    } catch (err) {
      res.status(400).json({ message: "Creation failed" });
    }
  });

  app.put(api.customers.update.path, requireAdmin, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const { password, role, ...safeUpdates } = req.body;
      const updates: any = { ...safeUpdates };
      if (password && password.length >= 6) {
        updates.password = await hashPassword(password);
      }
      if (role && ["user", "employee", "admin"].includes(role)) {
        updates.role = role;
      }
      const user = await storage.updateUser(id, updates);
      await logAdminAction(req, "Updated customer", "user", id, user.email);
      res.json({ ...user, password: undefined });
    } catch (err) {
      res.status(400).json({ message: "Update failed" });
    }
  });

  app.delete(api.customers.delete.path, requireAdmin, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const user = await storage.getUser(id);
      if (!user) return res.status(404).json({ message: "Customer not found" });
      if (user.role === "admin") return res.status(400).json({ message: "Cannot delete admin users" });
      await storage.deleteUser(id);
      await logAdminAction(req, "Deleted customer", "user", id, user.email);
      res.status(204).send();
    } catch (err) {
      res.status(400).json({ message: "Delete failed" });
    }
  });

  // === SHIPPING / WILAYAS ===
  app.get(api.shipping.list.path, async (req, res) => {
    const activeOnly = req.query?.active === "true";
    const allWilayas = activeOnly ? await storage.getActiveWilayas() : await storage.getWilayas();
    res.json(allWilayas);
  });

  app.get(api.shipping.get.path, async (req, res) => {
    const w = await storage.getWilayaByCode(Number(req.params.code));
    if (!w) return res.status(404).json({ message: "Wilaya not found" });
    res.json(w);
  });

  app.put(api.shipping.update.path, requireAdmin, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const updates: any = {};
      if (req.body.shippingPrice !== undefined) updates.shippingPrice = req.body.shippingPrice;
      if (req.body.isActive !== undefined) updates.isActive = req.body.isActive;
      const w = await storage.updateWilaya(id, updates);
      await logAdminAction(req, "Updated shipping", "wilaya", w.id, `${w.nameEn}: ${w.shippingPrice} DZD`);
      res.json(w);
    } catch (err) {
      res.status(400).json({ message: "Update failed" });
    }
  });

  app.put(api.shipping.bulkUpdate.path, requireAdmin, async (req, res) => {
    try {
      const { defaultPrice } = req.body;
      const allWilayas = await storage.getWilayas();
      let count = 0;
      for (const w of allWilayas) {
        await storage.updateWilaya(w.id, { shippingPrice: defaultPrice });
        count++;
      }
      await logAdminAction(req, `Set default shipping price to ${defaultPrice} DZD`, "shipping");
      res.json({ updated: count });
    } catch (err) {
      res.status(400).json({ message: "Bulk update failed" });
    }
  });

  // === POINTS REDEMPTION ===
  app.post("/api/points/redeem", requireAuth, async (req, res) => {
    try {
      const user = req.user as User;
      const { bookId, quantity } = req.body;
      const book = await storage.getBook(bookId);
      if (!book) return res.status(404).json({ message: "Book not found" });
      
      const pointsNeeded = Math.ceil(Number(book.price) / 350) * (quantity || 1);
      if (user.points < pointsNeeded) {
        return res.status(400).json({ message: "Not enough points", required: pointsNeeded, available: user.points });
      }

      await storage.updateUser(user.id, { points: user.points - pointsNeeded });
      
      const order = await storage.createOrder(
        user.id,
        user.name || user.email,
        user.phone || "",
        user.address || "",
        user.city || "",
        `Points redemption: ${pointsNeeded} points used`,
        0,
        [{ bookId: book.id, quantity: quantity || 1, unitPrice: 0 }],
        undefined, undefined, undefined, 0
      );

      await storage.updateOrderPointsAwarded(order.id, true);

      res.json({ message: "Points redeemed successfully", pointsUsed: pointsNeeded, remainingPoints: user.points - pointsNeeded, order });
    } catch (err) {
      res.status(400).json({ message: "Redemption failed" });
    }
  });

  // === ADMIN POINTS MANAGEMENT ===
  app.put("/api/admin/customers/:id/points", requireAdmin, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const { points } = req.body;
      const user = await storage.updateUser(id, { points: Number(points) });
      await logAdminAction(req, `Set points to ${points}`, "user", id, user.email);
      res.json({ ...user, password: undefined });
    } catch (err) {
      res.status(400).json({ message: "Update failed" });
    }
  });

  app.get(api.activity.list.path, requireAdmin, async (_req, res) => {
    const logs = await storage.getActivityLogs(200);
    res.json(logs);
  });

  app.get(api.stats.get.path, requireAdmin, async (_req, res) => {
    const [totalBooks, totalOrders, totalCustomers, lowStockBooks, revenue] = await Promise.all([
      storage.countBooks(),
      storage.countOrders(),
      storage.getUsers().then(u => u.filter(x => x.role === "user").length),
      storage.countLowStockBooks(),
      storage.totalRevenue(),
    ]);
    res.json({ totalBooks, totalOrders, totalCustomers, lowStockBooks, revenue });
  });

  // Seed
  await seedDatabase(hashPassword);
  await seedWilayas();

  return httpServer;
}

async function seedWilayas() {
  const count = await storage.countWilayas();
  if (count === 0) {
    console.log("Seeding wilayas...");
    for (const w of algerianWilayas) {
      await storage.createWilaya({
        code: w.code,
        nameAr: w.nameAr,
        nameEn: w.nameEn,
        shippingPrice: String(w.defaultPrice),
        isActive: true,
      });
    }
    console.log(`Seeded ${algerianWilayas.length} wilayas.`);
  }
}

async function seedDatabase(hashPassword: (pwd: string) => Promise<string>) {
  const existing = await storage.getUserByUsername("admin@daralibenzid.com");
  if (!existing) {
    console.log("Seeding database...");
    const adminPwd = await hashPassword("assater123");
    await storage.createUser({
      email: "admin@daralibenzid.com",
      password: adminPwd,
      role: "admin",
      name: "Admin",
    });

    const userPwd = await hashPassword("user123");
    await storage.createUser({
      email: "user@example.com",
      password: userPwd,
      role: "user",
      name: "Test User",
    });

    // Seed categories
    await storage.createCategory({ nameAr: "تاريخ", nameEn: "History", slug: "history" });
    await storage.createCategory({ nameAr: "أدب", nameEn: "Literature", slug: "literature" });
    await storage.createCategory({ nameAr: "رواية", nameEn: "Fiction", slug: "fiction" });
    await storage.createCategory({ nameAr: "دين", nameEn: "Religion", slug: "religion" });
    await storage.createCategory({ nameAr: "علوم", nameEn: "Science", slug: "science" });

    await storage.createBook({
      titleAr: "مقدمة ابن خلدون",
      titleEn: "The Muqaddimah",
      author: "Ibn Khaldun",
      descriptionAr: "كتاب العبر وديوان المبتدأ والخبر في أيام العرب والعجم والبربر ومن عاصرهم من ذوي السلطان الأكبر.",
      descriptionEn: "The Muqaddimah, often translated as 'Introduction' or 'Prolegomenon', is the most important Islamic history of the premodern world.",
      price: "2500",
      category: "History",
      image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800",
      language: "both",
      published: true,
      isbn: "978-0691174954",
      stock: 15,
    });

    await storage.createBook({
      titleAr: "ألف ليلة وليلة",
      titleEn: "One Thousand and One Nights",
      author: "Unknown",
      descriptionAr: "مجموعة قصصية تراثية من الشرق الأوسط.",
      descriptionEn: "A collection of Middle Eastern folk tales compiled in Arabic during the Islamic Golden Age.",
      price: "3000",
      category: "Literature",
      image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=800",
      language: "ar",
      published: true,
      isbn: "978-1234567890",
      stock: 10,
    });

    await storage.createBook({
      titleAr: "البؤساء",
      titleEn: "Les Miserables",
      author: "Victor Hugo",
      descriptionAr: "رواية فرنسية تاريخية من تأليف فيكتور هوجو.",
      descriptionEn: "A French historical novel by Victor Hugo, considered one of the greatest novels of the 19th century.",
      price: "1800",
      category: "Fiction",
      image: "https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&q=80&w=800",
      language: "both",
      published: true,
      isbn: "978-0451419439",
      stock: 8,
    });
  }
}
