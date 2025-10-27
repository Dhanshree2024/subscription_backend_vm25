import * as React from "react";
import { Html, Head, Preview, Body, Container, Section, Text, Img, Hr, Button } from "@react-email/components";




export function UserPasswordResetAdminEmail(
  { name, inviter, companyName, companyLogo, mailReply, resetPasswordUrl ,verified}:
   { name: string; inviter: string; companyName: string; companyLogo?: string; mailReply: string; resetPasswordUrl: string; verified?: boolean; }) {
 
 console.log("📩 Email Render Props:", {
  name, inviter, companyName, mailReply, resetPasswordUrl, verified,
});

 
  return (
    <Html>
      <Head />
      <Preview>📩 Password Reset for {companyName} Portal</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Section style={styles.header}>
            {/* {companyLogo ? <Img src={companyLogo} alt={`${companyName} Logo`} style={styles.logo} /> : null} */}
            <Text style={styles.companyName}>{companyName}</Text>
            <Hr style={styles.divider} />
          </Section>

          <Section style={styles.section}>
            <Text style={styles.greeting}>👋 Dear {name},</Text>
            <Text style={styles.message}>Your account password for the {companyName} portal has been reset by {inviter} .</Text>
            <Text style={styles.note}>To continue accessing your account, 
                please click the link below and update your password.
            </Text>

            <Button href={resetPasswordUrl} style={styles.button}>Reset Password</Button>
        
          </Section>

          <Section style={styles.footerSection}>
            <Hr style={styles.divider} />
            <Text style={styles.footer}>Thanks for trusting {companyName}! 🚀</Text>
            <Text style={styles.support}>If you have any questions, feel free to reach out to us at <a href={`mailto:${mailReply}`}>{mailReply}</a></Text>
            <Text style={styles.disclaimer}>This is a system-generated mail, do not reply.</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const styles: Record<string, React.CSSProperties> = {
  body: { backgroundColor: "#f9f9f9", fontFamily: "Arial, sans-serif", padding: "20px" },
  container: { maxWidth: "600px", margin: "auto", backgroundColor: "#ffffff", padding: "20px", borderRadius: "10px", boxShadow: "0 6px 12px rgba(0, 0, 0, 0.1), 0 -6px 12px rgba(0, 0, 0, 0.1)" },
  header: { textAlign: "center", paddingBottom: "15px" },
  logo: { width: "120px", height: "auto", marginBottom: "10px" },
  companyName: { fontSize: "22px", fontWeight: "bold", color: "#333" },
  divider: { borderTop: "1px solid #ddd", margin: "15px 0" },
  section: { textAlign: "center", padding: "10px 0" },
  greeting: { fontSize: "18px", fontWeight: "bold", marginBottom: "10px", color: "#444" },
  message: { fontSize: "16px", marginBottom: "8px", color: "#555" },
  note: { fontSize: "14px", marginTop: "10px", color: "#666" },
  button: { backgroundColor: "#365CCE", color: "#fff", padding: "10px 20px", fontSize: "16px", borderRadius: "8px", textDecoration: "none", display: "inline-block", marginTop: "15px" },
  footerSection: { textAlign: "center", marginTop: "20px" },
  footer: { fontSize: "16px", fontWeight: "bold", marginTop: "15px", color: "#444" },
  support: { fontSize: "14px", color: "#666", marginBottom: "8px" },
  disclaimer: { fontSize: "12px", color: "#999", marginTop: "10px" },
};
