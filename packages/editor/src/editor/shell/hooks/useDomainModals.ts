/**
 * useDomainModals — D4b Stage 1 extraction (audit-remediation 2026-05-08).
 *
 * Lifted out of useStudioModals.ts. Holds the 3 modals tied to
 * specific domain workflows (e-commerce + components + CMS):
 *   • collectionSetup — e-commerce onboarding ("create your store")
 *   • createComponent — convert an element into a reusable component
 *   • cmsCollectionSetup — WS-14a CMS collection wizard
 *
 * Returns the flat field shape useStudioModals already exposes — the
 * composer in useStudioModals merges it with the other two sub-hooks
 * and the `closeAll` utility, so consumers see no change.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type {
  CollectionSetupContext,
  CreateComponentContext,
  SaveAsComponentContext,
} from "./useStudioModals";

export interface UseDomainModalsReturn {
  // Collection Setup (e-commerce)
  showCollectionSetup: boolean;
  collectionSetupContext: CollectionSetupContext | null;
  openCollectionSetup: (
    onConfirm: (includeSampleData: boolean) => Promise<void>,
  ) => void;
  closeCollectionSetup: () => void;

  // Create Component
  showCreateComponent: boolean;
  createComponentContext: CreateComponentContext | null;
  openCreateComponent: (elementId: string) => void;
  closeCreateComponent: () => void;

  // Save as Component (T12 — canvas right-click; carries selectionIds + extractedBindings)
  showSaveAsComponent: boolean;
  saveAsComponentContext: SaveAsComponentContext | null;
  openSaveAsComponent: (context: SaveAsComponentContext) => void;
  closeSaveAsComponent: () => void;

  // CMS Collection Setup (WS-14a)
  showCMSCollectionSetup: boolean;
  openCMSCollectionSetup: () => void;
  closeCMSCollectionSetup: () => void;

  // CMS Records management
  showCMSRecords: boolean;
  openCMSRecords: () => void;
  closeCMSRecords: () => void;

  /** Reset every modal in this hook (called by useStudioModals.closeAll). */
  resetDomainModals: () => void;
}

export function useDomainModals(): UseDomainModalsReturn {
  const [showCollectionSetup, setShowCollectionSetup] = React.useState(false);
  const [collectionSetupContext, setCollectionSetupContext] =
    React.useState<CollectionSetupContext | null>(null);

  const [showCreateComponent, setShowCreateComponent] = React.useState(false);
  const [createComponentContext, setCreateComponentContext] =
    React.useState<CreateComponentContext | null>(null);

  const [showSaveAsComponent, setShowSaveAsComponent] = React.useState(false);
  const [saveAsComponentContext, setSaveAsComponentContext] =
    React.useState<SaveAsComponentContext | null>(null);

  const [showCMSCollectionSetup, setShowCMSCollectionSetup] = React.useState(false);
  const [showCMSRecords, setShowCMSRecords] = React.useState(false);

  const openCollectionSetup = React.useCallback(
    (onConfirm: (includeSampleData: boolean) => Promise<void>) => {
      setCollectionSetupContext({ onConfirm });
      setShowCollectionSetup(true);
    },
    [],
  );
  const closeCollectionSetup = React.useCallback(() => {
    setShowCollectionSetup(false);
    setCollectionSetupContext(null);
  }, []);

  const openCreateComponent = React.useCallback((elementId: string) => {
    setCreateComponentContext({ elementId });
    setShowCreateComponent(true);
  }, []);
  const closeCreateComponent = React.useCallback(() => {
    setShowCreateComponent(false);
    setCreateComponentContext(null);
  }, []);

  const openSaveAsComponent = React.useCallback((context: SaveAsComponentContext) => {
    setSaveAsComponentContext(context);
    setShowSaveAsComponent(true);
  }, []);
  const closeSaveAsComponent = React.useCallback(() => {
    setShowSaveAsComponent(false);
    setSaveAsComponentContext(null);
  }, []);

  const openCMSCollectionSetup = React.useCallback(() => setShowCMSCollectionSetup(true), []);
  const closeCMSCollectionSetup = React.useCallback(() => setShowCMSCollectionSetup(false), []);

  const openCMSRecords = React.useCallback(() => setShowCMSRecords(true), []);
  const closeCMSRecords = React.useCallback(() => setShowCMSRecords(false), []);

  const resetDomainModals = React.useCallback(() => {
    setShowCollectionSetup(false);
    setCollectionSetupContext(null);
    setShowCreateComponent(false);
    setCreateComponentContext(null);
    setShowSaveAsComponent(false);
    setSaveAsComponentContext(null);
    setShowCMSCollectionSetup(false);
    setShowCMSRecords(false);
  }, []);

  return {
    showCollectionSetup,
    collectionSetupContext,
    openCollectionSetup,
    closeCollectionSetup,
    showCreateComponent,
    createComponentContext,
    openCreateComponent,
    closeCreateComponent,
    showSaveAsComponent,
    saveAsComponentContext,
    openSaveAsComponent,
    closeSaveAsComponent,
    showCMSCollectionSetup,
    openCMSCollectionSetup,
    closeCMSCollectionSetup,
    showCMSRecords,
    openCMSRecords,
    closeCMSRecords,
    resetDomainModals,
  };
}
