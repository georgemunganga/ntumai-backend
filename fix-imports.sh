#!/bin/bash
cd /home/ubuntu/ntumai-backend/src/modules

echo "Fixing all import paths systematically..."

# Fix auth module imports (depth 3-4 from application/services)
find auth/application -name "*.ts" -exec sed -i "s|'../../communications/communications.service'|'../../../communications/communications.service'|g" {} \;

# Fix all modules: infrastructure and presentation subdirectories need ../../../shared
find deliveries/infrastructure deliveries/presentation -name "*.ts" -exec sed -i "s|'../../../shared/|'../../../../shared/|g" {} \;
find matching/infrastructure matching/presentation -name "*.ts" -exec sed -i "s|'../../../shared/|'../../../../shared/|g" {} \;
find shifts/infrastructure shifts/presentation -name "*.ts" -exec sed -i "s|'../../../shared/|'../../../../shared/|g" {} \;
find tracking/infrastructure tracking/presentation -name "*.ts" -exec sed -i "s|'../../../shared/|'../../../../shared/|g" {} \;

echo "Import paths fixed!"
