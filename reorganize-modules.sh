#!/bin/bash

# Script to reorganize NestJS modules into /src/modules/ following DDD structure

cd /home/ubuntu/ntumai-backend/src

echo "Starting module reorganization..."

# Move deliveries module
if [ -d "deliveries" ]; then
    echo "Moving deliveries to modules/deliveries..."
    mv deliveries modules/
fi

# Move marketplace module
if [ -d "marketplace" ]; then
    echo "Moving marketplace to modules/marketplace..."
    mv marketplace modules/
fi

# Move matching module
if [ -d "matching" ]; then
    echo "Moving matching to modules/matching..."
    mv matching modules/
fi

# Move shifts module
if [ -d "shifts" ]; then
    echo "Moving shifts to modules/shifts..."
    mv shifts modules/
fi

# Move tracking module
if [ -d "tracking" ]; then
    echo "Moving tracking to modules/tracking..."
    mv tracking modules/
fi

# Rename communication to communications (plural for consistency)
if [ -d "modules/communication" ]; then
    echo "Renaming communication to communications..."
    mv modules/communication modules/communications
fi

echo "Module reorganization complete!"
echo ""
echo "Current modules structure:"
ls -la modules/
