#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// List of all Radix UI components in package.json
const radixComponents = [
  'accordion', 'alert-dialog', 'aspect-ratio', 'avatar', 'checkbox',
  'collapsible', 'context-menu', 'dialog', 'dropdown-menu', 'hover-card',
  'label', 'menubar', 'navigation-menu', 'popover', 'progress',
  'radio-group', 'scroll-area', 'select', 'separator', 'slider',
  'slot', 'switch', 'tabs', 'toast', 'toggle', 'toggle-group', 'tooltip'
];

// Components actually used (from our analysis)
const usedComponents = [
  'alert', 'avatar', 'badge', 'button', 'card', 'dialog', 'form',
  'input', 'label', 'progress', 'select', 'separator', 'sheet',
  'skeleton', 'sonner', 'textarea', 'toast', 'toaster', 'toggle', 'tooltip'
];

// Map UI components to Radix packages
const uiToRadixMap = {
  'alert': null, // Custom component, not from Radix
  'avatar': 'avatar',
  'badge': null, // Custom component
  'button': null, // Custom component
  'card': null, // Custom component
  'dialog': 'dialog',
  'form': null, // react-hook-form
  'input': null, // Custom component
  'label': 'label',
  'progress': 'progress',
  'select': 'select',
  'separator': 'separator',
  'sheet': 'dialog', // Sheet uses dialog
  'skeleton': null, // Custom component
  'sonner': null, // External library
  'textarea': null, // Custom component
  'toast': 'toast',
  'toaster': 'toast',
  'toggle': 'toggle',
  'tooltip': 'tooltip'
};

console.log('🔍 Bundle Analysis Report');
console.log('=========================\n');

// Find unused Radix UI packages
const usedRadixPackages = new Set();
usedComponents.forEach(comp => {
  const radixPkg = uiToRadixMap[comp];
  if (radixPkg) {
    usedRadixPackages.add(radixPkg);
  }
});

const unusedRadixPackages = radixComponents.filter(pkg => !usedRadixPackages.has(pkg));

console.log('📦 Radix UI Component Analysis:');
console.log('--------------------------------');
console.log(`Total Radix packages installed: ${radixComponents.length}`);
console.log(`Radix packages in use: ${usedRadixPackages.size}`);
console.log(`Unused Radix packages: ${unusedRadixPackages.length}\n`);

console.log('❌ Unused Radix UI packages that can be removed:');
unusedRadixPackages.forEach(pkg => {
  console.log(`  - @radix-ui/react-${pkg}`);
});

console.log('\n✅ Radix UI packages in use:');
Array.from(usedRadixPackages).forEach(pkg => {
  console.log(`  - @radix-ui/react-${pkg}`);
});

// Analyze UI components directory
const uiComponentsDir = path.join(projectRoot, 'src', 'components', 'ui');
const uiFiles = fs.readdirSync(uiComponentsDir).filter(f => f.endsWith('.tsx') || f.endsWith('.ts'));

const unusedUIComponents = uiFiles
  .map(f => f.replace(/\.(tsx?|ts)$/, ''))
  .filter(f => !usedComponents.includes(f) && f !== 'use-toast'); // use-toast is a hook

console.log('\n📁 UI Component Files Analysis:');
console.log('--------------------------------');
console.log(`Total UI component files: ${uiFiles.length}`);
console.log(`UI components in use: ${usedComponents.length}`);
console.log(`Unused UI component files: ${unusedUIComponents.length}\n`);

if (unusedUIComponents.length > 0) {
  console.log('❌ Unused UI component files that can be removed:');
  unusedUIComponents.forEach(comp => {
    console.log(`  - src/components/ui/${comp}.tsx`);
  });
}

// Calculate potential savings
const avgComponentSize = 3; // KB (average)
const avgRadixPackageSize = 15; // KB (average)

const potentialSavings = {
  components: unusedUIComponents.length * avgComponentSize,
  radixPackages: unusedRadixPackages.length * avgRadixPackageSize,
};

console.log('\n💰 Potential Bundle Size Savings:');
console.log('----------------------------------');
console.log(`Removing unused UI components: ~${potentialSavings.components} KB`);
console.log(`Removing unused Radix packages: ~${potentialSavings.radixPackages} KB`);
console.log(`Total potential savings: ~${potentialSavings.components + potentialSavings.radixPackages} KB`);

// Generate removal commands
console.log('\n🔧 Cleanup Commands:');
console.log('--------------------');

if (unusedRadixPackages.length > 0) {
  const packages = unusedRadixPackages.map(pkg => `@radix-ui/react-${pkg}`).join(' ');
  console.log('Remove unused Radix packages:');
  console.log(`npm uninstall ${packages}\n`);
}

if (unusedUIComponents.length > 0) {
  console.log('Remove unused UI component files:');
  unusedUIComponents.forEach(comp => {
    console.log(`rm src/components/ui/${comp}.tsx`);
  });
}

console.log('\n📊 Additional Optimization Recommendations:');
console.log('-------------------------------------------');
console.log('1. Lazy load heavy components (charts, dialogs, etc.)');
console.log('2. Use dynamic imports for route components');
console.log('3. Implement React.memo for frequently re-rendered components');
console.log('4. Use useMemo and useCallback for expensive computations');
console.log('5. Consider replacing Google Fonts with system fonts or self-hosted fonts');
console.log('6. Enable gzip/brotli compression on the server');
console.log('7. Implement service worker for caching static assets');
console.log('8. Use web fonts with font-display: swap');
console.log('9. Remove lovable-tagger from production builds (already configured)');
console.log('10. Consider using Preact in production for smaller bundle size');