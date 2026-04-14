import { getFiles, transformUri } from "@/lib/helpers";
import { unstable_cache } from "next/cache";
import { Octokit } from "octokit";

const { GITHUB_TOKEN, OWNER, REPO, BRANCH } = process.env;

const owner = OWNER || "";
const repo = REPO || "";
const branch = BRANCH || "main";

// ⚠️ Allow Octokit to exist even without token
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
 * SAFE GITHUB CALL WRAPPER
 * Prevents build failure on Vercel
 */
async function safeGithubCall<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    console.error("[GitHub API Error]:", err);
    return fallback;
  }
}

export const getFileContentCached = unstable_cache(
  async (path: string) => {
    return safeGithubCall(async () => {
      // Try exact file first
      try {
        const res = await octokit.rest.repos.getContent({
          owner,
          repo,
          path,
          ref: branch,
        });

        // @ts-ignore
        if (res.data?.content) {
          return Buffer.from(res.data.content, "base64").toString("utf-8");
        }
      } catch (e) {
        // ignore and fallback
      }

      // Fallback: fuzzy search in folder
      const folderPath = path.split("/").slice(0, -1).join("/");
      const realFiles = await getRootCached(folderPath);

      if (realFiles && realFiles.length > 0) {
        const slugPart =
          path.split("/").pop()?.replace(/\.md$/i, "") || "";
        const normalizedSlug = normalize(slugPart);

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

            // @ts-ignore
            if (res.data?.content) {
              return Buffer.from(res.data.content, "base64").toString(
                "utf-8"
              );
            }
          }
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
    return safeGithubCall(async () => {
      const res = await octokit.rest.repos.getContent({
        owner,
        repo,
        path: transformUri(path).replace("/Site", "/site"),
        ref: branch,
      });

      const data = res.data;
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
  return safeGithubCall(async () => {
    const res = await octokit.rest.repos.getContent({
      owner,
      repo,
      path,
      ref: branch,
    });

    const data = res.data;
    return getFiles(data);
  }, []);
}

export async function getRootFileName(path: string) {
  return safeGithubCall(async () => {
    const res = await octokit.rest.repos.getContent({
      owner,
      repo,
      path: transformUri(path).replace("/Site", "/site"),
      ref: branch,
    });

    const data = res.data;
    return getFiles(data)
      .filter((item: string) => item.endsWith(".md"))
      .map((item: string) => item.split("/").pop()?.replace(/\.md$/, "") || "");
  }, []);
}