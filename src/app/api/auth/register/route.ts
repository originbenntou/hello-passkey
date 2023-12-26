import { NextResponse } from 'next/server'
import fido2 from '@simplewebauthn/server'
import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'
import lodash from 'lodash'
import fs from 'fs'
import crypto from 'crypto'
import base64url from 'base64url'

const RP_NAME = 'Hello Passkey';
const TIMEOUT = 30 * 1000 * 60;

if (!fs.existsSync('./.data')) {
  fs.mkdirSync('./.data')
}

type User = {
  id: string
  username: string
  credentials: any
}

type Data = {
  users: User[]
}

class LowWithLodash<T> extends Low<T> {
  chain: lodash.ExpChain<this['data']> = lodash.chain(this).get('data')
}

const defaultData: Data = {
  users: [],
}
const adapter = new JSONFile<Data>('./.data/db.json')
const db = new LowWithLodash(adapter, defaultData)

interface RequestBody {
  authenticatorSelection: {
    authenticatorAttachment: string;
    requireResidentKey: boolean;
    userVerification: string;
  };
  attestation: string;
}

interface ExtendedRequest extends RequestBody {
  body: RequestBody;
}
export async function POST(req: ExtendedRequest) {
  await db.read()


  const username = 'hoge'
  const user = db.chain.get('users').find({ username }).value()

  try {
    const excludeCredentials = [];
    if (user.credentials.length > 0) {
      for (let cred of user.credentials) {
        excludeCredentials.push({
          id: cred.credId,
          type: 'public-key',
          transports: ['internal'],
        });
      }
    }
    const pubKeyCredParams = [];
    // const params = [-7, -35, -36, -257, -258, -259, -37, -38, -39, -8];
    const params = [-7, -257];
    for (let param of params) {
      pubKeyCredParams.push({ type: 'public-key', alg: param });
    }
    const as = {
      authenticatorAttachment: '', requireResidentKey: false, userVerification: '',


    }; // authenticatorSelection
    const aa = req.body.authenticatorSelection.authenticatorAttachment;
    const rr = req.body.authenticatorSelection.requireResidentKey;
    const uv = req.body.authenticatorSelection.userVerification;
    const cp = req.body.attestation; // attestationConveyancePreference
    let asFlag = false;
    let authenticatorSelection;
    let attestation = 'none';

    if (aa && (aa == 'platform' || aa == 'cross-platform')) {
      asFlag = true;
      as.authenticatorAttachment = aa;
    }
    if (rr) {
      asFlag = true;
      as.requireResidentKey = rr;
    }
    if (uv && (uv == 'required' || uv == 'preferred' || uv == 'discouraged')) {
      asFlag = true;
      as.userVerification = uv;
    }
    if (asFlag) {
      authenticatorSelection = as;
    }
    if (cp && (cp == 'none' || cp == 'indirect' || cp == 'direct')) {
      attestation = cp;
    }

    const options = fido2.generateAuthenticationOptions({
      rpName: RP_NAME,
      rpID: process.env.HOSTNAME,
      userID: user.id,
      userName: user.username,
      timeout: TIMEOUT,
      // Prompt users for additional information about the authenticator.

      attestationType: attestation,
      // Prevent users from re-registering existing authenticators
      excludeCredentials,
      authenticatorSelection,
    });

    req.session.challenge = options.challenge;

    // Temporary hack until SimpleWebAuthn supports `pubKeyCredParams`
    options.pubKeyCredParams = [];
    for (let param of params) {
      options.pubKeyCredParams.push({ type: 'public-key', alg: param });
    }

    return NextResponse.json({
    message: 200,
  })
}
