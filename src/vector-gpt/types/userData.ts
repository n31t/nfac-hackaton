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

/**
 * Interface for user data.
 *
 * @property fullName - The full name of the user.
 * @property email - The email address of the user.
 * @property birthDate - The birth date of the user in DD-MM-YYYY format.
 * @property phoneNumber - The phone number of the user.
 * @property programmingSkillLevel - The programming skill level of the user.
 * @property cv - Optional: The URL or base64 encoded string of the user's CV.
 * @property willingToParticipateOnPaidBasis - Whether the user is willing to participate on a paid basis. This property is not important for some use cases.
 * @property telegramHandle - The Telegram handle of the user.
 * @property linkedInLink - The LinkedIn profile link of the user.
 * @property socialMediaLinks - An array of URLs of the user's social media profiles.
 * @property gitHubHandle - The GitHub handle of the user.
 * @property educationalPlacement - The educational institution (university, college, high school) of the user.
 * @property specialtyAtUniversity - The specialty of the user at the university.
 * @property jobPlacement - Optional: The job placement of the user.
 * @property programmingExperienceDescription - A description of the user's programming experience.
 * @property pastProgrammingProjects - A description of the user's past programming projects.
 * @property bestAchievements - A description of the user's best achievements.
 * @property availabilityInAlmaty - Whether the user is available in Almaty.
 * @property needAccommodationInAlmaty - Whether the user needs accommodation in Almaty. This property is not important for some use cases.
 */
export interface UserData {
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
}

export interface CandidateData {
  programmingSkillLevel: string;
  cv: string;
  educationalPlacement: string;
  specialtyAtUniversity: string;
  jobPlacement: string;
  programmingExperienceDescription: string;
  pastProgrammingProjects: string;
  bestAchievements: string;
}

export interface SecondTask {
  email: string;
  github: string;
  repo: string;
}
