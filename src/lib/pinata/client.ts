// Pinata client for IPFS integration

export async function pinJSONToIPFS(jsonData: Record<string, unknown>): Promise<string> {
  try {
    const response = await fetch('/api/anchor-rating', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(jsonData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Pinata API error: ${response.status}`);
    }

    const data = await response.json();
    return data.IpfsHash;
  } catch (error) {
    console.error('Error pinning JSON to IPFS:', error);
    throw error;
  }
}