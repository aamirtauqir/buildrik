/**
 * D-13 remainder: media library "load more" grew a `limit` param and
 * re-fetched the whole widened page from offset 0 on every click instead of
 * walking listAssets' existing `cursor`. Migrated to useInfiniteQuery.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const fetchNextPageMock = vi.fn();
const refetchMock = vi.fn();
let listAssetsState: {
  data?: { pages: { items: { id: string; filename: string; url: string; type: string; bytes: number; folderId: string | null; altText: string | null }[]; nextCursor: string | null }[] };
  isLoading: boolean;
  isError: boolean;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  refetch: () => void;
};

function makeAsset(id: string) {
  return { id, filename: `asset-${id}.png`, url: `https://blob/${id}.png`, type: "image", bytes: 100, folderId: null, altText: null };
}

vi.mock("@lib/trpc/client", () => ({
  trpc: {
    media: {
      listAssets: { useInfiniteQuery: (input: unknown, opts: unknown) => { void input; void opts; return listAssetsState; } },
      listFolders: { useQuery: () => ({ data: [] }) },
      checkStorageQuota: { useQuery: () => ({ data: { warningAt80Percent: false } }) },
      deleteAsset: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      createAsset: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      moveAsset: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      createFolder: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      renameFolder: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      deleteFolder: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
    },
    useUtils: () => ({}),
  },
}));

vi.mock("@/components/dashboard/toast-provider", () => ({
  useToast: () => ({ addToast: vi.fn() }),
}));

vi.mock("@vercel/blob/client", () => ({ upload: vi.fn() }));

import { MediaLibrary } from "../media-library";

describe("MediaLibrary — infinite-query pagination", () => {
  beforeEach(() => {
    fetchNextPageMock.mockClear();
    refetchMock.mockClear();
    listAssetsState = {
      data: { pages: [{ items: [makeAsset("1"), makeAsset("2")], nextCursor: "cursor-2" }] },
      isLoading: false,
      isError: false,
      hasNextPage: true,
      isFetchingNextPage: false,
      fetchNextPage: fetchNextPageMock,
      refetch: refetchMock,
    };
  });

  it("flattens items across fetched pages and calls fetchNextPage (not a widening limit) on Load more", async () => {
    const user = userEvent.setup();
    render(<MediaLibrary workspaceId="ws-1" />);

    expect(screen.getByText("asset-1.png")).toBeInTheDocument();
    expect(screen.getByText("asset-2.png")).toBeInTheDocument();

    const loadMore = screen.getByText("Load more assets");
    await user.click(loadMore);

    expect(fetchNextPageMock).toHaveBeenCalledTimes(1);
  });

  it("hides Load more once hasNextPage is false", () => {
    listAssetsState.hasNextPage = false;
    render(<MediaLibrary workspaceId="ws-1" />);
    expect(screen.queryByText("Load more assets")).not.toBeInTheDocument();
  });

  it("shows the loading label while fetching the next page", () => {
    listAssetsState.isFetchingNextPage = true;
    render(<MediaLibrary workspaceId="ws-1" />);
    expect(screen.getByText("Loading…")).toBeInTheDocument();
  });
});
