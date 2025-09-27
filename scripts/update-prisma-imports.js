/**
 * Script to update all PrismaService import paths to use the standardized path alias
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Define the correct import path
const CORRECT_IMPORT = "import { PrismaService } from '@common/prisma/prisma.service';";

// Define patterns to search for
const importPatterns = [
  /import\s+\{\s*PrismaService\s*\}\s+from\s+['"](.*?)['"];/g,
  /import\s+\{\s*PrismaService\s+as\s+\w+\s*\}\s+from\s+['"](.*?)['"];/g
];

// Paths to exclude (already using correct import)
const excludePaths = [
  'src/modules/auth/infrastructure/database/prisma.service.ts',
  'src/modules/common/prisma/prisma.module.ts'
];

// Function to update imports in a file
function updateImportsInFile(filePath) {
  try {
    // Read the file content
    const content = fs.readFileSync(filePath, 'utf8');
    let updatedContent = content;
    let hasChanges = false;

    // Skip files that should be excluded
    if (excludePaths.some(excludePath => filePath.includes(excludePath))) {
      console.log(`Skipping excluded file: ${filePath}`);
      return false;
    }

    // Check for PrismaService imports
    for (const pattern of importPatterns) {
      if (pattern.test(content)) {
        // Replace the import with the correct one
        updatedContent = updatedContent.replace(pattern, () => {
          return CORRECT_IMPORT;
        });
        hasChanges = true;
      }
    }

    // Write the updated content back to the file if changes were made
    if (hasChanges) {
      fs.writeFileSync(filePath, updatedContent, 'utf8');
      console.log(`Updated imports in: ${filePath}`);
      return true;
    }

    return false;
  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error);
    return false;
  }
}

// Function to recursively process files in a directory
function processDirectory(directory) {
  let updatedFiles = 0;

  const files = fs.readdirSync(directory, { withFileTypes: true });

  for (const file of files) {
    const fullPath = path.join(directory, file.name);

    if (file.isDirectory()) {
      // Skip node_modules and dist directories
      if (file.name !== 'node_modules' && file.name !== 'dist') {
        updatedFiles += processDirectory(fullPath);
      }
    } else if (file.name.endsWith('.ts')) {
      // Process TypeScript files
      if (updateImportsInFile(fullPath)) {
        updatedFiles++;
      }
    }
  }

  return updatedFiles;
}

// Main function
function main() {
  console.log('Starting to update PrismaService import paths...');
  
  const srcDir = path.join(__dirname, '..', 'src');
  const updatedFiles = processDirectory(srcDir);
  
  console.log(`\nCompleted! Updated ${updatedFiles} files.`);
}

// Run the script
main();