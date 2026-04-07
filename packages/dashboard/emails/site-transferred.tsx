import { Html, Head, Body, Container, Heading, Text, Button, Section, Hr } from "@react-email/components";

interface SiteTransferredProps {
  fromName: string;
  siteName: string;
  viewUrl: string;
}

export default function SiteTransferred({ fromName = "Alex", siteName = "My Site", viewUrl = "https://app.buildrik.app/sites/xxx" }: SiteTransferredProps) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: "system-ui, sans-serif", backgroundColor: "#f8fafc" }}>
        <Container style={{ maxWidth: "600px", margin: "0 auto", backgroundColor: "white", borderRadius: "8px", padding: "40px" }}>
          <Heading style={{ fontSize: "20px", fontWeight: "700", color: "#0F172A", textAlign: "center" as const }}>
            Site transferred to you
          </Heading>
          <Text style={{ fontSize: "14px", color: "#64748B", textAlign: "center" as const }}>
            {fromName} transferred &ldquo;{siteName}&rdquo; to you. You now have full ownership of this site.
          </Text>
          <Section style={{ textAlign: "center" as const, marginTop: "24px" }}>
            <Button href={viewUrl} style={{ backgroundColor: "#E42313", color: "white", padding: "12px 24px", borderRadius: "8px", fontSize: "14px", fontWeight: "600", textDecoration: "none" }}>
              View Site
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
