import { v4 as uuidv4 } from 'uuid';

// Use deterministic IDs for seed data
const INIT_1_ID = 'seed-init-internal-tool';
const INIT_2_ID = 'seed-init-board-game';

const today = new Date();
const daysAgo = (n) => {
  const d = new Date(today);
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
};

export const seedInitiatives = [
  {
    id: INIT_1_ID,
    name: 'Internal Tool Adoption',
    description: 'Drive adoption of the internal productivity tool across target companies via outreach on Reddit, LinkedIn, cold email, and community channels.',
    status: 'active',
    createdAt: daysAgo(14),
    platforms: ['Reddit', 'LinkedIn', 'Cold Email', 'Community Forums', 'WhatsApp'],
    activityTypes: ['Post', 'DM', 'Email', 'Demo', 'Follow-up'],
  },
  {
    id: INIT_2_ID,
    name: 'Startup Board Game Partnerships',
    description: 'Partner with startup founders, accelerators, and events to distribute and co-brand the startup-themed board game.',
    status: 'active',
    createdAt: daysAgo(14),
    platforms: ['WhatsApp', 'LinkedIn', 'Email', 'In-person', 'Events'],
    activityTypes: ['Founder Outreach', 'Partnership Pitch', 'Follow-up', 'Demo Session', 'Booking'],
  },
];

export const seedActivities = [
  // Internal Tool Adoption — 15 entries over 2 weeks
  { id: uuidv4(), initiativeId: INIT_1_ID, date: daysAgo(13), platform: 'Reddit', activityType: 'Post', quantity: 3, responseCount: 8, conversionCount: 1, notes: 'Posted in r/productivity, r/entrepreneur, r/startups. Good engagement on productivity post.' },
  { id: uuidv4(), initiativeId: INIT_1_ID, date: daysAgo(13), platform: 'Cold Email', activityType: 'Email', quantity: 20, responseCount: 3, conversionCount: 0, notes: 'First batch of cold emails to SaaS founders.' },
  { id: uuidv4(), initiativeId: INIT_1_ID, date: daysAgo(12), platform: 'LinkedIn', activityType: 'Post', quantity: 1, responseCount: 14, conversionCount: 2, notes: 'LinkedIn post about the tool went semi-viral in startup circles.' },
  { id: uuidv4(), initiativeId: INIT_1_ID, date: daysAgo(12), platform: 'LinkedIn', activityType: 'DM', quantity: 15, responseCount: 4, conversionCount: 1, notes: 'DMed startup founders from post engagement.' },
  { id: uuidv4(), initiativeId: INIT_1_ID, date: daysAgo(11), platform: 'Community Forums', activityType: 'Post', quantity: 2, responseCount: 5, conversionCount: 0, notes: 'Posted in Indie Hackers and Hacker News (Show HN).' },
  { id: uuidv4(), initiativeId: INIT_1_ID, date: daysAgo(10), platform: 'Cold Email', activityType: 'Email', quantity: 25, responseCount: 5, conversionCount: 1, notes: 'Second cold email batch — improved subject line.' },
  { id: uuidv4(), initiativeId: INIT_1_ID, date: daysAgo(9), platform: 'WhatsApp', activityType: 'DM', quantity: 10, responseCount: 3, conversionCount: 1, notes: 'Reached out to warm contacts via WhatsApp.' },
  { id: uuidv4(), initiativeId: INIT_1_ID, date: daysAgo(8), platform: 'LinkedIn', activityType: 'DM', quantity: 20, responseCount: 6, conversionCount: 2, notes: 'Follow-up DMs to previous post engagers.' },
  { id: uuidv4(), initiativeId: INIT_1_ID, date: daysAgo(7), platform: 'Reddit', activityType: 'Post', quantity: 2, responseCount: 11, conversionCount: 2, notes: 'r/SaaS and r/indiehackers posts. Both got traction.' },
  { id: uuidv4(), initiativeId: INIT_1_ID, date: daysAgo(6), platform: 'Cold Email', activityType: 'Follow-up', quantity: 30, responseCount: 7, conversionCount: 2, notes: 'Follow-up to first two cold email batches.' },
  { id: uuidv4(), initiativeId: INIT_1_ID, date: daysAgo(5), platform: 'LinkedIn', activityType: 'Demo', quantity: 3, responseCount: 3, conversionCount: 2, notes: 'Three demos booked from LinkedIn outreach. 2 converted.' },
  { id: uuidv4(), initiativeId: INIT_1_ID, date: daysAgo(4), platform: 'Community Forums', activityType: 'Post', quantity: 3, responseCount: 9, conversionCount: 1, notes: 'Posted in three niche Slack communities.' },
  { id: uuidv4(), initiativeId: INIT_1_ID, date: daysAgo(3), platform: 'Cold Email', activityType: 'Email', quantity: 30, responseCount: 6, conversionCount: 2, notes: 'Third batch targeting ops managers.' },
  { id: uuidv4(), initiativeId: INIT_1_ID, date: daysAgo(2), platform: 'LinkedIn', activityType: 'Follow-up', quantity: 8, responseCount: 3, conversionCount: 1, notes: 'Follow-up to demo leads.' },
  { id: uuidv4(), initiativeId: INIT_1_ID, date: daysAgo(1), platform: 'Reddit', activityType: 'Post', quantity: 2, responseCount: 6, conversionCount: 1, notes: 'Weekend posting strategy — lighter engagement.' },

  // Startup Board Game — 10 entries over 2 weeks
  { id: uuidv4(), initiativeId: INIT_2_ID, date: daysAgo(13), platform: 'WhatsApp', activityType: 'Founder Outreach', quantity: 8, responseCount: 3, conversionCount: 0, notes: 'Reached out to startup founders in existing WhatsApp groups.' },
  { id: uuidv4(), initiativeId: INIT_2_ID, date: daysAgo(11), platform: 'LinkedIn', activityType: 'Partnership Pitch', quantity: 5, responseCount: 2, conversionCount: 0, notes: 'Pitched accelerators and coworking spaces.' },
  { id: uuidv4(), initiativeId: INIT_2_ID, date: daysAgo(10), platform: 'Email', activityType: 'Founder Outreach', quantity: 15, responseCount: 4, conversionCount: 1, notes: 'Cold email to early-stage founders from AngelList.' },
  { id: uuidv4(), initiativeId: INIT_2_ID, date: daysAgo(9), platform: 'In-person', activityType: 'Demo Session', quantity: 2, responseCount: 2, conversionCount: 1, notes: 'Demo at a local startup meetup. One founder committed to bulk buy.' },
  { id: uuidv4(), initiativeId: INIT_2_ID, date: daysAgo(8), platform: 'WhatsApp', activityType: 'Follow-up', quantity: 8, responseCount: 2, conversionCount: 1, notes: 'Followed up on initial outreach. 1 booking confirmed.' },
  { id: uuidv4(), initiativeId: INIT_2_ID, date: daysAgo(6), platform: 'Events', activityType: 'Partnership Pitch', quantity: 3, responseCount: 3, conversionCount: 1, notes: 'Pitched 3 event organizers for co-branding. 1 said yes.' },
  { id: uuidv4(), initiativeId: INIT_2_ID, date: daysAgo(5), platform: 'LinkedIn', activityType: 'Founder Outreach', quantity: 12, responseCount: 5, conversionCount: 2, notes: 'Targeted Y Combinator alumni on LinkedIn.' },
  { id: uuidv4(), initiativeId: INIT_2_ID, date: daysAgo(4), platform: 'Email', activityType: 'Follow-up', quantity: 15, responseCount: 3, conversionCount: 1, notes: 'Follow-up emails to all pending leads.' },
  { id: uuidv4(), initiativeId: INIT_2_ID, date: daysAgo(2), platform: 'In-person', activityType: 'Booking', quantity: 1, responseCount: 1, conversionCount: 1, notes: 'Met a VC who wants 10 copies for portfolio companies.' },
  { id: uuidv4(), initiativeId: INIT_2_ID, date: daysAgo(1), platform: 'WhatsApp', activityType: 'Demo Session', quantity: 5, responseCount: 3, conversionCount: 1, notes: 'Virtual demo session via WhatsApp call for 5 interested founders.' },
];
