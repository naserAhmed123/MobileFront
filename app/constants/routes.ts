export const ROUTES = {
  //les routes de authentificaion w mateb3ha
  AUTH: '../(auth)' as const,
  LOGIN: '../(auth)/login' as const,
  BLOCKED: '../(auth)/blocked' as const,
  BLOCKED_CIT: '../(auth)/blockedCit' as const,

  //routes de citoyen
  HOME_CITOYEN: '../(main)/homeCitoyen' as const,
  RECLAMATIONS: '../(main)/reclamations' as const,
  ADD: '../(main)/reclamations/add' as const,

  REFERENCES: '../(main)/references' as const,
  PLAINTES: '../(main)/plaintes' as const,
  MES_PLAINTES: '../(main)/plaintes/TousMesPlainte' as const,

  PROFILE: '../(main)/profile' as const,
  PROFILE_CITOYEN: '../(main)/profile/indexCitoyen' as const,

  //routes de technicien
  HOME_TECHNICIEN: '../(main)/homeTechnicien' as const,
  INTERVENTIONS: '../(main)/interventions' as const,
  RAPPORTS: '../(main)/rapports' as const,
  CHAT: '../(main)/chat' as const,
  MATERIELS: '../(main)/materielTechnicien' as const,
  NOTIFICATIONS: '../(main)/notifications' as const,
  AIDE: '../(main)/aide' as const,
    AIDE_CITOYEN: '../(main)/aideCitoyen' as const,

  PLANNING: '../(main)/planning' as const,
} as const;

export type AppRoute = typeof ROUTES[keyof typeof ROUTES]; 