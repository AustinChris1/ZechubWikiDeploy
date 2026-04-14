import { getFiles, transformUri } from "@/lib/helpers";
import { unstable_cache } from "next/cache";
import { Octokit } from "octokit";

const { GITHUB_TOKEN, OWNER, REPO, BRANCH } = process.env;

const owner = OWNER || "";
const repo = REPO || "";
const branch = BRANCH || "main";

// ⚠️ Safe Octokit init
const octokit = new Octokit({
  auth: GITHUB_TOKEN || undefined,
});

// Normalize string for fuzzy matching
function normalize(str: string): string {
  return str
    .replace(/\.md$/i, "")
    .toLowerCase()
    .replace(/[-_ ]+/g, "");
}

/**
 * SAFE GITHUB WRAPPER
 */
async function safeGithubCall<T>(
  fn: () => Promise<T>,
  fallback: T
): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    console.error("[GitHub API Error]:", err);
    return fallback;
  }
}

/**
 * EXTRACT FILE CONTENT SAFELY
 */
function extractContent(data: unknown): string | null {
  if (!data || Array.isArray(data)) return null;

  if (typeof data === "object" && "content" in data) {
    const content = (data as { content?: unknown }).content;

    if (typeof content === "string") {
      return Buffer.from(content, "base64").toString("utf-8");
    }
  }

  return null;
}

export const getFileContentCached = unstable_cache(
  async (path: string) => {
    if (!owner || !repo) {
      console.warn("Missing GitHub env vars");
      return null;
    }

    return safeGithubCall(async () => {
      // 1. Try direct fetch
      try {
        const res = await octokit.rest.repos.getContent({
          owner,
          repo,
          path,
          ref: branch,
        });

        const content = extractContent(res.data);
        if (content) return content;
      } catch {
        // ignore
      }

      // 2. Fallback fuzzy search
      const folderPath = path.split("/").slice(0, -1).join("/");
      const realFiles = await getRootCached(folderPath);

      if (!realFiles.length) return null;

      const slug = path.split("/").pop()?.replace(/\.md$/i, "") || "";
      const normalizedSlug = normalize(slug);

      for (const file of realFiles) {
        if (
          normalize(file) === normalizedSlug ||
          normalize(file).includes(normalizedSlug)
        ) {
          const res = await octokit.rest.repos.getContent({
            owner,
            repo,
            path: file,
            ref: branch,
          });

          const content = extractContent(res.data);
          if (content) return content;
        }
      }

      return null;
    }, null);
  },
  ["github-file-content-cache"],
  {
    revalidate: false,
    tags: ["github-content"],
  }
);

export const getRootCached = unstable_cache(
  async (path: string) => {
    if (!owner || !repo) return [];

    return safeGithubCall(async () => {
      const res = await octokit.rest.repos.getContent({
        owner,
        repo,
        path: transformUri(path).replace("/Site", "/site"),
        ref: branch,
      });

      const data = res.data;

      if (!data) return [];

      const elements = getFiles(data);

      return elements.filter((item: string) =>
        item.endsWith(".md")
      );
    }, []);
  },
  ["github-root-md-cache"],
  {
    revalidate: 30,
    tags: ["github-content"],
  }
);

export async function getSiteFolders(path: string) {
  if (!owner || !repo) return [];

  return safeGithubCall(async () => {
    const res = await octokit.rest.repos.getContent({
      owner,
      repo,
      path,
      ref: branch,
    });

    return getFiles(res.data);
  }, []);
}

export async function getRootFileName(path: string) {
  if (!owner || !repo) return [];

  return safeGithubCall(async () => {
    const res = await octokit.rest.repos.getContent({
      owner,
      repo,
      path: transformUri(path).replace("/Site", "/site"),
      ref: branch,
    });

    return getFiles(res.data)
      .filter((item: string) => item.endsWith(".md"))
      .map(
        (item: string) =>
          item.split("/").pop()?.replace(/\.md$/, "") || ""
      );
  }, []);
}