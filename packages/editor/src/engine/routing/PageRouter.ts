/**
 * PageRouter - Client-side routing for multi-page projects
 * Maps URL paths to page IDs
 * @license BSD-3-Clause
 */

export class PageRouter {
  private routes: Map<string, string> = new Map(); // path -> pageId
  private reverseRoutes: Map<string, string> = new Map(); // pageId -> path

  /**
   * Register a route mapping a path to a page ID
   * @param path - URL path (e.g., '/about', '/contact')
   * @param pageId - Unique page identifier
   */
  register(path: string, pageId: string): void {
    const normalizedPath = this.normalizePath(path);

    // Remove old reverse mapping if path was already registered
    const oldPageId = this.routes.get(normalizedPath);
    if (oldPageId) {
      this.reverseRoutes.delete(oldPageId);
    }

    this.routes.set(normalizedPath, pageId);
    this.reverseRoutes.set(pageId, normalizedPath);
  }

  /**
   * Unregister a route by path
   * @param path - URL path to unregister
   */
  unregister(path: string): void {
    const normalizedPath = this.normalizePath(path);
    const pageId = this.routes.get(normalizedPath);
    if (pageId) {
      this.routes.delete(normalizedPath);
      this.reverseRoutes.delete(pageId);
    }
  }

  /**
   * Resolve a path to its corresponding page ID
   * @param path - URL path to resolve
   * @returns Page ID or null if not found
   */
  resolve(path: string): string | null {
    const normalizedPath = this.normalizePath(path);
    return this.routes.get(normalizedPath) ?? null;
  }

  /**
   * Get the path for a given page ID
   * @param pageId - Page identifier
   * @returns Path or null if not found
   */
  getPath(pageId: string): string | null {
    return this.reverseRoutes.get(pageId) ?? null;
  }

  /**
   * Get all registered routes
   * @returns Array of path-pageId pairs
   */
  getAllRoutes(): Array<{ path: string; pageId: string }> {
    return Array.from(this.routes.entries()).map(([path, pageId]) => ({
      path,
      pageId,
    }));
  }

  /**
   * Clear all registered routes
   */
  clear(): void {
    this.routes.clear();
    this.reverseRoutes.clear();
  }

  /**
   * Normalize a path for consistent matching
   * - Ensures path starts with /
   * - Removes trailing slash (except for root)
   * - Converts to lowercase
   */
  private normalizePath(path: string): string {
    // Ensure path starts with /
    let normalized = path.startsWith("/") ? path : `/${path}`;
    // Remove trailing slash (except for root)
    if (normalized.length > 1 && normalized.endsWith("/")) {
      normalized = normalized.slice(0, -1);
    }
    return normalized.toLowerCase();
  }
}
