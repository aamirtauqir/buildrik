import { useState } from "react";
import { createRoot } from "react-dom/client";
import { Uploader } from "../editor/shared/vibcoder/Uploader";
import { Button } from "../editor/shared/vibcoder/Button";
import { Icon } from "../editor/shared/vibcoder/Icon";
import { sectionLabel, stack } from "./_galleryStyles";

const stackWide = { ...stack, gap: 24, maxWidth: 560 };

function Demo() {
  const [lastDrop, setLastDrop] = useState<string>("(none yet)");

  const handleFiles = (files: FileList) => {
    const names = Array.from(files).map((f) => f.name).join(", ");
    setLastDrop(`${files.length} file(s): ${names}`);
  };

  return (
    <div style={stackWide}>
      <h2 style={sectionLabel}>default — drop-zone with prompt + hint + browse action</h2>
      <Uploader
        prompt="Drop image here or click to browse"
        hint="PNG, JPG up to 5MB"
        onFiles={handleFiles}
        accept="image/*"
        thumb={<Icon name="image" />}
      >
        <Button variant="secondary">Browse</Button>
      </Uploader>
      <small style={{ opacity: 0.6 }}>last drop: {lastDrop}</small>

      <h2 style={sectionLabel}>--sm size, no thumb, no actions</h2>
      <Uploader
        prompt="Drop file"
        hint="Any format"
        onFiles={handleFiles}
        size="sm"
      />

      <h2 style={sectionLabel}>--lg size + --centered (full-page mount)</h2>
      <Uploader
        prompt="Drop your project file here"
        hint="Or click anywhere in this zone to browse"
        onFiles={handleFiles}
        size="lg"
        variant="centered"
        thumb={<Icon name="file" />}
      >
        <Button variant="primary">Choose file</Button>
      </Uploader>

      <h2 style={sectionLabel}>--has-file variant (preview after selection)</h2>
      <Uploader
        prompt="hero-image.png"
        hint="2.4 MB · uploaded just now"
        onFiles={handleFiles}
        variant="has-file"
        thumb={<Icon name="image" />}
      >
        <Button variant="ghost">Replace</Button>
      </Uploader>

      <h2 style={sectionLabel}>--error variant</h2>
      <Uploader
        prompt="Upload failed"
        hint="File too large — max 5MB"
        onFiles={handleFiles}
        variant="error"
        thumb={<Icon name="alert-circle" />}
      >
        <Button variant="secondary">Retry</Button>
      </Uploader>

      <h2 style={sectionLabel}>disabled</h2>
      <Uploader
        prompt="Locked dropzone"
        hint="Disabled — click + drop are no-ops"
        onFiles={handleFiles}
        disabled
      />

      <h2 style={sectionLabel}>multiple + accept restriction</h2>
      <Uploader
        prompt="Drop up to 10 images"
        hint="JPG / PNG only · accept restriction enforced"
        onFiles={handleFiles}
        accept="image/jpeg,image/png"
        multiple
      />
    </div>
  );
}

const root = document.getElementById("react-root");
if (root) createRoot(root).render(<Demo />);
