/**
 * Utility to extract lead information from unstructured text messages
 * using regex patterns and natural language keyword matching.
 */
export const extractLeadDetails = (text) => {
    const details = {
        name: null,
        company: null,
        email: null,
        phone: null,
        service: null
    };

    const cleanText = text.trim();

    // 1. Email Extraction
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i;
    const emailMatch = cleanText.match(emailRegex);
    if (emailMatch) {
        details.email = emailMatch[0].trim();
    }

    // 2. Phone Extraction (Indian & international formats, 10-digit numbers)
    const phoneRegex = /(?:\+?91|0)?[ -]?[6789]\d{9}\b|\b\d{10}\b|\+?\d{12}\b/g;
    const phoneMatches = cleanText.match(phoneRegex);
    if (phoneMatches && phoneMatches.length > 0) {
        details.phone = phoneMatches[0].replace(/[- ]/g, "").trim();
    }

    // 3. Name & Company Pattern Matches
    // Pattern 1: "I am [Name] from [Company]" or "This is [Name] from [Company]"
    const pattern1 = /(?:i am|this is|i'm|my name is)\s+([a-zA-Z\s]{2,20})\s+from\s+([a-zA-Z0-9\s]{2,30})/i;
    const match1 = cleanText.match(pattern1);
    if (match1) {
        details.name = match1[1].trim();
        details.company = match1[2].trim();
    } else {
        // Pattern 2: "Name: [Name]"
        const namePattern = /(?:name|contact name|person)\s*[:\-]\s*([a-zA-Z\s]{2,25})/i;
        const nameMatch = cleanText.match(namePattern);
        if (nameMatch) {
            details.name = nameMatch[1].trim();
        }

        // Pattern 3: "Company: [Company]"
        const companyPattern = /(?:company|firm|organization|org)\s*[:\-]\s*([a-zA-Z0-9\s]{2,30})/i;
        const companyMatch = cleanText.match(companyPattern);
        if (companyMatch) {
            details.company = companyMatch[1].trim();
        }
    }

    // Fallbacks if not caught by patterns:
    // If we have an email like rahul@techcorp.com, we can infer company as TechCorp!
    if (!details.company && details.email) {
        const domain = details.email.split("@")[1];
        const publicDomains = ["gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "icloud.com", "mail.com", "live.com"];
        if (domain && !publicDomains.includes(domain.toLowerCase())) {
            const domainPrefix = domain.split(".")[0];
            // Capitalize domain prefix
            details.company = domainPrefix.charAt(0).toUpperCase() + domainPrefix.slice(1);
        }
    }

    // 4. Service Identification (Map keywords to actual CRM categories)
    const serviceKeywords = [
        { name: "Website Development", keywords: ["website", "web design", "portfolio", "e-commerce", "wordpress", "react", "html", "shopify"] },
        { name: "App Development", keywords: ["app", "android", "ios", "mobile application", "flutter", "react native"] },
        { name: "UI/UX Design", keywords: ["design", "ui", "ux", "wireframe", "figma", "mockup", "interface"] },
        { name: "Digital Marketing", keywords: ["marketing", "seo", "sem", "ads", "social media", "instagram", "facebook", "branding"] },
        { name: "Graphic Design", keywords: ["graphic", "logo", "banner", "flyer", "brochure", "creative"] },
        { name: "Custom Software", keywords: ["crm", "custom software", "erp", "saas", "dashboard", "portal"] },
        { name: "Automation & Chatbots", keywords: ["bot", "chatbot", "automation", "whatsapp automation", "n8n", "make", "flow"] },
        { name: "AI Solutions", keywords: ["ai", "artificial intelligence", "chatgpt", "openai", "machine learning", "llm"] },
        { name: "Cloud & Hosting", keywords: ["host", "hosting", "domain", "server", "aws", "cloud", "deployment"] }
    ];

    const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const lowercaseText = cleanText.toLowerCase();
    for (const item of serviceKeywords) {
        for (const kw of item.keywords) {
            const regex = new RegExp(`\\b${escapeRegex(kw.toLowerCase())}\\b`, "i");
            if (regex.test(lowercaseText)) {
                details.service = item.name;
                break;
            }
        }
        if (details.service) break;
    }

    return details;
};
