// ============================================================
// University of Oulu – Common Generic Skill Domains (Bachelor Level)
// Source: University of Oulu "Common generic skills and learning outcomes"
//
// This file contains STATIC framework content only:
//   - Domain titles, sub-skill names, learning outcomes
//
// ALL numeric metrics are calculated live from the database.
// See: src/app/admin-public/page.tsx → getGovernanceLiveData()
// ============================================================

// ── Runtime shape used by all UI components ─────────────────
// Numeric fields are populated by getGovernanceLiveData() at request time.
export interface DomainData {
  id: number;
  title: string;
  activatedSubSkills: number;
  totalRatings: number;
  coveragePercent: number;
  lastAssessmentDate: string;
  subSkills: string[];
  learningOutcomes: string[];
  taskMatrix: number[];  // assessment counts per top-4 task (heatmap columns)
}

// ── Static framework content (text only, no numbers) ────────
// domainKey = exact oulu_domain TEXT value stored in public.skills
export interface DomainStaticContent {
  id: number;         // 1-6, used for UI ordering and colour index only
  domainKey: string;  // exact DB value: skills.oulu_domain
  title: string;      // display title shown in the UI
  subSkills: string[];
  learningOutcomes: string[];
}

export const OULU_DOMAIN_FRAMEWORK: DomainStaticContent[] = [
  {
    id: 1,
    domainKey: "Analytical, Critical & Creative Thinking",
    title: "Analytical, Critical & Creative Thinking",
    subSkills: [
      "Observation of Thinking Skills",
      "Critical Thinking",
      "Problem Solving",
      "Creative Problem Solving",
    ],
    learningOutcomes: [
      "Recognize and reflect on own use of analytical, critical, and creative thinking",
      "Apply structured reasoning to evaluate knowledge, claims, and practices",
      "Identify and resolve complex or unpredictable problems effectively",
    ],
  },
  {
    id: 2,
    domainKey: "Sustainability, Responsibility & Ethics",
    title: "Sustainability, Responsibility & Ethics",
    subSkills: [
      "Sustainability Awareness",
      "UN SDG Knowledge",
      "Research Sustainability Integration",
      "Stakeholder Impact Assessment",
    ],
    learningOutcomes: [
      "Recognize sustainability dimensions and impacts",
      "Understand UN Sustainable Development Goals and their relevance",
      "Integrate sustainability into research and professional practice",
    ],
  },
  {
    id: 3,
    // DB stores this without the word "Skills"
    domainKey: "Communication, Interaction & Digital",
    title: "Communication, Interaction & Digital Skills",
    subSkills: [
      "Digital Literacy",
      "Public Speaking",
      "Constructive Feedback",
    ],
    learningOutcomes: [
      "Use digital tools effectively for communication and collaboration",
      "Deliver presentations to groups clearly and confidently",
      "Provide useful and respectful feedback to peers",
    ],
  },
  {
    id: 4,
    domainKey: "International & Multicultural",
    title: "International & Multicultural",
    subSkills: [
      "Cultural Sensitivity",
      "Inclusive Collaboration",
      "Cross-Cultural Communication",
    ],
    learningOutcomes: [
      "Respect and adapt to cultural differences in professional settings",
      "Work inclusively in multicultural contexts",
      "Communicate effectively across cultures",
    ],
  },
  {
    id: 5,
    domainKey: "Well-being & Self-Development",
    title: "Well-being & Self-Development",
    subSkills: [
      "Lifelong Learning",
      "Professional Conduct",
      "Group Learning Facilitation",
    ],
    learningOutcomes: [
      "Commit to continuous learning throughout career",
      "Demonstrate ethical, responsible, and reliable behavior",
      "Support learning and development within groups",
    ],
  },
  {
    id: 6,
    domainKey: "Multidisciplinary & Interdisciplinary",
    title: "Multidisciplinary & Interdisciplinary",
    subSkills: [
      "Interdisciplinary Connection",
      "Solution Design",
      "Applying Theory to Practice",
    ],
    learningOutcomes: [
      "Recognize conceptual and practical links between fields",
      "Structure and design innovative solutions to identified problems",
      "Transfer abstract concepts and theories into practical applications",
    ],
  },
];

export const PROGRAMME_BENEFITS: string[] = [
  "Faculty dashboard for department-level oversight",
  "Curriculum mapping support for programme skills integration",
  "Cohort skill heatmaps to track transversal competence acquisition",
  "Accreditation-ready reporting exports",
];
