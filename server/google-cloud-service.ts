// Stub file - Google Cloud services removed, using AWS (DynamoDB, Cognito, S3) instead

export const googleCloudSigninBackupService = {
  getSigninData: async (_filters?: any) => ({ success: false, recordsFound: 0, data: [] }),
  storeSigninData: async (_records: any[]) => ({ success: false }),
};

export const googleCloudService = {
  initializeBucket: async () => { },
  healthCheck: async () => ({ dynamodb: false, s3: false }),
  getTodaysFyersToken: async () => null,
  
  
  
  
  
  
  
  
  
  getAllCollectionData: async () => [],
  getData: async () => null,
  getCachedData: async () => ({ success: false, data: null }),
  cacheData: async () => { },
  storeRealtimeData: async () => ({ success: false }),
  storeData: async () => ({ success: false }),
  updateStrategy: async () => ({ success: false }),
  deleteStrategy: async () => ({ success: false }),
  deleteOldFyersTokens: async () => 0,
  saveFyersToken: async () => ({ success: false }),
  getAllFyersTokens: async () => []
};
