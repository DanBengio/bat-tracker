// Cron Vercel — tourne chaque jour à 9h00 (Maroc = UTC+1)
// Détecte les BCs livrés depuis 3 jours et met à jour un flag en Supabase
// Ce fichier est optionnel — la détection se fait aussi côté client

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  // Sécurité : vérifier que c'est bien le cron Vercel qui appelle
  if(req.headers['authorization'] !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Récupérer tous les BCs
    const r = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/bons_commande?select=id,reference,data`,
      { headers: { 'apikey': process.env.SUPABASE_KEY, 'Authorization': `Bearer ${process.env.SUPABASE_KEY}` } }
    );
    const rows = await r.json();
    if (!r.ok) throw new Error(rows.message);

    const today = new Date(); today.setHours(0,0,0,0);
    const DELAI = 3;
    const aEnvoyer = [];

    rows.forEach(row => {
      const data = row.data || {};
      if (!data.dateLivraisonEffective) return;
      if (data.avisEnvoye) return;
      const livraison = new Date(data.dateLivraisonEffective); livraison.setHours(0,0,0,0);
      const diffJours = Math.floor((today - livraison) / (1000 * 60 * 60 * 24));
      if (diffJours >= DELAI) {
        aEnvoyer.push({
          id: row.id,
          reference: row.reference,
          client: data.client,
          tel: data.tel,
          dateLivraisonEffective: data.dateLivraisonEffective,
          joursDepuisLivraison: diffJours
        });
      }
    });

    return res.status(200).json({
      checked: rows.length,
      aEnvoyer: aEnvoyer.length,
      bcs: aEnvoyer
    });

  } catch(err) {
    return res.status(500).json({ error: err.message });
  }
}
