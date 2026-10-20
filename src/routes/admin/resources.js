import { z } from 'zod';
import slugify from 'slugify';

export const resources = [
  // 1. Domains
  {
    name: 'domains',
    table: 'domains',
    label: 'Domains',
    singular: 'Domain',
    listColumns: [
      { key: 'id', label: 'ID' },
      { key: 'slug', label: 'Slug' },
      { key: 'name', label: 'Name' },
    ],
    fields: [
      { name: 'name', label: 'Domain Name', type: 'text', required: true, max: 50 },
      { name: 'slug', label: 'Slug', type: 'text', required: true, max: 30 },
    ],
    schema: z.object({
      name: z.string().min(1, 'Name is required').max(50),
      slug: z.string().min(1, 'Slug is required').max(30),
    }),
    beforeSave: (data) => ({
      ...data,
      slug: slugify(data.slug || data.name, { lower: true, strict: true }),
    }),
  },

  // 2. Skill Categories
  {
    name: 'skill-categories',
    table: 'skill_categories',
    label: 'Skill Categories',
    singular: 'Skill Category',
    listColumns: [
      { key: 'id', label: 'ID' },
      { key: 'name', label: 'Category Name' },
      { key: 'domain_name', label: 'Domain' },
      { key: 'sort_order', label: 'Order' },
    ],
    fields: [
      { name: 'domain_id', label: 'Domain', type: 'select', optionsFrom: 'domains', optionLabelKey: 'name', optionValueKey: 'id', required: true },
      { name: 'name', label: 'Category Name', type: 'text', required: true, max: 80 },
      { name: 'sort_order', label: 'Sort Order', type: 'number', default: 0 },
    ],
    schema: z.object({
      domain_id: z.coerce.number().min(1, 'Domain is required'),
      name: z.string().min(1, 'Category name is required').max(80),
      sort_order: z.coerce.number().default(0),
    }),
  },

  // 3. Skills
  {
    name: 'skills',
    table: 'skills',
    label: 'Skills',
    singular: 'Skill',
    listColumns: [
      { key: 'id', label: 'ID' },
      { key: 'name', label: 'Skill Name' },
      { key: 'category_name', label: 'Category' },
      { key: 'proficiency', label: 'Proficiency (%)' },
      { key: 'sort_order', label: 'Order' },
    ],
    fields: [
      { name: 'category_id', label: 'Category', type: 'select', optionsFrom: 'skill_categories', optionLabelKey: 'name', optionValueKey: 'id', required: true },
      { name: 'name', label: 'Skill Name', type: 'text', required: true, max: 80 },
      { name: 'proficiency', label: 'Proficiency (0-100%)', type: 'number', required: true, min: 0, max: 100, default: 50 },
      { name: 'icon', label: 'Icon identifier', type: 'text', max: 80 },
      { name: 'sort_order', label: 'Sort Order', type: 'number', default: 0 },
    ],
    schema: z.object({
      category_id: z.coerce.number().min(1, 'Category is required'),
      name: z.string().min(1, 'Skill name is required').max(80),
      proficiency: z.coerce.number().min(0).max(100),
      icon: z.string().max(80).optional().nullable(),
      sort_order: z.coerce.number().default(0),
    }),
  },

  // 4. Organizations
  {
    name: 'organizations',
    table: 'organizations',
    label: 'Organizations',
    singular: 'Organization',
    listColumns: [
      { key: 'id', label: 'ID' },
      { key: 'name', label: 'Name' },
      { key: 'location', label: 'Location' },
      { key: 'website', label: 'Website' },
    ],
    fields: [
      { name: 'name', label: 'Organization Name', type: 'text', required: true, max: 150 },
      { name: 'website', label: 'Website URL', type: 'url', max: 255 },
      { name: 'location', label: 'Location', type: 'text', max: 120 },
      { name: 'logo_path', label: 'Logo Image', type: 'image' },
    ],
    schema: z.object({
      name: z.string().min(1, 'Organization name is required').max(150),
      website: z.string().max(255).optional().nullable(),
      location: z.string().max(120).optional().nullable(),
    }),
  },

  // 5. Experiences
  {
    name: 'experiences',
    table: 'experiences',
    label: 'Experiences',
    singular: 'Experience',
    listColumns: [
      { key: 'id', label: 'ID' },
      { key: 'role_title', label: 'Role Title' },
      { key: 'organization_name', label: 'Organization' },
      { key: 'start_date', label: 'Start Date' },
      { key: 'end_date', label: 'End Date' },
      { key: 'sort_order', label: 'Order' },
    ],
    fields: [
      { name: 'organization_id', label: 'Organization', type: 'select', optionsFrom: 'organizations', optionLabelKey: 'name', optionValueKey: 'id', required: true },
      { name: 'role_title', label: 'Role Title', type: 'text', required: true, max: 150 },
      { name: 'start_date', label: 'Start Date', type: 'date', required: true },
      { name: 'end_date', label: 'End Date (Leave blank for Present)', type: 'date' },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'sort_order', label: 'Sort Order', type: 'number', default: 0 },
      {
        name: 'skills',
        label: 'Associated Skills',
        type: 'multiselect',
        relation: {
          junction: 'experience_skills',
          key: 'experience_id',
          other: 'skill_id',
          optionsFrom: 'skills',
        },
      },
    ],
    schema: z.object({
      organization_id: z.coerce.number().min(1, 'Organization is required'),
      role_title: z.string().min(1, 'Role title is required').max(150),
      start_date: z.string().min(1, 'Start date is required'),
      end_date: z.string().optional().nullable(),
      description: z.string().optional().nullable(),
      sort_order: z.coerce.number().default(0),
    }),
  },

  // 6. Educations
  {
    name: 'educations',
    table: 'educations',
    label: 'Educations',
    singular: 'Education',
    listColumns: [
      { key: 'id', label: 'ID' },
      { key: 'degree', label: 'Degree' },
      { key: 'organization_name', label: 'Institution' },
      { key: 'field_of_study', label: 'Field' },
      { key: 'grade', label: 'Grade' },
    ],
    fields: [
      { name: 'organization_id', label: 'Institution / Organization', type: 'select', optionsFrom: 'organizations', optionLabelKey: 'name', optionValueKey: 'id', required: true },
      { name: 'degree', label: 'Degree', type: 'text', required: true, max: 120 },
      { name: 'field_of_study', label: 'Field of Study', type: 'text', max: 120 },
      { name: 'start_date', label: 'Start Date', type: 'date' },
      { name: 'end_date', label: 'End Date', type: 'date' },
      { name: 'grade', label: 'Grade / CGPA', type: 'text', max: 40 },
      { name: 'description', label: 'Description / Honors', type: 'textarea' },
      { name: 'sort_order', label: 'Sort Order', type: 'number', default: 0 },
    ],
    schema: z.object({
      organization_id: z.coerce.number().min(1, 'Organization is required'),
      degree: z.string().min(1, 'Degree is required').max(120),
      field_of_study: z.string().max(120).optional().nullable(),
      start_date: z.string().optional().nullable(),
      end_date: z.string().optional().nullable(),
      grade: z.string().max(40).optional().nullable(),
      description: z.string().optional().nullable(),
      sort_order: z.coerce.number().default(0),
    }),
  },

  // 7. Research Platforms
  {
    name: 'research-platforms',
    table: 'research_platforms',
    label: 'Research Platforms',
    singular: 'Research Platform',
    listColumns: [
      { key: 'id', label: 'ID' },
      { key: 'name', label: 'Platform Name' },
      { key: 'icon', label: 'Icon' },
    ],
    fields: [
      { name: 'name', label: 'Platform Name', type: 'text', required: true, max: 60 },
      { name: 'icon', label: 'Icon', type: 'text', max: 80 },
    ],
    schema: z.object({
      name: z.string().min(1, 'Platform name is required').max(60),
      icon: z.string().max(80).optional().nullable(),
    }),
  },

  // 8. Research Profiles
  {
    name: 'research-profiles',
    table: 'research_profiles',
    label: 'Research Profiles',
    singular: 'Research Profile',
    listColumns: [
      { key: 'id', label: 'ID' },
      { key: 'platform_name', label: 'Platform' },
      { key: 'display_label', label: 'Display Label' },
      { key: 'profile_url', label: 'Profile URL' },
      { key: 'sort_order', label: 'Order' },
    ],
    fields: [
      { name: 'platform_id', label: 'Platform', type: 'select', optionsFrom: 'research_platforms', optionLabelKey: 'name', optionValueKey: 'id', required: true },
      { name: 'profile_url', label: 'Profile URL', type: 'url', required: true, max: 255 },
      { name: 'display_label', label: 'Display Label', type: 'text', max: 100 },
      { name: 'sort_order', label: 'Sort Order', type: 'number', default: 0 },
    ],
    schema: z.object({
      platform_id: z.coerce.number().min(1, 'Platform is required'),
      profile_url: z.string().url('Must be a valid URL starting with http:// or https://').max(255),
      display_label: z.string().max(100).optional().nullable(),
      sort_order: z.coerce.number().default(0),
    }),
  },

  // 9. Projects
  {
    name: 'projects',
    table: 'projects',
    label: 'Projects',
    singular: 'Project',
    listColumns: [
      { key: 'id', label: 'ID' },
      { key: 'title', label: 'Title' },
      { key: 'domain_name', label: 'Domain' },
      { key: 'is_featured', label: 'Featured' },
      { key: 'sort_order', label: 'Order' },
    ],
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true, max: 150 },
      { name: 'slug', label: 'Slug', type: 'text', required: true, max: 120 },
      { name: 'domain_id', label: 'Domain', type: 'select', optionsFrom: 'domains', optionLabelKey: 'name', optionValueKey: 'id', required: true },
      { name: 'summary', label: 'Summary (Card Preview)', type: 'textarea', max: 300 },
      { name: 'description', label: 'Full Description (Modal Detail)', type: 'textarea' },
      { name: 'repo_url', label: 'Repository URL', type: 'url', max: 255 },
      { name: 'demo_url', label: 'Live Demo URL', type: 'url', max: 255 },
      { name: 'cover_path', label: 'Cover Image', type: 'image' },
      { name: 'is_featured', label: 'Featured Project', type: 'checkbox' },
      { name: 'sort_order', label: 'Sort Order', type: 'number', default: 0 },
      {
        name: 'skills',
        label: 'Associated Skills',
        type: 'multiselect',
        relation: {
          junction: 'project_skills',
          key: 'project_id',
          other: 'skill_id',
          optionsFrom: 'skills',
        },
      },
    ],
    schema: z.object({
      title: z.string().min(1, 'Title is required').max(150),
      slug: z.string().min(1, 'Slug is required').max(120),
      domain_id: z.coerce.number().min(1, 'Domain is required'),
      summary: z.string().max(300).optional().nullable(),
      description: z.string().optional().nullable(),
      repo_url: z.string().max(255).optional().nullable(),
      demo_url: z.string().max(255).optional().nullable(),
      is_featured: z.preprocess((v) => v === '1' || v === 'true' || v === true || v === 'on', z.boolean()).default(false),
      sort_order: z.coerce.number().default(0),
    }),
    beforeSave: (data) => ({
      ...data,
      slug: slugify(data.slug || data.title, { lower: true, strict: true }),
    }),
  },
];

export function getResourceByName(name) {
  return resources.find((r) => r.name === name);
}

export default { resources, getResourceByName };
