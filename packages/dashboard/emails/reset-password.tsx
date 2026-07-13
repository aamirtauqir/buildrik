import { Html, Head, Body, Container, Section, Heading, Text, Button, Hr } from "@react-email/components";

interface ResetPasswordProps {
  resetUrl: string;
}

export default function ResetPassword({ resetUrl = "https://app.buildrick.io/auth/reset-password?token=xxx" }: ResetPasswordProps) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: "system-ui, sans-serif", backgroundColor: "#f8fafc" }}>
        <Container style={{ maxWidth: "600px", margin: "0 auto", backgroundColor: "white", borderRadius: "8px", padding: "40px" }}>
          <Heading style={{ fontSize: "20px", fontWeight: "700", color: "#0F172A", textAlign: "center" as const }}>
            Reset your password
          </Heading>
          <Text style={{ fontSize: "14px", color: "#64748B", textAlign: "center" as const }}>
            Click the button below to verify your email address and activate your Buildrick account.
          </Text>
          <Section style={{ textAlign: "center" as const, marginTop: "24px" }}>
            <Button href={resetUrl} style={{ backgroundColor: "#E42313", color: "white", padding: "12px 24px", borderRadius: "8px", fontSize: "14px", fontWeight: "600", textDecoration: "none" }}>
              Reset Password
            </Button>
          </Section>
          <Text style={{ fontSize: "12px", color: "#94A3B8", textAlign: "center" as const, marginTop: "24px" }}>
            This link expires in 1 hour. If you didn't request this, you can safely ignore this email.
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
