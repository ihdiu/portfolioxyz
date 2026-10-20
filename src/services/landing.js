import { getProfile } from '../repositories/profile.js';
import { getAllSettings } from '../repositories/settings.js';
import { getVisibleSections } from '../repositories/sections.js';
import { getGroupedSkills, getAllDomains } from '../repositories/skills.js';
import { getAllExperiences } from '../repositories/experiences.js';
import { getAllEducations } from '../repositories/educations.js';
import { getAllProfiles as getAllResearchProfiles } from '../repositories/research.js';
import { getAllProjects } from '../repositories/projects.js';
import { getAllNodes as getAllCareerNodes } from '../repositories/careerNodes.js';
import { buildNestedTree, renderNoscriptTree } from './careerTree.js';

/**
 * Assembles all data for the landing page in parallel
 * @returns {Promise<Object>} Aggregated landing page model
 */
export async function getLandingPageData() {
  const [
    profile,
    settings,
    visibleSections,
    groupedSkills,
    domains,
    experiences,
    educations,
    researchProfiles,
    projects,
    rawCareerNodes,
  ] = await Promise.all([
    getProfile(),
    getAllSettings(),
    getVisibleSections(),
    getGroupedSkills(),
    getAllDomains(),
    getAllExperiences(),
    getAllEducations(),
    getAllResearchProfiles(),
    getAllProjects(),
    getAllCareerNodes(),
  ]);

  const careerTree = buildNestedTree(rawCareerNodes);
  const careerNoscriptHtml = renderNoscriptTree(careerTree);

  return {
    profile: profile || {
      full_name: 'Engineer',
      headline: '',
      typed_roles: '',
      bio: '',
      email: '',
      location: '',
      avatar_path: '',
      resume_path: '',
    },
    settings,
    visibleSections,
    groupedSkills,
    domains,
    experiences,
    educations,
    researchProfiles,
    projects,
    careerTree,
    careerTreeJson: JSON.stringify(careerTree),
    careerNoscriptHtml,
  };
}

export default { getLandingPageData };
