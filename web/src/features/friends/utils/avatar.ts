const AVATAR_BASE =
  'https://api.dicebear.com/7.x/funemoji/svg?backgroundColor=b6e3f4,c0aede,d1d4f9&backgroundType=gradientLinear&radius=50'

export const buildAvatarUrl = (seed: string) => {
  const value = seed || 'friends'
  return `${AVATAR_BASE}&seed=${encodeURIComponent(value)}`
}


