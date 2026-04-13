/**
 * MediaCommandLayer contract tests.
 *
 * Uses a stub Composer that implements only the fields MediaCommandLayer
 * reads. This lets us verify the UI-facing contract — what events fire,
 * what result shape the UI gets, how typed errors flow — without pulling
 * in the 30+ Composer managers.
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect, vi } from "vitest";
import { MediaCommandLayer } from "../MediaCommandLayer";
import { MediaNoActivePageError } from "../MediaStorageTypes";
import { MEDIA_EVENTS } from "../../../shared/constants/media";
import type { Composer } from "../../Composer";

// Minimal stub matching what MediaCommandLayer touches.
interface StubElement {
  id: string;
  src?: string;
  bgImage?: string;
}

function makeStubComposer(options: {
  insertMediaAtResult?: ReturnType<
    import("../../elements/ElementManager").ElementManager["insertMediaAt"]
  >;
  elementsBySrc?: StubElement[];
  /** Throw on this elementId during setAttribute — simulates failure in replaceAcross */
  failOnElementId?: string;
} = {}) {
  const events: Array<{ event: string; payload: unknown }> = [];
  const elementState: Record<string, StubElement> = {};
  for (const el of options.elementsBySrc ?? []) elementState[el.id] = { ...el };

  type ComposerShape = Pick<
    Composer,
    "elements" | "media" | "beginTransaction" | "endTransaction" | "rollbackTransaction" | "emit"
  >;

  const composer = {
    elements: {
      insertMediaAt: vi.fn(() => options.insertMediaAtResult ?? null),
      findByMediaSrc: vi.fn((src: string) =>
        Object.values(elementState)
          .filter((el) => el.src === src || (el.bgImage && el.bgImage.includes(src)))
          .map((el) => makeElementFacade(el)),
      ),
      getElement: vi.fn((id: string) =>
        elementState[id] ? makeElementFacade(elementState[id]) : undefined,
      ),
    },
    media: {
      emitEvent: (event: string, payload: unknown) => events.push({ event, payload }),
    },
    beginTransaction: vi.fn(),
    endTransaction: vi.fn(),
    rollbackTransaction: vi.fn(),
    emit: vi.fn(),
  };

  function makeElementFacade(el: StubElement) {
    return {
      getId: () => el.id,
      getAttribute: (name: string) => (name === "src" ? el.src : undefined),
      getStyle: (prop: string) => (prop === "background-image" ? el.bgImage : undefined),
      setAttribute: (name: string, value: string) => {
        if (options.failOnElementId === el.id) throw new Error("simulated write failure");
        if (name === "src") el.src = value;
      },
      setStyle: (prop: string, value: string) => {
        if (options.failOnElementId === el.id) throw new Error("simulated write failure");
        if (prop === "background-image") el.bgImage = value;
      },
    };
  }

  return {
    composer: composer as unknown as ComposerShape as Composer,
    events,
    elementState,
  };
}

describe("MediaCommandLayer.insertMediaAt — font path", () => {
  it("returns font-applied result and emits INSERT_SUCCEEDED when text is selected", () => {
    const { composer, events } = makeStubComposer({
      insertMediaAtResult: { kind: "font-applied", elementIds: ["text-1", "text-2"] },
    });
    const cmd = new MediaCommandLayer(composer);

    const result = cmd.insertMediaAt("Inter", "font", { path: "click" });

    expect(result).toEqual({ elementId: "text-1", kind: "font-applied" });
    expect(events).toEqual([
      {
        event: MEDIA_EVENTS.INSERT_SUCCEEDED,
        payload: { src: "Inter", type: "font", elementIds: ["text-1", "text-2"], path: "click" },
      },
    ]);
  });

  it("emits INSERT_FAILED with reason=no-text-selected when nothing is selected", () => {
    const { composer, events } = makeStubComposer({
      insertMediaAtResult: { kind: "failed", reason: "no-text-selected" },
    });
    const cmd = new MediaCommandLayer(composer);

    const result = cmd.insertMediaAt("Inter", "font");

    expect(result).toBeNull();
    expect(events).toEqual([
      {
        event: MEDIA_EVENTS.INSERT_FAILED,
        payload: { reason: "no-text-selected", src: "Inter", type: "font" },
      },
    ]);
  });

  it("throws MediaNoActivePageError when reason=no-active-page", () => {
    const { composer, events } = makeStubComposer({
      insertMediaAtResult: { kind: "failed", reason: "no-active-page" },
    });
    const cmd = new MediaCommandLayer(composer);

    expect(() => cmd.insertMediaAt("any", "image")).toThrow(MediaNoActivePageError);
    // The INSERT_FAILED event fires even though we also throw, so the UI
    // telemetry records the reason.
    expect(events[0].event).toBe(MEDIA_EVENTS.INSERT_FAILED);
  });
});

describe("MediaCommandLayer.replaceAcross — partial failure contract", () => {
  it("when every element succeeds, returns clean=true and emits REPLACE_COMMITTED", () => {
    const { composer, events } = makeStubComposer({
      elementsBySrc: [
        { id: "el-1", src: "old.png" },
        { id: "el-2", src: "old.png" },
      ],
    });
    const cmd = new MediaCommandLayer(composer);

    const result = cmd.replaceAcross("old.png", "new.png");

    expect(result.clean).toBe(true);
    expect(result.replaced).toHaveLength(2);
    expect(result.failed).toHaveLength(0);

    const eventNames = events.map((e) => e.event);
    expect(eventNames).toContain(MEDIA_EVENTS.REPLACE_OPENED);
    expect(eventNames).toContain(MEDIA_EVENTS.REPLACE_COMMITTED);
    expect(eventNames).not.toContain(MEDIA_EVENTS.REPLACE_PARTIAL);
  });

  it("when some elements fail, commits the successes, returns failed[], emits REPLACE_PARTIAL", () => {
    const { composer, events } = makeStubComposer({
      elementsBySrc: [
        { id: "el-1", src: "old.png" },
        { id: "el-2", src: "old.png" },
        { id: "el-3", src: "old.png" },
      ],
      failOnElementId: "el-2",
    });
    const cmd = new MediaCommandLayer(composer);

    const result = cmd.replaceAcross("old.png", "new.png");

    expect(result.clean).toBe(false);
    expect(result.replaced).toHaveLength(2);
    expect(result.failed).toEqual([
      { elementId: "el-2", error: "simulated write failure" },
    ]);

    const partialEvt = events.find((e) => e.event === MEDIA_EVENTS.REPLACE_PARTIAL);
    expect(partialEvt).toBeDefined();
    expect(partialEvt?.payload).toMatchObject({
      oldSrc: "old.png",
      newSrc: "new.png",
      succeeded: 2,
      failed: [{ elementId: "el-2", error: "simulated write failure" }],
    });
  });

  it("when every element fails, rolls back the transaction and emits REPLACE_ROLLED_BACK", () => {
    const { composer, events } = makeStubComposer({
      elementsBySrc: [
        { id: "el-1", src: "old.png" },
        { id: "el-2", src: "old.png" },
      ],
      // Fail BOTH elements so the batch is fully rolled back.
      failOnElementId: "el-1",
    });
    // Second-element failure — stub only throws on one id, so swap: replace both
    // by making any element fail. For this test we need all-fail, so use a fresh stub
    // that throws on every setAttribute/setStyle call.
    const everyFailComposer = makeStubComposer({
      elementsBySrc: [
        { id: "el-1", src: "old.png" },
        { id: "el-2", src: "old.png" },
      ],
    });
    // Monkey-patch getElement to return elements whose setAttribute always throws.
    (everyFailComposer.composer.elements.findByMediaSrc as ReturnType<typeof vi.fn>)
      .mockImplementation(() => [
        {
          getId: () => "el-1",
          getAttribute: () => "old.png",
          getStyle: () => undefined,
          setAttribute: () => {
            throw new Error("boom");
          },
          setStyle: () => {},
        },
        {
          getId: () => "el-2",
          getAttribute: () => "old.png",
          getStyle: () => undefined,
          setAttribute: () => {
            throw new Error("boom");
          },
          setStyle: () => {},
        },
      ]);

    const cmd = new MediaCommandLayer(everyFailComposer.composer);
    const result = cmd.replaceAcross("old.png", "new.png");

    expect(result.clean).toBe(false);
    expect(result.replaced).toHaveLength(0);
    expect(result.failed).toHaveLength(2);

    // Transaction was begun and rolled back, not committed.
    expect((everyFailComposer.composer.beginTransaction as ReturnType<typeof vi.fn>)).toHaveBeenCalled();
    expect((everyFailComposer.composer.rollbackTransaction as ReturnType<typeof vi.fn>)).toHaveBeenCalled();
    expect((everyFailComposer.composer.endTransaction as ReturnType<typeof vi.fn>)).not.toHaveBeenCalled();

    const rolledBackEvt = everyFailComposer.events.find(
      (e) => e.event === MEDIA_EVENTS.REPLACE_ROLLED_BACK,
    );
    expect(rolledBackEvt).toBeDefined();
    // Also suppresses unused-var lint on `composer` created above.
    void composer;
  });
});

describe("MediaCommandLayer.getUsages / isInUse", () => {
  it("counts elements returned by findByMediaSrc", () => {
    const { composer } = makeStubComposer({
      elementsBySrc: [
        { id: "a", src: "logo.png" },
        { id: "b", src: "logo.png" },
        { id: "c", src: "other.png" },
      ],
    });
    const cmd = new MediaCommandLayer(composer);

    expect(cmd.getUsages("logo.png").count).toBe(2);
    expect(cmd.isInUse("logo.png")).toBe(true);
    expect(cmd.isInUse("missing.png")).toBe(false);
  });
});
