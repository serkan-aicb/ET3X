// Pinata client for IPFS integration

export async function pinJSONToIPFS(jsonData: Record<string, unknown>): Promise<string> {
  const pinataJWT = process.env.PINATA_JWT;
  
  if (!pinataJWT) {
    throw new Error('PINATA_JWT is not set');
  }
  
  try {
    const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${pinataJWT}`
      },
      body: JSON.stringify(jsonData)
    });
    
    if (!response.ok) {
      throw new Error(`Pinata API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.IpfsHash;
  } catch (error) {
    console.error('Error pinning JSON to IPFS:', error);
    throw error;
  }
}