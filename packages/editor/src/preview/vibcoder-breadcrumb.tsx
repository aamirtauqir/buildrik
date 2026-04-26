import { createRoot } from "react-dom/client";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbSeparator,
} from "../editor/shared/vibcoder/Breadcrumb";
import { sectionLabel, stack } from "./_galleryStyles";

const stackWide = { ...stack, gap: 16, maxWidth: 640 };

function Demo() {
  return (
    <div style={stackWide}>
      <h2 style={sectionLabel}>default</h2>
      <Breadcrumb>
        <BreadcrumbItem href="/">Home</BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem href="/projects">Projects</BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem current>Marketing site</BreadcrumbItem>
      </Breadcrumb>

      <h2 style={sectionLabel}>size: sm</h2>
      <Breadcrumb size="sm">
        <BreadcrumbItem href="/">Home</BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem href="/cms">CMS</BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem current>Schema</BreadcrumbItem>
      </Breadcrumb>

      <h2 style={sectionLabel}>variant: mono (file paths / inspector chains)</h2>
      <Breadcrumb variant="mono">
        <BreadcrumbItem href="#">section</BreadcrumbItem>
        <BreadcrumbSeparator>›</BreadcrumbSeparator>
        <BreadcrumbItem href="#">div.hero</BreadcrumbItem>
        <BreadcrumbSeparator>›</BreadcrumbSeparator>
        <BreadcrumbItem current>h1.headline</BreadcrumbItem>
      </Breadcrumb>

      <h2 style={sectionLabel}>variant: truncate</h2>
      <div style={{ maxWidth: 280 }}>
        <Breadcrumb variant="truncate">
          <BreadcrumbItem href="#">A long workspace name</BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem href="#">Folder name that wraps</BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem current>Some very long current page title</BreadcrumbItem>
        </Breadcrumb>
      </div>
    </div>
  );
}

const root = document.getElementById("react-root");
if (root) createRoot(root).render(<Demo />);
