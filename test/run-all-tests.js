/**
 * Test Runner Script
 * 
 * This script runs all the e2e tests in sequence and reports results
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const testFolders = [
  'auth',
  'users',
  'marketplace',
  'drivers',
  'errands',
  'integration'
];

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m'
};

console.log(`${colors.bright}${colors.blue}=== NTU MAI Backend API Test Runner ===${colors.reset}\n`);

// Ensure test directories exist
testFolders.forEach(folder => {
  const folderPath = path.join(__dirname, folder);
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
    console.log(`${colors.yellow}Created missing test directory: ${folder}${colors.reset}`);
  }
});

// Run tests
const results = [];
let allPassed = true;

testFolders.forEach(folder => {
  const testFiles = fs.readdirSync(path.join(__dirname, folder))
    .filter(file => file.endsWith('.e2e-spec.ts'));
  
  if (testFiles.length === 0) {
    console.log(`${colors.yellow}No test files found in ${folder}${colors.reset}`);
    return;
  }
  
  console.log(`${colors.bright}${colors.magenta}Running tests for ${folder} module...${colors.reset}`);
  
  testFiles.forEach(file => {
    const testPath = path.join(folder, file);
    console.log(`${colors.blue}Testing: ${testPath}${colors.reset}`);
    
    try {
      execSync(`npx jest --config ./test/jest-e2e.json ${testPath}`, { stdio: 'inherit' });
      results.push({ module: folder, file, passed: true });
      console.log(`${colors.green}✓ Passed: ${testPath}${colors.reset}\n`);
    } catch (error) {
      results.push({ module: folder, file, passed: false });
      console.error(`${colors.red}✗ Failed: ${testPath}${colors.reset}\n`);
      allPassed = false;
    }
  });
});

// Report summary
console.log(`${colors.bright}${colors.blue}=== Test Summary ===${colors.reset}`);

const passedTests = results.filter(r => r.passed).length;
const totalTests = results.length;
const passRate = Math.round((passedTests / totalTests) * 100);

console.log(`${colors.bright}Tests: ${totalTests}, Passed: ${passedTests}, Failed: ${totalTests - passedTests}, Pass Rate: ${passRate}%${colors.reset}`);

if (allPassed) {
  console.log(`${colors.green}${colors.bright}All tests passed successfully!${colors.reset}`);
} else {
  console.log(`${colors.red}${colors.bright}Some tests failed. Check the output above for details.${colors.reset}`);
  
  // List failed tests
  console.log(`${colors.red}Failed tests:${colors.reset}`);
  results.filter(r => !r.passed).forEach(result => {
    console.log(`${colors.red}- ${result.module}/${result.file}${colors.reset}`);
  });
}