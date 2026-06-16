#!/bin/bash

# This script generates the basic structure for all NestJS modules
# Run from hackaton-michelin-back directory: bash generate-modules.sh

cd "$(dirname "$0")"

echo "🚀 Generating NestJS module structure..."

# Modules to generate
modules=("auth" "cyclists" "activities" "tires" "recommendations" "clubs" "ambassadors" "admin" "profile-cards")

for module in "${modules[@]}"; do
  echo "Creating module: $module"

  # Create module directory
  mkdir -p "src/modules/$module"

  # Create DTOs directory
  mkdir -p "src/modules/$module/dto"

  echo "✅ Created $module structure"
done

echo ""
echo "✨ Module structure generated successfully!"
echo "Next steps:"
echo "1. Implement services and controllers for each module"
echo "2. Create DTOs for validation"
echo "3. Test endpoints"
