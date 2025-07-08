/**
 * Git Connector
 * Handles saving data to a Git repository
 */

class GitConnector {
    /**
     * Initialize the Git connector
     * @param {Object} config - Configuration object
     * @param {string} config.repo - GitHub repository in format 'username/repo'
     * @param {string} config.branch - Branch to commit to (default: 'main')
     * @param {string} config.token - GitHub personal access token
     * @param {string} config.username - GitHub username
     * @param {string} config.email - GitHub email
     */
    constructor(config = {}) {
        this.repo = config.repo || '';
        this.branch = config.branch || 'main';
        this.token = config.token || '';
        this.username = config.username || 'kanva-admin';
        this.email = config.email || 'admin@kanva.com';
        this.baseUrl = 'https://api.github.com';
    }

    /**
     * Save data to a file in the repository
     * @param {string} path - Path to the file in the repository
     * @param {Object} data - Data to save
     * @param {string} message - Commit message
     * @returns {Promise<Object>} - API response
     */
    async saveFile(path, data, message = 'Update configuration') {
        try {
            const url = `${this.baseUrl}/repos/${this.repo}/contents/${path}`;
            const content = JSON.stringify(data, null, 2);
            const contentEncoded = btoa(unescape(encodeURIComponent(content)));
            
            // Get the current SHA of the file if it exists
            let sha = '';
            try {
                const response = await fetch(url, {
                    headers: {
                        'Authorization': `token ${this.token}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                });
                
                if (response.ok) {
                    const fileData = await response.json();
                    sha = fileData.sha;
                }
            } catch (error) {
                console.warn('File does not exist or cannot be accessed, will create new file');
            }

            // Create or update the file
            const response = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${this.token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: message,
                    content: contentEncoded,
                    sha: sha || undefined,
                    branch: this.branch,
                    committer: {
                        name: this.username,
                        email: this.email
                    }
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to save file to GitHub');
            }

            return await response.json();
        } catch (error) {
            console.error('Error saving file to GitHub:', error);
            throw error;
        }
    }

    /**
     * Save multiple files in a single commit
     * @param {Array<{path: string, data: Object}>} files - Array of files to save
     * @param {string} message - Commit message
     * @returns {Promise<Object>} - API response
     */
    async saveFiles(files, message = 'Update multiple files') {
        try {
            // Get the latest commit SHA
            const refUrl = `${this.baseUrl}/repos/${this.repo}/git/refs/heads/${this.branch}`;
            const refResponse = await fetch(refUrl, {
                headers: {
                    'Authorization': `token ${this.token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            if (!refResponse.ok) {
                throw new Error('Failed to get latest commit SHA');
            }

            const { object: { sha: latestCommitSha } } = await refResponse.json();

            // Get the tree SHA
            const commitUrl = `${this.baseUrl}/repos/${this.repo}/git/commits/${latestCommitSha}`;
            const commitResponse = await fetch(commitUrl, {
                headers: {
                    'Authorization': `token ${this.token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            if (!commitResponse.ok) {
                throw new Error('Failed to get tree SHA');
            }

            const { tree: { sha: baseTreeSha } } = await commitResponse.json();

            // Create blobs for each file
            const tree = await Promise.all(files.map(async ({ path, data }) => {
                const content = JSON.stringify(data, null, 2);
                const contentEncoded = btoa(unescape(encodeURIComponent(content)));
                
                const blobResponse = await fetch(
                    `${this.baseUrl}/repos/${this.repo}/git/blobs`,
                    {
                        method: 'POST',
                        headers: {
                            'Authorization': `token ${this.token}`,
                            'Accept': 'application/vnd.github.v3+json',
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            content: contentEncoded,
                            encoding: 'base64'
                        })
                    }
                );

                if (!blobResponse.ok) {
                    throw new Error(`Failed to create blob for ${path}`);
                }

                const { sha } = await blobResponse.json();
                return {
                    path,
                    mode: '100644',
                    type: 'blob',
                    sha
                };
            }));

            // Create a new tree
            const treeResponse = await fetch(
                `${this.baseUrl}/repos/${this.repo}/git/trees`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `token ${this.token}`,
                        'Accept': 'application/vnd.github.v3+json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        base_tree: baseTreeSha,
                        tree: tree
                    })
                }
            );

            if (!treeResponse.ok) {
                throw new Error('Failed to create tree');
            }

            const { sha: treeSha } = await treeResponse.json();

            // Create a new commit
            const newCommitResponse = await fetch(
                `${this.baseUrl}/repos/${this.repo}/git/commits`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `token ${this.token}`,
                        'Accept': 'application/vnd.github.v3+json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        message: message,
                        tree: treeSha,
                        parents: [latestCommitSha],
                        author: {
                            name: this.username,
                            email: this.email
                        },
                        committer: {
                            name: this.username,
                            email: this.email
                        }
                    })
                }
            );

            if (!newCommitResponse.ok) {
                throw new Error('Failed to create commit');
            }

            const { sha: newCommitSha } = await newCommitResponse.json();

            // Update the reference
            const updateRefResponse = await fetch(
                `${this.baseUrl}/repos/${this.repo}/git/refs/heads/${this.branch}`,
                {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `token ${this.token}`,
                        'Accept': 'application/vnd.github.v3+json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        sha: newCommitSha,
                        force: false
                    })
                }
            );

            if (!updateRefResponse.ok) {
                throw new Error('Failed to update reference');
            }

            return await updateRefResponse.json();
        } catch (error) {
            console.error('Error saving files to GitHub:', error);
            throw error;
        }
    }
}

// Make available globally
if (typeof window !== 'undefined') {
    window.GitConnector = GitConnector;
}
