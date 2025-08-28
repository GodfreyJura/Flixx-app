const API_KEY = 'b73b23571284780aefb4396a788746f8';
const API_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';
const BACKDROP_BASE_URL = 'https://image.tmdb.org/t/p/original';

let currentPage = 1;
let totalPages = 1;
let currentQuery = '';
let currentType = 'movie'; 


function showSpinner() {
  const spinner = document.querySelector('.spinner');
  if (spinner) spinner.style.display = 'block';
}
function hideSpinner() {
  const spinner = document.querySelector('.spinner');
  if (spinner) spinner.style.display = 'none';
}


async function fetchAPI(endpoint) {
  showSpinner();
  try {
    const res = await fetch(endpoint);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('API fetch error:', err);
    return null;
  } finally {
    hideSpinner();
  }
}

async function displayNowPlaying() {
  const swiperWrapper = document.querySelector('.swiper .swiper-wrapper');
  if (!swiperWrapper) return;

  const data = await fetchAPI(`${API_URL}/movie/now_playing?api_key=${API_KEY}&language=en-US&page=1`);
  if (!data?.results?.length) return;

  swiperWrapper.innerHTML = '';

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
    swiperWrapper.appendChild(slide);
  });

  new Swiper('.swiper', {
    slidesPerView: 4,
    spaceBetween: 20,
    loop: true,
    autoplay: { delay: 4000, disableOnInteraction: false },
    breakpoints: { 320: { slidesPerView: 1 }, 480: { slidesPerView: 2 }, 768: { slidesPerView: 3 }, 1024: { slidesPerView: 4 } },
    navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' }
  });
}


async function displayPopularMovies() {
  const data = await fetchAPI(`${API_URL}/movie/popular?api_key=${API_KEY}&language=en-US&page=1`);
  const container = document.getElementById('popular-movies');
  if (!container) return;
  container.innerHTML = '';

  if (!data?.results?.length) {
    container.innerHTML = '<p>No movies found.</p>';
    return;
  }

  data.results.forEach(movie => {
    const poster = movie.poster_path ? `${IMAGE_BASE_URL}${movie.poster_path}` : 'images/no-image.jpg';
    const card = document.createElement('div');
    card.classList.add('card');
    card.innerHTML = `
      <a href="movie-details.html?id=${movie.id}">
        <img src="${poster}" alt="${movie.title}" class="card-img-top"/>
      </a>
      <div class="card-body">
        <h5 class="card-title">${movie.title}</h5>
        <p class="card-text">
          <small class="text-muted">Release: ${movie.release_date || 'N/A'}</small>
        </p>
      </div>
    `;
    container.appendChild(card);
  });
}

async function displayPopularTVShows() {
  const data = await fetchAPI(`${API_URL}/tv/popular?api_key=${API_KEY}&language=en-US&page=1`);
  const container = document.getElementById('popular-shows');
  if (!container) return;
  container.innerHTML = '';

  if (!data?.results?.length) {
    container.innerHTML = '<p>No TV shows found.</p>';
    return;
  }

  data.results.forEach(show => {
    const poster = show.poster_path ? `${IMAGE_BASE_URL}${show.poster_path}` : 'images/showcase-bg.jpg';
    const card = document.createElement('div');
    card.classList.add('card');
    card.innerHTML = `
      <a href="tv-details.html?id=${show.id}">
        <img src="${poster}" alt="${show.name}" class="card-img-top"/>
      </a>
      <div class="card-body">
        <h5 class="card-title">${show.name}</h5>
        <p class="card-text">
          <small class="text-muted">First Air Date: ${show.first_air_date || 'N/A'}</small>
        </p>
      </div>
    `;
    container.appendChild(card);
  });
}


async function displayDetails() {
  const id = new URLSearchParams(window.location.search).get('id');
  if (!id) return;

  let endpoint = '';
  let containerSelector = '';
  let isMovie = false;

  if (document.getElementById('movie-details')) {
    endpoint = `${API_URL}/movie/${id}?api_key=${API_KEY}&language=en-US`;
    containerSelector = '#movie-details';
    isMovie = true;
  } else if (document.getElementById('show-details')) {
    endpoint = `${API_URL}/tv/${id}?api_key=${API_KEY}&language=en-US`;
    containerSelector = '#show-details';
  } else return;

  const data = await fetchAPI(endpoint);
  if (!data) return;

  const container = document.querySelector(containerSelector);
  container.innerHTML = '';

  const title = data.title || data.name;
  const date = data.release_date || data.first_air_date;
  const poster = data.poster_path ? `${IMAGE_BASE_URL}${data.poster_path}` : 'images/no-image.jpg';

  
  let runtimeText = 'N/A';
  if (!isMovie && Array.isArray(data.episode_run_time) && data.episode_run_time.length > 0) {
    const avg = data.episode_run_time.reduce((a, b) => a + b, 0) / data.episode_run_time.length;
    runtimeText = `${Math.round(avg)} min`;
  }

  container.innerHTML = `
    <div class="details-top">
      <div>
        <img src="${poster}" alt="${title}">
      </div>
      <div>
        <h2>${title}</h2>
        <p><i class="fas fa-star text-primary"></i> ${data.vote_average?.toFixed(1)} / 10</p>
        <p class="text-muted">${isMovie ? 'Release Date' : 'First Air Date'}: ${date}</p>
        ${isMovie ? `<p class="text-muted">Budget: $${data.budget?.toLocaleString() || 'N/A'}</p>` : ''}
        ${isMovie ? `<p class="text-muted">Revenue: $${data.revenue?.toLocaleString() || 'N/A'}</p>` : ''}
        ${!isMovie ? `<p class="text-muted">Seasons: ${data.number_of_seasons}</p>` : ''}
        ${!isMovie ? `<p class="text-muted">Episodes: ${data.number_of_episodes}</p>` : ''}
        ${!isMovie ? `<p class="text-muted">Episode Runtime: ${runtimeText}</p>` : ''}
        <p>${data.overview}</p>
        <h5>Genres</h5>
        <ul class="list-group">${data.genres.map(g => `<li>${g.name}</li>`).join('')}</ul>
        ${data.homepage ? `<a href="${data.homepage}" target="_blank" class="btn">Visit Homepage</a>` : ''}
      </div>
    </div>
  `;

  displayBackgroundImage(containerSelector, data.backdrop_path);
}


function displayBackgroundImage(selector, backdropPath) {
  if (!backdropPath) return;
  const container = document.querySelector(selector);
  const overlay = document.createElement('div');
  overlay.style.backgroundImage = `url(${BACKDROP_BASE_URL}${backdropPath})`;
  overlay.style.backgroundSize = 'cover';
  overlay.style.backgroundPosition = 'center';
  overlay.style.position = 'absolute';
  overlay.style.top = 0;
  overlay.style.left = 0;
  overlay.style.width = '100vh';
  overlay.style.height = '100vh';
  overlay.style.zIndex = '-1';
  overlay.style.opacity = '0.1';
  container.appendChild(overlay);
}


function initSearch() {
  const form = document.querySelector('.search-form');
  if (!form) return;

  const prevBtn = document.getElementById('prev');
  const nextBtn = document.getElementById('next');
  const pageCounter = document.querySelector('.page-counter');

  async function searchAndDisplay() {
    if (!currentQuery && !document.getElementById('search-results')) return;

    let url = '';
    if (!currentQuery) {
      url =
        currentType === 'movie'
          ? `${API_URL}/movie/popular?api_key=${API_KEY}&language=en-US&page=${currentPage}`
          : `${API_URL}/tv/popular?api_key=${API_KEY}&language=en-US&page=${currentPage}`;
    } else {
      url = `${API_URL}/search/${currentType}?api_key=${API_KEY}&language=en-US&query=${encodeURIComponent(currentQuery)}&page=${currentPage}`;
    }

    const data = await fetchAPI(url);
    if (!data) return;

    totalPages = data.total_pages;
    renderSearchResults(data.results);
  }

  function renderSearchResults(items) {
    const container = document.getElementById('search-results');
    const heading = document.getElementById('search-results-heading');
    container.innerHTML = '';

    if (!items?.length) {
      heading.textContent = 'No results found.';
      document.getElementById('pagination').style.display = 'none';
      return;
    }

    heading.textContent = currentQuery
      ? `Results for "${currentQuery}" (${currentType.toUpperCase()})`
      : currentType === 'movie'
      ? 'Popular Movies'
      : 'Popular TV Shows';

    items.forEach(item => {
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

    document.getElementById('pagination').style.display = totalPages > 1 ? 'block' : 'none';
    pageCounter.textContent = `Page ${currentPage} of ${totalPages}`;
  }

  form.addEventListener('submit', e => {
    e.preventDefault();
    currentQuery = document.getElementById('search-term').value.trim();
    currentType = document.querySelector('input[name="type"]:checked').value;
    currentPage = 1;
    searchAndDisplay();
  });

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

  if (!currentQuery) searchAndDisplay();
}


document.addEventListener('DOMContentLoaded', () => {
  if (document.querySelector('.swiper .swiper-wrapper')) displayNowPlaying();
  if (document.getElementById('popular-movies')) displayPopularMovies();
  if (document.getElementById('popular-shows')) displayPopularTVShows();
  if (document.getElementById('movie-details') || document.getElementById('show-details')) displayDetails();
  if (document.querySelector('.search-form')) initSearch();
});
