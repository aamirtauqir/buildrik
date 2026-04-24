/**
 * useBulkSelect — multi-select state hook.
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useBulkSelect } from "../useBulkSelect";

describe("useBulkSelect", () => {
  it("toggleSelect adds id to selectedIds", () => {
    const { result } = renderHook(() => useBulkSelect());
    act(() => result.current.toggleSelect("p1"));
    expect(result.current.selectedIds.has("p1")).toBe(true);
    expect(result.current.selectedCount).toBe(1);
  });

  it("toggleSelect twice removes the id", () => {
    const { result } = renderHook(() => useBulkSelect());
    act(() => result.current.toggleSelect("p1"));
    act(() => result.current.toggleSelect("p1"));
    expect(result.current.selectedIds.has("p1")).toBe(false);
    expect(result.current.selectedCount).toBe(0);
  });

  it("hasSelection is false initially, true after first toggle", () => {
    const { result } = renderHook(() => useBulkSelect());
    expect(result.current.hasSelection).toBe(false);
    act(() => result.current.toggleSelect("p1"));
    expect(result.current.hasSelection).toBe(true);
  });

  it("clearSelection empties set and exits bulk mode", () => {
    const { result } = renderHook(() => useBulkSelect());
    act(() => result.current.toggleSelect("p1"));
    act(() => result.current.toggleSelect("p2"));
    act(() => result.current.clearSelection());
    expect(result.current.selectedIds.size).toBe(0);
    expect(result.current.hasSelection).toBe(false);
  });

  it("isSelected reports membership accurately", () => {
    const { result } = renderHook(() => useBulkSelect());
    act(() => result.current.toggleSelect("p1"));
    expect(result.current.isSelected("p1")).toBe(true);
    expect(result.current.isSelected("p2")).toBe(false);
  });

  it("shift+click selects contiguous range from last-clicked id", () => {
    const ordered = ["p1", "p2", "p3", "p4", "p5"];
    const { result } = renderHook(() => useBulkSelect());
    act(() => result.current.toggleSelect("p2", { orderedIds: ordered }));
    act(() => result.current.toggleSelect("p4", { shift: true, orderedIds: ordered }));
    expect(result.current.selectedIds.has("p2")).toBe(true);
    expect(result.current.selectedIds.has("p3")).toBe(true);
    expect(result.current.selectedIds.has("p4")).toBe(true);
    expect(result.current.selectedIds.has("p1")).toBe(false);
    expect(result.current.selectedIds.has("p5")).toBe(false);
  });
});
