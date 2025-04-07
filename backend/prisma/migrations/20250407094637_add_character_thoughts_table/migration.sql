-- CreateTable
CREATE TABLE "character_thoughts" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "character_id" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "position" TEXT,
    "metadata" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "character_thoughts_character_id_fkey" FOREIGN KEY ("character_id") REFERENCES "characters" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
