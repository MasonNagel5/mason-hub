// Starter CompTIA Security+ SY0-701 flashcard deck, organized by the five exam
// domains. Cards are content; review state lives in the flashcard_progress table.
// Mason can add his own cards later (stored in the same table-backed flow).

export const DOMAINS = [
  { id: "1", name: "General Security Concepts", weight: 12 },
  { id: "2", name: "Threats, Vulnerabilities & Mitigations", weight: 22 },
  { id: "3", name: "Security Architecture", weight: 18 },
  { id: "4", name: "Security Operations", weight: 28 },
  { id: "5", name: "Security Program Management & Oversight", weight: 20 },
];

export const CARDS = [
  // ---- Domain 1: General Security Concepts ----
  { id: "d1-01", domain: "1", front: "What are the three components of the CIA triad?", back: "Confidentiality, Integrity, Availability." },
  { id: "d1-02", domain: "1", front: "What does the AAA framework stand for?", back: "Authentication, Authorization, and Accounting." },
  { id: "d1-03", domain: "1", front: "Difference between authentication and authorization?", back: "Authentication proves who you are; authorization determines what you're allowed to do." },
  { id: "d1-04", domain: "1", front: "What is non-repudiation and how is it achieved?", back: "Assurance that someone cannot deny an action. Achieved with digital signatures and logging." },
  { id: "d1-05", domain: "1", front: "Name the control categories in Security+.", back: "Technical, Managerial, Operational, and Physical." },
  { id: "d1-06", domain: "1", front: "Name the control types.", back: "Preventive, Deterrent, Detective, Corrective, Compensating, Directive." },
  { id: "d1-07", domain: "1", front: "What is the principle of least privilege?", back: "Users/processes get only the minimum access needed to do their job." },
  { id: "d1-08", domain: "1", front: "What is Zero Trust's core assumption?", back: "Never trust, always verify — no implicit trust based on network location. Verify every request." },
  { id: "d1-09", domain: "1", front: "In Zero Trust, what are the control plane and data plane?", back: "Control plane makes access decisions (policy engine/administrator); data plane enforces them (policy enforcement point)." },
  { id: "d1-10", domain: "1", front: "What is the gap analysis?", back: "Comparing current security posture against a desired/target state to identify what's missing." },
  { id: "d1-11", domain: "1", front: "What does a honeypot do?", back: "A decoy system that lures attackers to study their behavior and divert them from real assets." },
  { id: "d1-12", domain: "1", front: "What is the difference between encryption and hashing?", back: "Encryption is reversible (with a key) for confidentiality; hashing is one-way for integrity." },

  // ---- Domain 2: Threats, Vulnerabilities & Mitigations ----
  { id: "d2-01", domain: "2", front: "Difference between a virus and a worm?", back: "A virus needs a host/user action to spread; a worm self-propagates across networks without user action." },
  { id: "d2-02", domain: "2", front: "What is a logic bomb?", back: "Malicious code that executes when a specific condition is met (e.g., a date or event)." },
  { id: "d2-03", domain: "2", front: "What distinguishes a RAT?", back: "Remote Access Trojan — malware giving an attacker remote control over the infected host." },
  { id: "d2-04", domain: "2", front: "What is the difference between a threat, vulnerability, and risk?", back: "Threat = potential danger; Vulnerability = weakness; Risk = likelihood a threat exploits a vulnerability × impact." },
  { id: "d2-05", domain: "2", front: "What is a zero-day vulnerability?", back: "A flaw unknown to the vendor with no available patch, so defenders have had zero days to fix it." },
  { id: "d2-06", domain: "2", front: "Define SQL injection.", back: "Inserting malicious SQL into input fields to manipulate a backend database. Mitigate with input validation and parameterized queries." },
  { id: "d2-07", domain: "2", front: "Difference between stored (persistent) and reflected XSS?", back: "Stored XSS is saved on the server and served to many users; reflected XSS is delivered via a crafted request/link to one victim." },
  { id: "d2-08", domain: "2", front: "What is a race condition (TOCTOU)?", back: "Time-of-check to time-of-use: a flaw where state changes between when it's checked and when it's used." },
  { id: "d2-09", domain: "2", front: "Phishing vs. spear phishing vs. whaling?", back: "Phishing = broad; spear phishing = targeted at specific individuals; whaling = targets executives/high-value people." },
  { id: "d2-10", domain: "2", front: "What is privilege escalation (vertical vs. horizontal)?", back: "Vertical = gaining higher privileges (user→admin); horizontal = accessing another user's same-level resources." },
  { id: "d2-11", domain: "2", front: "What is a supply chain attack?", back: "Compromising a trusted vendor/component to reach the real target (e.g., poisoned software updates)." },
  { id: "d2-12", domain: "2", front: "What is the purpose of fuzzing?", back: "Sending malformed/random inputs to find crashes and vulnerabilities in software." },

  // ---- Domain 3: Security Architecture ----
  { id: "d3-01", domain: "3", front: "AES vs. RSA — symmetric or asymmetric?", back: "AES is symmetric (one shared key); RSA is asymmetric (public/private key pair)." },
  { id: "d3-02", domain: "3", front: "What problem does asymmetric crypto solve over symmetric?", back: "Secure key exchange — you can share a public key openly without exposing the private key." },
  { id: "d3-03", domain: "3", front: "How does a digital signature work?", back: "Hash the message, encrypt the hash with the sender's private key. Recipient verifies with sender's public key — provides integrity, authentication, non-repudiation." },
  { id: "d3-04", domain: "3", front: "What is PKI?", back: "Public Key Infrastructure — the framework of CAs, certificates, and keys for managing public-key encryption and trust." },
  { id: "d3-05", domain: "3", front: "What does a Certificate Authority (CA) do?", back: "Issues and digitally signs certificates that bind a public key to an identity." },
  { id: "d3-06", domain: "3", front: "OCSP vs. CRL?", back: "Both check certificate revocation; CRL is a downloaded list, OCSP queries status in real time per certificate." },
  { id: "d3-07", domain: "3", front: "What is perfect forward secrecy?", back: "Session keys aren't derived from a long-term key, so compromising one key doesn't expose past sessions." },
  { id: "d3-08", domain: "3", front: "What is a TPM?", back: "Trusted Platform Module — a hardware chip that securely stores keys and supports full-disk encryption (e.g., BitLocker)." },
  { id: "d3-09", domain: "3", front: "TPM vs. HSM?", back: "TPM is built into a device's motherboard; an HSM is a dedicated, often removable, high-assurance key-management appliance." },
  { id: "d3-10", domain: "3", front: "What is salting and why is it used?", back: "Adding random data to a password before hashing so identical passwords hash differently — defeats rainbow tables." },
  { id: "d3-11", domain: "3", front: "What is a SASE architecture?", back: "Secure Access Service Edge — converges networking (SD-WAN) and security (SWG, CASB, ZTNA) into a cloud-delivered service." },
  { id: "d3-12", domain: "3", front: "Difference between tokenization and encryption?", back: "Tokenization replaces data with a non-sensitive token mapped in a vault; encryption mathematically transforms data with a key." },

  // ---- Domain 4: Security Operations ----
  { id: "d4-01", domain: "4", front: "What does a SIEM do?", back: "Security Information and Event Management — aggregates and correlates logs from across the environment for monitoring and alerting." },
  { id: "d4-02", domain: "4", front: "SOAR — what is it for?", back: "Security Orchestration, Automation, and Response — automates and orchestrates incident response with playbooks." },
  { id: "d4-03", domain: "4", front: "List the incident response phases (NIST).", back: "Preparation; Detection & Analysis; Containment, Eradication & Recovery; Post-incident activity (lessons learned)." },
  { id: "d4-04", domain: "4", front: "Order of volatility — collect what first?", back: "Most volatile first: CPU registers/cache → RAM → network state → disk → logs/archives." },
  { id: "d4-05", domain: "4", front: "What is the chain of custody?", back: "Documentation tracking who handled evidence and when, preserving its integrity for legal use." },
  { id: "d4-06", domain: "4", front: "Difference between vulnerability scanning and penetration testing?", back: "Scanning identifies known weaknesses (often automated); pen testing actively exploits them to prove impact." },
  { id: "d4-07", domain: "4", front: "What is a false positive vs. false negative in alerting?", back: "False positive = alert with no real threat; false negative = a real threat that produced no alert (more dangerous)." },
  { id: "d4-08", domain: "4", front: "MDM in mobile security — what does it manage?", back: "Mobile Device Management — enforces policy, remote wipe, encryption, and app control on mobile devices." },
  { id: "d4-09", domain: "4", front: "What is DLP?", back: "Data Loss Prevention — detects and blocks unauthorized transfer of sensitive data." },
  { id: "d4-10", domain: "4", front: "MTTR, RTO, RPO — define each.", back: "MTTR = mean time to repair; RTO = max tolerable downtime; RPO = max tolerable data loss (time)." },
  { id: "d4-11", domain: "4", front: "What is SOAR playbook vs. runbook?", back: "Playbook = high-level incident process; runbook = specific step-by-step operational procedure (often automated)." },
  { id: "d4-12", domain: "4", front: "What does EDR provide over traditional antivirus?", back: "Endpoint Detection and Response — continuous monitoring, behavioral detection, and response/rollback, not just signature scanning." },

  // ---- Domain 5: Security Program Management & Oversight ----
  { id: "d5-01", domain: "5", front: "Quantitative risk: what are SLE, ARO, and ALE?", back: "SLE = single loss expectancy; ARO = annual rate of occurrence; ALE = SLE × ARO (annualized loss expectancy)." },
  { id: "d5-02", domain: "5", front: "Name the four risk treatment options.", back: "Accept, Avoid, Transfer (e.g., insurance), and Mitigate." },
  { id: "d5-03", domain: "5", front: "RTO vs. RPO in BC/DR planning?", back: "RTO = how fast you must restore service; RPO = how much data loss is acceptable." },
  { id: "d5-04", domain: "5", front: "What is the difference between a policy, standard, and procedure?", back: "Policy = high-level intent; standard = mandatory specifics; procedure = step-by-step how-to." },
  { id: "d5-05", domain: "5", front: "What is due care vs. due diligence?", back: "Due diligence = researching/planning the right thing to do; due care = actually doing it / acting responsibly." },
  { id: "d5-06", domain: "5", front: "SOC 2 Type I vs. Type II?", back: "Type I assesses control design at a point in time; Type II assesses operating effectiveness over a period." },
  { id: "d5-07", domain: "5", front: "What is a BIA?", back: "Business Impact Analysis — identifies critical functions and the impact of their disruption (feeds RTO/RPO)." },
  { id: "d5-08", domain: "5", front: "Data roles: owner vs. custodian vs. processor?", back: "Owner = accountable for the data; custodian = maintains/protects it; processor = handles it on the owner's behalf." },
  { id: "d5-09", domain: "5", front: "What does a DPIA assess?", back: "Data Protection Impact Assessment — evaluates privacy risks of processing personal data." },
  { id: "d5-10", domain: "5", front: "Vendor risk: what is an SLA vs. MOU vs. MSA?", back: "SLA = service-level guarantees; MOU = informal agreement of intent; MSA = master contract governing the overall relationship." },
  { id: "d5-11", domain: "5", front: "What is the purpose of a tabletop exercise?", back: "A discussion-based walkthrough of an incident/DR plan to test readiness without live systems." },
  { id: "d5-12", domain: "5", front: "What is attestation in a security audit?", back: "A formal declaration that controls are in place and operating as stated, often by a third party." },
];

export function cardsByDomain(domainId) {
  return CARDS.filter((c) => c.domain === domainId);
}

export function cardById(id) {
  return CARDS.find((c) => c.id === id);
}
