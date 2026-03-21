import { Html, Head, Body, Container, Section, Heading, Text, Button, Hr } from "@react-email/components";

interface TeamInviteProps {
  inviteUrl: string;
  inviterName: string;
  workspaceName: string;
}

export default function TeamInvite({
  inviteUrl = "https://app.buildrik.app/auth/invite?token=xxx",
  inviterName = "A teammate",
  workspaceName = "My Workspace",
}: TeamInviteProps) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: "system-ui, sans-serif", backgroundColor: "#f8fafc" }}>
        <Container style={{ maxWidth: "600px", margin: "0 auto", backgroundColor: "white", borderRadius: "8px", padding: "40px" }}>
          <Heading style={{ fontSize: "20px", fontWeight: "700", color: "#0F172A", textAlign: "center" as const }}>
            You've been invited!
          </Heading>
          <Text style={{ fontSize: "14px", color: "#64748B", textAlign: "center" as const }}>
            {inviterName} invited you to join {workspaceName} on Buildrik.
          </Text>
          <Section style={{ textAlign: "center" as const, marginTop: "24px" }}>
            <Button href={inviteUrl} style={{ backgroundColor: "#6366F1", color: "white", padding: "12px 24px", borderRadius: "8px", fontSize: "14px", fontWeight: "600", textDecoration: "none" }}>
              Accept Invite
            </Button>
          </Section>
          <Text style={{ fontSize: "12px", color: "#94A3B8", textAlign: "center" as const, marginTop: "24px" }}>
            This invite expires in 7 days.
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
