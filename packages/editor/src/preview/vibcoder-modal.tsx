/**
 * Modal gallery — uses DemoTrigger per Phase 3 Contract E5.
 *
 * Three demos: default panel (380px), large (460px), and extra-large (560px).
 * Each demo is independently stateful via <DemoTrigger>; no `open={true}`
 * literal anywhere (E5 enforced by no-hardcoded-open-prop ESLint rule).
 *
 * @license BSD-3-Clause
 */
import React from "react";
import { createRoot } from "react-dom/client";
import { DemoTrigger } from "./_lib/DemoTrigger";
import {
  Modal,
  ModalContent,
  ModalClose,
  ModalTitle,
  ModalDescription,
  ModalFooter,
  OverlayMount,
} from "../editor/shared/vibcoder";
import { sectionLabel, stack } from "./_galleryStyles";

function Demo() {
  return (
    <OverlayMount>
      <div style={stack}>
        <h2 style={sectionLabel}>default size (380px)</h2>
        <DemoTrigger label="Open default modal">
          {(open, setOpen) => (
            <Modal open={open} onOpenChange={setOpen}>
              <ModalContent>
                <ModalTitle>Confirm action</ModalTitle>
                <ModalDescription>
                  Are you sure you want to proceed?
                </ModalDescription>
                <ModalFooter>
                  <ModalClose asChild>
                    <button className="bd-btn bd-btn--ghost">Cancel</button>
                  </ModalClose>
                  <ModalClose asChild>
                    <button className="bd-btn bd-btn--primary">Confirm</button>
                  </ModalClose>
                </ModalFooter>
              </ModalContent>
            </Modal>
          )}
        </DemoTrigger>

        <h2 style={{ ...sectionLabel, marginTop: 24 }}>large (460px)</h2>
        <DemoTrigger label="Open large modal">
          {(open, setOpen) => (
            <Modal open={open} onOpenChange={setOpen}>
              <ModalContent size="lg">
                <ModalTitle>Detailed dialog</ModalTitle>
                <ModalDescription>
                  Body content — Esc to close, click outside to dismiss, Tab to
                  navigate.
                </ModalDescription>
                <ModalFooter>
                  <ModalClose asChild>
                    <button className="bd-btn">Done</button>
                  </ModalClose>
                </ModalFooter>
              </ModalContent>
            </Modal>
          )}
        </DemoTrigger>

        <h2 style={{ ...sectionLabel, marginTop: 24 }}>extra-large (560px)</h2>
        <DemoTrigger label="Open xl modal">
          {(open, setOpen) => (
            <Modal open={open} onOpenChange={setOpen}>
              <ModalContent size="xl">
                <ModalTitle>Wide content</ModalTitle>
                <ModalDescription>
                  Use xl for content-heavy dialogs (form rows, table previews,
                  multi-column inputs).
                </ModalDescription>
                <ModalFooter>
                  <ModalClose asChild>
                    <button className="bd-btn">Close</button>
                  </ModalClose>
                </ModalFooter>
              </ModalContent>
            </Modal>
          )}
        </DemoTrigger>
      </div>
    </OverlayMount>
  );
}

const root = document.getElementById("react-root");
if (root) createRoot(root).render(<Demo />);
