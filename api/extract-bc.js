export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const { base64 } = req.body;
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: [
            { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64 } },
            { type: 'text', text: `Extrais les informations de ce bon de commande et retourne UNIQUEMENT un JSON valide sans backticks ni markdown, avec ce format exact:
{
  "reference": "CMD0000",
  "client": "Nom client",
  "date": "DD/MM/YYYY",
  "totalHT": 0.00,
  "totalTTC": 0.00,
  "lignes": [
    {
      "description": "Nom article",
      "type": "goodies ou textile",
      "marquage": "technique de marquage",
      "quantite": 0,
      "totalHT": 0.00
    }
  ]
}
Type = "textile" si c'est un vetement (polo, t-shirt, veste...), sinon "goodies".
Exclure les frais techniques (FT...). Retourner UNIQUEMENT le JSON brut, sans aucun texte avant ou apres.` }
          ]
        }]
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || 'Erreur API Anthropic');

    let result = data.content[0].text.trim();
    result = result.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
    JSON.parse(result); // valider

    return res.status(200).json({ result });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
