// script.js

// Use your backend proxy instead of exposing the TMDB API key
const API_URL = '/api/tmdb'; // this points to your Vercel API route
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';
const BACKDROP_BASE_URL = 'https://image.tmdb.org/t/p/original';

// How many pages to aggregate (in parallel) for Popular sections
const PAGES_TO_FETCH = 7;

let currentPage = 1;
let totalPages = 1;
let currentQuery = '';
let currentType = 'movie';

let _activeRequests = 0;
function showSpinner() {
  const spinner = document.querySelector('.spinner');
  _activeRequests++;
  if (spinner) spinner.style.display = 'block';
}
function hideSpinner() {
  const spinner = document.querySelector('.spinner');
  _activeRequests = Math.max(0, _activeRequests - 1);
  if (spinner && _activeRequests === 0) spinner.style.display = 'none';
}

// Wrapper to call our Vercel API route
async function fetchAPI(endpoint) {
  showSpinner();
  try {
    const res = await fetch(`${API_URL}?endpoint=${encodeURIComponent(endpoint)}`);
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${endpoint}`);
    return await res.json();
  } catch (err) {
    console.error('API fetch error:', err);
    return null;
  } finally {
    hideSpinner();
  }
}

async function fetchMultiplePages(endpointBuilder, pages = PAGES_TO_FETCH) {
  const promises = [];
  for (let page = 1; page <= pages; page++) {
    promises.push(fetchAPI(endpointBuilder(page)));
  }
  const results = await Promise.all(promises);
  return results.flatMap(r => (r && r.results ? r.results : []));
}

// NOW PLAYING
async function displayNowPlaying() {
  const wrapper = document.querySelector('.swiper .swiper-wrapper');
  if (!wrapper) return;

  const data = await fetchAPI(`/movie/now_playing?language=en-US&page=1`);
  if (!data?.results?.length) return;

  wrapper.innerHTML = '';
  data.results.forEach(movie => {
    const poster = movie.poster_path ? `${IMAGE_BASE_URL}${movie.poster_path}` : 'images/no-image.jpg';
    const slide = document.createElement('div');
    slide.classList.add('swiper-slide');
    slide.innerHTML = `
      <a href="movie-details.html?id=${movie.id}">
        <img src="${poster}" alt="${movie.title}" />
        <div class="slide-info">
          <h3>${movie.title}</h3>
          <p>${movie.release_date || ''}</p>
        </div>
      </a>
    `;
    wrapper.appendChild(slide);
  });

  // eslint-disable-next-line no-undef
  new Swiper('.swiper', {
    slidesPerView: 4,
    spaceBetween: 20,
    loop: true,
    autoplay: { delay: 4000, disableOnInteraction: false },
    breakpoints: {
      320: { slidesPerView: 1 },
      480: { slidesPerView: 2 },
      768: { slidesPerView: 3 },
      1024: { slidesPerView: 4 },
    },
    navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' },
  });
}

// POPULAR MOVIES
async function displayPopularMovies() {
  const container = document.getElementById('popular-movies');
  if (!container) return;
  container.innerHTML = '';

  const movies = await fetchMultiplePages(page => `/movie/popular?language=en-US&page=${page}`, PAGES_TO_FETCH);

  if (!movies.length) {
    container.innerHTML = '<p>No movies found.</p>';
    return;
  }

  movies.forEach(movie => {
    const poster = movie.poster_path ? `${IMAGE_BASE_URL}${movie.poster_path}` : 'images/no-image.jpg';
    const card = document.createElement('div');
    card.classList.add('card');
    card.innerHTML = `
      <a href="movie-details.html?id=${movie.id}">
        <img src="${poster}" alt="${movie.title}" class="card-img-top" />
      </a>
      <div class="card-body">
        <h5 class="card-title">${movie.title}</h5>
        <p class="card-text"><small class="text-muted">Release: ${movie.release_date || 'N/A'}</small></p>
      </div>
    `;
    container.appendChild(card);
  });
}

// POPULAR SHOWS
async function displayPopularTVShows() {
  const container = document.getElementById('popular-shows');
  if (!container) return;
  container.innerHTML = '';

  const shows = await fetchMultiplePages(page => `/tv/popular?language=en-US&page=${page}`, PAGES_TO_FETCH);

  if (!shows.length) {
    container.innerHTML = '<p>No TV shows found.</p>';
    return;
  }

  shows.forEach(show => {
    const poster = show.poster_path ? `${IMAGE_BASE_URL}${show.poster_path}` : 'images/showcase-bg.jpg';
    const card = document.createElement('div');
    card.classList.add('card');
    card.innerHTML = `
      <a href="tv-details.html?id=${show.id}">
        <img src="${poster}" alt="${show.name}" class="card-img-top" />
      </a>
      <div class="card-body">
        <h5 class="card-title">${show.name}</h5>
        <p class="card-text"><small class="text-muted">First Air Date: ${show.first_air_date || 'N/A'}</small></p>
      </div>
    `;
    container.appendChild(card);
  });
}

// DETAILS PAGE
async function displayDetails() {
  const id = new URLSearchParams(window.location.search).get('id');
  if (!id) return;

  const movieContainer = document.getElementById('movie-details');
  const showContainer = document.getElementById('show-details');

  let endpoint = '';
  let containerSelector = '';
  let isMovie = false;

  if (movieContainer) {
    endpoint = `/movie/${id}?language=en-US`;
    containerSelector = '#movie-details';
    isMovie = true;
  } else if (showContainer) {
    endpoint = `/tv/${id}?language=en-US`;
    containerSelector = '#show-details';
  } else {
    return;
  }

  const data = await fetchAPI(endpoint);
  if (!data) return;

  const container = document.querySelector(containerSelector);
  container.innerHTML = '';

  const title = data.title || data.name;
  const date = data.release_date || data.first_air_date || 'N/A';
  const poster = data.poster_path ? `${IMAGE_BASE_URL}${data.poster_path}` : 'images/no-image.jpg';

  let runtimeText = 'N/A';
  if (!isMovie && Array.isArray(data.episode_run_time) && data.episode_run_time.length > 0) {
    const avg = data.episode_run_time.reduce((a, b) => a + b, 0) / data.episode_run_time.length;
    runtimeText = `${Math.round(avg)} min`;
  }

  container.innerHTML = `
    <div class="details-top" style="position:relative;">
      <div>
        <img src="${poster}" alt="${title}">
      </div>
      <div>
        <h2>${title}</h2>
        <p><i class="fas fa-star text-primary"></i> ${data.vote_average ? data.vote_average.toFixed(1) : 'N/A'} / 10</p>
        <p class="text-muted">${isMovie ? 'Release Date' : 'First Air Date'}: ${date}</p>
        ${isMovie ? `<p class="text-muted">Budget: $${data.budget?.toLocaleString?.() || 'N/A'}</p>` : ''}
        ${isMovie ? `<p class="text-muted">Revenue: $${data.revenue?.toLocaleString?.() || 'N/A'}</p>` : ''}
        ${!isMovie ? `<p class="text-muted">Seasons: ${data.number_of_seasons ?? 'N/A'}</p>` : ''}
        ${!isMovie ? `<p class="text-muted">Episodes: ${data.number_of_episodes ?? 'N/A'}</p>` : ''}
        ${!isMovie ? `<p class="text-muted">Episode Runtime: ${runtimeText}</p>` : ''}
        <p>${data.overview || ''}</p>
        <h5>Genres</h5>
        <ul class="list-group">${(data.genres || []).map(g => `<li>${g.name}</li>`).join('')}</ul>
        ${data.homepage ? `<a href="${data.homepage}" target="_blank" class="btn">Visit Homepage</a>` : ''}
      </div>
    </div>
  `;

  displayBackgroundImage(containerSelector, data.backdrop_path);
}

function displayBackgroundImage(selector, backdropPath) {
  if (!backdropPath) return;
  const container = document.querySelector(selector);
  if (!container) return;

  const overlay = document.createElement('div');
  overlay.style.backgroundImage = `url(${BACKDROP_BASE_URL}${backdropPath})`;
  overlay.style.backgroundSize = 'cover';
  overlay.style.backgroundPosition = 'center';
  overlay.style.position = 'absolute';
  overlay.style.top = 0;
  overlay.style.left = 0;
  overlay.style.width = '100vw';
  overlay.style.height = '100vh';
  overlay.style.zIndex = '-1';
  overlay.style.opacity = '0.1';
  container.style.position = 'relative';
  container.appendChild(overlay);
}

// SEARCH
async function searchAndDisplay() {
  const heading = document.getElementById('search-results-heading');
  const container = document.getElementById('search-results');
  const pagination = document.getElementById('pagination');
  const pageCounter = document.getElementById('page-counter');

  if (!container || !heading) return;

  const q = (currentQuery || '').trim();
  if (!q) {
    heading.textContent = 'Please enter a search term.';
    container.innerHTML = '';
    if (pagination) pagination.style.display = 'none';
    return;
  }

  const data = await fetchAPI(`/search/${currentType}?language=en-US&query=${encodeURIComponent(q)}&page=${currentPage}`);
  if (!data || !Array.isArray(data.results) || data.results.length === 0) {
    heading.textContent = `No results found for "${q}".`;
    container.innerHTML = '';
    if (pagination) pagination.style.display = 'none';
    return;
  }

  heading.textContent = `Results for "${q}" (${currentType.toUpperCase()})`;
  container.innerHTML = '';

  data.results.forEach(item => {
    const title = item.title || item.name;
    const date = item.release_date || item.first_air_date || 'N/A';
    const poster = item.poster_path ? `${IMAGE_BASE_URL}${item.poster_path}` : 'images/no-image.jpg';
    const typePage = item.title ? 'movie' : 'tv';

    const card = document.createElement('div');
    card.classList.add('card');
    card.innerHTML = `
      <a href="${typePage}-details.html?id=${item.id}">
        <img src="${poster}" alt="${title}" />
      </a>
      <h5>${title}</h5>
      <p>${date}</p>
    `;
    container.appendChild(card);
  });

  totalPages = data.total_pages || 1;
  if (pagination && pageCounter) {
    pagination.style.display = totalPages > 1 ? 'block' : 'none';
    pageCounter.textContent = `Page ${currentPage} of ${totalPages}`;
  }
}

// SEARCH FORM + PAGINATION
function initSearchForm() {
  const form = document.querySelector('.search-form');
  if (!form) return;

  form.addEventListener('submit', e => {
    const action = form.getAttribute('action');
    if (action && action.trim().length > 0) return;

    e.preventDefault();
    const termInput = document.getElementById('search-term');
    const typeInput = document.querySelector('input[name="type"]:checked');
    currentQuery = termInput ? termInput.value.trim() : '';
    currentType = typeInput ? typeInput.value : 'movie';
    currentPage = 1;
    searchAndDisplay();
  });
}

function initPagination() {
  const prevBtn = document.getElementById('prev');
  const nextBtn = document.getElementById('next');
  if (!prevBtn || !nextBtn) return;

  prevBtn.addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      searchAndDisplay();
    }
  });

  nextBtn.addEventListener('click', () => {
    if (currentPage < totalPages) {
      currentPage++;
      searchAndDisplay();
    }
  });
}

// INIT
document.addEventListener('DOMContentLoaded', () => {
  initSearchForm();

  if (document.querySelector('.swiper .swiper-wrapper')) displayNowPlaying();
  if (document.getElementById('popular-movies')) displayPopularMovies();
  if (document.getElementById('popular-shows')) displayPopularTVShows();
  if (document.getElementById('movie-details') || document.getElementById('show-details')) displayDetails();

  if (document.getElementById('search-results')) {
    initPagination();

    const params = new URLSearchParams(window.location.search);
    const termFromURL = params.get('search-term');
    const typeFromURL = params.get('type');

    if (termFromURL) currentQuery = termFromURL;
    if (typeFromURL === 'movie' || typeFromURL === 'tv') currentType = typeFromURL;

    const termInput = document.getElementById('search-term');
    const movieRadio = document.getElementById('movie');
    const tvRadio = document.getElementById('tv');
    if (termInput && termFromURL) termInput.value = termFromURL;
    if (movieRadio && tvRadio && typeFromURL) {
      if (typeFromURL === 'movie') movieRadio.checked = true;
      if (typeFromURL === 'tv') tvRadio.checked = true;
    }

    if (currentQuery) {
      currentPage = 1;
      searchAndDisplay();
    }
  }
});
