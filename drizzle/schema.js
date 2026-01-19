// backend/drizzle/schema.js

import { 
  pgTable, 
  serial, 
  varchar, 
  text, 
  integer, 
  boolean, 
  timestamp, 
  doublePrecision 
} from "drizzle-orm/pg-core";


export const User = pgTable("User", {
  id: serial("id").primaryKey(),

  // Core identity
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  password: varchar("password").notNull(),
  phone: varchar("phone").notNull(),

  // Personal info
  address: text("address"),
  dateOfBirth: timestamp("dateOfBirth"),
  occupation: varchar("occupation", { length: 255 }),

  // Security
  securityQuestion: text("securityQuestion"),
  securityAnswer: text("securityAnswer"),

  // Files (store file path / filename, NOT the file itself)
  profilePicture: varchar("profilePicture"),
  idDocument: varchar("idDocument"),

  // Bank details ✅ (THIS was missing)
  bankName: varchar("bankName", { length: 255 }),
  accountName: varchar("accountName", { length: 255 }),
  accountNumber: varchar("accountNumber", { length: 50 }),

  // Access control
  role: varchar("role", { length: 50 }).default("user"),
  status: varchar("status", { length: 50 }).default("active"),

  // Timestamps
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt")
  .defaultNow()
  .$onUpdate(() => new Date())
  .notNull(),

});


export const loan = pgTable("Loan", {
  id: serial("id").primaryKey(),
  userId: integer("userId").references(() => User.id),
  amount: doublePrecision("amount"),
  purpose: text("purpose"),
  duration: integer("duration"), // duration in months
  status: varchar("status").default("pending"),
  date: timestamp("date").defaultNow(),
});

export const Plan = pgTable("plan", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 50 }).unique(), // daily, weekly, etc
  name: varchar("name", { length: 100 }),
});

export const CommunityMessage = pgTable("CommunityMessage", {
   id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => User.id),
  planId: integer("plan_id").references(() => Plan.id),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
});




export const UserPlan = pgTable("user_plan", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => User.id),
  planId: integer("plan_id").references(() => Plan.id),
});



export const investment = pgTable("Investment", {
  id: serial("id").primaryKey(),
  userId: integer("userId").references(() => User.id),
  projectName: varchar("projectName"),
  amount: integer("amount"),
  returns: integer("returns"),
  startDate: timestamp("startDate"),
  status: varchar("status").default("pending"),
});

export const contribution = pgTable("Contribution", {
  id: serial("id").primaryKey(),
  userId: integer("userId").references(() => User.id) .notNull(),
  amount: doublePrecision("amount").notNull(),
  status: varchar("status").default("pending") .notNull(),
  createdAt: timestamp("createdAt").defaultNow() .notNull(),
   updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull(),
});

export const Withdrawal = pgTable("Withdrawal", {
  id: serial("id").primaryKey(),
  userId: integer("userId").references(() => 
    User.id),
  amount: doublePrecision("amount"),
  status: varchar("status").default("pending"),
  bankName: varchar("bankName"),
  accountName: varchar("accountName"),
  accountNumber: varchar("accountNumber"),
  createdAt: timestamp("createdAt").defaultNow(),
});

export const Message = pgTable("Message", {
  id: serial("id").primaryKey(),
  userId: integer("userId").references(() => User.id),
  content: text("content"),
  createdAt: timestamp("createdAt").defaultNow(),
});

export const report = pgTable("Report", {
  id: serial("id").primaryKey(),
  userId: integer("userId").references(() => User.id),
  title: varchar("title"),
  content: text("content"),
  reply: text("reply"), // ✅ add
  status: varchar("status").default("pending"),
  createdat: timestamp("createdat").defaultNow(),
  date: timestamp("date"), // ✅ add
});


export const support = pgTable("support", {
  id: serial("id").primaryKey(),
  userId: integer("userId").references(() => User.id),
  message: text("message"),
  reply: text("reply"),
  status: varchar("status").default("pending"),
  createdAt: timestamp("createdAt").defaultNow(),
});

export const notification = pgTable("notification", {
  id: serial("id").primaryKey(),
  userid: integer("userid").notNull().references(() => User.id),
  title: varchar("title", { length: 100 }).notNull(),
  message: text("message").notNull(),
  isread: boolean("isread").default(false),
  createdat: timestamp("createdat").defaultNow(),
});
