const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const apiDir = path.join(__dirname, '../src/app/api');
const apiDisabledDir = path.join(__dirname, '../src/app/_api-disabled');

try {
  // 1. Temporarily rename API directory
  if (fs.existsSync(apiDir)) {
    console.log('Renaming src/app/api to src/app/_api-disabled...');
    fs.renameSync(apiDir, apiDisabledDir);
  }

  // 2. Run Next.js build with cross-env
  console.log('Running mobile export build...');
  execSync('npx cross-env BUILD_TARGET=mobile next build', { stdio: 'inherit' });

} catch (error) {
  console.error('Build failed:', error.message);
  process.exitCode = 1;
} finally {
  // 3. Restore API directory
  if (fs.existsSync(apiDisabledDir)) {
    console.log('Restoring src/app/api...');
    fs.renameSync(apiDisabledDir, apiDir);
  }
}
