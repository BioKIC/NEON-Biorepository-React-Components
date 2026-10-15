import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const fs = require('fs-extra');
const path = require('path');

const sourceDir =
    '/usr/src/NEON-Biorepository-React-Components/build';

const targetDir =
    '/mnt/c/xampp/htdocs/neon/neon-react/core-components';

const indexFilePath = path.join(sourceDir, 'index.html');

const targetHtmlFilePath =
    '/mnt/c/xampp/htdocs/neon/includes/head.php';

const START = '<!-- NEON REACT ASSETS START -->';
const END = '<!-- NEON REACT ASSETS END -->';

const phpAssetRoot =
    '<?php echo $CLIENT_ROOT; ?>/neon-react/core-components';

function rewriteAssetUrls(html) {
    return html.replace(
        /(\b(?:href|src)=["'])\/(?:neon-react\/)?core-components\//gi,
        (_, prefix) => prefix + phpAssetRoot + '/'
    );
}

function extractAssets(indexHtml) {
    const head = indexHtml.match(
        /<head\b[^>]*>([\s\S]*?)<\/head>/i
    )?.[1];

    if (head === undefined) {
        throw new Error(
            'Generated index.html is missing <head>.'
        );
    }

    return head.trim();
}

function replaceManagedSection(headPhp, content) {
    const start = headPhp.indexOf(START);
    const end = headPhp.indexOf(END);

    if (start === -1 || end === -1 || end <= start) {
        throw new Error(
            'Missing NEON REACT ASSETS markers in head.php.'
        );
    }

    return (
        headPhp.slice(0, start) +
        content +
        headPhp.slice(end + END.length)
    );
}

async function main() {
    console.log('\n========================================');
    console.log('       NEON REACT DEPLOYMENT');
    console.log('========================================');

    if (!(await fs.pathExists(indexFilePath))) {
        throw new Error(
            `Build index.html not found: ${indexFilePath}`
        );
    }

    if (!(await fs.pathExists(targetHtmlFilePath))) {
        throw new Error(
            `PHP file not found: ${targetHtmlFilePath}`
        );
    }

    const indexHtml = await fs.readFile(
        indexFilePath,
        'utf8'
    );

    const originalHeadPhp = await fs.readFile(
        targetHtmlFilePath,
        'utf8'
    );

    const headContent = extractAssets(indexHtml);
    
    if (!headContent.includes('/_next/static/')) {
        throw new Error(
            'No generated Next.js assets found in <head>.'
        );
    }
    
    const updatedAt = new Date().toLocaleString();
    
    const generatedContent = [
        START,
        `<!-- React last updated: ${updatedAt} -->`,
        rewriteAssetUrls(headContent),
        END
    ].join('\n');

    const updatedHeadPhp = replaceManagedSection(
        originalHeadPhp,
        generatedContent
    );

    // Back up the original PHP file.
    await fs.copy(
        targetHtmlFilePath,
        `${targetHtmlFilePath}.bak`,
        { overwrite: true }
    );

    // Remove old deployed files, preserving biorepo_lib.
    await fs.ensureDir(targetDir);

    for (const file of await fs.readdir(targetDir)) {
        if (file === 'biorepo_lib') {
            continue;
        }

        await fs.remove(path.join(targetDir, file));
    }

    // Copy the new build, excluding index.html.
    for (const file of await fs.readdir(sourceDir)) {
        if (file === 'index.html') {
            continue;
        }

        await fs.copy(
            path.join(sourceDir, file),
            path.join(targetDir, file),
            { overwrite: true }
        );

        console.log(`Copied: ${file}`);
    }

    // Only the managed asset section is changed.
    // reactScript code outside it is untouched.
    await fs.writeFile(
        targetHtmlFilePath,
        updatedHeadPhp,
        'utf8'
    );

    console.log('Complete generated <head> copied.');
    console.log('Deployment complete.');
}

main().catch(error => {
    console.error('Deployment failed:', error);
    process.exit(1);
});