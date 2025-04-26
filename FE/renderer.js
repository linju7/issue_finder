document.addEventListener('DOMContentLoaded', () => {
  const searchButton = document.getElementById('search-button');
  const searchInput = document.getElementById('search-input');
  const authInput = document.getElementById('auth-input');
  const resultContainer = document.getElementById('result-container');
  const prevButton = document.getElementById('prev-button');
  const nextButton = document.getElementById('next-button');

  let results = [];
  let currentPage = 0;
  const resultsPerPage = 3; // 한 페이지에 3개씩 표시

  const renderResults = () => {
    resultContainer.innerHTML = '';
    const start = currentPage * resultsPerPage;
    const end = start + resultsPerPage;
    const pageResults = results.slice(start, end);

    pageResults.forEach(result => {
      const resultElement = document.createElement('div');
      resultElement.classList.add('result-item');
      resultElement.innerHTML = `
        <p><strong>요약:</strong> <a href="${result.link}" target="_blank">${result.title}</a></p>
        <p><strong>유사도:</strong> ${result.similarity_score.toFixed(2)}</p>
      `;
      resultContainer.appendChild(resultElement);
    });

    // 페이지네이션 버튼 상태 업데이트
    prevButton.disabled = currentPage === 0;
    nextButton.disabled = end >= results.length;
  };

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
      results = data.results; // 서버에서 받은 정렬된 결과 리스트
      currentPage = 0; // 페이지 초기화
      renderResults(); // 결과 렌더링
    } catch (error) {
      resultContainer.innerHTML = `<p class="error">오류 발생: ${error.message}</p>`;
    }
  });

  prevButton.addEventListener('click', () => {
    if (currentPage > 0) {
      currentPage--;
      renderResults();
    }
  });

  nextButton.addEventListener('click', () => {
    if ((currentPage + 1) * resultsPerPage < results.length) {
      currentPage++;
      renderResults();
    }
  });
});