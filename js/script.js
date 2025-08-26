const global = {
  currentPage: window.location.pathname
};

const API_KEY = 'b73b23571284780aefb4396a788746f8';
const BASE_URL = 'https://api.themoviedb.org/3';

async function fetchAPIData(endpoint) {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}?api_key=${API_KEY}&language=en-US`);
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Error fetching data:', error);
    return null;    
  }
}

async function displayPopularMovies() {
  const data = await fetchAPIData('/movie/popular&page=1');
  if (data && data.results) {
    console.log(data.results);
    return data.results;
  } else {
    return [];
  }
}

displayPopularMovies();


function highlightActiveLink() {
  const links = document.querySelectorAll('.nav-link');
  links.forEach(link => {
    const href = link.getAttribute('href');
    if (global.currentPage.endsWith(href)) {
      link.classList.add('active');
    }
  });
}

function init() {
  switch (global.currentPage) {
    case '/':
    case '/index.html':
      console.log('Home');
      break;
    case '/shows.html':
      console.log('Shows');
      break;
    case '/movies-details.html':
      console.log('Movie Details');
      break;
    case '/tv-details.html':
      console.log('TV Details');
      break;
    case '/search.html':
      console.log('Search');
      break;
    default:
      console.log('Page not handled in switch statement.');
  }

  highlightActiveLink();
}
document.addEventListener('DOMContentLoaded', init);
 














