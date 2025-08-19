import fs from 'fs';
import path from 'path';

/*
 * Vite plugin to automatically update Service Worker with built asset names
 */
export function serviceWorkerPlugin() {
  return {
    name: 'service-worker-plugin',
    
    generateBundle(options, bundle) {
      // Find the main CSS and JS files from the bundle
      const builtAssets = [];
      
      // Look through all generated files to find the main entry points
      Object.keys(bundle).forEach(fileName => {
        const file = bundle[fileName];
        
        // Add main JS and CSS files to our asset list
        if (file.isEntry || fileName.endsWith('.css')) {
          builtAssets.push(`/${fileName}`);
        }
      });
      
      console.log('Found built assets for Service Worker:', builtAssets);
      
      // Store the assets list so we can use it in writeBundle
      this.builtAssets = builtAssets;
    },
    
    // Hook that runs after all files are written to disk
    writeBundle(options) {
      const outputDir = options.dir || 'dist';
      const serviceWorkerPath = path.join(outputDir, 'service-worker.js');
      
      try {
        // Read the Service Worker file that was copied during build
        let swContent = fs.readFileSync(serviceWorkerPath, 'utf8');
        
        // Replace the CORE_ASSETS placeholder with actual built asset names
        const coreAssetsPattern = /const CORE_ASSETS = \[[\s\S]*?\];/;
        const newCoreAssets = `const CORE_ASSETS = [
  '/',
  '/index.html',
  '/favicon.svg'${this.builtAssets.length > 0 ? ',\n  ' + this.builtAssets.map(asset => `'${asset}'`).join(',\n  ') : ''}
];`;
        
        swContent = swContent.replace(coreAssetsPattern, newCoreAssets);
        
        // Write the updated Service Worker back to disk
        fs.writeFileSync(serviceWorkerPath, swContent);
        
        console.log(' Worker updated with built asset names');
        
      } catch (error) {
        console.warn('Could not update Service Worker:', error.message);
        // Don't fail the build if Service Worker update fails
      }
    }
  };
}