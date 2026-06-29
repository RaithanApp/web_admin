import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ── Types ────────────────────────────────────────────────────────────────────

export type ProviderProfile = {
  id: string
  user_id: string
  first_name: string | null
  last_name: string | null
  year_of_birth: number | null
  gender: string | null
  profile_image_url: string | null
  status: string
  created_at: string
  updated_at: string
}

export type Business = {
  id: string
  user_id: string
  business_name: string | null
  business_type: string
  pincode: string
  block_number: string
  street: string
  area: string
  landmark: string | null
  city: string
  state: string
  mobile_number: string
  working_days: Record<string, boolean>
  working_time: { start: string; end: string }
  categories: string[]
  created_at: string
  updated_at: string
}

export type Product = {
  id: string
  user_id: string
  business_id: string
  product_type: string
  hp: string | null
  model_no: string | null
  type: string | null
  e_shram_card_number: string | null
  ready_to_travel: boolean
  is_individual: boolean
  number_of_workers: number
  services: string[]
  image_front: string | null
  image_back: string | null
  image_left: string | null
  image_right: string | null
  doc_driving_license: string | null
  doc_rc_book: string | null
  doc_bill: string | null
  doc_e_shram_card: string | null
  verification_status: string
  avg_rating: number
  created_at: string
  updated_at: string
}

export type Seeker = {
  id: string
  phone_number: string
  created_at: string
  updated_at: string
}

// ── Status helpers ────────────────────────────────────────────────────────────

/**
 * Derives the display status for a provider given their profile status
 * and whether they have a business record.
 */
export function deriveProviderStatus(
  profileStatus: string,
  hasBusiness: boolean
): string {
  if (profileStatus === 'profile_pending') return 'otp_verified'
  if (profileStatus === 'business_pending' || (!hasBusiness && profileStatus !== 'verified' && profileStatus !== 'rejected' && profileStatus !== 'blocked')) {
    return 'business_details_remaining'
  }
  return profileStatus // 'verified' | 'rejected' | 'blocked' | 'verification_required'
}