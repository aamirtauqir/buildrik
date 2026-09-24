/**
 * useFolders ↔ the server store (`pages.folders.*`): folders are personal and
 * follow the user; localStorage is only the offline copy.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";

const remote = vi.hoisted(() => ({
  list: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  movePage: vi.fn(),
}));
vi.mock("@/services/PageFolderService", () => ({ pageFolderRemote: remote }));

import { useFolders } from "../useFolders";

const live = new Set(["p1", "p2", "p3"]);
const folder = (id: string, name: string, pageIds: string[] = [], collapsed = false) => ({ id, name, pageIds, collapsed });

beforeEach(() => {
  localStorage.clear();
  Object.values(remote).forEach((m) => m.mockReset());
  remote.list.mockResolvedValue([]);
  remote.update.mockImplementation(async (id: string, patch: object) => ({ ...folder(id, "x"), ...patch }));
  remote.remove.mockResolvedValue({ success: true });
  remote.movePage.mockResolvedValue([]);
});

describe("useFolders — server store", () => {
  it("shows the server's folders for this user and site", async () => {
    remote.list.mockResolvedValue([folder("srv-1", "Legal", ["p2"])]);
    const { result } = renderHook(() => useFolders("site-1", live));
    await waitFor(() => expect(result.current.folders).toEqual([folder("srv-1", "Legal", ["p2"])]));
    expect(remote.list).toHaveBeenCalledWith("site-1");
  });

  it("create is immediate, then takes the server's id; a move right after waits for it", async () => {
    let answer!: (f: unknown) => void;
    remote.create.mockReturnValue(new Promise((r) => (answer = r)));
    const { result } = renderHook(() => useFolders("site-1", live));
    await waitFor(() => expect(remote.list).toHaveBeenCalled());

    let tempId = "";
    act(() => {
      tempId = result.current.createFolder("Marketing");
      result.current.movePageToFolder("p1", tempId);
    });
    expect(result.current.folders[0]).toMatchObject({ id: tempId, name: "Marketing", pageIds: ["p1"] });
    expect(remote.movePage).not.toHaveBeenCalled(); // no real id yet

    await act(async () => answer(folder("srv-9", "Marketing")));
    await waitFor(() => expect(remote.movePage).toHaveBeenCalledWith("site-1", "p1", "srv-9"));
    expect(result.current.folders[0].id).toBe("srv-9");
    expect(result.current.folders[0].pageIds).toEqual(["p1"]);
  });

  it("rename, collapse, remove-from-folder and delete each reach the server", async () => {
    remote.list.mockResolvedValue([folder("srv-1", "Legal", ["p1"])]);
    const { result } = renderHook(() => useFolders("site-1", live));
    await waitFor(() => expect(result.current.folders).toHaveLength(1));

    act(() => result.current.renameFolder("srv-1", "Policies"));
    act(() => result.current.toggleCollapse("srv-1"));
    act(() => result.current.removePageFromFolder("p1"));
    act(() => result.current.deleteFolder("srv-1"));

    await waitFor(() => expect(remote.remove).toHaveBeenCalledWith("srv-1"));
    expect(remote.update).toHaveBeenCalledWith("srv-1", { name: "Policies" });
    expect(remote.update).toHaveBeenCalledWith("srv-1", { collapsed: true });
    expect(remote.movePage).toHaveBeenCalledWith("site-1", "p1", null);
  });

  it("a refused change re-reads the server's state", async () => {
    remote.list.mockResolvedValueOnce([folder("srv-1", "Legal")]).mockResolvedValue([folder("srv-1", "Legal")]);
    remote.update.mockResolvedValue(null);
    const { result } = renderHook(() => useFolders("site-1", live));
    await waitFor(() => expect(result.current.folders).toHaveLength(1));

    act(() => result.current.renameFolder("srv-1", "Nope"));
    expect(result.current.folders[0].name).toBe("Nope"); // optimistic
    await waitFor(() => expect(result.current.folders[0].name).toBe("Legal"));
  });

  it("uploads folders that only lived in this browser, once, when the server has none", async () => {
    localStorage.setItem("pg-folders-v1-site-1", JSON.stringify([folder("fld-local", "Old", ["p3"], true)]));
    remote.list.mockResolvedValueOnce([]).mockResolvedValue([folder("srv-5", "Old", ["p3"], true)]);
    remote.create.mockResolvedValue(folder("srv-5", "Old"));
    const { result } = renderHook(() => useFolders("site-1", live));
    await waitFor(() => expect(result.current.folders[0]?.id).toBe("srv-5"));
    expect(remote.create).toHaveBeenCalledWith("site-1", "Old");
    expect(remote.movePage).toHaveBeenCalledWith("site-1", "p3", "srv-5");
    expect(remote.update).toHaveBeenCalledWith("srv-5", { collapsed: true });
  });

  it("offline (list fails) keeps the local copy and never uploads", async () => {
    localStorage.setItem("pg-folders-v1-site-1", JSON.stringify([folder("fld-local", "Old")]));
    remote.list.mockResolvedValue(null);
    const { result } = renderHook(() => useFolders("site-1", live));
    await waitFor(() => expect(remote.list).toHaveBeenCalled());
    expect(result.current.folders).toEqual([folder("fld-local", "Old")]);
    expect(remote.create).not.toHaveBeenCalled();
  });

  it("no site (demo): nothing is sent", () => {
    const { result } = renderHook(() => useFolders(null, live));
    act(() => {
      result.current.createFolder("Demo");
    });
    expect(remote.list).not.toHaveBeenCalled();
    expect(remote.create).not.toHaveBeenCalled();
  });
});
