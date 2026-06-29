type StatusBadgeProps = {
  status: string
}

const STATUS_CONFIG: Record<
  string,
  { label: string; className: string }
> = {
  verified: {
    label: 'Verified',
    className: 'bg-green-500 text-white',
  },
  rejected: {
    label: 'Rejected',
    className: 'bg-red-600 text-white',
  },
  blocked: {
    label: 'Blocked',
    className: 'bg-gray-900 text-white',
  },
  verification_required: {
    label: 'Verification Required',
    className: 'bg-orange-500 text-white',
  },
  otp_verified: {
    label: 'Otp Verified',
    className: 'bg-blue-500 text-white',
  },
  business_details_remaining: {
    label: 'Business Details Remaining',
    className: 'bg-orange-400 text-white',
  },
  profile_pending: {
    label: 'Otp Verified',
    className: 'bg-blue-500 text-white',
  },
  // product verification statuses
  unverified: {
    label: 'Unverified',
    className: 'bg-red-500 text-white',
  },
  reverification_required: {
    label: 'Reverification Required',
    className: 'bg-yellow-500 text-white',
  },
  modification_required: {
    label: 'Modification Required',
    className: 'bg-yellow-400 text-gray-900',
  },
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? {
    label: status,
    className: 'bg-gray-200 text-gray-700',
  }

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${config.className}`}
    >
      {config.label}
    </span>
  )
}