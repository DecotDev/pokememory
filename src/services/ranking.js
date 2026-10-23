let showAllRecords = false;

export function saveGameResult(user, cardsCount, totalSeconds, currentLastGameId) {
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
    container.innerHTML = `<p style="font-size: 0.85rem; color: #666; text-align: center;">No games played yet.</p>`;
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
    <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem; text-align: left;">
      <thead>
        <tr style="border-bottom: 2px solid #ccc; background: #f4f4f4;">
          <th style="padding: 6px;">Pos</th>
          <th style="padding: 6px;">Player</th>
          <th style="padding: 6px;">Fav</th>
          <th style="padding: 6px; text-align: center;">Cards</th>
          <th style="padding: 6px;">Time</th>
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

    const rowStyle = isLatest 
      ? 'background-color: #fff9c4; font-weight: bold; border-left: 4px solid #ffcb05;' 
      : 'border-bottom: 1px solid #eee;';

    html += `
      <tr style="${rowStyle}">
        <td style="padding: 6px;">#${index + 1}</td>
        <td style="padding: 6px;">${item.username}</td>
        <td style="padding: 6px;"><img src="${item.pokemonImage}" alt="${item.pokemonName}" style="width: 22px; height: 22px; vertical-align: middle;" /></td>
        <td style="padding: 6px; text-align: center;">${item.cardsCount}</td>
        <td style="padding: 6px;">${item.timeString}</td>
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
      <div style="text-align: center; margin-top: 0.5rem;">
        <button id="toggle-ranking-btn" style="background: none; border: none; color: #2a75bb; font-size: 0.8rem; font-weight: bold; cursor: pointer; text-decoration: underline;">
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