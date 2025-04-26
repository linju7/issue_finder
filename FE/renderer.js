document.addEventListener('DOMContentLoaded', () => {
  const searchButton = document.getElementById('search-button');
  const searchInput = document.getElementById('search-input');
  const authInput = document.getElementById('auth-input');
  const resultContainer = document.getElementById('result-container');

  searchButton.addEventListener('click', async () => {
    const query = searchInput.value.trim();
    const auth = authInput.value.trim();

    if (!auth) {
      alert('인증 키를 입력하세요!');
      return;
    }

    if (!query) {
      alert('검색어를 입력하세요!');
      return;
    }

    try {
      // 서버에 요청 보내기
      const response = await fetch('http://127.0.0.1:8000/all/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          target: query,
          auth: auth, // 입력받은 인증 키
        }),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();

      // 결과 표시
      resultContainer.innerHTML = `
        <h3>검색 결과</h3>
        <p><strong>제목:</strong> ${data.most_similar_title}</p>
        <p><strong>유사도:</strong> ${data.similarity_score.toFixed(2)}</p>
        <p><strong>링크:</strong> <a href="${data.link}" target="_blank">${data.link}</a></p>
      `;
    } catch (error) {
      resultContainer.innerHTML = `<p class="error">오류 발생: ${error.message}</p>`;
    }
  });
});