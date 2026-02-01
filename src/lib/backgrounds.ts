export interface Background {
  id: string
  name: string
  url: string
}

const SUPABASE_STORAGE_URL = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/backgrounds`

export const backgrounds: Background[] = [
  {
    id: 'video-1',
    name: 'Video 1',
    url: `${SUPABASE_STORAGE_URL}/video-1.mp4`,
  },
  {
    id: 'video-2',
    name: 'Video 2',
    url: `${SUPABASE_STORAGE_URL}/video-2.mp4`,
  },
  {
    id: 'video-3',
    name: 'Video 3',
    url: `${SUPABASE_STORAGE_URL}/video-3.mp4`,
  },
  {
    id: 'video-4',
    name: 'Video 4',
    url: `${SUPABASE_STORAGE_URL}/video-4.mp4`,
  },
  {
    id: 'video-5',
    name: 'Video 5',
    url: `${SUPABASE_STORAGE_URL}/video-5.mp4`,
  },
]

export const defaultBackground = backgrounds[0]

