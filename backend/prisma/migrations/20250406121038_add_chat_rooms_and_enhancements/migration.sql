/*
  Warnings:

  - Added the required column `updated_at` to the `conversations` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "characters" ADD COLUMN "aiPrompt" TEXT;
ALTER TABLE "characters" ADD COLUMN "color" TEXT;
ALTER TABLE "characters" ADD COLUMN "dialogueStyle" TEXT;
ALTER TABLE "characters" ADD COLUMN "position" TEXT;
ALTER TABLE "characters" ADD COLUMN "primaryColor" TEXT;
ALTER TABLE "characters" ADD COLUMN "skinColor" TEXT;
ALTER TABLE "characters" ADD COLUMN "specialKeywords" TEXT;
ALTER TABLE "characters" ADD COLUMN "specialty" TEXT;

-- CreateTable
CREATE TABLE "chat_rooms" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "is_public" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "room_members" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "chat_room_id" INTEGER NOT NULL,
    "joined_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_read" DATETIME,
    "role" TEXT NOT NULL DEFAULT 'member',
    CONSTRAINT "room_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "room_members_chat_room_id_fkey" FOREIGN KEY ("chat_room_id") REFERENCES "chat_rooms" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "room_messages" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "chat_room_id" INTEGER NOT NULL,
    "sender_id" INTEGER NOT NULL,
    "sender_type" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" TEXT,
    CONSTRAINT "room_messages_chat_room_id_fkey" FOREIGN KEY ("chat_room_id") REFERENCES "chat_rooms" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "token_grants" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "character_id" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL DEFAULT 1,
    "reason" TEXT NOT NULL DEFAULT 'conversation',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "token_grants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "token_grants_character_id_fkey" FOREIGN KEY ("character_id") REFERENCES "characters" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_CharacterToChatRoom" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_CharacterToChatRoom_A_fkey" FOREIGN KEY ("A") REFERENCES "characters" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_CharacterToChatRoom_B_fkey" FOREIGN KEY ("B") REFERENCES "chat_rooms" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_messages" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "message_text" TEXT NOT NULL,
    "sender_type" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "conversation_id" INTEGER NOT NULL,
    "metadata" TEXT,
    "read_status" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_messages" ("conversation_id", "created_at", "id", "message_text", "sender_type") SELECT "conversation_id", "created_at", "id", "message_text", "sender_type" FROM "messages";
DROP TABLE "messages";
ALTER TABLE "new_messages" RENAME TO "messages";
CREATE TABLE "new_conversations" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL DEFAULT 'Untitled Conversation',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "character_id" INTEGER NOT NULL,
    "user_id" INTEGER,
    "is_archived" BOOLEAN NOT NULL DEFAULT false,
    "metadata" TEXT,
    CONSTRAINT "conversations_character_id_fkey" FOREIGN KEY ("character_id") REFERENCES "characters" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "conversations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_conversations" ("character_id", "created_at", "id", "title", "user_id") SELECT "character_id", "created_at", "id", "title", "user_id" FROM "conversations";
DROP TABLE "conversations";
ALTER TABLE "new_conversations" RENAME TO "conversations";
CREATE TABLE "new_users" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "username" TEXT NOT NULL,
    "email" TEXT,
    "avatar_url" TEXT,
    "bio" TEXT,
    "last_active" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "token_balance" INTEGER NOT NULL DEFAULT 0,
    "settings" TEXT
);
INSERT INTO "new_users" ("created_at", "email", "id", "username") SELECT "created_at", "email", "id", "username" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;

-- CreateIndex
CREATE UNIQUE INDEX "room_members_user_id_chat_room_id_key" ON "room_members"("user_id", "chat_room_id");

-- CreateIndex
CREATE UNIQUE INDEX "_CharacterToChatRoom_AB_unique" ON "_CharacterToChatRoom"("A", "B");

-- CreateIndex
CREATE INDEX "_CharacterToChatRoom_B_index" ON "_CharacterToChatRoom"("B");
