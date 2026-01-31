import { GuestData } from '../types';

// List of question files - this will be populated from the file system
// In production, this could be generated at build time or fetched from an API
const QUESTION_FILES = [
  '001_How to Improve Memory  Focus Using Science Protoco_jC8Pu9HBd48_questions.json',
  '001_Using Play to Rewire  Improve Your Brain  Huberman_BRG4_KfTxbs_questions.json',
  '002_How to Heal From Post-Traumatic Stress Disorder PT_4RFEkGKKhdE_questions.json',
  '003_Essentials Therapy Treating Trauma  Other Life Cha_iNL_BFlHYZ8_questions.json',
  '007_Optimizing Workspace for Productivity Focus  Creat_23t_ynq2tmk_questions.json',
  '015_Essentials Build a Healthy Gut Microbiome  Dr Just_n_MVhE63ZQQ_questions.json',
  '017_The Science of Making  Breaking Habits  Huberman L_HXuj7wAt7u8_questions.json',
  '019_Essentials Using Hypnosis to Enhance Mental  Physi_SOo4yNoaAoc_questions.json',
  '022_How to Speak Clearly  With Confidence  Matt Abraha_ZtTUfMHuioA_questions.json',
  '025_Erasing Fears  Traumas Using Modern Neuroscience_tpntW9Tte4M_questions.json',
  '030_How to Overcome Inner Resistance  Steven Pressfiel_cpKsogGdem4_questions.json',
  '035_Essentials How Humans Select  Keep Romantic Partne_VqiPNN4Jblk_questions.json',
  '054_Male vs Female Brain Differences  How They Arise F_k8SBJzsIWAo_questions.json',
  '056_Health Effects  Risks of Kratom Opioids  Other Nat_gyE6Z4GLEeM_questions.json',
];

class QuestionLoaderClass {
  private static instance: QuestionLoaderClass;
  private guests: GuestData[] = [];
  private loaded: boolean = false;

  private constructor() {}

  public static getInstance(): QuestionLoaderClass {
    if (!QuestionLoaderClass.instance) {
      QuestionLoaderClass.instance = new QuestionLoaderClass();
    }
    return QuestionLoaderClass.instance;
  }

  public async loadAllQuestions(): Promise<GuestData[]> {
    if (this.loaded) {
      return this.guests;
    }

    // Use the sample data for now - this works reliably
    // In production, you would fetch from an API or use a build-time generated manifest
    this.guests = this.getSampleData();
    this.loaded = true;
    
    console.log(`Loaded ${this.guests.length} guests with questions`);
    return this.guests;
  }

  private getSampleData(): GuestData[] {
    // Sample data for development/testing - comprehensive set based on actual content
    return [
      {
        video_id: 'gyE6Z4GLEeM',
        title: 'Health Effects & Risks of Kratom, Opioids & Other Natural Medicines | Dr. Chris McCurdy',
        url: 'https://www.youtube.com/watch?v=gyE6Z4GLEeM',
        duration: 9773,
        guest: 'Dr. Chris McCurdy',
        summary: 'Discussion about Kratom effects, risks, and plant alkaloids in medicine.',
        key_takeaways: [
          'Understand the difference between kratom leaf and kratom-derived products',
          'Be aware of kratom\'s potential for addiction',
          'Start with the lowest possible dose to avoid tolerance',
        ],
        questions: [
          {
            id: 1,
            type: 'factual',
            difficulty: 'easy',
            question: 'What is the botanical name of the Kratom tree?',
            options: [
              { id: 'a', text: 'Cannabis sativa', correct: false },
              { id: 'b', text: 'Mitragyna speciosa', correct: true },
              { id: 'c', text: 'Papaver somniferum', correct: false },
              { id: 'd', text: 'Erythroxylum coca', correct: false },
            ],
            explanation: 'Mitragyna speciosa is the scientific name for the Kratom tree.',
          },
          {
            id: 2,
            type: 'opinion',
            difficulty: 'medium',
            question: 'For individuals seeking a mild stimulant effect from Kratom, what approach is recommended?',
            options: [
              { id: 'a', text: 'Consuming the highest available concentration', correct: false },
              { id: 'b', text: 'Ingesting kratom on an empty stomach', correct: false },
              { id: 'c', text: 'Starting with the lowest effective dose', correct: true },
              { id: 'd', text: 'Mixing with other stimulants', correct: false },
            ],
            explanation: 'Starting with the lowest effective dose minimizes the risk of tolerance and dependence.',
          },
          {
            id: 3,
            type: 'factual',
            difficulty: 'hard',
            question: 'Which chemical characteristic is essential for a molecule to be classified as an alkaloid?',
            options: [
              { id: 'a', text: 'Presence of a carboxyl group', correct: false },
              { id: 'b', text: 'Presence of a phosphate group', correct: false },
              { id: 'c', text: 'Presence of a nitrogen atom', correct: true },
              { id: 'd', text: 'Presence of a halogen', correct: false },
            ],
            explanation: 'Alkaloids are organic compounds that contain at least one nitrogen atom.',
          },
        ],
      },
      {
        video_id: 'k8SBJzsIWAo',
        title: 'Male vs Female Brain Differences & How They Arise | Dr. Lisa Mosconi',
        url: 'https://www.youtube.com/watch?v=k8SBJzsIWAo',
        duration: 8400,
        guest: 'Dr. Lisa Mosconi',
        summary: 'Exploring the differences between male and female brains and their implications.',
        key_takeaways: [
          'Brain differences emerge from both biology and environment',
          'Hormones play a significant role in brain development',
          'Understanding differences can improve health outcomes',
        ],
        questions: [
          {
            id: 1,
            type: 'factual',
            difficulty: 'easy',
            question: 'What is the primary hormone associated with female reproductive health?',
            options: [
              { id: 'a', text: 'Testosterone', correct: false },
              { id: 'b', text: 'Estrogen', correct: true },
              { id: 'c', text: 'Cortisol', correct: false },
              { id: 'd', text: 'Insulin', correct: false },
            ],
            explanation: 'Estrogen is the primary female sex hormone and plays a key role in reproductive health.',
          },
          {
            id: 2,
            type: 'opinion',
            difficulty: 'medium',
            question: 'Which factor most significantly influences brain development differences?',
            options: [
              { id: 'a', text: 'Diet alone', correct: false },
              { id: 'b', text: 'Combination of hormones and environment', correct: true },
              { id: 'c', text: 'Exercise only', correct: false },
              { id: 'd', text: 'Sleep patterns', correct: false },
            ],
            explanation: 'Brain development is influenced by a complex interplay of hormones and environmental factors.',
          },
          {
            id: 3,
            type: 'factual',
            difficulty: 'hard',
            question: 'At what stage do sex-based brain differences begin to emerge?',
            options: [
              { id: 'a', text: 'At puberty', correct: false },
              { id: 'b', text: 'In early childhood', correct: false },
              { id: 'c', text: 'During prenatal development', correct: true },
              { id: 'd', text: 'In adolescence', correct: false },
            ],
            explanation: 'Sex-based brain differences begin to emerge during prenatal development due to hormonal influences.',
          },
        ],
      },
      {
        video_id: 'ZtTUfMHuioA',
        title: 'How to Speak Clearly & With Confidence | Matt Abrahams',
        url: 'https://www.youtube.com/watch?v=ZtTUfMHuioA',
        duration: 7200,
        guest: 'Matt Abrahams',
        summary: 'Techniques for clear communication and building speaking confidence.',
        key_takeaways: [
          'Structure your message before speaking',
          'Practice reduces anxiety',
          'Focus on the audience, not yourself',
        ],
        questions: [
          {
            id: 1,
            type: 'factual',
            difficulty: 'easy',
            question: 'What is the first step to speaking more clearly?',
            options: [
              { id: 'a', text: 'Speaking faster', correct: false },
              { id: 'b', text: 'Structuring your message', correct: true },
              { id: 'c', text: 'Using complex vocabulary', correct: false },
              { id: 'd', text: 'Avoiding eye contact', correct: false },
            ],
            explanation: 'Structuring your message helps organize thoughts and improve clarity.',
          },
          {
            id: 2,
            type: 'opinion',
            difficulty: 'medium',
            question: 'What is the most effective way to reduce speaking anxiety?',
            options: [
              { id: 'a', text: 'Avoiding public speaking entirely', correct: false },
              { id: 'b', text: 'Regular practice and preparation', correct: true },
              { id: 'c', text: 'Speaking without notes', correct: false },
              { id: 'd', text: 'Focusing on mistakes', correct: false },
            ],
            explanation: 'Regular practice and preparation build confidence and reduce anxiety.',
          },
          {
            id: 3,
            type: 'factual',
            difficulty: 'hard',
            question: 'According to communication research, what percentage of communication is non-verbal?',
            options: [
              { id: 'a', text: 'About 20%', correct: false },
              { id: 'b', text: 'About 40%', correct: false },
              { id: 'c', text: 'About 55-93%', correct: true },
              { id: 'd', text: 'About 10%', correct: false },
            ],
            explanation: 'Research suggests 55-93% of communication is non-verbal, including body language and tone.',
          },
        ],
      },
      {
        video_id: 'n_MVhE63ZQQ',
        title: 'Essentials: Build a Healthy Gut Microbiome | Dr. Justin Sonnenburg',
        url: 'https://www.youtube.com/watch?v=n_MVhE63ZQQ',
        duration: 6800,
        guest: 'Dr. Justin Sonnenburg',
        summary: 'Understanding the gut microbiome and how to optimize it for health.',
        key_takeaways: [
          'Fiber is essential for gut bacteria',
          'Diversity in diet promotes microbiome health',
          'Fermented foods support beneficial bacteria',
        ],
        questions: [
          {
            id: 1,
            type: 'factual',
            difficulty: 'easy',
            question: 'What is the primary food source for beneficial gut bacteria?',
            options: [
              { id: 'a', text: 'Protein', correct: false },
              { id: 'b', text: 'Fiber', correct: true },
              { id: 'c', text: 'Fat', correct: false },
              { id: 'd', text: 'Sugar', correct: false },
            ],
            explanation: 'Fiber serves as the primary food source for beneficial gut bacteria.',
          },
          {
            id: 2,
            type: 'opinion',
            difficulty: 'medium',
            question: 'Which dietary change is most beneficial for gut microbiome diversity?',
            options: [
              { id: 'a', text: 'Eating the same foods daily', correct: false },
              { id: 'b', text: 'Consuming a variety of plant-based foods', correct: true },
              { id: 'c', text: 'Taking antibiotics regularly', correct: false },
              { id: 'd', text: 'Avoiding all fermented foods', correct: false },
            ],
            explanation: 'A diverse diet with various plant-based foods promotes microbiome diversity.',
          },
          {
            id: 3,
            type: 'factual',
            difficulty: 'hard',
            question: 'Approximately how many bacterial cells reside in the human gut?',
            options: [
              { id: 'a', text: 'Around 1 million', correct: false },
              { id: 'b', text: 'Around 1 billion', correct: false },
              { id: 'c', text: 'Around 38 trillion', correct: true },
              { id: 'd', text: 'Around 100 thousand', correct: false },
            ],
            explanation: 'The human gut contains approximately 38 trillion bacterial cells.',
          },
        ],
      },
      {
        video_id: '23t_ynq2tmk',
        title: 'Optimizing Workspace for Productivity, Focus & Creativity | Huberman Lab',
        url: 'https://www.youtube.com/watch?v=23t_ynq2tmk',
        duration: 5400,
        guest: null,
        summary: 'Science-based strategies for setting up an optimal workspace.',
        key_takeaways: [
          'Light exposure affects alertness and productivity',
          'Temperature influences cognitive performance',
          'Workspace organization impacts focus',
        ],
        questions: [
          {
            id: 1,
            type: 'factual',
            difficulty: 'easy',
            question: 'What type of light is best for alertness during work?',
            options: [
              { id: 'a', text: 'Dim warm light', correct: false },
              { id: 'b', text: 'Bright overhead light', correct: true },
              { id: 'c', text: 'No light', correct: false },
              { id: 'd', text: 'Only candlelight', correct: false },
            ],
            explanation: 'Bright overhead light increases alertness and supports focus.',
          },
          {
            id: 2,
            type: 'opinion',
            difficulty: 'medium',
            question: 'What is the optimal temperature range for cognitive work?',
            options: [
              { id: 'a', text: 'Very warm (80°F+)', correct: false },
              { id: 'b', text: 'Cool to moderate (65-72°F)', correct: true },
              { id: 'c', text: 'Very cold (below 55°F)', correct: false },
              { id: 'd', text: 'Temperature doesn\'t matter', correct: false },
            ],
            explanation: 'Cool to moderate temperatures support optimal cognitive performance.',
          },
          {
            id: 3,
            type: 'factual',
            difficulty: 'hard',
            question: 'What is the recommended screen position relative to eye level?',
            options: [
              { id: 'a', text: 'Far below eye level', correct: false },
              { id: 'b', text: 'At or slightly below eye level', correct: true },
              { id: 'c', text: 'Far above eye level', correct: false },
              { id: 'd', text: 'To the side', correct: false },
            ],
            explanation: 'Screen should be at or slightly below eye level to reduce strain.',
          },
        ],
      },
      {
        video_id: 'HXuj7wAt7u8',
        title: 'The Science of Making & Breaking Habits | Huberman Lab',
        url: 'https://www.youtube.com/watch?v=HXuj7wAt7u8',
        duration: 8100,
        guest: null,
        summary: 'Understanding the neuroscience behind habit formation and how to change behaviors.',
        key_takeaways: [
          'Habits are stored in the basal ganglia',
          'Dopamine plays a key role in habit formation',
          'Environment cues trigger habitual behaviors',
        ],
        questions: [
          {
            id: 1,
            type: 'factual',
            difficulty: 'easy',
            question: 'Which brain region is primarily responsible for storing habits?',
            options: [
              { id: 'a', text: 'Prefrontal cortex', correct: false },
              { id: 'b', text: 'Basal ganglia', correct: true },
              { id: 'c', text: 'Hippocampus', correct: false },
              { id: 'd', text: 'Cerebellum', correct: false },
            ],
            explanation: 'The basal ganglia is the primary brain region for habit storage.',
          },
          {
            id: 2,
            type: 'opinion',
            difficulty: 'medium',
            question: 'What is the most effective strategy for breaking a bad habit?',
            options: [
              { id: 'a', text: 'Pure willpower', correct: false },
              { id: 'b', text: 'Replacing it with a new habit', correct: true },
              { id: 'c', text: 'Ignoring it', correct: false },
              { id: 'd', text: 'Only focusing on the negative', correct: false },
            ],
            explanation: 'Replacing a bad habit with a new one is more effective than elimination alone.',
          },
          {
            id: 3,
            type: 'factual',
            difficulty: 'hard',
            question: 'According to research, how long does it typically take to form a new habit?',
            options: [
              { id: 'a', text: 'Exactly 21 days', correct: false },
              { id: 'b', text: '18 to 254 days, averaging 66 days', correct: true },
              { id: 'c', text: 'Only 7 days', correct: false },
              { id: 'd', text: 'One year minimum', correct: false },
            ],
            explanation: 'Research shows habit formation takes 18-254 days, with 66 days being average.',
          },
        ],
      },
      {
        video_id: 'cpKsogGdem4',
        title: 'How to Overcome Inner Resistance | Steven Pressfield',
        url: 'https://www.youtube.com/watch?v=cpKsogGdem4',
        duration: 7800,
        guest: 'Steven Pressfield',
        summary: 'Understanding and overcoming the resistance that prevents creative work.',
        key_takeaways: [
          'Resistance is a universal force against creativity',
          'Showing up daily defeats resistance',
          'Professional mindset overcomes amateur thinking',
        ],
        questions: [
          {
            id: 1,
            type: 'factual',
            difficulty: 'easy',
            question: 'According to Steven Pressfield, what is Resistance?',
            options: [
              { id: 'a', text: 'A physical force', correct: false },
              { id: 'b', text: 'An internal force that opposes creative work', correct: true },
              { id: 'c', text: 'External criticism', correct: false },
              { id: 'd', text: 'Lack of talent', correct: false },
            ],
            explanation: 'Resistance is the internal force that opposes our creative endeavors.',
          },
          {
            id: 2,
            type: 'opinion',
            difficulty: 'medium',
            question: 'What is the primary difference between professionals and amateurs?',
            options: [
              { id: 'a', text: 'Talent level', correct: false },
              { id: 'b', text: 'Showing up every day regardless of conditions', correct: true },
              { id: 'c', text: 'Having expensive equipment', correct: false },
              { id: 'd', text: 'Being paid for work', correct: false },
            ],
            explanation: 'Professionals show up every day regardless of how they feel; amateurs wait for inspiration.',
          },
          {
            id: 3,
            type: 'factual',
            difficulty: 'hard',
            question: 'What does Pressfield identify as the strongest indicator of Resistance?',
            options: [
              { id: 'a', text: 'Feeling tired', correct: false },
              { id: 'b', text: 'The more important the work, the stronger the Resistance', correct: true },
              { id: 'c', text: 'Lack of ideas', correct: false },
              { id: 'd', text: 'Financial constraints', correct: false },
            ],
            explanation: 'Resistance is strongest against work that matters most to our growth.',
          },
        ],
      },
      {
        video_id: 'VqiPNN4Jblk',
        title: 'Essentials: How Humans Select & Keep Romantic Partners | Huberman Lab',
        url: 'https://www.youtube.com/watch?v=VqiPNN4Jblk',
        duration: 6200,
        guest: null,
        summary: 'The science of attraction, mate selection, and relationship maintenance.',
        key_takeaways: [
          'Attraction involves biological and psychological factors',
          'Communication is key to relationship longevity',
          'Shared values predict relationship success',
        ],
        questions: [
          {
            id: 1,
            type: 'factual',
            difficulty: 'easy',
            question: 'What hormone is associated with bonding and attachment?',
            options: [
              { id: 'a', text: 'Cortisol', correct: false },
              { id: 'b', text: 'Oxytocin', correct: true },
              { id: 'c', text: 'Adrenaline', correct: false },
              { id: 'd', text: 'Insulin', correct: false },
            ],
            explanation: 'Oxytocin is known as the "bonding hormone" and promotes attachment.',
          },
          {
            id: 2,
            type: 'opinion',
            difficulty: 'medium',
            question: 'What is the strongest predictor of long-term relationship success?',
            options: [
              { id: 'a', text: 'Physical attraction', correct: false },
              { id: 'b', text: 'Shared values and communication', correct: true },
              { id: 'c', text: 'Financial compatibility', correct: false },
              { id: 'd', text: 'Similar hobbies', correct: false },
            ],
            explanation: 'Shared values and good communication are the strongest predictors of relationship success.',
          },
          {
            id: 3,
            type: 'factual',
            difficulty: 'hard',
            question: 'What is the Gottman ratio for healthy relationships?',
            options: [
              { id: 'a', text: '1:1 positive to negative interactions', correct: false },
              { id: 'b', text: '5:1 positive to negative interactions', correct: true },
              { id: 'c', text: '10:1 positive to negative interactions', correct: false },
              { id: 'd', text: '2:1 positive to negative interactions', correct: false },
            ],
            explanation: 'The Gottman ratio suggests 5 positive interactions for every 1 negative in healthy relationships.',
          },
        ],
      },
    ];
  }

  public getGuestById(videoId: string): GuestData | undefined {
    return this.guests.find(g => g.video_id === videoId);
  }

  public getGuestByName(name: string): GuestData | undefined {
    return this.guests.find(g => {
      const guestName = this.extractGuestName(g);
      return guestName?.toLowerCase().includes(name.toLowerCase());
    });
  }

  private extractGuestName(guest: GuestData): string | null {
    if (guest.guest) {
      return guest.guest;
    }

    const title = guest.title;
    const pipeIndex = title.lastIndexOf('|');
    if (pipeIndex !== -1) {
      return title.substring(pipeIndex + 1).trim();
    }

    return null;
  }

  public getGuestCount(): number {
    return this.guests.length;
  }

  public getGuestsWithFilter(filter: {
    difficulty?: 'easy' | 'medium' | 'hard';
    hasGuest?: boolean;
  }): GuestData[] {
    return this.guests.filter(guest => {
      if (filter.hasGuest !== undefined) {
        const hasGuestName = !!this.extractGuestName(guest);
        if (filter.hasGuest !== hasGuestName) return false;
      }

      if (filter.difficulty) {
        const hasDifficulty = guest.questions.some(
          q => q.difficulty === filter.difficulty
        );
        if (!hasDifficulty) return false;
      }

      return true;
    });
  }
}

export const QuestionLoader = QuestionLoaderClass;
