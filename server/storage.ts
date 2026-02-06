import { db } from "./db";
import {
  users, books, categories, orders, orderItems, activityLogs, wilayas,
  type User, type InsertUser,
  type Book, type InsertBook, type UpdateBookRequest,
  type Category, type InsertCategory,
  type Order, type OrderItem, type OrderWithItems,
  type Wilaya, type InsertWilaya,
  type ActivityLog, type InsertActivityLog
} from "@shared/schema";
import { eq, desc, sql } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  sessionStore: session.Store;

  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUsers(): Promise<User[]>;
  updateUser(id: number, updates: Partial<User>): Promise<User>;

  getBooks(category?: string, search?: string): Promise<Book[]>;
  getBook(id: number): Promise<Book | undefined>;
  createBook(book: InsertBook): Promise<Book>;
  updateBook(id: number, updates: UpdateBookRequest): Promise<Book>;
  deleteBook(id: number): Promise<void>;
  countBooks(): Promise<number>;
  countLowStockBooks(): Promise<number>;

  getCategories(): Promise<Category[]>;
  getCategory(id: number): Promise<Category | undefined>;
  createCategory(cat: InsertCategory): Promise<Category>;
  updateCategory(id: number, updates: Partial<InsertCategory>): Promise<Category>;
  deleteCategory(id: number): Promise<void>;

  getWilayas(): Promise<Wilaya[]>;
  getActiveWilayas(): Promise<Wilaya[]>;
  getWilayaByCode(code: number): Promise<Wilaya | undefined>;
  getWilaya(id: number): Promise<Wilaya | undefined>;
  createWilaya(w: InsertWilaya): Promise<Wilaya>;
  updateWilaya(id: number, updates: Partial<Wilaya>): Promise<Wilaya>;
  countWilayas(): Promise<number>;

  createOrder(userId: number | null, customerName: string, phone: string, address: string, city: string, notes: string | undefined, total: number, items: { bookId: number; quantity: number; unitPrice: number }[], wilayaCode?: number, wilayaName?: string, baladiya?: string, shippingPrice?: number): Promise<OrderWithItems>;
  getOrders(): Promise<OrderWithItems[]>;
  getOrder(id: number): Promise<OrderWithItems | undefined>;
  getUserOrders(userId: number): Promise<OrderWithItems[]>;
  updateOrderStatus(id: number, status: string): Promise<Order>;
  updateOrderPointsAwarded(id: number, awarded: boolean): Promise<Order>;
  deleteOrder(id: number): Promise<void>;
  countOrders(): Promise<number>;
  totalRevenue(): Promise<number>;

  deleteUser(id: number): Promise<void>;

  logActivity(log: InsertActivityLog): Promise<ActivityLog>;
  getActivityLogs(limit?: number): Promise<ActivityLog[]>;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getUsers(): Promise<User[]> {
    return db.select().from(users).orderBy(desc(users.createdAt));
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User> {
    const [user] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return user;
  }

  async getBooks(category?: string, search?: string): Promise<Book[]> {
    const allBooks = await db.select().from(books).orderBy(desc(books.createdAt));
    return allBooks.filter(book => {
      if (category && book.category !== category) return false;
      if (search) {
        const s = search.toLowerCase();
        return book.titleAr.toLowerCase().includes(s) || book.titleEn.toLowerCase().includes(s) || book.author.toLowerCase().includes(s);
      }
      return true;
    });
  }

  async getBook(id: number): Promise<Book | undefined> {
    const [book] = await db.select().from(books).where(eq(books.id, id));
    return book;
  }

  async createBook(insertBook: InsertBook): Promise<Book> {
    const [book] = await db.insert(books).values(insertBook).returning();
    return book;
  }

  async updateBook(id: number, updates: UpdateBookRequest): Promise<Book> {
    const [book] = await db.update(books).set(updates).where(eq(books.id, id)).returning();
    return book;
  }

  async deleteBook(id: number): Promise<void> {
    await db.delete(books).where(eq(books.id, id));
  }

  async countBooks(): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)::int` }).from(books);
    return result[0]?.count ?? 0;
  }

  async countLowStockBooks(): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)::int` }).from(books).where(sql`${books.stock} < 5`);
    return result[0]?.count ?? 0;
  }

  async getCategories(): Promise<Category[]> {
    return db.select().from(categories);
  }

  async getCategory(id: number): Promise<Category | undefined> {
    const [cat] = await db.select().from(categories).where(eq(categories.id, id));
    return cat;
  }

  async createCategory(cat: InsertCategory): Promise<Category> {
    const [created] = await db.insert(categories).values(cat).returning();
    return created;
  }

  async updateCategory(id: number, updates: Partial<InsertCategory>): Promise<Category> {
    const [cat] = await db.update(categories).set(updates).where(eq(categories.id, id)).returning();
    return cat;
  }

  async deleteCategory(id: number): Promise<void> {
    await db.delete(categories).where(eq(categories.id, id));
  }

  async getWilayas(): Promise<Wilaya[]> {
    return db.select().from(wilayas).orderBy(wilayas.code);
  }

  async getActiveWilayas(): Promise<Wilaya[]> {
    return db.select().from(wilayas).where(eq(wilayas.isActive, true)).orderBy(wilayas.code);
  }

  async getWilayaByCode(code: number): Promise<Wilaya | undefined> {
    const [w] = await db.select().from(wilayas).where(eq(wilayas.code, code));
    return w;
  }

  async getWilaya(id: number): Promise<Wilaya | undefined> {
    const [w] = await db.select().from(wilayas).where(eq(wilayas.id, id));
    return w;
  }

  async createWilaya(w: InsertWilaya): Promise<Wilaya> {
    const [created] = await db.insert(wilayas).values(w).returning();
    return created;
  }

  async updateWilaya(id: number, updates: Partial<Wilaya>): Promise<Wilaya> {
    const [updated] = await db.update(wilayas).set(updates).where(eq(wilayas.id, id)).returning();
    return updated;
  }

  async countWilayas(): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)::int` }).from(wilayas);
    return result[0]?.count ?? 0;
  }

  async createOrder(userId: number | null, customerName: string, phone: string, address: string, city: string, notes: string | undefined, total: number, items: { bookId: number; quantity: number; unitPrice: number }[], wilayaCode?: number, wilayaName?: string, baladiya?: string, shippingPrice?: number): Promise<OrderWithItems> {
    const [order] = await db.insert(orders).values({
      userId, customerName, phone, address, city, notes, total: String(total), status: "pending",
      wilayaCode: wilayaCode || null,
      wilayaName: wilayaName || null,
      baladiya: baladiya || null,
      shippingPrice: shippingPrice != null ? String(shippingPrice) : null,
    }).returning();

    const insertedItems: OrderItem[] = [];
    for (const item of items) {
      const [oi] = await db.insert(orderItems).values({
        orderId: order.id,
        bookId: item.bookId,
        quantity: item.quantity,
        unitPrice: String(item.unitPrice),
      }).returning();
      insertedItems.push(oi);
    }

    return { ...order, items: insertedItems };
  }

  async getOrders(): Promise<OrderWithItems[]> {
    const allOrders = await db.select().from(orders).orderBy(desc(orders.createdAt));
    const result: OrderWithItems[] = [];
    for (const order of allOrders) {
      const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
      const itemsWithBooks = [];
      for (const item of items) {
        const [book] = await db.select().from(books).where(eq(books.id, item.bookId));
        itemsWithBooks.push({ ...item, book });
      }
      result.push({ ...order, items: itemsWithBooks });
    }
    return result;
  }

  async getOrder(id: number): Promise<OrderWithItems | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    if (!order) return undefined;
    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
    const itemsWithBooks = [];
    for (const item of items) {
      const [book] = await db.select().from(books).where(eq(books.id, item.bookId));
      itemsWithBooks.push({ ...item, book });
    }
    return { ...order, items: itemsWithBooks };
  }

  async getUserOrders(userId: number): Promise<OrderWithItems[]> {
    const allOrders = await db.select().from(orders).where(eq(orders.userId, userId)).orderBy(desc(orders.createdAt));
    const result: OrderWithItems[] = [];
    for (const order of allOrders) {
      const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
      result.push({ ...order, items });
    }
    return result;
  }

  async updateOrderStatus(id: number, status: string): Promise<Order> {
    const [order] = await db.update(orders).set({ status }).where(eq(orders.id, id)).returning();
    return order;
  }

  async updateOrderPointsAwarded(id: number, awarded: boolean): Promise<Order> {
    const [order] = await db.update(orders).set({ pointsAwarded: awarded }).where(eq(orders.id, id)).returning();
    return order;
  }

  async deleteOrder(id: number): Promise<void> {
    await db.delete(orderItems).where(eq(orderItems.orderId, id));
    await db.delete(orders).where(eq(orders.id, id));
  }

  async deleteUser(id: number): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async countOrders(): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)::int` }).from(orders);
    return result[0]?.count ?? 0;
  }

  async totalRevenue(): Promise<number> {
    const result = await db.select({ total: sql<number>`COALESCE(sum(total::numeric), 0)::numeric` }).from(orders).where(sql`${orders.status} != 'cancelled'`);
    return Number(result[0]?.total ?? 0);
  }

  async logActivity(log: InsertActivityLog): Promise<ActivityLog> {
    const [entry] = await db.insert(activityLogs).values(log).returning();
    return entry;
  }

  async getActivityLogs(limit = 100): Promise<ActivityLog[]> {
    return db.select().from(activityLogs).orderBy(desc(activityLogs.createdAt)).limit(limit);
  }
}

export const storage = new DatabaseStorage();
