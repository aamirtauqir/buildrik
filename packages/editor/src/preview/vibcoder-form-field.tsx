import React from "react";
import { createRoot } from "react-dom/client";
import { FormField } from "../editor/shared/vibcoder/FormField";
import { Input } from "../editor/shared/vibcoder/Input";
import { Select } from "../editor/shared/vibcoder/Select";
import { Textarea } from "../editor/shared/vibcoder/Textarea";
import { sectionLabel, stack } from "./_galleryStyles";

const stackWide = { ...stack, gap: 16 };

function Demo() {
  return (
    <>
      <h2 style={sectionLabel}>default (column)</h2>
      <div style={stackWide}>
        <FormField label="Page title" htmlFor="ff-title" helper="Shown in browser tab.">
          <Input id="ff-title" defaultValue="Home" />
        </FormField>
      </div>

      <h2 style={{ ...sectionLabel, marginTop: 24 }}>required</h2>
      <div style={stackWide}>
        <FormField label="Slug" htmlFor="ff-slug" required helper="Lowercase, hyphenated.">
          <Input id="ff-slug" defaultValue="/pricing" />
        </FormField>
      </div>

      <h2 style={{ ...sectionLabel, marginTop: 24 }}>error overrides helper</h2>
      <div style={stackWide}>
        <FormField label="Email" htmlFor="ff-email" helper="We'll never share." error="Must be a valid email.">
          <Input id="ff-email" defaultValue="not-an-email" />
        </FormField>
      </div>

      <h2 style={{ ...sectionLabel, marginTop: 24 }}>inline</h2>
      <div style={stackWide}>
        <FormField label="Status" htmlFor="ff-status" inline>
          <Select id="ff-status" defaultValue="draft">
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </Select>
        </FormField>
      </div>

      <h2 style={{ ...sectionLabel, marginTop: 24 }}>row (3-column grid, dense inspector)</h2>
      <div style={stackWide}>
        <FormField label="Width" htmlFor="ff-w" row helper="px">
          <Input id="ff-w" defaultValue="320" />
        </FormField>
        <FormField label="Height" htmlFor="ff-h" row helper="px">
          <Input id="ff-h" defaultValue="240" />
        </FormField>
      </div>

      <h2 style={{ ...sectionLabel, marginTop: 24 }}>disabled</h2>
      <div style={stackWide}>
        <FormField label="Plan" htmlFor="ff-plan" disabled helper="Upgrade to change.">
          <Input id="ff-plan" defaultValue="Free" disabled />
        </FormField>
      </div>

      <h2 style={{ ...sectionLabel, marginTop: 24 }}>textarea content slot</h2>
      <div style={stackWide}>
        <FormField label="Description" htmlFor="ff-desc" helper="Shown in social previews.">
          <Textarea id="ff-desc" defaultValue="A visual web builder for product teams." />
        </FormField>
      </div>
    </>
  );
}

const root = document.getElementById("react-root");
if (root) createRoot(root).render(<Demo />);
