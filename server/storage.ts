import { db } from "./db";
import {
  users, books,
  type User, type InsertUser,
  type Book, type InsertBook, type UpdateBookRequest
} from "@shared/schema";
import { eq, desc } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  sessionStore: session.Store;
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Book operations
  getBooks(category?: string, search?: string): Promise<Book[]>;
  getBook(id: number): Promise<Book | undefined>;
  createBook(book: InsertBook): Promise<Book>;
  updateBook(id: number, updates: UpdateBookRequest): Promise<Book>;
  deleteBook(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
  }

  // === User ===
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

  // === Book ===
  async getBooks(category?: string, search?: string): Promise<Book[]> {
    let query = db.select().from(books).orderBy(desc(books.createdAt));
    
    // Simple in-memory filtering for simplicity if complex SQL needed, 
    // but here we can just chain if needed. 
    // For now, returning all and letting basic filtering happen or implementing simple where clauses
    // Drizzle query builder is flexible.
    
    // Note: For advanced search/filtering, we'd add .where() clauses here.
    // Keeping it simple for MVP.
    const allBooks = await query;
    
    return allBooks.filter(book => {
      if (category && book.category !== category) return false;
      if (search) {
        const searchLower = search.toLowerCase();
        return (
          book.titleAr.toLowerCase().includes(searchLower) ||
          book.titleEn.toLowerCase().includes(searchLower) ||
          book.author.toLowerCase().includes(searchLower)
        );
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
    const [book] = await db
      .update(books)
      .set(updates)
      .where(eq(books.id, id))
      .returning();
    return book;
  }

  async deleteBook(id: number): Promise<void> {
    await db.delete(books).where(eq(books.id, id));
  }
}

export const storage = new DatabaseStorage();
