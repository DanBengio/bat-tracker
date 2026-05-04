export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_KEY;

  try {
    const bcRes = await fetch(`${SUPABASE_URL}/rest/v1/bons_commande?order=created_at.desc`, {
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Accept': 'application/json' }
    });
    const bcs = await bcRes.json();
    if (!bcRes.ok) throw new Error(bcs.message || 'Erreur lecture BCs');

    const lignesRes = await fetch(`${SUPABASE_URL}/rest/v1/lignes_articles?order=created_at.asc`, {
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Accept': 'application/json' }
    });
    const lignes = await lignesRes.json();
    if (!lignesRes.ok) throw new Error(lignes.message || 'Erreur lecture lignes');

    const result = bcs.map(bc => ({
      id: bc.id,
      reference: bc.reference,
      client: bc.client,
      contact: bc.contact || '',
      tel: bc.tel || '',
      date: bc.date_bc || '',
      dateLivraison: bc.date_livraison || '',
      totalHT: bc.total_ht || 0,
      totalTTC: bc.total_ttc || 0,
      paiement: bc.paiement || 'attente',
      livraison: bc.livraison || 'livraison',
      notes: bc.notes || '',
      lignes: lignes
        .filter(l => l.bc_id === bc.id)
        .map(l => ({
          id: l.id,
          description: l.description,
          type: l.type || 'goodies',
          marquage: l.marquage || '',
          quantite: l.quantite || 0,
          totalHT: l.total_ht || 0,
          fournisseur: l.fournisseur || '',
          statut: l.statut || 'simulation',
          mockup: l.mockup || null,
        }))
    }));

    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
