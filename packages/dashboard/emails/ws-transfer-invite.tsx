import { Html, Head, Body, Container, Heading, Text, Button, Section, Hr } from "@react-email/components";

interface WsTransferInviteProps {
  workspaceName: string;
  acceptUrl: string;
}

export default function WsTransferInvite({ workspaceName = "My Workspace", acceptUrl = "https://app.buildrik.app/transfer/accept?token=xxx" }: WsTransferInviteProps) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: "system-ui, sans-serif", backgroundColor: "#f8fafc" }}>
        <Container style={{ maxWidth: "600px", margin: "0 auto", backgroundColor: "white", borderRadius: "8px", padding: "40px" }}>
          <Heading style={{ fontSize: "20px", fontWeight: "700", color: "#0F172A", textAlign: "center" as const }}>
            Accept workspace ownership
          </Heading>
          <Text style={{ fontSize: "14px", color: "#64748B", textAlign: "center" as const }}>
            You&apos;ve been invited to take ownership of &ldquo;{workspaceName}&rdquo;. Click below to accept.
          </Text>
          <Section style={{ textAlign: "center" as const, marginTop: "24px" }}>
            <Button href={acceptUrl} style={{ backgroundColor: "#E42313", color: "white", padding: "12px 24px", borderRadius: "8px", fontSize: "14px", fontWeight: "600", textDecoration: "none" }}>
              Accept
            </Button>
          </Section>
          <Text style={{ fontSize: "12px", color: "#94A3B8", textAlign: "center" as const, marginTop: "24px" }}>
            This link expires in 7 days. If you didn&apos;t expect this, you can safely ignore it.
          </Text>
          <Hr style={{ borderColor: "#E2E8F0", marginTop: "32px" }} />
          <Text style={{ fontSize: "12px", color: "#94A3B8", textAlign: "center" as const }}>
            Sent by Buildrik
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
