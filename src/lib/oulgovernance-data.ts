// University of Oulu's 6 Generic Skill Domains (Bachelor Level)
// Source: University of Oulu "Common generic skills and learning outcomes" document

export interface DomainData {
  id: number;
  title: string;
  activatedSubSkills: number;
  totalRatings: number;
  coveragePercent: number;
  lastAssessmentDate: string;
  subSkills: string[];
  learningOutcomes: string[];
  taskMatrix: number[]; // Array of 4 values for heatmap
}

export interface GovernanceDashboardData {
  participatingStudents: number;
  totalSkillRatings: number;
  activatedSubSkills: number;
  genericDomainsCovered: string;
  avgAssessmentsPerStudent: string;
  domains: DomainData[];
  competenceDistribution: {
    averageAssessmentsPerStudent: number;
    percentStudentsWith4PlusDomains: number;
    distributionAcross456Domains: {
      fourDomains: number;
      fiveDomains: number;
      sixDomains: number;
    };
  };
  programmeBenefits: string[];
}

export const ouluGovernanceData: GovernanceDashboardData = {
  participatingStudents: 106,
  totalSkillRatings: 3423,
  activatedSubSkills: 20,
  genericDomainsCovered: "6/6",
  avgAssessmentsPerStudent: "32+",
  
  domains: [
    {
      id: 1,
      title: "Analytical, Critical & Creative Thinking",
      activatedSubSkills: 4,
      totalRatings: 687,
      coveragePercent: 94,
      lastAssessmentDate: "2026-02-25",
      subSkills: [
        "Observation of Thinking Skills",
        "Critical Thinking",
        "Problem Solving",
        "Creative Problem Solving"
      ],
      learningOutcomes: [
        "Recognize and reflect on own use of analytical, critical, and creative thinking",
        "Apply structured reasoning to evaluate knowledge, claims, and practices",
        "Identify and resolve complex or unpredictable problems effectively"
      ],
      taskMatrix: [85, 72, 68, 45]
    },
    {
      id: 2,
      title: "Sustainability, Responsibility & Ethics",
      activatedSubSkills: 4,
      totalRatings: 542,
      coveragePercent: 88,
      lastAssessmentDate: "2026-02-24",
      subSkills: [
        "Sustainability Awareness",
        "UN SDG Knowledge",
        "Research Sustainability Integration",
        "Stakeholder Impact Assessment"
      ],
      learningOutcomes: [
        "Recognize sustainability dimensions and impacts",
        "Understand UN Sustainable Development Goals and their relevance",
        "Integrate sustainability into research and professional practice"
      ],
      taskMatrix: [62, 58, 71, 39]
    },
    {
      id: 3,
      title: "Communication, Interaction & Digital Skills",
      activatedSubSkills: 3,
      totalRatings: 598,
      coveragePercent: 91,
      lastAssessmentDate: "2026-02-26",
      subSkills: [
        "Digital Literacy",
        "Public Speaking",
        "Constructive Feedback"
      ],
      learningOutcomes: [
        "Use digital tools effectively for communication and collaboration",
        "Deliver presentations to groups clearly and confidently",
        "Provide useful and respectful feedback to peers"
      ],
      taskMatrix: [78, 65, 54, 41]
    },
    {
      id: 4,
      title: "International & Multicultural",
      activatedSubSkills: 3,
      totalRatings: 489,
      coveragePercent: 85,
      lastAssessmentDate: "2026-02-23",
      subSkills: [
        "Cultural Sensitivity",
        "Inclusive Collaboration",
        "Cross-Cultural Communication"
      ],
      learningOutcomes: [
        "Respect and adapt to cultural differences in professional settings",
        "Work inclusively in multicultural contexts",
        "Communicate effectively across cultures"
      ],
      taskMatrix: [56, 49, 63, 38]
    },
    {
      id: 5,
      title: "Well-being & Self-Development",
      activatedSubSkills: 3,
      totalRatings: 612,
      coveragePercent: 89,
      lastAssessmentDate: "2026-02-25",
      subSkills: [
        "Lifelong Learning",
        "Professional Conduct",
        "Group Learning Facilitation"
      ],
      learningOutcomes: [
        "Commit to continuous learning throughout career",
        "Demonstrate ethical, responsible, and reliable behavior",
        "Support learning and development within groups"
      ],
      taskMatrix: [71, 68, 59, 47]
    },
    {
      id: 6,
      title: "Multidisciplinary & Interdisciplinary",
      activatedSubSkills: 3,
      totalRatings: 495,
      coveragePercent: 82,
      lastAssessmentDate: "2026-02-22",
      subSkills: [
        "Interdisciplinary Connection",
        "Solution Design",
        "Applying Theory to Practice"
      ],
      learningOutcomes: [
        "Recognize conceptual and practical links between fields",
        "Structure and design innovative solutions to identified problems",
        "Transfer abstract concepts and theories into practical applications"
      ],
      taskMatrix: [52, 47, 58, 34]
    }
  ],
  
  competenceDistribution: {
    averageAssessmentsPerStudent: 32,
    percentStudentsWith4PlusDomains: 87,
    distributionAcross456Domains: {
      fourDomains: 23,
      fiveDomains: 38,
      sixDomains: 26
    }
  },
  
  programmeBenefits: [
    "Faculty dashboard for department-level oversight",
    "Curriculum mapping support for programme skills integration",
    "Cohort skill heatmaps to track transversal competence acquisition",
    "Accreditation-ready reporting exports"
  ]
};
