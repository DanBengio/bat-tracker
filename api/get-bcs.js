export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const r = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/bons_commande?order=updated_at.desc&select=id,reference,data`,
      { headers: { 'apikey': process.env.SUPABASE_KEY, 'Authorization': `Bearer ${process.env.SUPABASE_KEY}` } }
    );
    const rows = await r.json();
    if (!r.ok) throw new Error(rows.message || 'Erreur lecture');

    // Reconstituer les objets BC depuis jsonb
    const bcs = rows.map(row => ({ id: row.id, reference: row.reference, ...row.data }));
    return res.status(200).json(bcs);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
