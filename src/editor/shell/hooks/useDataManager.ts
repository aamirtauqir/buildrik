/**
 * Data Manager Hook
 * Provides data source management from composer's DataManager
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../../engine";
import type { DataSource, DataBinding, DataResolverResult } from "../../../shared/types/data";

export interface UseDataManagerResult {
  /** All registered data sources */
  sources: DataSource[];
  /** Register a new data source */
  registerSource: (source: DataSource) => void;
  /** Unregister a data source */
  unregisterSource: (id: string) => void;
  /** Get a specific data source */
  getSource: (id: string) => DataSource | undefined;
  /** Resolve a data binding to its value (async) */
  resolve: (binding: DataBinding) => Promise<DataResolverResult>;
  /** Update data source data */
  updateSourceData: (id: string, data: unknown) => void;
}

export function useDataManager(composer: Composer | null): UseDataManagerResult {
  const [sources, setSources] = React.useState<DataSource[]>([]);

  // Subscribe to data source changes
  React.useEffect(() => {
    if (!composer?.data) return;

    const updateSources = () => {
      setSources(composer.data.getAllSources());
    };

    composer.data.on("source:registered", updateSources);
    composer.data.on("source:unregistered", updateSources);
    composer.data.on("source:updated", updateSources);

    // Get initial state
    updateSources();

    return () => {
      composer.data.off("source:registered", updateSources);
      composer.data.off("source:unregistered", updateSources);
      composer.data.off("source:updated", updateSources);
    };
  }, [composer]);

  const registerSource = React.useCallback(
    (source: DataSource) => {
      composer?.data?.registerSource(source);
    },
    [composer]
  );

  const unregisterSource = React.useCallback(
    (id: string) => {
      composer?.data?.unregisterSource(id);
    },
    [composer]
  );

  const getSource = React.useCallback(
    (id: string): DataSource | undefined => {
      return composer?.data?.getSource(id);
    },
    [composer]
  );

  const resolve = React.useCallback(
    async (binding: DataBinding): Promise<DataResolverResult> => {
      if (!composer?.data) {
        return { success: false, value: undefined, error: "Data manager not available" };
      }
      return composer.data.resolve(binding);
    },
    [composer]
  );

  const updateSourceData = React.useCallback(
    (id: string, data: unknown) => {
      composer?.data?.updateSourceData(id, data);
    },
    [composer]
  );

  return {
    sources,
    registerSource,
    unregisterSource,
    getSource,
    resolve,
    updateSourceData,
  };
}

export default useDataManager;
