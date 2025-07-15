// DOM elements
const searchInput = document.getElementById('searchInput');
const moviesGrid = document.getElementById('moviesGrid');
const movieCounter = document.getElementById('movieCounter');
const clearBtn = document.getElementById('clearBtn');
const emptyState = document.getElementById('emptyState');
const filterBtnsContainer = document.querySelector('.filter-buttons');
const yearSelect = document.getElementById('yearSelect');
let currentYear = 'all';

let currentFilter = 'all';
let currentSearch = '';
let movies = [];
let genresList = [];

// TMDB API key
const tmdbApiKey = "72411b660ac0954015d1877a01856225";

// Fetch genres and movies from TMDB, map genres to names, and fetch actors
async function fetchMovies() {
    // Fetch genre list
    const genreRes = await fetch(`https://api.themoviedb.org/3/genre/movie/list?api_key=${tmdbApiKey}&language=en-US`);
    const genreData = await genreRes.json();
    const genreMap = {};
    genresList = genreData.genres; // Save for dynamic filter buttons
    genreData.genres.forEach(g => { genreMap[g.id] = g.name; });

    // Fetch popular movies (first page, 20 movies)
    const url = `https://api.themoviedb.org/3/movie/popular?api_key=${tmdbApiKey}&language=en-US&page=1`;
    const response = await fetch(url);
    const data = await response.json();

    // For each movie, fetch credits to get main actor (first billed cast), IMDb ID, and TMDB rating
    const moviesWithActors = await Promise.all(
        data.results.map(async movie => {
            let actor = "Unknown";
            let imdb_id = "";
            let tmdb_rating = movie.vote_average || "N/A";
            try {
                // Get main actor
                const creditsRes = await fetch(`https://api.themoviedb.org/3/movie/${movie.id}/credits?api_key=${tmdbApiKey}`);
                const creditsData = await creditsRes.json();
                if (creditsData.cast && creditsData.cast.length > 0) {
                    actor = creditsData.cast[0].name;
                }
                // Get IMDb ID
                const detailsRes = await fetch(`https://api.themoviedb.org/3/movie/${movie.id}?api_key=${tmdbApiKey}`);
                const detailsData = await detailsRes.json();
                imdb_id = detailsData.imdb_id || "";
            } catch (e) {}
            return {
                title: movie.title,
                genre: movie.genre_ids.length > 0 ? genreMap[movie.genre_ids[0]] : "Unknown",
                year: movie.release_date ? movie.release_date.split('-')[0] : "Unknown",
                actor: actor,
                poster: movie.poster_path
                    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
                    : "https://via.placeholder.com/150x225?text=No+Image",
                imdb_id: imdb_id,
                tmdb_rating: tmdb_rating
            };
        })
    );
    return moviesWithActors;
}

async function init() {
    if (!moviesGrid || !emptyState) return;
    moviesGrid.innerHTML = '<div style="text-align:center;width:100%">Loading movies...</div>';
    emptyState.style.display = 'none';
    try {
        const fetchedMovies = await fetchMovies();
        movies = Array.isArray(fetchedMovies) ? fetchedMovies : [];
        if (movies.length === 0) {
            throw new Error("No movies found from API.");
        }
        renderGenreButtons();
        populateYearOptions();
        renderMovies();
        setupEventListeners();
    } catch (error) {
        moviesGrid.innerHTML = '';
        emptyState.style.display = 'block';
        if (emptyState.querySelector('h3')) {
            emptyState.querySelector('h3').textContent = "Error loading movies";
        }
        if (emptyState.querySelector('p')) {
            emptyState.querySelector('p').textContent = error.message || "Please try again later.";
        }
    }
}

function setupEventListeners() {
    if (searchInput) searchInput.addEventListener('input', handleSearch);
    if (clearBtn) clearBtn.addEventListener('click', clearSearch);
    // Re-query filter buttons after dynamic rendering
    document.querySelectorAll('.filter-btn').forEach(btn => btn.addEventListener('click', handleFilterClick));
    if (yearSelect) yearSelect.addEventListener('change', function() {
        currentYear = this.value;
        renderMovies();
    });
}

function handleSearch(e) {
    currentSearch = e.target.value.toLowerCase();
    renderMovies();
}

function handleFilterClick(e) {
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    e.target.classList.add('active');
    currentFilter = e.target.dataset.genre;
    renderMovies();
}

function clearSearch() {
    if (searchInput) searchInput.value = '';
    currentSearch = '';
    currentFilter = 'all';
    currentYear = 'all';
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    const allBtn = document.querySelector('.filter-btn[data-genre="all"]');
    if (allBtn) allBtn.classList.add('active');
    if (yearSelect) yearSelect.value = 'all';
    renderMovies();
}

function populateYearOptions() {
    if (!yearSelect) return;
    yearSelect.innerHTML = '<option value="all">All</option>';
    const years = [...new Set(movies.map(movie => movie.year))].sort();
    years.forEach(year => {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearSelect.appendChild(option);
    });
}

function renderGenreButtons() {
    if (!filterBtnsContainer) return;
    filterBtnsContainer.innerHTML = '';
    // "All" button
    const allBtn = document.createElement('button');
    allBtn.className = 'filter-btn active';
    allBtn.dataset.genre = 'all';
    allBtn.textContent = 'All';
    filterBtnsContainer.appendChild(allBtn);
    // Genre buttons
    genresList.forEach(genre => {
        const btn = document.createElement('button');
        btn.className = 'filter-btn';
        btn.dataset.genre = genre.name;
        btn.textContent = genre.name;
        filterBtnsContainer.appendChild(btn);
    });
}

function getFilteredMovies() {
    // Always limit to 20 movies after filtering/searching
    return movies.filter(movie => {
        const genreMatch = currentFilter === 'all' ||
            movie.genre.toLowerCase() === currentFilter.toLowerCase();
        const yearMatch = currentYear === 'all' ||
            movie.year.toString() === currentYear;
        const searchMatch = currentSearch === '' ||
            movie.title.toLowerCase().includes(currentSearch) ||
            movie.genre.toLowerCase().includes(currentSearch) ||
            movie.actor.toLowerCase().includes(currentSearch) ||
            movie.year.toString().includes(currentSearch);
        return genreMatch && yearMatch && searchMatch;
    }).slice(0, 20);
}

function createMovieCard(movie) {
    const imdbLink = movie.imdb_id
        ? `<a href="https://www.imdb.com/title/${movie.imdb_id}" target="_blank" rel="noopener noreferrer" class="imdb-link">IMDb</a>`
        : `<span class="imdb-link disabled">IMDb</span>`;
    return `
        <div class="movie-card">
            <img src="${movie.poster}" alt="${movie.title} Poster" class="movie-poster"/>
            <div class="movie-content">
                <div class="movie-title">${movie.title}</div>
                <div class="movie-info">
                    <span class="movie-label">Genre:</span>
                    <span class="movie-value"><span class="genre-tag">${movie.genre}</span></span>
                </div>
                <div class="movie-info">
                    <span class="movie-label">Actor:</span>
                    <span class="movie-value">${movie.actor}</span>
                </div>
                <div class="movie-info">
                    <span class="movie-label">Year:</span>
                    <span class="movie-value">${movie.year}</span>
                </div>
                <div class="movie-info">
                    <span class="movie-label">TMDB Rating:</span>
                    <span class="movie-value">${movie.tmdb_rating}</span>
                </div>
                <div class="movie-info">
                    <span class="movie-label">IMDb:</span>
                    <span class="movie-value">${imdbLink}</span>
                </div>
            </div>
        </div>
    `;
}

function renderMovies() {
    const filteredMovies = getFilteredMovies();
    if (movieCounter) movieCounter.textContent = `Showing ${filteredMovies.length} of ${movies.length} movies`;
    if (filteredMovies.length === 0) {
        if (moviesGrid) moviesGrid.style.display = 'none';
        if (emptyState) {
            emptyState.style.display = 'block';
            if (emptyState.querySelector('h3')) emptyState.querySelector('h3').textContent = "No movies found";
            if (emptyState.querySelector('p')) emptyState.querySelector('p').textContent = "Try adjusting your search or filter criteria";
        }
        return;
    }
    if (moviesGrid) {
        moviesGrid.style.display = 'grid';
        moviesGrid.innerHTML = filteredMovies.map(movie => createMovieCard(movie)).join('');
    }
    if (emptyState) emptyState.style.display = 'none';
}

document.addEventListener('DOMContentLoaded', init);