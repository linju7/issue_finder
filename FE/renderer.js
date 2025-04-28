document.addEventListener('DOMContentLoaded', () => {
  const searchButton = document.getElementById('search-button');
  const resetButton = document.getElementById('reset-button'); // 다시 검색하기 버튼
  const searchInput = document.getElementById('search-input');
  const authInput = document.getElementById('auth-input');
  const resultContainer = document.getElementById('result-container');
  const paginationControls = document.getElementById('pagination-controls');

  let results = [];
  let currentPage = 0;
  const resultsPerPage = 3;

  const setLoading = (isLoading) => {
    if (isLoading) {
      resultContainer.innerHTML = '<p>로딩 중...</p>';
    }
  };

  const getCardColor = (similarity) => {
    if (similarity >= 0.9) return '#ff4d4f'; // 빨강 (가장 중요)
    if (similarity >= 0.8) return '#ffa940'; // 주황
    if (similarity >= 0.7) return '#ffc53d'; // 노랑
    if (similarity >= 0.6) return '#bae637'; // 연두
    return '#d9f7be'; // 연한 초록 (덜 중요)
  };

  const renderPaginationControls = () => {
    paginationControls.innerHTML = ''; // 기존 버튼 초기화

    if (results.length > 0) {
      paginationControls.style.display = 'flex'; // 검색 결과가 있을 때 표시

      // 이전 버튼
      const prevButton = document.createElement('button');
      prevButton.id = 'prev-button';
      prevButton.classList.add('pagination-button');
      prevButton.textContent = '이전';
      prevButton.disabled = currentPage === 0;
      prevButton.addEventListener('click', () => {
        if (currentPage > 0) {
          currentPage--;
          renderResults();
        }
      });
      paginationControls.appendChild(prevButton);

      // 페이지 번호 버튼 (최대 5개 표시)
      const totalPages = Math.ceil(results.length / resultsPerPage);
      const maxVisiblePages = 5;
      let startPage = Math.max(0, currentPage - Math.floor(maxVisiblePages / 2));
      let endPage = Math.min(totalPages, startPage + maxVisiblePages);

      // 페이지 번호가 끝에 가까울 때 조정
      if (endPage - startPage < maxVisiblePages) {
        startPage = Math.max(0, endPage - maxVisiblePages);
      }

      for (let i = startPage; i < endPage; i++) {
        const pageButton = document.createElement('button');
        pageButton.classList.add('page-button');
        pageButton.textContent = i + 1;
        if (i === currentPage) {
          pageButton.classList.add('active'); // 현재 페이지 강조
        }
        pageButton.addEventListener('click', () => {
          currentPage = i;
          renderResults();
        });
        paginationControls.appendChild(pageButton);
      }

      // 다음 버튼
      const nextButton = document.createElement('button');
      nextButton.id = 'next-button';
      nextButton.classList.add('pagination-button');
      nextButton.textContent = '다음';
      nextButton.disabled = (currentPage + 1) * resultsPerPage >= results.length;
      nextButton.addEventListener('click', () => {
        if ((currentPage + 1) * resultsPerPage < results.length) {
          currentPage++;
          renderResults();
        }
      });
      paginationControls.appendChild(nextButton);
    } else {
      paginationControls.style.display = 'none'; // 검색 결과가 없을 때 숨김
    }
  };

  const renderResults = () => {
    resultContainer.innerHTML = '';
    const start = currentPage * resultsPerPage;
    const end = start + resultsPerPage;
    const pageResults = results.slice(start, end);

    pageResults.forEach(result => {
      const resultElement = document.createElement('div');
      resultElement.classList.add('result-item');
      resultElement.style.backgroundColor = getCardColor(result.similarity_score); // 카드 색상 설정
      resultElement.innerHTML = `
        <div class="result-card">
          <h3 class="result-title">${result.title}</h3>
          <p class="result-score">유사도: ${result.similarity_score.toFixed(2)}</p>
          <button class="copy-link-button" data-link="${result.link}" title="링크복사">
            <i class="fas fa-copy"></i>
          </button>
        </div>
      `;
      resultContainer.appendChild(resultElement);
    });

    // 링크 복사 버튼 이벤트 추가
    document.querySelectorAll('.copy-link-button').forEach(button => {
      button.addEventListener('click', (e) => {
        const link = e.currentTarget.getAttribute('data-link');
        navigator.clipboard.writeText(link).then(() => {
          alert('링크가 복사되었습니다!');
        });
      });
    });

    renderPaginationControls(); // 페이지네이션 표시 업데이트
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

    setLoading(true); // 로딩 시작
    try {
      const response = await fetch('http://127.0.0.1:8000/all/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ target: query, auth }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('인증키 값이 잘못되었습니다'); // 401 에러 메시지 변경
        } else {
          throw new Error(`Error: ${response.status}`);
        }
      }

      const data = await response.json();
      results = data.results;
      currentPage = 0;
      renderResults();

      // 검색 완료 후 다시하기 버튼 표시
      resetButton.style.display = 'inline-block';
    } catch (error) {
      resultContainer.innerHTML = `<p class="error">오류 발생: ${error.message}</p>`;
    } finally {
      setLoading(false); // 로딩 종료
    }
  });

  resetButton.addEventListener('click', () => {
    resultContainer.innerHTML = ''; // 결과 영역 초기화
    paginationControls.innerHTML = ''; // 페이지네이션 초기화
    searchInput.value = ''; // 검색어 입력 필드 초기화
    resetButton.style.display = 'none'; // 다시하기 버튼 숨김
  });
});