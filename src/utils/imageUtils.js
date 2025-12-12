
// Fallback images categorized
const categoryImages = {
  default: [
    'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1611974765270-ca1258634369?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=800&q=80'
  ],
  markets: [
    'https://images.unsplash.com/photo-1611974765270-ca1258634369?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1535320903710-d9cf76d51c92?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1642543492481-44e81e3914a7?auto=format&fit=crop&w=800&q=80'
  ],
  economy: [
    'https://images.unsplash.com/photo-1526304640155-24e3acfad16ef?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1580519542036-c47de6196ba5?auto=format&fit=crop&w=800&q=80'
  ],
  technology: [
    'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800&q=80'
  ],
  ipo: [
    'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1579532537598-459ecdaf39cc?auto=format&fit=crop&w=800&q=80'
  ]
};

export const getRandomImage = (categoryName = '') => {
  const normalizedCat = (categoryName || '').toLowerCase();
  let images = categoryImages.default;

  if (normalizedCat.includes('market') || normalizedCat.includes('stock')) images = categoryImages.markets;
  else if (normalizedCat.includes('economy') || normalizedCat.includes('finance')) images = categoryImages.economy;
  else if (normalizedCat.includes('tech') || normalizedCat.includes('digital')) images = categoryImages.technology;
  else if (normalizedCat.includes('ipo') || normalizedCat.includes('startup')) images = categoryImages.ipo;

  return images[Math.floor(Math.random() * images.length)];
};
