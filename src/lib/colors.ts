const AVATAR_COLORS = [
  '#FFB6C1', // light pink
  '#FF69B4', // hot pink
  '#FF1493', // deep pink
  '#DB7093', // pale violet red
  '#FFC0CB', // pink
  '#FFD1DC', // pastel pink
  '#E75480', // dark pink
  '#F4A7B9', // nadeshiko pink
  '#FADADD', // pale pink
  '#FF85A2', // salmon pink
]

export function getAvatarColor(id: string): string {
  // Generate a consistent color based on the id
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    const char = id.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  const index = Math.abs(hash) % AVATAR_COLORS.length
  return AVATAR_COLORS[index]
}

