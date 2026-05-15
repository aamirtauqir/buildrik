/**
 * DetachConfirmModal tests — Task 13
 * Covers: 4-bullet body, singular/plural instance label, Cancel/Detach actions.
 */

import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import * as React from "react";
import { DetachConfirmModal } from "../DetachConfirmModal";

describe("DetachConfirmModal", () => {
  it("renders title + 4 bullet rows + meta strip", () => {
    const { getByText } = render(
      <DetachConfirmModal
        instanceLabel="#3"
        masterName="Custom CTA"
        masterInstanceCount={7}
        onCancel={() => {}}
        onConfirm={() => {}}
      />
    );
    expect(getByText(/Detach instance #3/i)).toBeTruthy();
    expect(getByText(/Custom CTA/)).toBeTruthy();
    expect(getByText(/7 instances/)).toBeTruthy();
    expect(getByText(/Current resolved bindings will be snapshotted/i)).toBeTruthy();
    expect(getByText(/This instance becomes free-form/i)).toBeTruthy();
    expect(
      getByText(/Master edits will no longer affect this instance/i)
    ).toBeTruthy();
    expect(getByText(/Undo restores the link/i)).toBeTruthy();
  });

  it("singularizes 'instance' for count=1", () => {
    const { getByText } = render(
      <DetachConfirmModal
        instanceLabel="#1"
        masterName="X"
        masterInstanceCount={1}
        onCancel={() => {}}
        onConfirm={() => {}}
      />
    );
    // Match "1 instance" but not "1 instances"
    expect(getByText(/\b1 instance\b(?!s)/)).toBeTruthy();
  });

  it("fires onConfirm when Detach clicked", () => {
    const onConfirm = vi.fn();
    const { getByText } = render(
      <DetachConfirmModal
        instanceLabel="#3"
        masterName="X"
        masterInstanceCount={1}
        onCancel={() => {}}
        onConfirm={onConfirm}
      />
    );
    fireEvent.click(getByText("Detach"));
    expect(onConfirm).toHaveBeenCalled();
  });

  it("fires onCancel when Cancel clicked", () => {
    const onCancel = vi.fn();
    const { getByText } = render(
      <DetachConfirmModal
        instanceLabel="#3"
        masterName="X"
        masterInstanceCount={1}
        onCancel={onCancel}
        onConfirm={() => {}}
      />
    );
    fireEvent.click(getByText("Cancel"));
    expect(onCancel).toHaveBeenCalled();
  });
});
