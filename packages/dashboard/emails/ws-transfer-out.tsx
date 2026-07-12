import { Html, Head, Body, Container, Heading, Text, Section, Hr } from "@react-email/components";

interface WsTransferOutProps {
  workspaceName: string;
  newOwnerEmail: string;
}

export default function WsTransferOut({ workspaceName = "My Workspace", newOwnerEmail = "new@example.com" }: WsTransferOutProps) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: "system-ui, sans-serif", backgroundColor: "#f8fafc" }}>
        <Container style={{ maxWidth: "600px", margin: "0 auto", backgroundColor: "white", borderRadius: "8px", padding: "40px" }}>
          <Heading style={{ fontSize: "20px", fontWeight: "700", color: "#0F172A", textAlign: "center" as const }}>
            Workspace transfer initiated
          </Heading>
          <Text style={{ fontSize: "14px", color: "#64748B", textAlign: "center" as const }}>
            You initiated a transfer of &ldquo;{workspaceName}&rdquo; to {newOwnerEmail}. The transfer will complete once they accept.
          </Text>
          <Section style={{ textAlign: "center" as const, marginTop: "24px" }}>
            <Text style={{ fontSize: "12px", color: "#94A3B8" }}>
              If you did not initiate this transfer, please contact support immediately.
            </Text>
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
