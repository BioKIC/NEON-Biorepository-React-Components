
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const fs = require('fs-extra');
const path = require('path');

const sourceDir = '/usr/src/NEON-Biorepository-React-Components/build';
const targetDir = '/mnt/c/xampp/htdocs/neon/neon-react';
const indexFilePath = path.join(sourceDir, 'index.html');
const targetHtmlFilePath = '/mnt/c/xampp/htdocs/neon/includes/head.php';

const START = '<!-- NEON REACT ASSETS START -->';
const END = '<!-- NEON REACT ASSETS END -->';

function logSection(number, message) {
    console.log(`\n[${number}/5] ${message}`);
}

function extractAttribute(tag, attribute) {
    const match = tag.match(new RegExp(`${attribute}="([^"]+)"`, 'i'));
    return match ? match[1] : 'unknown';
}

async function main() {
    const startedAt = Date.now();
    const updatedAt = new Date().toLocaleString();

    let deletedCount = 0;
    let copiedCount = 0;

    console.log('\n========================================');
    console.log('       NEON REACT DEPLOYMENT');
    console.log('========================================');
    console.log(`Started:     ${updatedAt}`);
    console.log(`Source:      ${sourceDir}`);
    console.log(`Destination: ${targetDir}`);
    console.log(`PHP file:    ${targetHtmlFilePath}`);

    // --------------------------------------------------
    // 1. Validate build and deployment paths
    // --------------------------------------------------

    logSection(1, 'Validating build and deployment paths...');

    if (!(await fs.pathExists(indexFilePath))) {
        throw new Error(`Build index.html not found: ${indexFilePath}`);
    }

    console.log(`  OK: ${indexFilePath}`);

    if (!(await fs.pathExists(targetHtmlFilePath))) {
        throw new Error(`PHP file not found: ${targetHtmlFilePath}`);
    }

    console.log(`  OK: ${targetHtmlFilePath}`);

    const indexHtml = await fs.readFile(indexFilePath, 'utf8');
    let headPhp = await fs.readFile(targetHtmlFilePath, 'utf8');

    if (!headPhp.includes(START) || !headPhp.includes(END)) {
        throw new Error(
            `Missing deployment markers in head.php.\n` +
            `Add these where the React assets belong:\n` +
            `${START}\n${END}`
        );
    }

    // --------------------------------------------------
    // 2. Extract generated Next.js assets
    // --------------------------------------------------

    logSection(2, 'Extracting Next.js assets...');

    const headMatch = indexHtml.match(/<head>([\s\S]*?)<\/head>/i);

    if (!headMatch) {
        throw new Error('Cannot find <head> in generated index.html');
    }

    const generatedHead = headMatch[1];

    const cssTags = generatedHead.match(
        /<link\b(?=[^>]*rel="stylesheet")[^>]*>/gi
    ) || [];

    const scriptTags = generatedHead.match(
        /<script\b[^>]*src="[^"]+"[^>]*><\/script>/gi
    ) || [];

    const bodyMatch = indexHtml.match(
        /<body[^>]*>([\s\S]*?)<\/body>/i
    );

    const bodyHtml = bodyMatch ? bodyMatch[1] : '';

    const bootstrapScripts = bodyHtml.match(
        /<script\b[^>]*>[\s\S]*?<\/script>/gi
    ) || [];

    console.log(`  Stylesheets found:     ${cssTags.length}`);
    console.log(`  Head scripts found:    ${scriptTags.length}`);
    console.log(`  Body scripts found:    ${bootstrapScripts.length}`);

    console.log('\n  Stylesheets:');

    for (const tag of cssTags) {
        console.log(`    ${extractAttribute(tag, 'href')}`);
    }

    console.log('\n  Head JavaScript files:');

    for (const tag of scriptTags) {
        console.log(`    ${extractAttribute(tag, 'src')}`);
    }

    console.log('\n  Body scripts:');

    for (const tag of bootstrapScripts) {
        const src = extractAttribute(tag, 'src');

        if (src !== 'unknown') {
            console.log(`    ${src}`);
        } else {
            console.log('    Inline Next.js bootstrap script');
        }
    }

    if (cssTags.length === 0 && scriptTags.length === 0) {
        throw new Error('No generated CSS or JavaScript assets found.');
    }

    const assets = [
        START,
        `<!-- React last updated: ${updatedAt} -->`,
        ...cssTags,
        ...scriptTags,
        ...bootstrapScripts,
        END
    ].join('\n');

    const startIndex = headPhp.indexOf(START);
    const endIndex = headPhp.indexOf(END) + END.length;

    if (endIndex <= startIndex) {
        throw new Error('Deployment markers are in the wrong order.');
    }

    const updatedHeadPhp =
        headPhp.slice(0, startIndex) +
        assets +
        headPhp.slice(endIndex);

    // --------------------------------------------------
    // 3. Back up head.php
    // --------------------------------------------------

    logSection(3, 'Backing up head.php...');

    const backupPath = `${targetHtmlFilePath}.bak`;

    await fs.copy(targetHtmlFilePath, backupPath, {
        overwrite: true
    });

    console.log(`  Backup created: ${backupPath}`);

    // --------------------------------------------------
    // 4. Clean deployment directory
    // --------------------------------------------------

    logSection(4, 'Cleaning deployment directory...');

    await fs.ensureDir(targetDir);

    const existingFiles = await fs.readdir(targetDir);

    for (const file of existingFiles) {
        const targetPath = path.join(targetDir, file);

        if (file === 'biorepo_lib') {
            console.log(`  PRESERVED: ${file}`);
            continue;
        }

        await fs.remove(targetPath);
        console.log(`  DELETED:   ${file}`);
        deletedCount++;
    }

    console.log(`\n  Total deleted: ${deletedCount}`);

    // --------------------------------------------------
    // 5. Copy build files and update head.php
    // --------------------------------------------------

    logSection(5, 'Copying build files and updating PHP...');

    const buildFiles = await fs.readdir(sourceDir);

    for (const file of buildFiles) {
        if (file === 'index.html') {
            console.log(`  SKIPPED: ${file}`);
            continue;
        }

        const sourcePath = path.join(sourceDir, file);
        const targetPath = path.join(targetDir, file);

        await fs.copy(sourcePath, targetPath, {
            overwrite: true
        });

        const stats = await fs.stat(sourcePath);
        const type = stats.isDirectory() ? 'DIRECTORY' : 'FILE';

        console.log(`  COPIED [${type}]: ${file}`);
        copiedCount++;
    }

    console.log(`\n  Total copied: ${copiedCount}`);

    await fs.writeFile(
        targetHtmlFilePath,
        updatedHeadPhp,
        'utf8'
    );

    console.log(`\n  UPDATED: ${targetHtmlFilePath}`);
    console.log(`  React last updated: ${updatedAt}`);

    // --------------------------------------------------
    // Deployment summary
    // --------------------------------------------------

    const elapsedSeconds = (
        (Date.now() - startedAt) / 1000
    ).toFixed(2);

    console.log('\n========================================');
    console.log('         DEPLOYMENT SUMMARY');
    console.log('========================================');
    console.log(`Status:             SUCCESS`);
    console.log(`Last updated:       ${updatedAt}`);
    console.log(`Stylesheets:        ${cssTags.length}`);
    console.log(`Head scripts:       ${scriptTags.length}`);
    console.log(`Body scripts:       ${bootstrapScripts.length}`);
    console.log(`Files/dirs deleted: ${deletedCount}`);
    console.log(`Files/dirs copied:  ${copiedCount}`);
    console.log(`PHP updated:        YES`);
    console.log(`PHP backup:         ${backupPath}`);
    console.log(`Duration:           ${elapsedSeconds} seconds`);
    console.log('========================================\n');
}

main().catch((err) => {
    console.error('\n========================================');
    console.error('         DEPLOYMENT FAILED');
    console.error('========================================');
    console.error(err);
    console.error('========================================\n');
    process.exit(1);
});
