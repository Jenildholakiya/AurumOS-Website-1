export interface License {
  id:           number
  key:          string          // AU-XXXX-XXXX-XXXX-XXXX
  business_name:string
  owner_name:   string
  city:         string
  phone:        string | null
  status:       'active' | 'revoked' | 'pending'
  machine_id:   string | null   // set on first activation
  activated_at: string | null
  created_at:   string
  notes:        string | null
  amount_paid:  number | null   // ₹ amount you received
}

export interface ActivationLog {
  id:          number
  license_id:  number
  machine_id:  string
  ip_address:  string | null
  checked_at:  string
  status:      'ok' | 'revoked' | 'not_found'
}

export interface DashboardStats {
  total_licenses:  number
  active:          number
  revoked:         number
  pending:         number
  total_revenue:   number
  this_month:      number
  recent:          License[]
}

export interface GenerateFormData {
  business_name: string
  owner_name:    string
  city:          string
  phone:         string
  amount_paid:   string
  notes:         string
}
