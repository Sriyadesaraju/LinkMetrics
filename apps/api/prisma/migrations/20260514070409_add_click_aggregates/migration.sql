-- CreateTable
CREATE TABLE "ClickAggregateDaily" (
    "id" TEXT NOT NULL,
    "linkId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "country" TEXT,
    "deviceType" TEXT,
    "browser" TEXT,
    "clicks" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ClickAggregateDaily_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ClickAggregateDaily_linkId_date_idx" ON "ClickAggregateDaily"("linkId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "ClickAggregateDaily_linkId_date_country_deviceType_browser_key" ON "ClickAggregateDaily"("linkId", "date", "country", "deviceType", "browser");

-- AddForeignKey
ALTER TABLE "ClickAggregateDaily" ADD CONSTRAINT "ClickAggregateDaily_linkId_fkey" FOREIGN KEY ("linkId") REFERENCES "Link"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
