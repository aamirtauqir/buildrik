import { Html, Head, Body, Container, Heading, Text, Button, Section, Hr } from "@react-email/components";

interface EmailChangedProps {
  verifyUrl: string;
}

export default function EmailChanged({ verifyUrl = "https://app.buildrick.io/auth/verify-email?token=xxx" }: EmailChangedProps) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: "system-ui, sans-serif", backgroundColor: "#f8fafc" }}>
        <Container style={{ maxWidth: "600px", margin: "0 auto", backgroundColor: "white", borderRadius: "8px", padding: "40px" }}>
          <Heading style={{ fontSize: "20px", fontWeight: "700", color: "#0F172A", textAlign: "center" as const }}>
            Verify your new email address
          </Heading>
          <Text style={{ fontSize: "14px", color: "#64748B", textAlign: "center" as const }}>
            You requested an email address change on your Buildrick account. Click below to verify your new address.
          </Text>
          <Section style={{ textAlign: "center" as const, marginTop: "24px" }}>
            <Button href={verifyUrl} style={{ backgroundColor: "#E42313", color: "white", padding: "12px 24px", borderRadius: "8px", fontSize: "14px", fontWeight: "600", textDecoration: "none" }}>
              Verify
            </Button>
          </Section>
          <Text style={{ fontSize: "12px", color: "#94A3B8", textAlign: "center" as const, marginTop: "24px" }}>
            This link expires in 24 hours. If you didn&apos;t request this change, your current email remains active.
          </Text>
          <Hr style={{ borderColor: "#E2E8F0", marginTop: "32px" }} />
          <Text style={{ fontSize: "12px", color: "#94A3B8", textAlign: "center" as const }}>
            Sent by Buildrick
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
