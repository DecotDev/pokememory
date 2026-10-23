let showAllRecords = false;

export function saveGameResult(user, cardsCount, totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const timeString = `${minutes}m ${seconds}s`;

  const newResult = {
    id: 'game_' + Date.now(),
    username: user.username,
    pokemonName: user.name,
    pokemonImage: user.image,
    cardsCount: cardsCount,
    secondsElapsed: totalSeconds,
    timeString: timeString
  };

  const existingHistory = JSON.parse(localStorage.getItem('poke_ranking')) || [];
  existingHistory.push(newResult);
  localStorage.setItem('poke_ranking', JSON.stringify(existingHistory));

  return newResult.id;
}

export function renderRanking(container, lastGameId) {
  const history = JSON.parse(localStorage.getItem('poke_ranking')) || [];

  if (history.length === 0) {
    container.innerHTML = `<p class="no-records">No games played yet.</p>`;
    return;
  }

  // Order: more cards first, then less time
  history.sort((a, b) => {
    if (b.cardsCount !== a.cardsCount) {
      return b.cardsCount - a.cardsCount;
    }
    return a.secondsElapsed - b.secondsElapsed;
  });

  let html = `
    <table class="ranking-table">
      <thead>
        <tr>
          <th style="padding: 8px;">Pos</th>
          <th style="padding: 8px;">Player</th>
          <th style="padding: 8px;">PK</th>
          <th style="padding: 8px; text-align: center;">Cards</th>
          <th style="padding: 8px;">Time</th>
        </tr>
      </thead>
      <tbody>
  `;

  const maxVisible = 5;
  history.forEach((item, index) => {
    const isTopFew = index < maxVisible;
    const isLatest = item.id === lastGameId;


    if (!showAllRecords && !isTopFew && !isLatest && history.length > maxVisible) {
      return;
    }

    const rowClass = isLatest ? 'ranking-row ranking-latest' : 'ranking-row';

    html += `
      <tr class="${rowClass}">
        <td>#${index + 1}</td>
        <td>${item.username}</td>
        <td><img src="${item.pokemonImage}" alt="${item.pokemonName}" style="width: 22px; height: 22px; vertical-align: middle;" /></td>
        <td style="text-align: center;">${item.cardsCount}</td>
        <td>${item.timeString}</td>
      </tr>
    `;
  });

  html += `
      </tbody>
    </table>
  `;

  // Ranking dropdown button
  if (history.length > maxVisible) {
    const buttonText = showAllRecords ? "Show less (Top 5)" : `Show all (${history.length} records)`;
    html += `
      <div style="text-align: center;">
        <button id="toggle-ranking-btn" class="toggle-btn">
          ${buttonText}
        </button>
      </div>
    `;
  }

  container.innerHTML = html;

  // Drop down button event listener
  const toggleBtn = container.querySelector('#toggle-ranking-btn');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      showAllRecords = !showAllRecords;
      renderRanking(container, lastGameId);
    });
  }
}