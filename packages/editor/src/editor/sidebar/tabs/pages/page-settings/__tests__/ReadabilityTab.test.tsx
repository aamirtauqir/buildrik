/**
 * ReadabilityTab — four states mapped one to one from analyzeReadability
 * (boards SEO-M3 / M3b / M3c / M3d).
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { ReadabilityTab, readabilityLabel } from "../ReadabilityTab";

const f = (id: string, rating: "problem" | "improvement" | "good") => ({ id, rating, text: `${id} text` });

describe("ReadabilityTab", () => {
  it("default: status word header and the findings list", () => {
    render(<ReadabilityTab locale="en" readability={{ evaluated: true, findings: [f("passive-voice", "improvement"), f("flesch", "good")] }} />);
    expect(screen.getByTestId("readability-status")).toHaveTextContent("Readability: Needs attention");
    expect(screen.getByText("Improvements (1)")).toBeInTheDocument();
  });

  it("unsupported language: Not evaluated for <Language name>, neutral findings below", () => {
    render(<ReadabilityTab locale="fr" readability={{ evaluated: false, reason: "language", findings: [f("sentence-length", "good")] }} />);
    expect(screen.getByTestId("readability-note")).toHaveTextContent("Not evaluated for French");
    expect(screen.getByTestId("readability-status")).toHaveTextContent("Readability: Not evaluated");
    expect(screen.getByRole("button", { name: /Good results \(1\)/ })).toBeInTheDocument();
  });

  it("empty page asks for text", () => {
    render(<ReadabilityTab locale="en" readability={{ evaluated: false, reason: "empty", findings: [] }} />);
    expect(screen.getByTestId("readability-note")).toHaveTextContent("Add some text to this page to check readability");
  });

  it("CMS template is checked on sample text", () => {
    render(<ReadabilityTab locale="en" readability={{ evaluated: false, reason: "cms-template", findings: [f("sentence-length", "good")] }} />);
    expect(screen.getByTestId("readability-note")).toHaveTextContent("Template page — checked on sample text");
  });

  it("the tab label is a status word or Not evaluated — never a number", () => {
    expect(readabilityLabel(null)).toBe("Not checked");
    expect(readabilityLabel({ evaluated: false, reason: "language", findings: [] })).toBe("Not evaluated");
    expect(readabilityLabel({ evaluated: true, findings: [f("x", "good")] })).toBe("No issues detected");
  });
});
