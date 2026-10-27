
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const fs = require('fs-extra');
const path = require('path');

const sourceDir = '/usr/src/NEON-Biorepository-React-Components/build';
const targetDir = '/mnt/c/xampp/htdocs/neon/neon-react/core-components';
const reactHeadPath = '/mnt/c/xampp/htdocs/neon/includes/react_head.php';
const footerPath = '/mnt/c/xampp/htdocs/neon/includes/footer.php';

const indexFilePath = path.join(sourceDir, 'index.html');

const START = '<!-- NEON REACT ASSETS START -->';
const END = '<!-- NEON REACT ASSETS END -->';

const phpAssetRoot = '<?php echo $CLIENT_ROOT; ?>/neon-react/core-components';

// Convert local React asset URLs to PHP-based URLs.
function rewriteAssetUrls(html) {
    return html.replace(
        /(\b(?:href|src)=["'])\/(?:neon-react\/)?core-components\//gi,
        (_, prefix) => prefix + phpAssetRoot + '/'
    );
}

// Remove async from generated scripts, excluding Google Analytics.
function removeAsync(html) {
    return html.replace(
        /<script\b[^>]*\bsrc=["'][^"']*\/_next\/static\/chunks\/[^"']+\.js["'][^>]*>/gi,
        tag => tag.replace(/\s+async\s*=\s*["']["']/gi, '')
    );
}

// Remove the second React JS chunk from the head causing react error #412
function removeSecondHeadChunk(head) {
    let count = 0;

    return head.replace(
        /<script\b[^>]*\bsrc=["'][^"']*\/_next\/static\/chunks\/[^"']+\.js["'][^>]*><\/script>/gi,
        tag => ++count === 2 ? '' : tag
    );
}

// Extract the generated HTML head.
function extractHead(indexHtml) {
    const head = indexHtml.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)?.[1];

    if (head === undefined) {
        throw new Error('Generated index.html is missing <head>.');
    }

    return head.trim();
}

// Get the script with id="_R_" from the generated body.
function getBodyChunk(indexHtml) {
    const body = indexHtml.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i)?.[1];

    if (!body) {
        throw new Error('Generated index.html is missing <body>.');
    }

    const scripts = body.match(/<script\b[^>]*>/gi) || [];

    const reactScript = scripts.find(tag =>
        /\bid=["']_R_["']/i.test(tag)
    );

    if (!reactScript) {
        throw new Error('Could not find the React body script with id="_R_".');
    }

    const src = reactScript.match(/\bsrc=["']([^"']+)["']/i)?.[1];

    if (!src) {
        throw new Error('React body script is missing its src.');
    }

    return getChunkPath(src);
}

// Extract static/chunks/filename.js from an asset URL.
function getChunkPath(src) {
    const match = src.match(/static\/chunks\/[^"'?\s]+\.js/i);

    if (!match) {
        throw new Error(`Invalid React chunk URL: ${src}`);
    }

    return match[0];
}

// Find the last JS script before the Drupal CSS preload.
function getLastHeadChunk(head) {
    const drupalLink = /<link\b[^>]*rel=["']preload["'][^>]*href=["'][^"']*drupal-theme[^"']*["'][^>]*>/i;
    const match = drupalLink.exec(head);

    if (!match) {
        throw new Error('Could not find the Drupal CSS preload in <head>.');
    }

    const beforeDrupal = head.slice(0, match.index);
    const scripts = [...beforeDrupal.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi)];

    const chunkScripts = scripts
        .map(script => script[1])
        .filter(src => /\/_next\/static\/chunks\/[^"'?\s]+\.js/i.test(src));

    if (!chunkScripts.length) {
        throw new Error('Could not find a React JS chunk before Drupal CSS.');
    }

    return getChunkPath(chunkScripts[chunkScripts.length - 1]);
}

// Replace the managed React asset section.
function replaceManagedSection(php, content) {
    const start = php.indexOf(START);
    const end = php.indexOf(END);

    if (start === -1 || end === -1 || end <= start) {
        throw new Error('Missing NEON REACT ASSETS markers in react_head.php.');
    }

    return php.slice(0, start) +
        content +
        php.slice(end + END.length);
}

// Update the two Turbopack otherChunks references.
function updateTurbopackChunks(php, bodyChunk, headChunk) {
    const pattern = /otherChunks\s*:\s*\[[\s\S]*?\]/;

    if (!pattern.test(php)) {
        throw new Error('Could not find otherChunks in react_head.php.');
    }

    return php.replace(pattern, `otherChunks: [
      '${bodyChunk}', // script in body
      '${headChunk}' // last script before Drupal CSS
    ]`);
}

// Update the footer React script's src using its _R_ ID.
function updateFooter(footer, bodyChunk) {
    const src = `${phpAssetRoot}/_next/${bodyChunk}`;

    const pattern = /(<script\b[\s\S]*?\bid\s*=\s*["']_R_["'][\s\S]*?>)/gi;
    let found = 0;

    const updated = footer.replace(pattern, tag => {
        found++;

        return tag.replace(
            /(\bsrc\s*=\s*["'])[\s\S]*?(["'])/i,
            (_, opening, closing) => `${opening}${src}${closing}`
        ).replace(/\s+async\s*=\s*["'][^"']*["']/gi, '');
    });

    if (found !== 1) {
        throw new Error(`Expected one footer script with id="_R_", found ${found}.`);
    }

    return updated;
}

async function main() {
    console.log('\n========================================');
    console.log('       NEON REACT DEPLOYMENT');
    console.log('========================================');

    // Verify required files.
    for (const file of [indexFilePath, reactHeadPath, footerPath]) {
        if (!(await fs.pathExists(file))) {
            throw new Error(`Required file not found: ${file}`);
        }
    }

    const indexHtml = await fs.readFile(indexFilePath, 'utf8');
    const originalHead = await fs.readFile(reactHeadPath, 'utf8');
    const originalFooter = await fs.readFile(footerPath, 'utf8');

    // Extract generated assets and current chunk filenames.
    const headContent = removeSecondHeadChunk(extractHead(indexHtml));
    const bodyChunk = getBodyChunk(indexHtml);
    const headChunk = getLastHeadChunk(headContent);

    if (!headContent.includes('/_next/static/')) {
        throw new Error('No generated Next.js assets found in <head>.');
    }

    console.log(`Body chunk: ${bodyChunk}`);
    console.log(`Last head chunk: ${headChunk}`);

    // Prepare updated React assets.
    const updatedAt = new Date().toLocaleString();

    const generatedContent = [
        START,
        `<!-- React last updated: ${updatedAt} -->`,
        removeAsync(rewriteAssetUrls(headContent)),
        END
    ].join('\n');

    // Update React head assets and Turbopack configuration.
    let updatedHead = replaceManagedSection(
        originalHead,
        generatedContent
    );

    updatedHead = updateTurbopackChunks(
        updatedHead,
        bodyChunk,
        headChunk
    );

    // Update footer script.
    const updatedFooter = updateFooter(
        originalFooter,
        bodyChunk
    );

    // Back up PHP files before changing them.
    await fs.copy(reactHeadPath, `${reactHeadPath}.bak`, {
        overwrite: true
    });

    await fs.copy(footerPath, `${footerPath}.bak`, {
        overwrite: true
    });

    console.log('PHP backups created.');

    // Remove previous React build, preserving biorepo_lib.
    await fs.ensureDir(targetDir);

    for (const file of await fs.readdir(targetDir)) {
        if (file === 'biorepo_lib') continue;

        await fs.remove(path.join(targetDir, file));
    }

    // Copy the new build, excluding index.html.
    for (const file of await fs.readdir(sourceDir)) {
        if (file === 'index.html') continue;

        await fs.copy(
            path.join(sourceDir, file),
            path.join(targetDir, file),
            { overwrite: true }
        );

        console.log(`Copied: ${file}`);
    }

    // Write updated PHP files.
    await fs.writeFile(reactHeadPath, updatedHead, 'utf8');
    await fs.writeFile(footerPath, updatedFooter, 'utf8');

    console.log('React assets updated in react_head.php.');
    console.log('Turbopack chunks updated.');
    console.log('Footer React script updated.');
    console.log('Deployment complete.');
}

main().catch(error => {
    console.error('Deployment failed:', error);
    process.exit(1);
});
