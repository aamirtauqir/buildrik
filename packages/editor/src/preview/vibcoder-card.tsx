import React from "react";
import { createRoot } from "react-dom/client";
import {
  Card,
  CardHeader,
  CardHeaderMeta,
  CardBody,
  CardFooter,
  CardTitle,
  CardDesc,
} from "../editor/shared/vibcoder/Card";
import { Button } from "../editor/shared/vibcoder/Button";
import { sectionLabel, stack } from "./_galleryStyles";

const stackWide = { ...stack, gap: 16, maxWidth: 480 };

function Demo() {
  return (
    <>
      <h2 style={sectionLabel}>elevated (default)</h2>
      <div style={stackWide}>
        <Card>
          <CardHeader>
            Page settings <CardHeaderMeta>updated 2h ago</CardHeaderMeta>
          </CardHeader>
          <CardBody>
            Configure how this page is indexed, shared, and surfaced across
            social previews.
          </CardBody>
          <CardFooter>
            <Button variant="ghost">Cancel</Button>
            <Button variant="primary">Save</Button>
          </CardFooter>
        </Card>
      </div>

      <h2 style={{ ...sectionLabel, marginTop: 24 }}>elevated — header only</h2>
      <div style={stackWide}>
        <Card>
          <CardHeader>
            Recent activity <CardHeaderMeta>last 7d</CardHeaderMeta>
          </CardHeader>
          <CardBody>
            12 deploys, 4 collaborators, 38 commits. No incidents.
          </CardBody>
        </Card>
      </div>

      <h2 style={{ ...sectionLabel, marginTop: 24 }}>flush — title + desc</h2>
      <div style={stackWide}>
        <Card flush>
          <CardTitle>Tip</CardTitle>
          <CardDesc>
            Use Cmd+K to open the command palette from anywhere in the editor.
          </CardDesc>
        </Card>
      </div>

      <h2 style={{ ...sectionLabel, marginTop: 24 }}>flush — multiple stacked</h2>
      <div style={stackWide}>
        <Card flush>
          <CardTitle>Connect a custom domain</CardTitle>
          <CardDesc>
            Point your DNS to our nameservers and verify ownership.
          </CardDesc>
        </Card>
        <Card flush>
          <CardTitle>Invite your team</CardTitle>
          <CardDesc>Add up to 10 collaborators on the Pro plan.</CardDesc>
        </Card>
      </div>
    </>
  );
}

const root = document.getElementById("react-root");
if (root) createRoot(root).render(<Demo />);
