import { createRequire } from "module";
const require = createRequire(import.meta.url);

const fs = require('fs-extra');
const path = require('path');

const sourceDir = '/usr/src/NEON-Biorepository-React-Components/build';
const targetDir = '/mnt/c/xampp/htdocs/neon/neon-react';
const indexFilePath = '/usr/src/NEON-Biorepository-React-Components/build/index.html';
const targetHtmlFilePath = '/mnt/c/xampp/htdocs/neon/includes/head.php';

// Function to delete all files and folders in the target directory except for biorepo_lib
async function cleanTargetDir() {
    try {
        const files = await fs.readdir(targetDir);
        for (const file of files) {
            const targetPath = path.join(targetDir, file);
            if (file !== 'biorepo_lib') {
                await fs.remove(targetPath);
                console.log(`Deleted ${targetPath}`);
            }
        }
    } catch (err) {
        console.error('Error cleaning target directory:', err);
    }
}

// Function to copy files and directories excluding index.html
async function copyFiles() {
    try {
        // Ensure target directory exists
        await fs.ensureDir(targetDir);

        // Copy static folder except for index.html
        const files = await fs.readdir(sourceDir);
        for (const file of files) {
            const sourceFile = path.join(sourceDir, file);
            const targetFile = path.join(targetDir, file);
            if (file !== 'index.html') {
                await fs.copy(sourceFile, targetFile);
                console.log(`Copied ${file} to ${targetFile}`);
            }
        }
    } catch (err) {
        console.error('Error copying files:', err);
    }
}

// Function to modify index.html and insert content into another file
async function modifyHtml() {
    try {
        const indexHtml = await fs.readFile(indexFilePath, 'utf8');

        // Extract part of the code (e.g., between <div id="root"> and </div>)
        const regex = /<meta charset="utf-8"\/>([\s\S]*?)<\/head>/;
        const match = indexHtml.match(regex);
        if (match) {
            let extractedContent = match[1];

            // Replace content if needed (example: replace 'old-text' with 'new-text')
            let modifiedContent = extractedContent.replace(/\.\/neon-react\//g, '<?php echo $CLIENT_ROOT; ?>/neon-react/');

            // Extract the main JS file name from the extracted content
            const scriptRegex = /<script defer="defer" src="([^"]+)"><\/script>/;
            const scriptMatch = modifiedContent.match(scriptRegex);            
            const mainJsFile = scriptMatch[1];

            // Remove the specific <script defer="defer" src="..."></script> line
            modifiedContent = modifiedContent.replace(scriptRegex, '');
            
            // Get the current date and time
            const currentDateTime = new Date().toLocaleString();
            const updateInfo = `<!--React last updated: ${currentDateTime}-->\n`;
            const finalContent = updateInfo + modifiedContent;

            // Insert modified content into the target HTML file
            let targetHtml = await fs.readFile(targetHtmlFilePath, 'utf8');
            let updatedHtml = targetHtml.replace(/<!--React last updated[\s\S]*?.css" rel="stylesheet">/, finalContent);
            
            // Replace the line that contains reactScript.src with the new main JS file
            const reactScriptRegex = /reactScript\.src = '[^']+\/main\.[^']+\.js';/;
            const newReactScript = `reactScript.src = '${mainJsFile}';`;
            updatedHtml = updatedHtml.replace(reactScriptRegex, newReactScript);
            
            await fs.writeFile(targetHtmlFilePath, updatedHtml);

            console.log('HTML content modified and inserted successfully.');
        } else {
            console.error('Content to be extracted not found in index.html');
        }
    } catch (err) {
        console.error('Error modifying HTML:', err);
    }
}

// Run the functions
(async () => {
    await cleanTargetDir();
    await copyFiles();
    await modifyHtml();
})();
