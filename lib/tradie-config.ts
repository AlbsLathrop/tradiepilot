export function getTradieConfigId(email: string): string {
  const mapping: Record<string, string> = {
    'joey@tradie.test': 'joey-tradie',
    'ben@tradie.test': 'bens-stonework',
    'joe@tradie.test': 'joes-painting',
    'marco@tradie.test': 'stonemason-pro',
  };
  return mapping[email] || 'joey-tradie';
}
