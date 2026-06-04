import type { Env, MintRecord, MintRecordCreate, ApiOk, ApiErr } from './types.ts';

const JSON_HEADERS: Record<string, string> = {
  'content-type': 'application/json',
  'access-control-allow-origin': '*',
};

function ok<T>(data: T): Response {
  return new Response(JSON.stringify({ ok: true, data } as ApiOk<T>), {
    headers: JSON_HEADERS,
  });
}

function err(code: string, message: string, status = 400): Response {
  return new Response(
    JSON.stringify({ ok: false, error: { code, message } } as ApiErr),
    { status, headers: JSON_HEADERS },
  );
}

// ---------------------------------------------------------------------------
// NFT metadata builder (on-chain friendly + off-chain URI)
// ---------------------------------------------------------------------------
function buildTokenUri(record: MintRecord): string {
  const metadata = {
    name: `Vault Physical Item #${record.tokenId}`,
    description: `Tokenized physical item from The Vault DFW. Status: ${record.status}.`,
    image: record.physicalItem.photos[0] || '',
    attributes: [
      { trait_type: 'chain', value: record.chainId },
      { trait_type: 'contract', value: record.contractAddress },
      { trait_type: 'token_id', value: record.tokenId },
      { trait_type: 'status', value: record.status },
      { trait_type: 'condition', value: record.physicalItem.condition },
      { trait_type: 'serial', value: record.physicalItem.serialNumber || 'N/A' },
    ],
    properties: {
      buyer: record.ownerId,
      onchain_uri: record.onchainUri || undefined,
      offchain_uri: record.offchainUri || undefined,
    },
  };

  return record.offchainUri || `https://thevaultdfw.win/api/token/${record.id}/metadata`;
}

// ---------------------------------------------------------------------------
// Marketplace adapters (OpenSea / Magic Eden)
// ---------------------------------------------------------------------------
async function postToOpenSea(record: MintRecord): Promise<{ url?: string }> {
  // Production: call OpenSea API to create/import asset.
  // For now this is a stub that records intent and returns a marketplace URL.
  const chain = record.chainId === 1 ? 'ethereum' : record.chainId === 137 ? 'polygon' : 'solana';
  const slug = `thevault/${record.contractAddress}/${record.tokenId}`;
  return { url: `https://opensea.io/assets/${chain}/${record.contractAddress}/${record.tokenId}` };
}

async function postToMagicEden(record: MintRecord): Promise<{ url?: string }> {
  // Magic Eden Solana explorer URL pattern
  if (record.chainId !== 1155 || !record.contractAddress) return {};
  const mint = record.tokenId || record.id;
  return { url: `https://magiceden.io/item-details/${mint}` };
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------
export async function handleTokenize(request: Request, env: Env): Promise<Response> {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: { ...JSON_HEADERS, 'access-control-allow-origin': '*' } });
  }

  const url = new URL(request.url);

  // GET /api/tokenize/:id
  if (url.pathname.startsWith('/api/tokenize/') && request.method === 'GET') {
    const id = url.pathname.split('/').pop() || '';
    const row = await env.thevault_db.prepare('SELECT * FROM mint_records WHERE id = ?1')
      .bind(id).first<Record<string, unknown>>();
    if (!row) return err('not_found', 'Token record not found', 404);
    return ok(row);
  }

  // POST /api/tokenize
  if (url.pathname === '/api/tokenize' && request.method === 'POST') {
    const body = (await request.json().catch(() => ({}))) as Partial<MintRecordCreate>;
    const listingId = typeof body.listingId === 'string' ? body.listingId : '';
    const ownerId = typeof body.ownerId === 'string' ? body.ownerId : '';
    const chainId = typeof body.chainId === 'number' ? body.chainId : 1155;
    const contractAddress = typeof body.contractAddress === 'string' ? body.contractAddress : '';
    const tokenId = typeof body.tokenId === 'string' ? body.tokenId : crypto.randomUUID();
    const physicalItem = (body as MintRecordCreate).physicalItem || {
      condition: 'mint',
      authenticityDocs: [],
      photos: [],
    };

    if (!listingId || !ownerId || !contractAddress) {
      return err('invalid_request', 'listingId, ownerId, and contractAddress are required');
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const status: MintRecord['status'] = 'pending';

    const payload = {
      id,
      listingId,
      ownerId,
      chainId,
      contractAddress,
      tokenId,
      status,
      onchainUri: buildTokenUri({ id, listingId, ownerId, chainId, contractAddress, tokenId, status, physicalItem, createdAt: now, updatedAt: now }),
      offchainUri: `https://thevaultdfw.win/api/token/${id}/metadata`,
      physicalItem,
      createdAt: now,
      updatedAt: now,
    };

    const inserted = await env.thevault_db.prepare(
      `INSERT INTO mint_records (id, listing_id, owner_id, chain_id, contract_address, token_id, status, onchain_uri, offchain_uri, physical_item, created_at, updated_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, datetime('now'), datetime('now')) RETURNING *`
    ).bind(
      payload.id,
      payload.listingId,
      payload.ownerId,
      payload.chainId,
      payload.contractAddress,
      payload.tokenId,
      payload.status,
      payload.onchainUri,
      payload.offchainUri,
      JSON.stringify(payload.physicalItem),
    ).first<Record<string, unknown>>();

    if (!inserted) return err('server_error', 'Failed to create mint record');

    const mintRecord = inserted as MintRecord;

    // Best-effort marketplace registration
    try {
      const results = await Promise.allSettled([
        postToOpenSea(mintRecord).catch(() => ({})),
        postToMagicEden(mintRecord).catch(() => ({})),
      ]);
      console.log('Marketplace registration', {
        id: mintRecord.id,
        results: results.map(r => r.status),
      });
    } catch (e) {
      console.error('Marketplace registration failed', e);
    }

    return ok(mintRecord);
  }

  return err('not_found', 'Unknown tokenize route', 404);
}
