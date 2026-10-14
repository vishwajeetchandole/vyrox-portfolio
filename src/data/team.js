// Add member photos under public/images/team and set image to '/images/team/filename.jpg'.
export { teamMembers } from './teamMembers.js'

export const challengePillars = [
  {
    title: 'Creative strategy',
    text: 'We turn raw ideas into focused directions with clarity, story, and user-first thinking that feels intentional.',
  },
  {
    title: 'Product experimentation',
    text: 'Our approach mixes rapid prototyping, testing, and learning so ideas evolve into meaningful digital experiences.',
  },
  {
    title: 'Design systems thinking',
    text: 'We care about the details: motion, polish, usability, and the feeling that a product is crafted rather than assembled.',
  },
  {
    title: 'Execution under pressure',
    text: 'From ideation to delivery, we move fast, adapt quickly, and keep momentum while solving difficult real-world problems.',
  },
];

export const technologyStack = [
  { title: 'Programming Languages', items: ['JavaScript', 'TypeScript', 'Python', 'C++', 'Java', 'SQL'] },
  { title: 'Frontend Development', items: ['React', 'Vite', 'Tailwind', 'Framer Motion', 'Next.js', 'HTML', 'CSS', 'Redux'] },
  { title: 'Backend Development', items: ['Node.js', 'Express', 'REST APIs', 'Authentication', 'FastAPI', 'Django', 'GraphQL'] },
  { title: 'AI / Machine Learning', items: ['Prompt design', 'Model workflows', 'Automation', 'Data pipelines', 'TensorFlow', 'PyTorch', 'Scikit-learn', 'LangChain'] },
  { title: 'Data & Databases', items: ['MongoDB', 'SQLite', 'Supabase', 'Analytics', 'PostgreSQL', 'MySQL', 'Redis', 'Pandas'] },
  { title: 'Developer Tools', items: ['Git', 'Figma', 'Vercel', 'Postman', 'GitHub', 'Docker', 'VS Code', 'Linux'] },
  { title: 'Cloud & Deployment', items: ['AWS', 'Netlify', 'Render', 'CI/CD'] },
];

export const showcase = [
  {
    title: 'Aether Studio',
    category: 'Product concept',
    summary: 'An immersive creative workspace where ideas, stories, and design systems connect in one live collaboration flow.',
    tags: ['React', 'UX', 'Storytelling'],
  },
  {
    title: 'Signal Forge',
    category: 'Research prototype',
    summary: 'A human-centered AI dashboard that surfaces insights, priorities, and patterns in a calmer, more useful interface.',
    tags: ['AI', 'Dashboards', 'Testing'],
  },
  {
    title: 'Pulse Hack Lab',
    category: 'Hackathon build',
    summary: 'A rapid-build challenge sprint combining product thinking, technical execution, and memorable presentation under time pressure.',
    tags: ['Speed', 'Collaboration', 'Shipping'],
  },
];

export const navItems = [
  { label: 'TEAM', href: '#team' },
  { label: 'STRENGTH', href: '#strength' },
  { label: 'STACK', href: '#stack' },
  { label: 'WORK', href: '#work' },
];
