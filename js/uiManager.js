// UI Management and Results Display
const visibleMovies = new Map(); // Track visible movies per group

function toggleParallelepiped(movieId, filmName, imagePath) {
  const container = document.getElementById(`${movieId}-parallelepiped`);
  const isExpanded = container.style.height !== '0px' && container.style.height !== '';
  
  // Generate film ID using the same logic as filmIds.js
  const filmId = `film-${filmName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`;
  
  // Send film selection to Firebase (same as categories)
  if (window.firebase) {
    window.firebase.send("remoteControl", {
      id: filmId,
      filmName: filmName,
      type: 'film',
      date: new Date().getTime()
    });
  }
  
  if (isExpanded) {
    container.style.height = '0px';
    container.innerHTML = '';
  } else {
    if (typeof StandaloneParallelepiped !== 'undefined') {
      // Fallback image mapping for missing image_path fields
             const imageMap = {
         'The Hunger Games': 'public/cofanetto/The Hunger Games Catching Fire.jpg',
         'The Devil Wears Prada': 'public/cofanetto/the devil wears prada.jpg',
         'Sicario': 'public/cofanetto/sicario.jpg',
         'The Danish Girl': 'public/cofanetto/The Danish Girl.jpg',
         'Maria': 'public/cofanetto/maria.jpg',
         'The Killer': 'public/cofanetto/thekiller2023.jpg'
       };
      
      const finalImagePath = imagePath || imageMap[filmName] || 'public/cofanetto/Avatar.jpg';
      
      const parallelepiped = StandaloneParallelepiped.create({
        id: `${movieId}-3d`,
        imagePath: finalImagePath,
        animationDuration: 6,
        animationDelay: 0
      });
      container.innerHTML = '';
      container.appendChild(parallelepiped);
      container.style.height = '120px';
    }
  }
}

function showResults(data) {
  const mainApp = document.getElementById('main-app');
  let resultsScreen = document.getElementById('results-screen');
  
  if (!resultsScreen) {
    resultsScreen = document.createElement('div');
    resultsScreen.id = 'results-screen';
    resultsScreen.style.display = 'none';
    document.body.appendChild(resultsScreen);
  }

  // Initialize visible movies count for each group
  data.groups.forEach((group, index) => {
    visibleMovies.set(`group-${index}`, 5);
  });

  resultsScreen.innerHTML = `
    <div style="padding: 20px; max-width: 600px; margin: 0 auto;">
      <button id="back-btn" style="background-color: #D9D9D9; color: black; border: none; padding: 10px 20px; border-radius: 14px; margin-bottom: 20px; cursor: pointer; font-family: 'Input Mono', monospace;">← Back</button>
      
      <div style="width: 280px; height: 45px; border: 3px solid #D9D9D9; background: transparent; display: flex; align-items: center; justify-content: center; color: #D9D9D9; margin: 0 auto 35px; border-radius: 14px; font-size: 17px; font-weight: 900;">${data.label}</div>
      
      ${data.groups.map((group, groupIndex) => createGroupHTML(group, groupIndex)).join('')}
    </div>
  `;

  mainApp.style.display = 'none';
  resultsScreen.style.display = 'block';

  setupEventListeners(data);
}

function createGroupHTML(group, groupIndex) {
  const visibleCount = visibleMovies.get(`group-${groupIndex}`) || 5;
  const hasMore = group.movies.length > visibleCount;

  return `
    <div style="margin-bottom: 30px;">
      <div style="width: 280px; height: 49px; ${group.isWinner ? 'background-color: #D9D9D9;' : 'background: transparent; border: 3px solid #D9D9D9;'} color: ${group.isWinner ? 'black' : 'white'}; display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: 800; border-radius: 14px; margin: 0 auto 10px; font-family: 'Input Mono', monospace;">
        ${group.name.toUpperCase()} ${group.isWinner ? '🏆' : ''}
      </div>
      <div style="font-size: 14px; color: white; text-align: center; margin-bottom: 15px;">
        Total: <span style="font-weight: 900; font-size: 18px;">$${formatEarnings(group.totalBoxOffice)}</span>
      </div>
            <div id="movies-container-${groupIndex}" style="display: flex; flex-direction: column; align-items: center;">
        ${group.movies.slice(0, visibleCount).map((movie, movieIndex) => 
          createMovieHTML(movie, group.isWinner, `movie-${groupIndex}-${movieIndex}`)
        ).join('')}
      </div>
      ${hasMore ? `
        <button id="show-more-${groupIndex}" style="width: 280px; height: 30px; background: transparent; border: 1px solid #D9D9D9; color: white; display: flex; align-items: center; justify-content: center; margin: 10px auto; border-radius: 13px; font-size: 12px; font-family: 'Input Mono', monospace; cursor: pointer;">
          Show More (${group.movies.length - visibleCount} more)
        </button>
      ` : ''}
    </div>
  `;
}

function createMovieHTML(movie, isWinner, movieId) {
  const filmId = `film-${movie.name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`;
  return `
    <div style="margin: 3px auto;">
      <div id="${movieId}" onclick="toggleParallelepiped('${movieId}', '${movie.name.replace(/'/g, "\\'")}', '${movie.imagePath || ''}')" style="width: 280px; height: 5px; ${isWinner ? 'background-color: #D9D9D9;' : 'background: transparent; border: 1px solid #D9D9D9;'} color: ${isWinner ? 'black' : 'white'}; display: flex; align-items: center; justify-content: flex-start; padding: 8px; border-radius: 13px; font-size: 12px; font-weight: 400; font-family: 'Input Mono', monospace; opacity: 0; transform: translateY(20px); cursor: pointer;">
        <span id="${filmId}">${movie.name}</span> <span style="font-weight: 900; margin-left: 8px;">$${formatEarnings(movie.boxOffice)}</span>
      </div>
      <div id="${movieId}-parallelepiped" style="height: 0; overflow: hidden; transition: height 0.3s ease; display: flex; justify-content: center; align-items: center;"></div>
    </div>
  `;
}

function showMoreMovies(groupIndex, group) {
  const container = document.getElementById(`movies-container-${groupIndex}`);
  const button = document.getElementById(`show-more-${groupIndex}`);
  const currentVisible = visibleMovies.get(`group-${groupIndex}`);
  const newVisible = group.movies.length; // Show all remaining movies
  
  // Add all remaining movies
  const newMovies = group.movies.slice(currentVisible, newVisible);
  newMovies.forEach((movie, index) => {
    const movieIndex = currentVisible + index;
    const movieId = `movie-${groupIndex}-${movieIndex}`;
    container.insertAdjacentHTML('beforeend', createMovieHTML(movie, group.isWinner, movieId));
  });

  // Animate new movies
  const newMovieElements = newMovies.map((_, index) => 
    document.getElementById(`movie-${groupIndex}-${currentVisible + index}`)
  );

  gsap.to(newMovieElements, {
    opacity: 1,
    y: 0,
    duration: 0.5,
    stagger: 0.05,
    ease: "power2.out"
  });

  // Update state and remove button
  visibleMovies.set(`group-${groupIndex}`, newVisible);
  button.remove();
}

function setupEventListeners(data) {
  // Back button
  document.getElementById('back-btn').addEventListener('click', () => {
    document.getElementById('results-screen').style.display = 'none';
    document.getElementById('main-app').style.display = 'flex';
  });

  // Show more buttons
  data.groups.forEach((group, groupIndex) => {
    const button = document.getElementById(`show-more-${groupIndex}`);
    if (button) {
      button.addEventListener('click', () => showMoreMovies(groupIndex, group));
    }
  });

  // Animate initial movies
  gsap.set('#results-screen [id^="movie-"]', { opacity: 0, y: 20 });
  gsap.to('#results-screen [id^="movie-"]', {
    opacity: 1,
    y: 0,
    duration: 0.5,
    stagger: 0.05,
    ease: "power2.out"
  });
} 