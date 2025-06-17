const fs = require('fs-extra');
const path = require('path');
const postcss = require('postcss');
const cssnano = require('cssnano');
const tailwindcss = require('@tailwindcss/postcss');
const UglifyJS = require('uglify-js');

// Paths
const publicDir = path.join(__dirname, 'public');
const srcDir = path.join(__dirname, 'src');
const buildDir = path.join(__dirname, 'build');

// Check if in production mode
const isProduction = process.env.NODE_ENV === 'production';

// Step 1: Copy the 'public' folder to 'build'
async function copyPublicFolder() {
  try {
    await fs.copy(publicDir, buildDir);
    console.log('Public folder copied to build.');
  } catch (err) {
    console.error('Error copying public folder:', err);
  }
}

// Step 2: Copy all HTML files from 'src' to 'build' recursively
async function copyHtmlFiles() {
    try {
        const getAllHtmlFiles = async (dir) => {
            const files = await fs.readdir(dir);
            const htmlFiles = [];
            
            for (const file of files) {
                const fullPath = path.join(dir, file);
                const stat = await fs.stat(fullPath);
                
                if (stat.isDirectory()) {
                    htmlFiles.push(...(await getAllHtmlFiles(fullPath)));
                } else if (file.endsWith('.html')) {
                    htmlFiles.push(fullPath);
                }
            }
            
            return htmlFiles;
        };

        const htmlFiles = await getAllHtmlFiles(srcDir);
        
        for (const htmlFile of htmlFiles) {
            const relativePath = path.relative(srcDir, htmlFile);
            const destPath = path.join(buildDir, relativePath);
            await fs.ensureDir(path.dirname(destPath));
            await fs.copy(htmlFile, destPath);
            console.log(`HTML file copied to build: ${relativePath}`);
        }

        console.log('All HTML files copied to build.');
    } catch (err) {
        console.error('Error copying HTML files:', err);
    }
}

// Step 3: Process CSS files with PostCSS
async function processCssFiles() {
    try {
        const getAllCssFiles = async (dir) => {
            const files = await fs.readdir(dir);
            const cssFiles = [];
            
            for (const file of files) {
                const fullPath = path.join(dir, file);
                const stat = await fs.stat(fullPath);
                
                if (stat.isDirectory()) {
                    cssFiles.push(...(await getAllCssFiles(fullPath)));
                } else if (file.endsWith('.css')) {
                    cssFiles.push(fullPath);
                }
            }
            
            return cssFiles;
        };

        const cssFiles = await getAllCssFiles(srcDir);
        
        for (const cssFile of cssFiles) {
            const relativePath = path.relative(srcDir, cssFile);
            const destPath = path.join(buildDir, relativePath);
            const cssContent = await fs.readFile(cssFile, 'utf8');
            const result = await postcss([tailwindcss]).process(cssContent, { from: cssFile, to: destPath });
            await fs.ensureDir(path.dirname(destPath));
            await fs.writeFile(destPath, result.css);
            console.log(`CSS file processed and copied to build: ${relativePath}`);
        }

        console.log('All CSS files processed and copied to build.');
    } catch (err) {
        console.error('Error processing CSS files:', err);
    }
}

// Step 4: Process JavaScript files (minify in production, copy in development)
async function minifyJsFiles() {
    try {
        const getAllJsFiles = async (dir) => {
            const files = await fs.readdir(dir);
            const jsFiles = [];
            
            for (const file of files) {
                const fullPath = path.join(dir, file);
                const stat = await fs.stat(fullPath);
                
                if (stat.isDirectory()) {
                    jsFiles.push(...(await getAllJsFiles(fullPath)));
                } else if (file.endsWith('.js')) {
                    jsFiles.push(fullPath);
                }
            }
            
            return jsFiles;
        };

        const jsFiles = await getAllJsFiles(srcDir);
        
        for (const jsFile of jsFiles) {
            const relativePath = path.relative(srcDir, jsFile);
            const destPath = path.join(buildDir, relativePath);
            const jsContent = await fs.readFile(jsFile, 'utf8');

            await fs.ensureDir(path.dirname(destPath));

            if (isProduction) {
                const result = UglifyJS.minify(jsContent);
                if (result.error) throw result.error;
                await fs.writeFile(destPath, result.code);
                console.log(`JS file minified and copied to build: ${relativePath}`);
            } else {
                await fs.copy(jsFile, destPath);
                console.log(`JS file copied to build: ${relativePath}`);
            }
        }

        console.log('All JS files processed and copied to build.');
    } catch (err) {
        console.error('Error processing JS files:', err);
    }
}

// Run all tasks
async function build() {
  try {
    // console.log('Tailwind plugin:', require('@tailwindcss/postcss') || require('tailwindcss'));
    await fs.emptyDir(buildDir); // Clean the build directory
    console.log('Build directory cleaned.');
    await copyPublicFolder();
    await copyHtmlFiles();
    await processCssFiles();
    await minifyJsFiles();
    console.log('Build process completed.');
  } catch (err) {
    console.error('Build process failed:', err);
  }
}

async function processFile(filePath) {
    const relativePath = path.relative(srcDir, filePath);
    const destPath = path.join(buildDir, relativePath);

    try {
        if (filePath.endsWith('.html')) {
            await fs.ensureDir(path.dirname(destPath));
            await fs.copy(filePath, destPath);
            console.log(`HTML file processed: ${relativePath}`);
        } else if (filePath.endsWith('.css')) {
            const cssContent = await fs.readFile(filePath, 'utf8');
            const result = await postcss([tailwindcss]).process(cssContent, { from: filePath, to: destPath });
            await fs.ensureDir(path.dirname(destPath));
            await fs.writeFile(destPath, result.css);
            console.log(`CSS file processed: ${relativePath}`);
        } else if (filePath.endsWith('.js')) {
            const jsContent = await fs.readFile(filePath, 'utf8');
            await fs.ensureDir(path.dirname(destPath));
            if (isProduction) {
                const result = UglifyJS.minify(jsContent);
                if (result.error) throw result.error;
                await fs.writeFile(destPath, result.code);
                console.log(`JS file minified: ${relativePath}`);
            } else {
                await fs.copy(filePath, destPath);
                console.log(`JS file copied: ${relativePath}`);
            }
        } else {
            console.log(`Unsupported file type: ${relativePath}`);
        }
    } catch (err) {
        console.error(`Error processing file ${relativePath}:`, err);
    }
}

// Vérifiez si un fichier spécifique est passé en argument
const changedFilePath = process.argv[2];

if (changedFilePath) {
    processFile(changedFilePath).then(() => {
        console.log('File processing completed.');
    }).catch(err => {
        console.error('Error processing file:', err);
    });
} else {
    // Si aucun fichier spécifique n'est passé, exécutez le build complet
    build();
}