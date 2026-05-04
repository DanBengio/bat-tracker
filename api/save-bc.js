export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const cmd = req.body;
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    // Tout le BC va dans data (sauf id et reference qui sont des colonnes dédiées)
    const { id, reference, ...rest } = cmd;
    const payload = {
      reference,
      data: rest,
      updated_at: new Date().toISOString(),
    };

    // Ajouter l'id seulement si c'est un vrai UUID Supabase
    if (id && isUUID.test(id)) payload.id = id;

    const r = await fetch(`${process.env.SUPABASE_URL}/rest/v1/bons_commande`, {
      method: 'POST',
      headers: {
        'apikey': process.env.SUPABASE_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates,return=representation',
      },
      body: JSON.stringify(payload)
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.message || JSON.stringify(data));

    const savedId = Array.isArray(data) ? data[0].id : data.id;
    return res.status(200).json({ success: true, id: savedId });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
