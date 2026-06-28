import { Html, Head, Body, Container, Heading, Text, Button, Section, Hr } from "@react-email/components";

interface ReviewResolvedProps {
  siteName: string;
  approved: boolean;
  resolverName: string;
  note?: string;
  viewUrl: string;
}

export default function ReviewResolved({
  siteName = "My Site",
  approved = true,
  resolverName = "An admin",
  note,
  viewUrl = "https://app.buildrik.app/sites/xxx",
}: ReviewResolvedProps) {
  const headline = approved
    ? `“${siteName}” was approved`
    : `Changes requested on “${siteName}”`;
  const lead = approved
    ? `${resolverName} approved your review — the site is cleared to publish.`
    : `${resolverName} asked for changes before this site can go live.`;
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: "system-ui, sans-serif", backgroundColor: "#f8fafc" }}>
        <Container style={{ maxWidth: "600px", margin: "0 auto", backgroundColor: "white", borderRadius: "8px", padding: "40px" }}>
          <Heading style={{ fontSize: "20px", fontWeight: "700", color: approved ? "#15803D" : "#B45309", textAlign: "center" as const }}>
            {headline}
          </Heading>
          <Text style={{ fontSize: "14px", color: "#64748B", textAlign: "center" as const }}>
            {lead}
          </Text>
          {note ? (
            <Section style={{ marginTop: "20px", backgroundColor: "#F8FAFC", borderRadius: "6px", padding: "12px 16px" }}>
              <Text style={{ fontSize: "12px", fontWeight: "600", color: "#0F172A", margin: "0 0 4px" }}>Note from {resolverName}</Text>
              <Text style={{ fontSize: "13px", color: "#475569", margin: "0" }}>{note}</Text>
            </Section>
          ) : null}
          <Section style={{ textAlign: "center" as const, marginTop: "24px" }}>
            <Button href={viewUrl} style={{ backgroundColor: "#E42313", color: "white", padding: "12px 24px", borderRadius: "8px", fontSize: "14px", fontWeight: "600", textDecoration: "none" }}>
              Open site
            </Button>
          </Section>
          <Hr style={{ borderColor: "#E2E8F0", marginTop: "32px" }} />
          <Text style={{ fontSize: "12px", color: "#94A3B8", textAlign: "center" as const }}>
            Sent by Buildrik &middot; You can manage email preferences in your account settings.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
