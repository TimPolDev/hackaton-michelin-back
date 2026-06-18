-- Add a product image gallery to tires (managed via admin). Non-destructive.
ALTER TABLE "tires" ADD COLUMN "images" TEXT[] DEFAULT ARRAY[]::TEXT[];
