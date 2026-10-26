/**
 * useOnline — the browser's connection state, live (`online` / `offline`
 * events). Brand reads it for the offline states the boards draw (2L9 B6-B38
 * "Needs a connection to read a website", B6-B43 the offline banner): token
 * edits still apply locally; restore points and reading a website need the
 * server.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";

const read = () => (typeof navigator === "undefined" ? true : navigator.onLine !== false);

export function useOnline(): boolean {
  const [online, setOnline] = React.useState(read);
  React.useEffect(() => {
    const sync = () => setOnline(read());
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);
  return online;
}
