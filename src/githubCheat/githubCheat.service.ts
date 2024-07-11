const axios = require('axios');
const GITHUB_API = "https://api.github.com";

/**
 * Fetches the content of a GitHub repository.
 *
 * @param owner - The username of the owner of the repository.
 * @param repo - The name of the repository.
 * @param path - The path within the repository to fetch content from. Defaults to the root of the repository.
 * @returns A promise that resolves to an array of objects, where each object represents a file or directory in the repository.
 *
 * This function uses the GitHub API to fetch the content of the specified repository.
 * The 'Accept' header is set to 'application/vnd.github.v3+json' to get the JSON response.
 * The 'Authorization' header is set with a GitHub token to authenticate the request.
 * If the request is successful, the function returns the data from the response.
 * If an error occurs, the function logs the error message and returns an empty array.
 */
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

/**
 * Fetches the content of a file from a given URL.
 *
 * @param fileUrl - The URL of the file to fetch.
 * @returns A promise that resolves to a string containing the content of the file, or null if an error occurs.
 *
 * This function uses the axios library to send a GET request to the `fileUrl`.
 * The 'Accept' header is set to 'application/vnd.github.v3.raw' to get the raw content of the file.
 * The 'Authorization' header is set with a GitHub token to authenticate the request.
 * If the request is successful, the function returns the data from the response.
 * If an error occurs, the function logs the error message and returns null.
 */
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

/**
 * Fetches all the code from a GitHub repository and splits it into chunks.
 *
 * @param owner - The username of the owner of the repository.
 * @param repo - The name of the repository.
 * @returns A promise that resolves to an array of strings, where each string is a chunk of the code from the repository.
 *
 * This function fetches all the code files from the specified GitHub repository, concatenates them into a single string,
 * and then splits this string into chunks of a specified size (default is 30000 characters).
 * The function fetches code files with the following extensions: .js, .py, .java, .cpp, .ts, .html, .css.
 * The function processes the repository's content recursively, so it also fetches code from subdirectories.
 */
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

/**
 * Splits a string of code into chunks of a specified size.
 *
 * @param allCode - The string of code to be split into chunks.
 * @param chunkSize - The maximum size of each chunk. Defaults to 30000 characters.
 * @returns A promise that resolves to an array of strings, where each string is a chunk of the original code.
 *
 * This function splits the input string `allCode` into chunks of size `chunkSize`. 
 * The splitting is done at the last newline character within the chunk size, 
 * to avoid splitting a line of code across two chunks. 
 * If no newline character is found within the chunk size, the function forces a split at `chunkSize`.
 */
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

/**
 * Finds the common lines between two sets of code chunks.
 *
 * @param chunks1 - An array of strings, where each string is a chunk of code from the first set.
 * @param chunks2 - An array of strings, where each string is a chunk of code from the second set.
 * @returns A promise that resolves to an array of strings, where each string is a line of code that is common to both sets of chunks.
 *
 * This function compares the lines of code in `chunks1` and `chunks2` and finds the lines that are common to both sets.
 * Each chunk is split into lines by splitting the string at newline characters.
 * The function uses a Set to efficiently check if a line from `chunks2` is also in `chunks1`.
 */
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




