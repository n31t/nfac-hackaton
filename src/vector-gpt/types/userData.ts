/**
 * Enum representing the level of programming skills.
 */
enum ProgrammingSkillLevel {
    NoExperience = "No experience",
    ITStudent = "IT student",
    CompetitiveProgrammer = "Competitive programmer",
    ProfessionalDeveloper = "Professional developer",
  }
  /**
   * Interface representing the form questions.
   */
export interface userData{
    fullName: string;
    email: string;
    birthDate: string; // Format: DD-MM-YYYY
  phoneNumber: string;
    programmingSkillLevel: ProgrammingSkillLevel;
    cv?: string; // Optional: URL or base64 encoded string
    willingToParticipateOnPaidBasis: boolean; //WE DON'T CARE
    telegramHandle: string;
    linkedInLink: string;
    socialMediaLinks: string[]; // Array of URLs
    gitHubHandle: string;
    educationalPlacement: string; // University/College/High school
    specialtyAtUniversity: string; 
    jobPlacement?: string; // Optional
    programmingExperienceDescription: string;
    pastProgrammingProjects: string;
    bestAchievements: string;
    availabilityInAlmaty: boolean;
    needAccommodationInAlmaty: boolean; //WE DON'T CARE
    // representativeGroups: string[];
  }