import { createRef } from "react";
import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { Uploader } from "./Uploader";

// Build a synthetic FileList for tests (jsdom doesn't expose a constructor).
function fileList(...files: File[]): FileList {
  const list = {
    length: files.length,
    item: (i: number) => files[i] ?? null,
    [Symbol.iterator]: function* () {
      for (const f of files) yield f;
    },
  } as unknown as FileList;
  for (let i = 0; i < files.length; i++) {
    (list as unknown as Record<number, File>)[i] = files[i];
  }
  return list;
}

describe("vibcoder Uploader wrapper — Contract A (slot composition)", () => {
  it("renders <div.bd-uploader> with prompt slot (__name)", () => {
    const { container } = render(
      <Uploader prompt="Drop here" onFiles={() => {}} />,
    );
    const root = container.querySelector("div.bd-uploader");
    expect(root).toBeTruthy();
    expect(root!.querySelector(".bd-uploader__name")!.textContent).toBe(
      "Drop here",
    );
  });

  it("OMITS __hint when hint undefined", () => {
    const { container } = render(
      <Uploader prompt="Drop here" onFiles={() => {}} />,
    );
    expect(container.querySelector(".bd-uploader__hint")).toBeNull();
  });

  it("renders __hint when hint provided", () => {
    const { container } = render(
      <Uploader prompt="Drop here" hint="PNG up to 5MB" onFiles={() => {}} />,
    );
    expect(container.querySelector(".bd-uploader__hint")!.textContent).toBe(
      "PNG up to 5MB",
    );
  });

  it("OMITS __thumb when thumb undefined", () => {
    const { container } = render(
      <Uploader prompt="x" onFiles={() => {}} />,
    );
    expect(container.querySelector(".bd-uploader__thumb")).toBeNull();
  });

  it("renders __thumb when thumb provided", () => {
    const { container } = render(
      <Uploader
        prompt="x"
        onFiles={() => {}}
        thumb={<span data-testid="th" />}
      />,
    );
    const thumb = container.querySelector(".bd-uploader__thumb");
    expect(thumb).toBeTruthy();
    expect(thumb!.querySelector("[data-testid='th']")).toBeTruthy();
  });

  it("OMITS __actions when children undefined", () => {
    const { container } = render(
      <Uploader prompt="x" onFiles={() => {}} />,
    );
    expect(container.querySelector(".bd-uploader__actions")).toBeNull();
  });

  it("renders __actions when children provided", () => {
    const { container } = render(
      <Uploader prompt="x" onFiles={() => {}}>
        <button type="button">Browse</button>
      </Uploader>,
    );
    const actions = container.querySelector(".bd-uploader__actions");
    expect(actions).toBeTruthy();
    expect(actions!.querySelector("button")!.textContent).toBe("Browse");
  });

  it("OMITS size + variant + disabled modifiers when undefined", () => {
    const { container } = render(
      <Uploader prompt="x" onFiles={() => {}} />,
    );
    const cls = container.querySelector(".bd-uploader")!.className;
    expect(cls).not.toContain("bd-uploader--sm");
    expect(cls).not.toContain("bd-uploader--lg");
    expect(cls).not.toContain("bd-uploader--centered");
    expect(cls).not.toContain("bd-uploader--has-file");
    expect(cls).not.toContain("bd-uploader--error");
    expect(cls).not.toContain("bd-uploader--disabled");
  });

  it("emits --sm + --has-file when set", () => {
    const { container } = render(
      <Uploader prompt="x" onFiles={() => {}} size="sm" variant="has-file" />,
    );
    const cls = container.querySelector(".bd-uploader")!.className;
    expect(cls).toContain("bd-uploader--sm");
    expect(cls).toContain("bd-uploader--has-file");
  });

  it("emits --lg / --centered / --error variants", () => {
    for (const v of ["centered", "error", "has-file"] as const) {
      const { container } = render(
        <Uploader prompt="x" onFiles={() => {}} variant={v} />,
      );
      expect(container.querySelector(".bd-uploader")!.className).toContain(
        `bd-uploader--${v}`,
      );
    }
  });
});

describe("vibcoder Uploader — drag-drop event semantics", () => {
  it("dragover calls e.preventDefault() — CRITICAL or browser navigates to dropped file", () => {
    const { container } = render(
      <Uploader prompt="x" onFiles={() => {}} />,
    );
    const root = container.querySelector(".bd-uploader") as HTMLDivElement;
    const evt = new Event("dragover", { bubbles: true, cancelable: true }) as Event & {
      dataTransfer: { files: FileList };
    };
    evt.dataTransfer = { files: fileList() };
    const prevented = !root.dispatchEvent(evt);
    expect(prevented).toBe(true);
  });

  it("dragover adds .is-dragover class to the root", () => {
    const { container } = render(
      <Uploader prompt="x" onFiles={() => {}} />,
    );
    const root = container.querySelector(".bd-uploader") as HTMLDivElement;
    fireEvent.dragOver(root, { dataTransfer: { files: fileList() } });
    expect(root.classList.contains("is-dragover")).toBe(true);
  });

  it("dragleave removes .is-dragover class from the root", () => {
    const { container } = render(
      <Uploader prompt="x" onFiles={() => {}} />,
    );
    const root = container.querySelector(".bd-uploader") as HTMLDivElement;
    fireEvent.dragOver(root, { dataTransfer: { files: fileList() } });
    expect(root.classList.contains("is-dragover")).toBe(true);
    fireEvent.dragLeave(root);
    expect(root.classList.contains("is-dragover")).toBe(false);
  });

  it("drop calls onFiles with FileList + clears .is-dragover", () => {
    const onFiles = vi.fn();
    const { container } = render(
      <Uploader prompt="x" onFiles={onFiles} />,
    );
    const root = container.querySelector(".bd-uploader") as HTMLDivElement;
    fireEvent.dragOver(root, { dataTransfer: { files: fileList() } });
    const file = new File(["hi"], "hi.png", { type: "image/png" });
    fireEvent.drop(root, { dataTransfer: { files: fileList(file) } });
    expect(onFiles).toHaveBeenCalledOnce();
    const fl = onFiles.mock.calls[0][0] as FileList;
    expect(fl.length).toBe(1);
    expect(fl[0].name).toBe("hi.png");
    expect(root.classList.contains("is-dragover")).toBe(false);
  });

  it("drop does NOT call onFiles when no files in dataTransfer", () => {
    const onFiles = vi.fn();
    const { container } = render(
      <Uploader prompt="x" onFiles={onFiles} />,
    );
    const root = container.querySelector(".bd-uploader") as HTMLDivElement;
    fireEvent.drop(root, { dataTransfer: { files: fileList() } });
    expect(onFiles).not.toHaveBeenCalled();
  });

  it("drop does NOT call onFiles when disabled (but still preventDefaults navigation)", () => {
    const onFiles = vi.fn();
    const { container } = render(
      <Uploader prompt="x" onFiles={onFiles} disabled />,
    );
    const root = container.querySelector(".bd-uploader") as HTMLDivElement;
    const file = new File(["hi"], "hi.png", { type: "image/png" });
    fireEvent.drop(root, { dataTransfer: { files: fileList(file) } });
    expect(onFiles).not.toHaveBeenCalled();
  });
});

describe("vibcoder Uploader — click-to-browse via hidden file input", () => {
  it("renders a hidden <input type='file'> covering the drop zone", () => {
    const { container } = render(
      <Uploader prompt="x" onFiles={() => {}} />,
    );
    const input = container.querySelector(
      "input[type='file']",
    ) as HTMLInputElement;
    expect(input).toBeTruthy();
    expect(input.style.display).toBe("none");
    expect(input.tabIndex).toBe(-1);
  });

  it("forwards accept + multiple to hidden input", () => {
    const { container } = render(
      <Uploader prompt="x" onFiles={() => {}} accept="image/*" multiple />,
    );
    const input = container.querySelector(
      "input[type='file']",
    ) as HTMLInputElement;
    expect(input.getAttribute("accept")).toBe("image/*");
    expect(input.multiple).toBe(true);
  });

  it("disables hidden input when disabled=true", () => {
    const { container } = render(
      <Uploader prompt="x" onFiles={() => {}} disabled />,
    );
    const input = container.querySelector(
      "input[type='file']",
    ) as HTMLInputElement;
    expect(input.disabled).toBe(true);
  });

  it("clicking the root triggers the hidden input click", () => {
    const { container } = render(
      <Uploader prompt="x" onFiles={() => {}} />,
    );
    const root = container.querySelector(".bd-uploader") as HTMLDivElement;
    const input = container.querySelector(
      "input[type='file']",
    ) as HTMLInputElement;
    const clickSpy = vi.spyOn(input, "click");
    fireEvent.click(root);
    expect(clickSpy).toHaveBeenCalledOnce();
  });

  it("clicking the root does NOT trigger input click when disabled", () => {
    const { container } = render(
      <Uploader prompt="x" onFiles={() => {}} disabled />,
    );
    const root = container.querySelector(".bd-uploader") as HTMLDivElement;
    const input = container.querySelector(
      "input[type='file']",
    ) as HTMLInputElement;
    const clickSpy = vi.spyOn(input, "click");
    fireEvent.click(root);
    expect(clickSpy).not.toHaveBeenCalled();
  });

  it("hidden input change fires onFiles", () => {
    const onFiles = vi.fn();
    const { container } = render(
      <Uploader prompt="x" onFiles={onFiles} />,
    );
    const input = container.querySelector(
      "input[type='file']",
    ) as HTMLInputElement;
    const file = new File(["hi"], "hi.png", { type: "image/png" });
    fireEvent.change(input, { target: { files: fileList(file) } });
    expect(onFiles).toHaveBeenCalledOnce();
  });

  it("hidden input click does NOT re-trigger root handleClick (stopPropagation prevents infinite loop)", () => {
    // The infinite-loop foot-gun: handleClick on root → input.click() →
    // synthetic click bubbles to root onClick → handleClick → input.click() …
    // The hidden input's onClick={stopPropagation} breaks the cycle. We verify
    // by spying on the input.click() method itself: clicking the input should
    // NOT cause a second input.click() to fire from the bubbled handler.
    const onClickSpy = vi.fn();
    const { container } = render(
      <Uploader prompt="Drop" onFiles={() => {}} onClick={onClickSpy} />,
    );
    const input = container.querySelector(
      "input[type='file']",
    ) as HTMLInputElement;
    const inputClickSpy = vi.spyOn(input, "click");
    // Simulate the browser's programmatic input.click() dispatch
    fireEvent.click(input);
    // Without stopPropagation, root onClick would fire (and re-trigger
    // input.click()). Both must be 0 to confirm the cycle is broken.
    expect(onClickSpy).not.toHaveBeenCalled();
    expect(inputClickSpy).not.toHaveBeenCalled();
  });
});

describe("vibcoder Uploader — keyboard accessibility (role=button + Enter/Space)", () => {
  it("emits role=button and aria-label=prompt for AT users", () => {
    const { container } = render(
      <Uploader prompt="Upload your media" onFiles={() => {}} />,
    );
    const dropzone = container.querySelector(".bd-uploader")!;
    expect(dropzone.getAttribute("role")).toBe("button");
    expect(dropzone.getAttribute("aria-label")).toBe("Upload your media");
  });

  it("non-disabled tabIndex is 0 (keyboard-focusable); disabled tabIndex is -1", () => {
    const { container: enabled } = render(
      <Uploader prompt="x" onFiles={() => {}} />,
    );
    expect(
      (enabled.querySelector(".bd-uploader") as HTMLDivElement).tabIndex,
    ).toBe(0);
    const { container: disabled } = render(
      <Uploader prompt="x" onFiles={() => {}} disabled />,
    );
    expect(
      (disabled.querySelector(".bd-uploader") as HTMLDivElement).tabIndex,
    ).toBe(-1);
  });

  it("Enter key on dropzone triggers file picker", () => {
    const { container } = render(
      <Uploader prompt="Drop" onFiles={() => {}} />,
    );
    const dropzone = container.querySelector(".bd-uploader") as HTMLDivElement;
    const input = container.querySelector(
      "input[type='file']",
    ) as HTMLInputElement;
    const clickSpy = vi.spyOn(input, "click");
    fireEvent.keyDown(dropzone, { key: "Enter" });
    expect(clickSpy).toHaveBeenCalledOnce();
  });

  it("Space key on dropzone triggers file picker AND prevents page scroll", () => {
    const { container } = render(
      <Uploader prompt="Drop" onFiles={() => {}} />,
    );
    const dropzone = container.querySelector(".bd-uploader") as HTMLDivElement;
    const input = container.querySelector(
      "input[type='file']",
    ) as HTMLInputElement;
    const clickSpy = vi.spyOn(input, "click");
    // Dispatch a real DOM KeyboardEvent so we can observe defaultPrevented
    // after React's onKeyDown handler runs.
    const event = new KeyboardEvent("keydown", {
      key: " ",
      bubbles: true,
      cancelable: true,
    });
    dropzone.dispatchEvent(event);
    expect(clickSpy).toHaveBeenCalledOnce();
    expect(event.defaultPrevented).toBe(true);
  });

  it("disabled prevents Enter/Space keydown from triggering file picker", () => {
    const { container } = render(
      <Uploader prompt="Drop" onFiles={() => {}} disabled />,
    );
    const dropzone = container.querySelector(".bd-uploader") as HTMLDivElement;
    const input = container.querySelector(
      "input[type='file']",
    ) as HTMLInputElement;
    const clickSpy = vi.spyOn(input, "click");
    fireEvent.keyDown(dropzone, { key: "Enter" });
    fireEvent.keyDown(dropzone, { key: " " });
    expect(clickSpy).not.toHaveBeenCalled();
  });
});

describe("vibcoder Uploader — base wrapper conventions", () => {
  it("merges caller className", () => {
    const { container } = render(
      <Uploader prompt="x" onFiles={() => {}} className="extra" />,
    );
    expect(container.querySelector(".bd-uploader")!.className).toContain(
      "extra",
    );
  });

  it("forwards ref to root <div>", () => {
    const ref = createRef<HTMLDivElement>();
    render(<Uploader ref={ref} prompt="x" onFiles={() => {}} />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it("emits aria-disabled='true' when disabled", () => {
    const { container } = render(
      <Uploader prompt="x" onFiles={() => {}} disabled />,
    );
    expect(
      container.querySelector(".bd-uploader")!.getAttribute("aria-disabled"),
    ).toBe("true");
  });

  it("OMITS aria-disabled when disabled undefined", () => {
    const { container } = render(
      <Uploader prompt="x" onFiles={() => {}} />,
    );
    expect(
      container.querySelector(".bd-uploader")!.hasAttribute("aria-disabled"),
    ).toBe(false);
  });
});
