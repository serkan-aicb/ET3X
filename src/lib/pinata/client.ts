// Pinata client for IPFS integration

export async function pinJSONToIPFS(jsonData: Record<string, unknown>): Promise<string | null> {
  try {
    const response = await fetch('/api/anchor-rating', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(jsonData),
    });

    const data = await response.json();
    
    // If we get a cid: null response, it means Pinata failed but we should continue
    if (data.cid === null) {
      console.warn('Warning: Failed to pin rating to IPFS, continuing without CID');
      return null;
    }
    
    // If there's an error field, throw an error
    if (data.error) {
      throw new Error(data.error);
    }

    return data.IpfsHash;
  } catch (error) {
    console.error('Error pinning JSON to IPFS:', error);
    throw error;
  }
}