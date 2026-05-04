export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const { nom } = req.body;
    if (!nom) throw new Error('Nom requis');

    const r = await fetch(`${process.env.SUPABASE_URL}/rest/v1/fournisseurs`, {
      method: 'POST',
      headers: {
        'apikey': process.env.SUPABASE_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify({ nom })
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.message || 'Erreur ajout fournisseur');
    return res.status(200).json(Array.isArray(data) ? data[0] : data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
