import * as React from "react";
import { Html, Head, Preview, Body, Container, Section, Text, Img, Hr, Button } from "@react-email/components";
import { render } from "@react-email/render";

export function LoginVerificationEmail({ name, otp, companyName, companyLogo,mailReply }: { name: string; otp: string; companyName: string; companyLogo: string,mailReply: string }) {
  return (
    <Html>
      <Head />
      <Preview>🔐 OTP for Your {companyName} Account</Preview>
      <Body style={styles.body}>
                <Container style={styles.outerContainer}>
        
        <Container style={styles.container}>
          <Section style={styles.header}>
            {/* <Img src={companyLogo} alt={`${companyName} Logo`} style={styles.logo} /> */}
            <Text style={styles.companyName}>{companyName}</Text>
            <Hr style={styles.divider} />
          </Section>

          <Section style={styles.section}>
            <Text style={styles.greeting}>👋 Hello {name},</Text>
            <Text style={styles.otpText}>Your One-Time Password (OTP) is:</Text>
            <Text style={styles.otp}>{otp}</Text>
            <Text style={styles.note}>This OTP is valid for 5 minutes. Do not share it with anyone.</Text>
            {/* <Button href="#" style={styles.button}>Verify Email</Button> */}
          </Section>

          <Section style={styles.footerSection}>
            <Hr style={styles.divider} />
            <Text style={styles.footer}>Thanks for choosing {companyName}! 🚀</Text>
            <Text style={styles.support}>Need help? Contact us at <a href={`mailto:${companyName}`}>{mailReply}</a></Text>
          </Section>
        </Container>
        </Container>
        
      </Body>
    </Html>
  );
}

// Define TypeScript type for styles
const styles: Record<string, React.CSSProperties> = {
    body: { backgroundColor: "#f9f9f9", fontFamily: "Arial, sans-serif", padding: "20px" },
    outerContainer: { display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", padding: "40px 0" },
    container: { maxWidth: "600px", margin: "auto", backgroundColor: "#ffffff", padding: "20px", borderRadius: "10px",   boxShadow: "0 6px 12px rgba(0, 0, 0, 0.1), 0 -6px 12px rgba(0, 0, 0, 0.1)" },
    header: { textAlign: "center", paddingBottom: "15px" },
    logo: { width: "120px", height: "auto", marginBottom: "10px" },
    companyName: { fontSize: "22px", fontWeight: "bold", color: "#333" },
    divider: { borderTop: "1px solid #ddd", margin: "15px 0" },
    section: { textAlign: "center", padding: "10px 0" },
    greeting: { fontSize: "18px", fontWeight: "bold", marginBottom: "10px", color: "#444" },
    otpText: { fontSize: "16px", marginBottom: "8px", color: "#555" },
    otp: { fontSize: "26px", fontWeight: "bold", color: "#ff5733", padding: "12px", backgroundColor: "#f4f4f4", display: "inline-block", borderRadius: "8px", letterSpacing: "2px" },
    note: { fontSize: "14px", marginTop: "10px", color: "#666" },
    button: { backgroundColor: "#365CCE", color: "#666", padding: "10px 20px", fontSize: "16px", borderRadius: "8px", textDecoration: "none", display: "inline-block", marginTop: "15px" },
    footerSection: { textAlign: "center", marginTop: "20px" },
    footer: { fontSize: "16px", fontWeight: "bold", marginTop: "15px", color: "#444" },
    support: { fontSize: "14px", color: "#666", marginBottom: "8px" },
    disclaimer: { fontSize: "12px", color: "#999", marginTop: "10px" },
  };
  
// Render for testing (optional)
// console.log(render(<LoginVerificationEmail name="John Doe" otp="123456" companyName="NORBIK" companyLogo="https://your-company-logo.com/logo.png" />));
