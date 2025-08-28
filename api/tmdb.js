// api/tmdb.js
export default async function handler(req, res) {
  const { type = "movie", query = "", page = 1 } = req.query;

  if (!query) {
    return res.status(400).json({ error: "Missing query parameter" });
  }

  try {
    const apiKey = process.env.TMDB_API_KEY; // stored in Vercel Env
    const url = `https://api.themoviedb.org/3/search/${type}?api_key=${apiKey}&query=${encodeURIComponent(query)}&page=${page}`;

    const response = await fetch(url);
    const data = await response.json();

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch TMDB API" });
  }
}
