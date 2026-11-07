/**
 * Preview stand-in for the two DSH icons ModelPicker uses. The real package
 * pulls in markdown, code highlighting, and host stores; these copy its artwork.
 */
interface IconProps { size?: number; className?: string }

export const IconCheckOutlineMedium = ({ size = 16, className }: IconProps) => (
  <svg width={size} height={size} className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true" strokeWidth={1.3}>
    <path d="M2.25 8.5L5.49732 11.7473C5.90519 12.1552 6.57263 12.1344 6.95426 11.7018L13.75 4" stroke="currentColor" />
  </svg>
)

export const IconChevronDownOutlineMedium = ({ size = 14, className }: IconProps) => (
  <svg width={size} height={size} className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true" strokeWidth={1.3}>
    <path d="M4 6L7.29289 9.29289C7.68342 9.68342 8.31658 9.68342 8.70711 9.29289L12 6" stroke="currentColor" />
  </svg>
)
