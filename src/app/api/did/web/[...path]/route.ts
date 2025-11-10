import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { type NextRequest } from 'next/server'

// Updated to properly handle the route parameters according to Next.js App Router requirements
export async function GET(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  // Unwrap the params promise
  const unwrappedParams = await params
  const path = unwrappedParams.path
  
  // Check if path is valid (should be [role, id])
  if (!path || path.length !== 2) {
    return NextResponse.json({ error: 'Invalid DID path' }, { status: 400 })
  }
  
  const [role, id] = path
  
  // Validate role
  if (role !== 'stud' && role !== 'edu') {
    return NextResponse.json({ error: 'Invalid role in DID' }, { status: 400 })
  }
  
  try {
    const supabase = await createServerClient()
    
    // Find user by DID
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('did, username')
      .eq('did', `did:web:talent3x.io:${role}:${id}`)
      .single()
    
    if (error || !profile) {
      return NextResponse.json({ error: 'DID not found' }, { status: 404 })
    }
    
    // Create DID document
    const didDocument = {
      "@context": [
        "https://www.w3.org/ns/did/v1",
        "https://w3id.org/security/suites/jws-2020/v1"
      ],
      "id": profile.did,
      "verificationMethod": [{
        "id": `${profile.did}#keys-1`,
        "type": "JsonWebKey2020",
        "controller": profile.did,
        "publicKeyJwk": {
          "kty": "OKP",
          "crv": "Ed25519",
          "x": "11qYAYKxCrfVS_7TyWQHOg7hcvPapiMlrwIaaPcHURo"
        }
      }],
      "authentication": [
        `${profile.did}#keys-1`
      ],
      "assertionMethod": [
        `${profile.did}#keys-1`
      ]
    }
    
    return NextResponse.json(didDocument, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600'
      }
    })
  } catch (error) {
    console.error('Error generating DID document:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}