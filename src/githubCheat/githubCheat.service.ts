const axios = require('axios');
const GITHUB_API = "https://api.github.com";

async function fetchRepoContent(owner, repo, path = '') {
    const url = `${GITHUB_API}/repos/${owner}/${repo}/contents/${path}`;
    try {
        const response = await axios.get(url, {
            headers: {
                'Accept': 'application/vnd.github.v3+json',
                'Authorization': `token ${process.env.GITHUB_SECRET_TOKEN}`
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching repo content:', (error as Error).message);
        return null;
    }
}

async function getFileContent(fileUrl) {
    try {
        const response = await axios.get(fileUrl, {
            headers: {
                'Accept': 'application/vnd.github.v3.raw',
                'Authorization': `token ${process.env.GITHUB_SECRET_TOKEN}`
            }
        });
        return response.data;
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
        
        if (Array.isArray(contents)) {
            for (const item of contents) {
                if (item.type === 'file') {
                    // Check if the file is a code file (you can expand this list)
                    if (['.js', '.py', '.java', '.cpp', '.ts', '.html', '.css'].some(ext => item.name.endsWith(ext))) {
                        const content = await getFileContent(item.download_url);
                        if (content) {
                            allCode += content + '\n';
                            console.log('Fetched code from:', item.download_url);
                        }
                    }
                } else if (item.type === 'dir') {
                    // Recursively process subdirectories
                    await processContent(item.path);
                }
            }
        } else {
            console.error('Unexpected content structure:', contents);
        }
    }
    
    await processContent();
    return splitCodeIntoChunks(allCode);
}

async function splitCodeIntoChunks(allCode: string, chunkSize: number = 30000): Promise<string[]> {
    const chunks: string[] = [];
    let index = 0;

    while (index < allCode.length) {
        // Find the last newline character within the chunk size
        let endIndex = index + chunkSize;
        if (endIndex < allCode.length) {
            endIndex = allCode.lastIndexOf('\n', endIndex);
            if (endIndex <= index) {
                // If no newline found, force split at chunkSize
                endIndex = index + chunkSize;
            }
        } else {
            endIndex = allCode.length;
        }

        // Add the chunk to the array
        chunks.push(allCode.slice(index, endIndex));

        // Move to the next chunk
        index = endIndex;
    }

    return chunks;
}

export async function findCommonLinesBetweenChunks(chunks1, chunks2) {
    const file1Lines = new Set(chunks1.flatMap(chunk => chunk.split('\n')));
    const commonLines = new Set();

    for (const chunk of chunks2) {
        const lines = chunk.split('\n');
        for (const line of lines) {
            if (file1Lines.has(line)) {
                commonLines.add(line);
            }
        }
    }

    return Array.from(commonLines);
}




