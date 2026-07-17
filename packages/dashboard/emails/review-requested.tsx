import { Html, Head, Body, Container, Heading, Text, Button, Section, Hr } from "@react-email/components";

interface ReviewRequestedProps {
  siteName: string;
  requesterName: string;
  note?: string;
  changeSummary?: string;
  reviewsUrl: string;
}

export default function ReviewRequested({
  siteName = "My Site",
  requesterName = "A teammate",
  note,
  changeSummary,
  reviewsUrl = "https://app.buildrick.io/dashboard/agency/reviews",
}: ReviewRequestedProps) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: "system-ui, sans-serif", backgroundColor: "#f8fafc" }}>
        <Container style={{ maxWidth: "600px", margin: "0 auto", backgroundColor: "white", borderRadius: "8px", padding: "40px" }}>
          <Heading style={{ fontSize: "20px", fontWeight: "700", color: "#0F172A", textAlign: "center" as const }}>
            {requesterName} sent &ldquo;{siteName}&rdquo; for review
          </Heading>
          <Text style={{ fontSize: "14px", color: "#64748B", textAlign: "center" as const }}>
            A content editor is asking you to review changes before they go live.
          </Text>
          {changeSummary ? (
            <Section style={{ marginTop: "20px", backgroundColor: "#F8FAFC", borderRadius: "6px", padding: "12px 16px" }}>
              <Text style={{ fontSize: "12px", fontWeight: "600", color: "#0F172A", margin: "0 0 4px" }}>What changed</Text>
              <Text style={{ fontSize: "13px", color: "#475569", margin: "0" }}>{changeSummary}</Text>
            </Section>
          ) : null}
          {note ? (
            <Section style={{ marginTop: "12px", backgroundColor: "#F8FAFC", borderRadius: "6px", padding: "12px 16px" }}>
              <Text style={{ fontSize: "12px", fontWeight: "600", color: "#0F172A", margin: "0 0 4px" }}>Note</Text>
              <Text style={{ fontSize: "13px", color: "#475569", margin: "0" }}>{note}</Text>
            </Section>
          ) : null}
          <Section style={{ textAlign: "center" as const, marginTop: "24px" }}>
            <Button href={reviewsUrl} style={{ backgroundColor: "#E42313", color: "white", padding: "12px 24px", borderRadius: "8px", fontSize: "14px", fontWeight: "600", textDecoration: "none" }}>
              Review now
            </Button>
          </Section>
          <Hr style={{ borderColor: "#E2E8F0", marginTop: "32px" }} />
          <Text style={{ fontSize: "12px", color: "#94A3B8", textAlign: "center" as const }}>
            Sent by Buildrick &middot; You can manage email preferences in your account settings.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
