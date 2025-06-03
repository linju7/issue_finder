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
    // 토스 블루 계열: 유사도 높을수록 진한 파랑
    if (similarity >= 0.95) return '#3182f6'; // 진한 토스 블루
    if (similarity >= 0.9) return '#4f98fa';
    if (similarity >= 0.8) return '#7bb8fa';
    if (similarity >= 0.7) return '#b3d6fd';
    return '#e8f3ff'; // 연한 파랑
  };

  // section 참조
  const formSection = document.querySelector('.form-section');
  const resultsSection = document.querySelector('.results-section');
  const loadingOverlay = document.getElementById('loading-overlay');
  const resetButton2 = document.getElementById('reset-button2');
  // 모달 관련
  const modalOverlay = document.getElementById('modal-overlay');
  const modalTitle = document.getElementById('modal-title');
  const modalDesc = document.getElementById('modal-desc');
  const modalClose = document.getElementById('modal-close');

  // 에러 메시지 동적 생성/제거 함수
  function showInputError(input, message) {
    input.classList.add('error');
    let msg = input.parentElement.querySelector('.input-error-message');
    if (!msg) {
      msg = document.createElement('div');
      msg.className = 'input-error-message';
      input.parentElement.appendChild(msg);
    }
    msg.textContent = message;
  }
  function clearInputError(input) {
    input.classList.remove('error');
    const msg = input.parentElement.querySelector('.input-error-message');
    if (msg) msg.remove();
  }

  // 입력폼 포커스/블러 효과
  [authInput, searchInput].forEach(input => {
    input.addEventListener('focus', () => clearInputError(input));
    input.addEventListener('input', () => clearInputError(input));
  });

  // 결과 fade 효과
  function fadeOutResults(cb) {
    resultContainer.classList.add('fade-out');
    setTimeout(() => {
      resultContainer.classList.remove('fade-out');
      if (cb) cb();
    }, 350);
  }
  function fadeInResults() {
    resultContainer.classList.add('fade-in');
    setTimeout(() => resultContainer.classList.remove('fade-in'), 350);
  }

  // section 전환 함수 (중앙 단일 박스 전환)
  function setActiveSection(active) {
    formSection.style.display = (active === 'form') ? 'flex' : 'none';
    resultsSection.style.display = (active === 'results') ? 'flex' : 'none';
  }

  // 최초 진입 시 검색폼만 중앙에 표시
  setActiveSection('form');

  // Toss 스타일 로딩 오버레이
  function showLoadingOverlay(show) {
    loadingOverlay.style.display = show ? 'flex' : 'none';
  }

  // 무한 스크롤용 변수
  let loadedCount = 0;
  const LOAD_BATCH = 5; // 5개씩 로드

  // 무한 스크롤 결과 렌더링
  const renderResults = () => {
    if (!results.length) return resultContainer.innerHTML = '';
    resultContainer.innerHTML = '';
    for (let i = 0; i < loadedCount; i++) {
      const result = results[i];
      const resultElement = document.createElement('div');
      resultElement.classList.add('result-item', 'result-default');
      // 유사도 값 표시용 span
      let simClass = result.similarity_score >= 0.6 ? 'sim-high' : 'sim-low';
      let simText = `유사도: ${(result.similarity_score * 100).toFixed(1)}%`;
      resultElement.innerHTML = `
        <div class="result-content">
          <h3 class="result-title">${result.title}</h3>
        </div>
        <span class="result-similarity ${simClass}">${simText}</span>
      `;
      resultElement.addEventListener('click', () => {
        window.open(result.link, '_blank');
      });
      resultContainer.appendChild(resultElement);
    }
    resultContainer.appendChild(sentinel);
  };

  // 무한 스크롤 IntersectionObserver (result-container 내부 스크롤)
  const sentinel = document.createElement('div');
  sentinel.style.height = '1px';
  sentinel.style.width = '100%';
  resultContainer.appendChild(sentinel);
  const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && loadedCount < results.length) {
      loadedCount = Math.min(loadedCount + LOAD_BATCH, results.length);
      renderResults();
    }
  }, { root: resultContainer, threshold: 1.0 });

  // 모달 표시 함수
  function showModal(type) {
    let title = '';
    let desc = '';
    if (type === 'auth-empty') {
      title = '인증키가 입력되지 않았어요.';
      desc = '인증키는 반드시 입력해야합니다. 입력하여 다시 시도해주세요.';
    } else if (type === 'auth-wrong') {
      title = '인증키가 올바르지 않아요.';
      desc = '인증키를 다시 입력하여 시도해주세요.';
    } else if (type === 'search-empty') {
      title = '검색어가 입력되지 않았어요';
      desc = '검색어에 찾고자 하는 이슈를 설명해주세요';
    }
    modalTitle.textContent = title;
    modalDesc.textContent = desc;
    modalOverlay.style.display = 'flex';
    document.body.classList.add('modal-open');
  }
  function hideModal() {
    modalOverlay.style.display = 'none';
    document.body.classList.remove('modal-open');
  }
  modalClose.addEventListener('click', hideModal);
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) hideModal();
  });

  // 검색 버튼 클릭
  searchButton.addEventListener('click', async () => {
    const query = searchInput.value.trim();
    const auth = authInput.value.trim();

    // 에러 표시 초기화
    authInput.classList.remove('error');
    searchInput.classList.remove('error');

    // 입력값 체크 및 모달
    if (!auth && !query) {
      authInput.classList.add('error');
      searchInput.classList.add('error');
      showModal('auth-empty');
      return;
    }
    if (!auth) {
      authInput.classList.add('error');
      showModal('auth-empty');
      return;
    }
    if (!query) {
      searchInput.classList.add('error');
      showModal('search-empty');
      return;
    }

    showLoadingOverlay(true);
    fadeOutResults(() => {
      setLoading(true);
    });

    try {
      const response = await fetch('/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: query, auth }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          authInput.classList.add('error');
          showModal('auth-wrong');
          // 인증키 오류 시 입력폼을 그대로 유지하고, 결과로 넘어가지 않음
          setLoading(false);
          showLoadingOverlay(false);
          return;
        } else {
          throw new Error(`Error: ${response.status}`);
        }
      }

      const data = await response.json();
      results = data.results;
      currentPage = 0;
      loadedCount = Math.min(LOAD_BATCH, results.length);
      renderResults();
      setActiveSection('results');
      if (results.length > 0) {
        observer.disconnect();
        observer.observe(sentinel);
      }
    } catch (error) {
      resultContainer.innerHTML = `<p class="error">오류 발생: ${error.message}</p>`;
      setActiveSection('results');
    } finally {
      setLoading(false);
      showLoadingOverlay(false);
    }
  });

  // 다시하기 버튼(결과화면) 클릭 시 초기화
  resetButton2.addEventListener('click', () => {
    resultContainer.innerHTML = '';
    loadedCount = 0;
    results = [];
    observer.disconnect();
    resultContainer.appendChild(sentinel);
    searchInput.value = '';
    clearInputError(authInput);
    clearInputError(searchInput);
    setActiveSection('form');
    searchInput.focus();
  });

  // 기존 resetButton(입력폼)도 동작 유지
  resetButton.addEventListener('click', () => {
    resultContainer.innerHTML = '';
    paginationControls.innerHTML = '';
    searchInput.value = '';
    clearInputError(authInput);
    clearInputError(searchInput);
    resetButton.style.display = 'none';
  });
});