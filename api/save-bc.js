export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_KEY;

  try {
    const cmd = req.body;
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    const payload = {
      reference: cmd.reference,
      client: cmd.client,
      contact: cmd.contact || null,
      tel: cmd.tel || null,
      date_bc: cmd.date || null,
      date_livraison: cmd.dateLivraison || null,
      total_ht: cmd.totalHT || 0,
      total_ttc: cmd.totalTTC || 0,
      paiement: cmd.paiement || 'attente',
      livraison: cmd.livraison || 'livraison',
      notes: cmd.notes || null,
      updated_at: new Date().toISOString(),
    };

    if (cmd.id && isUUID.test(cmd.id)) payload.id = cmd.id;

    const bcRes = await fetch(`${SUPABASE_URL}/rest/v1/bons_commande`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates,return=representation',
      },
      body: JSON.stringify(payload)
    });
    const bcData = await bcRes.json();
    if (!bcRes.ok) throw new Error(bcData.message || JSON.stringify(bcData));

    const bcId = Array.isArray(bcData) ? bcData[0].id : bcData.id;

    await fetch(`${SUPABASE_URL}/rest/v1/lignes_articles?bc_id=eq.${bcId}`, {
      method: 'DELETE',
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
    });

    if (cmd.lignes && cmd.lignes.length > 0) {
      const lignesPayload = cmd.lignes.map(l => ({
        bc_id: bcId,
        description: l.description,
        type: l.type || 'goodies',
        marquage: l.marquage || null,
        quantite: l.quantite || 0,
        total_ht: l.totalHT || 0,
        fournisseur: l.fournisseur || null,
        statut: l.statut || 'simulation',
        mockup: l.mockup || null,
      }));

      const lignesRes = await fetch(`${SUPABASE_URL}/rest/v1/lignes_articles`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify(lignesPayload)
      });
      if (!lignesRes.ok) {
        const err = await lignesRes.json();
        throw new Error(err.message || 'Erreur sauvegarde lignes');
      }
    }

    return res.status(200).json({ success: true, id: bcId });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
