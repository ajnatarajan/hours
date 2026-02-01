const AVATAR_COLORS = [
  '#4CD964', // green
  '#FF6B6B', // red
  '#4DABF7', // blue
  '#FFD93D', // yellow
  '#9775FA', // purple
  '#FF922B', // orange
  '#F06595', // pink
  '#20C997', // teal
  '#69DB7C', // light green
  '#748FFC', // indigo
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

