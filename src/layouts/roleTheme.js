import { ROLES } from '../utils/constants'

/** Sidebar and accent colors. Presentation only — not used for permissions. */
export const ROLE_COLORS = {
  [ROLES.ADMINISTRATOR]: '#182D69',
  [ROLES.SECURITY_GUARD]: '#15803D',
  [ROLES.DOCTOR]: '#0D9488',
  [ROLES.NURSING_STAFF]: '#E11D48',
  [ROLES.OPD_STAFF]: '#0284C7',
  [ROLES.DEPARTMENT_SECRETARY]: '#E11D48',
}

export function roleColor(role) {
  return ROLE_COLORS[role] || ROLE_COLORS[ROLES.ADMINISTRATOR]
}
