export type AppRoutes = {
  // login w mateb3o 
  '/(auth)': undefined;
  '/(auth)/login': undefined;
  '/(auth)/blocked': undefined;
  '/(auth)/blockedCit': undefined;

  // citoyen
  '/(main)/homeCitoyen': undefined;
  '/(main)/reclamations': undefined;
  '/(main)/references': undefined;
  '/(main)/plaintes': undefined;
  '/(main)/profile': undefined;

  // technicien
  '/(main)/homeTechnicien': undefined;
  '/(main)/interventions': undefined;
  '/(main)/rapports': undefined;
  '/(main)/chat': undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends AppRoutes {}
  }
} 