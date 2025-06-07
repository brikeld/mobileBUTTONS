// Data processing and filter mappings
const filterMappings = {
  'demographics_gender': { path: 'demographics.gender', label: 'GENDERS' },
  'demographics_ethnicity': { path: 'demographics.ethnicity', label: 'ETHNICITIES' },
  'demographics_age_range': { path: 'demographics.age_range', label: 'AGE RANGE' },
  'personality_traits_introvert_extrovert': { path: 'personality_traits.introvert_extrovert', label: 'PERSONALITY TRAITS' },
  'personality_traits_biggest_strength_category': { path: 'personality_traits.biggest_strength.category', label: 'BIGGEST STRENGTHS' },
  'personality_traits_biggest_fear_category': { path: 'personality_traits.biggest_fear.category', label: 'BIGGEST FEARS' },
  'moral_ambiguity_betrays_others': { path: 'personality_traits.moral_ambiguity.betrays_others', label: 'BETRAYAL' },
  'background_history_tragic_past': { path: 'background_history.tragic_past', label: 'TRAGIC PAST' },
  'socioeconomic_income_level': { path: 'socioeconomic.income_level', label: 'INCOME LEVEL' },
  'narrative_arc_goal_achievement': { path: 'narrative_arc.goal_achievement', label: 'GOAL ACHIEVEMENT' },
  'relationships_family_parental_status': { path: 'relationships_family.parental_status', label: 'PARENTAL STATUS' },
  'dialogue_analysis_swear_frequency': { path: 'dialogue_analysis.swear_frequency', label: 'SWEAR FREQUENCY' }
};

let charactersData = null;

// Load data
fetch('./testDoing.json')
  .then(response => response.json())
  .then(data => {
    charactersData = data.characters;
  });

function formatEarnings(num) {
  const format = (value, suffix) => {
    let formatted = value.toPrecision(3);
    if (formatted.includes('e+')) {
      formatted = formatted.split('e+')[0];
    }
    return `${formatted}${suffix}`;
  };
  if (num >= 1e12) return format(num / 1e12, 'T');
  if (num >= 1e9) return format(num / 1e9, 'B');
  if (num >= 1e6) return format(num / 1e6, 'M');
  if (num >= 1e3) return format(num / 1e3, 'K');
  return num.toPrecision(3);
}

function getNestedValue(obj, path) {
  return path.split('.').reduce((curr, prop) => curr?.[prop], obj);
}

function normalizeCategory(category) {
  if (!category) return category;
  
  // Replace underscores with spaces
  let normalized = category.toString().replace(/_/g, ' ');
  
  // Handle specific consolidations
  if (normalized === 'working class' || normalized === 'working_class') {
    return 'working class';
  }
  
  return normalized;
}

function processFilterData(filterId) {
  const mapping = filterMappings[filterId];
  if (!mapping || !charactersData) return null;

  const groups = {};
  
  charactersData.forEach(character => {
    const value = getNestedValue(character.character_analysis, mapping.path);
    if (!value) return;
    
    const rawKey = Array.isArray(value) ? value[0] : value;
    const key = normalizeCategory(rawKey);
    if (!groups[key]) {
      groups[key] = { movies: [], totalBoxOffice: 0 };
    }
    
    groups[key].movies.push({
      name: character.film_info.film_name,
      boxOffice: character.film_info.box_office,
      year: character.film_info.year,
      imagePath: character.film_info.image_path
    });
    groups[key].totalBoxOffice += character.film_info.box_office;
  });

  // Sort movies within each group by box office (highest to lowest)
  Object.values(groups).forEach(group => {
    group.movies.sort((a, b) => b.boxOffice - a.boxOffice);
  });

  const sortedGroups = Object.entries(groups)
    .sort(([,a], [,b]) => b.totalBoxOffice - a.totalBoxOffice)
    .map(([key, data], index) => ({
      name: key,
      ...data,
      isWinner: index === 0
    }));

  return { label: mapping.label, groups: sortedGroups };
}

function getAllFilmIds() {
  if (!charactersData) return [];
  
  return charactersData.map(character => {
    const filmName = character.film_info.film_name;
    return `film-${filmName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`;
  });
}

function getFilmIdByName(filmName) {
  return `film-${filmName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`;
} 