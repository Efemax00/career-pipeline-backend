export const SYSTEM_VERTICALS = [
  // ─── CAREER (Default) ─────────────────────────────────────────
  {
    slug: 'career',
    name: 'Career',
    description: 'Find companies hiring for your role and track applications',
    icon: 'Briefcase',
    isSystem: true,
    userId: null,
    discovery: {
      source: 'remotive',
      searchTypes: [],
      defaultCountry: '',
      defaultRegion: '',
    },
    extraFields: [
      { key: 'role', label: 'Role', type: 'string' },
      { key: 'salary', label: 'Salary', type: 'string' },
      { key: 'remote', label: 'Remote', type: 'boolean' },
    ],
    contactRoles: ['Recruiter', 'Hiring Manager', 'Team Lead'],
    messageTemplate: {
      systemPrompt: `You write concise, warm job-seeking outreach messages.
Tone: professional, confident, not desperate.
Never use generic phrases like "I hope this finds you well".`,
      userPromptTemplate: `Company: {name}
Role: {role}
Location: {city}, {country}

Write a 3-sentence message expressing interest in the {role} role.
Mention one specific skill that matches the company.
End with a soft question. Do not use placeholders.`,
      valueProps: ['relevant experience', 'specific skills match', 'culture fit'],
    },
    pipelineStages: [
      { id: 'new-target', label: 'New Target', color: '#6b7280' },
      { id: 'researching', label: 'Researching', color: '#8b5cf6' },
      { id: 'contact-found', label: 'Contact Found', color: '#3b82f6' },
      { id: 'outreach-sent', label: 'Outreach Sent', color: '#06b6d4' },
      { id: 'conversation', label: 'Conversation', color: '#f59e0b' },
      { id: 'applied', label: 'Applied', color: '#f97316' },
      { id: 'assessment', label: 'Assessment', color: '#ef4444' },
      { id: 'interview', label: 'Interview', color: '#10b981' },
      { id: 'offer', label: 'Offer', color: '#22c55e' },
      { id: 'hired', label: 'Hired', color: '#16a34a' },
      { id: 'closed-lost', label: 'Closed Lost', color: '#dc2626' },
    ],
  },

  // ─── HOSPITALITY LEADS ─────────────────────────────────────────
  {
    slug: 'hospitality',
    name: 'Hospitality Leads',
    description: 'Find hotels, resorts, and lodges to sell hospitality software',
    icon: 'Hotel',
    isSystem: true,
    userId: null,
    discovery: {
      source: 'google-places',
      searchTypes: ['lodging'],
      defaultCountry: 'Nigeria',
      defaultRegion: 'Delta State',
    },
    extraFields: [
      { key: 'rating', label: 'Rating', type: 'number' },
      { key: 'reviewCount', label: 'Reviews', type: 'number' },
      { key: 'amenities', label: 'Amenities', type: 'array' },
      { key: 'priceLevel', label: 'Price Level', type: 'string' },
    ],
    contactRoles: ['Front Desk Manager', 'General Manager', 'Owner', 'Revenue Manager'],
    messageTemplate: {
      systemPrompt: `You write B2B cold outreach for a hospitality management software.
Tone: professional, warm, specific. Never generic.
Mention ONE concrete growth lever (direct bookings, OTA commission, guest retention).
Keep it to 3-4 sentences max.`,
      userPromptTemplate: `Hotel: {name}
Location: {city}, {country}
Rating: {rating} ({reviewCount} reviews)
Amenities: {amenities}

Write a personalized 3-4 sentence outreach message.
1. Compliment a specific detail about the hotel
2. Name one growth lever our software unlocks
3. End with a soft question to start a conversation
Do not use placeholders. Do not say "I hope this finds you well".`,
      valueProps: [
        'increase direct bookings by 30%',
        'cut OTA commissions by 15%',
        'improve guest retention and repeat stays',
        'automate front desk operations',
      ],
    },
    pipelineStages: [
      { id: 'prospect', label: 'Prospect', color: '#6b7280' },
      { id: 'researching', label: 'Researching', color: '#8b5cf6' },
      { id: 'contact-found', label: 'Contact Found', color: '#3b82f6' },
      { id: 'contacted', label: 'Contacted', color: '#06b6d4' },
      { id: 'in-conversation', label: 'In Conversation', color: '#f59e0b' },
      { id: 'demo-scheduled', label: 'Demo Scheduled', color: '#f97316' },
      { id: 'trial', label: 'Trial', color: '#10b981' },
      { id: 'negotiation', label: 'Negotiation', color: '#22c55e' },
      { id: 'won', label: 'Won', color: '#16a34a' },
      { id: 'lost', label: 'Lost', color: '#dc2626' },
    ],
  },

  // ─── FOOD VENDOR LEADS ─────────────────────────────────────────
  {
    slug: 'food-vendors',
    name: 'Food Vendor Leads',
    description: 'Find restaurants, cafes, and food vendors to sell to',
    icon: 'UtensilsCrossed',
    isSystem: true,
    userId: null,
    discovery: {
      source: 'google-places',
      searchTypes: ['restaurant', 'cafe', 'meal_delivery', 'meal_takeaway'],
      defaultCountry: 'Nigeria',
      defaultRegion: '',
    },
    extraFields: [
      { key: 'rating', label: 'Rating', type: 'number' },
      { key: 'reviewCount', label: 'Reviews', type: 'number' },
      { key: 'cuisine', label: 'Cuisine', type: 'string' },
      { key: 'priceLevel', label: 'Price Level', type: 'string' },
    ],
    contactRoles: ['Owner', 'Manager', 'Procurement Officer'],
    messageTemplate: {
      systemPrompt: `You write B2B cold outreach for a food vendor software.
Tone: friendly, professional, specific.
Mention ONE concrete business win.`,
      userPromptTemplate: `Restaurant: {name}
Location: {city}, {country}
Rating: {rating} ({reviewCount} reviews)
Cuisine: {cuisine}

Write a 3-sentence outreach message.
1. Compliment something specific
2. Name one business win (delivery cost, repeat orders, menu optimization)
3. End with a soft question
Do not use placeholders.`,
      valueProps: [
        'reduce delivery costs',
        'increase repeat orders',
        'optimize menu pricing',
      ],
    },
    pipelineStages: [
      { id: 'prospect', label: 'Prospect', color: '#6b7280' },
      { id: 'contacted', label: 'Contacted', color: '#3b82f6' },
      { id: 'sample-sent', label: 'Sample Sent', color: '#06b6d4' },
      { id: 'negotiation', label: 'Negotiation', color: '#f59e0b' },
      { id: 'won', label: 'Won', color: '#16a34a' },
      { id: 'lost', label: 'Lost', color: '#dc2626' },
    ],
  },
];
