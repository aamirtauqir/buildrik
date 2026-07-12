import { Html, Head, Body, Container, Heading, Text, Button, Section, Hr } from "@react-email/components";

interface FormSubmissionProps {
  siteName: string;
  fields: { label: string; value: string }[];
  viewUrl: string;
}

export default function FormSubmission({
  siteName = "My Site",
  fields = [{ label: "Name", value: "Jane" }, { label: "Email", value: "jane@example.com" }],
  viewUrl = "https://app.buildrik.app/forms/xxx",
}: FormSubmissionProps) {
  const preview = fields.slice(0, 3);
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: "system-ui, sans-serif", backgroundColor: "#f8fafc" }}>
        <Container style={{ maxWidth: "600px", margin: "0 auto", backgroundColor: "white", borderRadius: "8px", padding: "40px" }}>
          <Heading style={{ fontSize: "20px", fontWeight: "700", color: "#0F172A", textAlign: "center" as const }}>
            New submission on {siteName}
          </Heading>
          <Section style={{ marginTop: "16px" }}>
            {preview.map((f) => (
              <Text key={f.label} style={{ fontSize: "14px", color: "#64748B", margin: "4px 0" }}>
                <strong style={{ color: "#0F172A" }}>{f.label}:</strong> {f.value}
              </Text>
            ))}
            {fields.length > 3 && (
              <Text style={{ fontSize: "12px", color: "#94A3B8" }}>
                +{fields.length - 3} more fields
              </Text>
            )}
          </Section>
          <Section style={{ textAlign: "center" as const, marginTop: "24px" }}>
            <Button href={viewUrl} style={{ backgroundColor: "#E42313", color: "white", padding: "12px 24px", borderRadius: "8px", fontSize: "14px", fontWeight: "600", textDecoration: "none" }}>
              View Submission
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
