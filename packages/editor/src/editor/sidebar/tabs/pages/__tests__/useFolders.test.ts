/**
 * useFolders — sidebar folder management hook (flat model + localStorage).
 * @license BSD-3-Clause
 */
import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useFolders } from "../useFolders";

const livePages = new Set<string>(["p1", "p2", "p3"]);

describe("useFolders (flat model)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("createFolder produces folder with empty pageIds and not collapsed", () => {
    const { result } = renderHook(() => useFolders("project-test", livePages));
    act(() => {
      result.current.createFolder("Marketing");
    });
    expect(result.current.folders.length).toBe(1);
    expect(result.current.folders[0].pageIds).toEqual([]);
    expect(result.current.folders[0].collapsed).toBe(false);
    expect(result.current.folders[0].name).toBe("Marketing");
  });

  it("createFolder returns the new folder id", () => {
    const { result } = renderHook(() => useFolders("project-test", livePages));
    let returnedId = "";
    act(() => {
      returnedId = result.current.createFolder("M");
    });
    expect(returnedId).toBe(result.current.folders[0].id);
  });

  it("movePageToFolder appends to pageIds", () => {
    const { result } = renderHook(() => useFolders("project-test", livePages));
    let fid = "";
    act(() => {
      fid = result.current.createFolder("M");
    });
    act(() => result.current.movePageToFolder("p1", fid));
    expect(result.current.folders[0].pageIds).toEqual(["p1"]);
  });

  it("movePageToFolder onto another folder removes from old, adds to new", () => {
    const { result } = renderHook(() => useFolders("project-test", livePages));
    let fa = "";
    let fb = "";
    act(() => {
      fa = result.current.createFolder("A");
      fb = result.current.createFolder("B");
    });
    act(() => result.current.movePageToFolder("p1", fa));
    act(() => result.current.movePageToFolder("p1", fb));
    expect(result.current.folders.find((f) => f.id === fa)?.pageIds).toEqual([]);
    expect(result.current.folders.find((f) => f.id === fb)?.pageIds).toEqual(["p1"]);
  });

  it("removePageFromFolder filters page from any folder", () => {
    const { result } = renderHook(() => useFolders("project-test", livePages));
    let fid = "";
    act(() => {
      fid = result.current.createFolder("M");
    });
    act(() => result.current.movePageToFolder("p1", fid));
    act(() => result.current.movePageToFolder("p2", fid));
    act(() => result.current.removePageFromFolder("p1"));
    expect(result.current.folders[0].pageIds).toEqual(["p2"]);
  });

  it("toggleCollapse flips boolean both directions", () => {
    const { result } = renderHook(() => useFolders("project-test", livePages));
    let fid = "";
    act(() => {
      fid = result.current.createFolder("M");
    });
    act(() => result.current.toggleCollapse(fid));
    expect(result.current.folders[0].collapsed).toBe(true);
    act(() => result.current.toggleCollapse(fid));
    expect(result.current.folders[0].collapsed).toBe(false);
  });

  it("renameFolder updates name (trims whitespace, ignores empty)", () => {
    const { result } = renderHook(() => useFolders("project-test", livePages));
    let fid = "";
    act(() => {
      fid = result.current.createFolder("M");
    });
    act(() => result.current.renameFolder(fid, "  New Name  "));
    expect(result.current.folders[0].name).toBe("New Name");
    act(() => result.current.renameFolder(fid, "   "));
    expect(result.current.folders[0].name).toBe("New Name");
  });

  it("deleteFolder removes folder from list", () => {
    const { result } = renderHook(() => useFolders("project-test", livePages));
    let fid = "";
    act(() => {
      fid = result.current.createFolder("M");
    });
    act(() => result.current.deleteFolder(fid));
    expect(result.current.folders.length).toBe(0);
  });

  it("pageToFolder map reflects membership", () => {
    const { result } = renderHook(() => useFolders("project-test", livePages));
    let fid = "";
    act(() => {
      fid = result.current.createFolder("M");
    });
    act(() => result.current.movePageToFolder("p1", fid));
    expect(result.current.pageToFolder.get("p1")).toBe(fid);
  });

  it("pruneDeletedPages cleans stale pageIds", () => {
    const { result } = renderHook(() => useFolders("project-test", livePages));
    let fid = "";
    act(() => {
      fid = result.current.createFolder("M");
    });
    act(() => result.current.movePageToFolder("p1", fid));
    act(() => result.current.movePageToFolder("p2", fid));
    act(() => result.current.pruneDeletedPages(new Set(["p1"])));
    expect(result.current.folders[0].pageIds).toEqual(["p1"]);
  });

  it("flat-only invariant: folders never contain other folders", () => {
    const { result } = renderHook(() => useFolders("project-test", livePages));
    act(() => {
      result.current.createFolder("Outer");
      result.current.createFolder("Inner");
    });
    // No API exists for nesting folders. Each is a top-level entity.
    expect(result.current.folders.length).toBe(2);
    const innerId = result.current.folders[1].id;
    expect(result.current.folders[0].pageIds).not.toContain(innerId);
  });
});
