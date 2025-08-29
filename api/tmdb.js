export default async function handler(req, res) {
  const { endpoint, ...query } = req.query;

  if (!endpoint) {
    return res.status(400).json({ error: "Missing 'endpoint' parameter" });
  }

  
  const queryString = new URLSearchParams(query).toString();
  const url = `https://api.themoviedb.org/3${endpoint}${queryString ? `?${queryString}` : ""}`;

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${process.env.TMDB_API_KEY}`,
        accept: "application/json",
      },
    });
 
    if (!response.ok) {
      return res.status(response.status).json({ error: "Failed to fetch from TMDB" });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: "Server error", details: error.message });
  }
}
