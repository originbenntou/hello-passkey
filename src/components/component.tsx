'use client'

import {
  CardTitle,
  CardDescription,
  CardHeader,
  CardFooter,
  Card,
  CardContent,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import base64url from 'base64url'

const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
  challenge: base64url.toBuffer('hello-passkey'),
  rp: {
    name: 'hello-passkey',
    id: 'localhost',
  },
  user: {
    id: base64url.toBuffer('abcdef'),
    name: 'john9999',
    displayName: 'john',
  },
  pubKeyCredParams: [
    { alg: -7, type: 'public-key' },
    { alg: -257, type: 'public-key' },
  ],
  excludeCredentials: [
    {
      id: base64url.toBuffer('hello-passkey'),
      type: 'public-key',
      transports: ['internal'],
    },
  ],
  authenticatorSelection: {
    authenticatorAttachment: 'platform',
    requireResidentKey: true,
    userVerification: 'preferred',
  },
}

export function Component() {
  const getCredential = async () => {
    const credential = await navigator.credentials.create({
      publicKey: publicKeyCredentialCreationOptions,
    })
    console.log(credential)
  }

  return (
    <div className="flex justify-center items-center min-h-screen">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription>Let's experience Passkey!</CardDescription>
        </CardHeader>
        <CardContent></CardContent>
        <CardFooter>
          <Button
            className="w-full bg-white hover:bg-gray-100 text-gray-800 font-semibold py-2 px-4 border border-gray-400 rounded shadow"
            onClick={getCredential}
          >
            Login with Passkey
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
