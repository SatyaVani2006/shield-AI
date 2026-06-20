require('dotenv').config();
const connectDB = require('./connection');
const Faq = require('../models/Faq');

const defaults = [
  {
    question: 'What is phishing and how do I avoid it?',
    answer:
      'Phishing is a social engineering attack where attackers impersonate trusted entities to steal credentials. Avoid it by verifying sender addresses, hovering over links, never sharing OTPs, and reporting suspicious emails.',
    category: 'phishing',
    keywords: ['phishing', 'email', 'scam', 'fake'],
  },
  {
    question: 'How do I create a strong password?',
    answer:
      'Use at least 14 characters with mixed case, numbers, and symbols. Use a password manager, never reuse passwords, and enable MFA on all critical accounts.',
    category: 'password',
    keywords: ['password', 'strong', 'mfa', '2fa'],
  },
  {
    question: 'What should I do if I suspect malware on my device?',
    answer:
      'Disconnect from the network, run a full antivirus scan in safe mode, preserve logs, change passwords from a clean device, and restore from a known-good backup if needed.',
    category: 'malware',
    keywords: ['malware', 'virus', 'infected', 'ransomware'],
  },
  {
    question: 'How do I secure my home Wi-Fi network?',
    answer:
      'Change default router credentials, use WPA3 or WPA2-AES, hide SSID if appropriate, disable WPS, enable guest network for IoT, and keep firmware updated.',
    category: 'network',
    keywords: ['wifi', 'router', 'network', 'wlan'],
  },
  {
    question: 'What is a security incident response plan?',
    answer:
      'An IR plan defines roles, detection, containment, eradication, recovery, and lessons learned after a breach. Practice tabletop exercises and keep emergency contacts updated.',
    category: 'threats',
    keywords: ['incident', 'breach', 'response', 'ir'],
  },
];

(async () => {
  await connectDB();
  const count = await Faq.countDocuments();
  if (count === 0) {
    await Faq.insertMany(defaults);
    console.log(`[SHIELD AI] Seeded ${defaults.length} FAQs`);
  } else {
    console.log(`[SHIELD AI] FAQs already exist (${count}), skipping seed`);
  }
  process.exit(0);
})();
