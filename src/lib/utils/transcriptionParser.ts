import { z } from 'zod';

// Predefined lists of recognized skills and interests
const RECOGNIZED_SKILLS = [
  'python', 'javascript', 'typescript', 'node.js', 'three.js',
  'react', 'vue', 'angular', 'web development', 'full-stack',
  'frontend', 'backend', 'web scraping', 'machine learning',
  'ai', 'artificial intelligence', 'data science', 'blockchain',
  'mobile development', 'ios', 'android', 'flutter', 'react native'
];

const RECOGNIZED_INTERESTS = [
  'web development', 'mobile development', 'artificial intelligence',
  'machine learning', 'blockchain', 'game development', 'cybersecurity',
  'data science', 'cloud computing', 'devops', 'ui/ux design',
  'open source', 'robotics', 'virtual reality', 'augmented reality'
];

export interface ParsedTranscription {
  skills: string[];
  interests: string[];
  projectExperience?: {
    name: string;
    technologies: string[];
    description: string;
  }[];
  teamPreferences?: {
    desiredTeamSize?: number;
    requiredSkills?: string[];
    flexibility: 'flexible' | 'specific';
  };
}

export function parseTranscription(transcription: string): ParsedTranscription {
  const skills = new Set<string>();
  const interests = new Set<string>();
  const projects: ParsedTranscription['projectExperience'] = [];
  
  // Convert to lowercase for better matching
  const text = transcription.toLowerCase();
  
  // Extract skills
  RECOGNIZED_SKILLS.forEach(skill => {
    if (text.includes(skill.toLowerCase())) {
      skills.add(skill);
    }
  });

  // Extract interests
  RECOGNIZED_INTERESTS.forEach(interest => {
    if (text.includes(interest.toLowerCase())) {
      interests.add(interest);
    }
  });

  // Extract project information
  const projectMatch = text.match(/project called ["']([^"']+)["']/i);
  if (projectMatch) {
    const projectName = projectMatch[1];
    const techStack = Array.from(skills).filter(skill => 
      text.includes(`used: ${skill}`) || 
      text.includes(`using ${skill}`) ||
      text.includes(`built with ${skill}`)
    );
    
    projects.push({
      name: projectName,
      technologies: techStack,
      description: extractProjectDescription(text, projectName)
    });
  }

  // Determine team preferences
  const teamPreferences = {
    flexibility: text.includes('open to') || text.includes('flexible') ? 'flexible' : 'specific',
    requiredSkills: Array.from(skills).filter(skill => 
      text.includes(`looking for ${skill}`) || 
      text.includes(`need ${skill}`)
    )
  } as ParsedTranscription['teamPreferences'];

  return {
    skills: Array.from(skills),
    interests: Array.from(interests),
    projectExperience: projects.length > 0 ? projects : undefined,
    teamPreferences
  };
}

function extractProjectDescription(text: string, projectName: string): string {
  const sentences = text.split(/[.!?]+/);
  const relevantSentences = sentences.filter(sentence => 
    sentence.toLowerCase().includes(projectName.toLowerCase()) ||
    sentence.toLowerCase().includes('built') ||
    sentence.toLowerCase().includes('created') ||
    sentence.toLowerCase().includes('developed')
  );
  
  return relevantSentences.join('. ').trim();
}

// Zod schema for validation
export const TranscriptionSchema = z.object({
  skills: z.array(z.string()),
  interests: z.array(z.string()),
  projectExperience: z.array(z.object({
    name: z.string(),
    technologies: z.array(z.string()),
    description: z.string()
  })).optional(),
  teamPreferences: z.object({
    desiredTeamSize: z.number().optional(),
    requiredSkills: z.array(z.string()).optional(),
    flexibility: z.enum(['flexible', 'specific'])
  }).optional()
}); 