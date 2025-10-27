import * as React from "react";
import { render } from "@react-email/render";
import { Html, Head, Preview, Body, Container, Section, Text, Img, Hr, Button } from "@react-email/components";

export function OnboardingConfirmationEmail({ name, companyName, companyLogo, mailReply, trialUrl, username, password }: { name: string; companyName: string; companyLogo?: string; mailReply: string; trialUrl: string; username: string; password: string }) {
  return (
    <Html>
      <Head />
      <Preview>🏢 Welcome to {companyName}! Your Free Trial is Ready</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Section style={styles.header}>
            {/* {companyLogo ? <Img src={companyLogo} alt={`${companyName} Logo`} style={styles.logo} /> : null} */}
            <Text style={styles.companyName}>{companyName}</Text>
            <Hr style={styles.divider} />
          </Section>

          <Section style={styles.section}>
            <Text style={styles.greeting}>👋 Welcome to our platform, {name}!</Text>
            <Text style={styles.message}>Thank you for signing up for a free trial. We are pleased to inform you that your 30-day free trial has been successfully created.</Text>
            <Text style={styles.note}>You can use the following credentials to access your trial subscription:</Text>
            {/* <Text style={styles.credentials}><strong>URL:</strong> <a href={trialUrl}>{trialUrl}</a></Text> */}
            <Text style={styles.credentials}><strong>Username:</strong> {username}</Text>
            <Text style={styles.credentials}><strong>Password:</strong> {password}</Text>
            <Button href={trialUrl} style={styles.button}>Click here to Login</Button>
          </Section>

          <Section style={styles.footerSection}>
            <Hr style={styles.divider} />
            <Text style={styles.footer}>Welcome aboard! 🚀</Text>
            <Text style={styles.support}>Need help? Contact us at <a href={`mailto:${mailReply}`}>{mailReply}</a></Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Define TypeScript type for styles
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
  credentials: { fontSize: "14px", fontWeight: "bold", color: "#333", marginTop: "5px" },
  button: { backgroundColor: "#365CCE", color: "#fff", padding: "10px 20px", fontSize: "16px", borderRadius: "8px", textDecoration: "none", display: "inline-block", marginTop: "15px" },
  footerSection: { textAlign: "center", marginTop: "20px" },
  footer: { fontSize: "16px", fontWeight: "bold", marginTop: "15px", color: "#444" },
  support: { fontSize: "14px", color: "#666", marginBottom: "8px" },
};


// Render for testing (optional)
console.log(
    render(
      <OnboardingConfirmationEmail 
        name="John Doe"
        companyName="Your Company"
        companyLogo="https://yourcompany.com/logo.png"
        mailReply="support@yourcompany.com"
        trialUrl="https://yourcompany.com/trial"
        username="johndoe"
        password="securepassword"
      />
    )
  );