import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // Check if PINATA_JWT is configured
    const pinataJWT = process.env.PINATA_JWT;
    
    if (!pinataJWT) {
      console.warn('PINATA_JWT missing - cannot anchor rating to IPFS');
      return NextResponse.json(
        { error: "PINATA_JWT missing" }, 
        { status: 500 }
      );
    }
    
    // Parse the request body
    const ratingPayload = await request.json();
    
    // Call Pinata's pinJSONToIPFS endpoint
    const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${pinataJWT}`,
      },
      body: JSON.stringify(ratingPayload),
    });
    
    // Log the full Pinata response body on non-200 responses for debugging
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Pinata API error:', response.status, response.statusText, errorText);
      // Don't throw in the client: log a warning, return { cid: null } and continue
      return NextResponse.json({ cid: null });
    }
    
    // Return the Pinata response JSON (CID etc.)
    const result = await response.json();
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('Error anchoring rating:', error);
    // Don't throw in the client: log a warning, return { cid: null } and continue
    return NextResponse.json({ cid: null });
  }
}