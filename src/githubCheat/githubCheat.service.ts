const axios = require('axios');

const GITHUB_API = "https://api.github.com";

async function fetchRepoContent(owner, repo, path = '') {
    const url = `${GITHUB_API}/repos/${owner}/${repo}/contents/${path}`;
    
    try {
        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        console.error('Error fetching repo content:', (error as Error).message);
        return null;
    }
}

async function getFileContent(fileUrl) {
    try {
        const response = await axios.get(fileUrl);
if (typeof response.data === 'string') {
    return response.data;
} else if (response.data && response.data.content) {
    return Buffer.from(response.data.content, 'base64').toString('utf-8');
} else {
    console.error('Unexpected response data:', response.data);
    return null;
}
    } catch (error) {
        console.error('Error fetching file content:', (error as Error).message);
        return null;
    }
}

export async function getAllCode(owner, repo) {
    let allCode = '';

    async function processContent(path = '') {
        const contents = await fetchRepoContent(owner, repo, path);
        if (!contents) return;

        for (const item of contents) {
            if (item.type === 'file') {
                // Check if the file is a code file (you can expand this list)
                if (['.js', '.py', '.java', '.cpp', '.ts', '.html', '.css'].some(ext => item.name.endsWith(ext))) {
                    const content = await getFileContent(item.download_url);
                    if (content) {
                        allCode += content + '\n';
                    }
                }
            } else if (item.type === 'dir') {
                // Recursively process subdirectories
                await processContent(item.path);
            }
        }
    }

    await processContent();
    return allCode;
}

