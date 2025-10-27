import * as React from "react";
import { Html, Head, Preview, Body, Container, Section, Text, Img, Hr } from "@react-email/components";

export function PasswordUpdatedEmail({ name, companyName, companyLogo, mailReply }: { name: string; companyName: string; companyLogo?: string; mailReply: string }) {
  return (
    <Html>
      <Head />
      <Preview> Password Successfully Updated on {companyName} Account</Preview>
      <Body style={styles.body}>
        <Container style={styles.outerContainer}>
          <Container style={styles.container}>
            <Section style={styles.header}>
              {companyLogo ? <Img src={companyLogo} alt={`${companyName} Logo`} style={styles.logo} /> : null}
              <Text style={styles.companyName}>{companyName}</Text>
              <Hr style={styles.divider} />
            </Section>

            <Section style={styles.section}>
              <Text style={styles.greeting}>👋 Dear {name},</Text>
              <Text style={styles.successText}>
                We wanted to inform you that your password for your {companyName} account has been successfully updated.
              </Text>
              <Text style={styles.note}>If you did not request this change, please reset your password immediately and contact our support team.</Text>
            </Section>

            <Section style={styles.footerSection}>
              <Hr style={styles.divider} />
              <Text style={styles.disclaimer}>
                If you recognize this change, no further action is required. However, if you suspect any unauthorized activity, please contact our support team immediately.
              </Text>
              <Text style={styles.support}>
                For assistance, please reach out to us at <a href={`mailto:${mailReply}`}>{mailReply}</a>.
              </Text>
              <Text style={styles.disclaimer}>This is an automated message. Please do not reply to this email.</Text>
            </Section>
          </Container>
        </Container>
      </Body>
    </Html>
  );
}

const styles: Record<string, React.CSSProperties> = {
  body: { backgroundColor: "#f9f9f9", fontFamily: "Arial, sans-serif", padding: "20px" },
  outerContainer: { display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", padding: "40px 0" },
  container: { maxWidth: "600px", backgroundColor: "#ffffff", padding: "40px 20px", borderRadius: "10px", boxShadow: "0 6px 12px rgba(0, 0, 0, 0.1)" },
  header: { textAlign: "center", paddingBottom: "15px" },
  logo: { width: "120px", height: "auto", marginBottom: "10px" },
  companyName: { fontSize: "22px", fontWeight: "bold", color: "#333" },
  divider: { borderTop: "1px solid #ddd", margin: "15px 0" },
  section: { textAlign: "center", padding: "20px 0" },
  greeting: { fontSize: "18px", fontWeight: "bold", marginBottom: "10px", color: "#444" },
  successText: { fontSize: "14px", marginBottom: "8px", color: "#555" },
  note: { fontSize: "14px", marginTop: "10px", color: "#666" },
  footerSection: { textAlign: "center", marginTop: "20px" },
  support: { fontSize: "14px", color: "#666", marginBottom: "8px" },
  disclaimer: { fontSize: "12px", color: "#999", marginTop: "10px" },
};

