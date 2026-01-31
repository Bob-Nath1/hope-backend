CREATE TABLE "CommunityMessage" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"plan_id" integer,
	"content" text NOT NULL,
	"createdAt" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "Message" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer,
	"content" text,
	"createdAt" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "plan" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(50),
	"name" varchar(100),
	CONSTRAINT "plan_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "User" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password" varchar NOT NULL,
	"phone" varchar NOT NULL,
	"address" text,
	"dateOfBirth" timestamp,
	"occupation" varchar(255),
	"securityQuestion" text,
	"securityAnswer" text,
	"profilePicture" varchar,
	"idDocument" varchar,
	"bankName" varchar(255),
	"accountName" varchar(255),
	"accountNumber" varchar(50),
	"role" varchar(50) DEFAULT 'user',
	"status" varchar(50) DEFAULT 'active',
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "User_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "user_plan" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"plan_id" integer
);
--> statement-breakpoint
CREATE TABLE "Withdrawal" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer,
	"amount" double precision,
	"status" varchar DEFAULT 'pending',
	"bankName" varchar,
	"accountName" varchar,
	"accountNumber" varchar,
	"createdAt" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "Contribution" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"amount" double precision NOT NULL,
	"status" varchar DEFAULT 'pending' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Investment" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer,
	"projectName" varchar,
	"amount" integer,
	"returns" integer,
	"startDate" timestamp,
	"status" varchar DEFAULT 'pending'
);
--> statement-breakpoint
CREATE TABLE "Loan" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer,
	"amount" double precision,
	"purpose" text,
	"duration" integer,
	"status" varchar DEFAULT 'pending',
	"date" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "notification" (
	"id" serial PRIMARY KEY NOT NULL,
	"userid" integer NOT NULL,
	"title" varchar(100) NOT NULL,
	"message" text NOT NULL,
	"isread" boolean DEFAULT false,
	"createdat" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "Report" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer,
	"title" varchar,
	"content" text,
	"reply" text,
	"status" varchar DEFAULT 'pending',
	"createdat" timestamp DEFAULT now(),
	"date" timestamp
);
--> statement-breakpoint
CREATE TABLE "support" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer,
	"message" text,
	"reply" text,
	"status" varchar DEFAULT 'pending',
	"createdAt" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "CommunityMessage" ADD CONSTRAINT "CommunityMessage_user_id_User_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "CommunityMessage" ADD CONSTRAINT "CommunityMessage_plan_id_plan_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plan"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Message" ADD CONSTRAINT "Message_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_plan" ADD CONSTRAINT "user_plan_user_id_User_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_plan" ADD CONSTRAINT "user_plan_plan_id_plan_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plan"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Withdrawal" ADD CONSTRAINT "Withdrawal_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Contribution" ADD CONSTRAINT "Contribution_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Investment" ADD CONSTRAINT "Investment_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Loan" ADD CONSTRAINT "Loan_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification" ADD CONSTRAINT "notification_userid_User_id_fk" FOREIGN KEY ("userid") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Report" ADD CONSTRAINT "Report_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support" ADD CONSTRAINT "support_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;