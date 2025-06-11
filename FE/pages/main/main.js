document.addEventListener('DOMContentLoaded', () => {
  const searchButton = document.getElementById('search-button');
  const resetButton = document.getElementById('reset-button'); // 다시 검색하기 버튼
  const keywordManageButton = document.getElementById('keyword-manage-button'); // 키워드 관리 버튼
  const searchInput = document.getElementById('search-input');
  const authInput = document.getElementById('auth-input');
  const resultContainer = document.getElementById('result-container');
  const paginationControls = document.getElementById('pagination-controls');
  
  // 키워드 관리 관련 요소들
  const keywordAuthInput = document.getElementById('keyword-auth-input');
  const originalInput = document.getElementById('original-input');
  const expandedInput = document.getElementById('expanded-input');
  const registerButton = document.getElementById('register-button');
  const backToMainButton = document.getElementById('back-to-main-button');
  const keywordResultContainer = document.getElementById('keyword-result-container');
  const resetKeywordButton = document.getElementById('reset-keyword-button');

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
  const keywordSection = document.querySelector('.keyword-section');
  const keywordResultsSection = document.querySelector('.keyword-results-section');
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
  [authInput, searchInput, keywordAuthInput, originalInput, expandedInput].forEach(input => {
    if (input) {
      input.addEventListener('focus', () => clearInputError(input));
      input.addEventListener('input', () => clearInputError(input));
    }
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

  // section 전환 함수 (모든 섹션 제어)
  function setActiveSection(active) {
    // 모든 섹션 숨기기
    formSection.style.display = 'none';
    resultsSection.style.display = 'none';
    keywordSection.style.display = 'none';
    keywordResultsSection.style.display = 'none';
    
    // 선택된 섹션만 보이기
    switch(active) {
      case 'form':
        formSection.style.display = 'flex';
        break;
      case 'results':
        resultsSection.style.display = 'flex';
        break;
      case 'keyword':
        keywordSection.style.display = 'flex';
        break;
      case 'keyword-results':
        keywordResultsSection.style.display = 'flex';
        break;
    }
  }

  // 최초 진입 시 검색폼만 중앙에 표시
  setActiveSection('form');

  // Toss 스타일 로딩 오버레이
  function showLoadingOverlay(show, message = '이슈를 찾는 중') {
    const loadingText = document.getElementById('loading-text');
    if (loadingText) {
      loadingText.innerHTML = `${message}<span class="loading-dots"><span class="loading-dot"></span><span class="loading-dot"></span><span class="loading-dot"></span></span>`;
    }
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
    } else if (type === 'keyword-original-empty') {
      title = '원본 키워드가 입력되지 않았어요';
      desc = '원본 키워드를 입력해주세요';
    } else if (type === 'keyword-expanded-empty') {
      title = '확장 키워드가 입력되지 않았어요';
      desc = '확장 키워드를 입력해주세요';
    } else if (type === 'keyword-register-success') {
      title = '키워드가 성공적으로 등록되었습니다';
      desc = '키워드 확장이 정상적으로 등록되었습니다.';
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

  // 검색 실행 함수
  const performSearch = async () => {
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
  };

  // 키워드 등록 실행 함수
  const performKeywordRegister = async () => {
    const auth = keywordAuthInput.value.trim();
    const original = originalInput.value.trim();
    const expanded = expandedInput.value.trim();

    // 에러 표시 초기화
    keywordAuthInput.classList.remove('error');
    originalInput.classList.remove('error');
    expandedInput.classList.remove('error');

    // 입력값 체크 및 모달
    if (!auth) {
      keywordAuthInput.classList.add('error');
      showModal('auth-empty');
      return;
    }
    if (!original) {
      originalInput.classList.add('error');
      showModal('keyword-original-empty');
      return;
    }
    if (!expanded) {
      expandedInput.classList.add('error');
      showModal('keyword-expanded-empty');
      return;
    }

    showLoadingOverlay(true, '키워드를 등록하는 중');

    try {
      const response = await fetch('/register-keyword', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ original, expanded, auth }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          keywordAuthInput.classList.add('error');
          showModal('auth-wrong');
          showLoadingOverlay(false);
          return;
        } else {
          throw new Error(`Error: ${response.status}`);
        }
      }

      const data = await response.json();
      
      // 등록 성공 시 결과 표시
      keywordResultContainer.innerHTML = `
        <div class="result-item result-default">
          <div class="result-content">
            <h3 class="result-title">등록 완료</h3>
            <p>원본: ${original}</p>
            <p>확장: ${expanded}</p>
          </div>
        </div>
      `;
      
      setActiveSection('keyword-results');
      showModal('keyword-register-success');
      
    } catch (error) {
      keywordResultContainer.innerHTML = `<p class="error">오류 발생: ${error.message}</p>`;
      setActiveSection('keyword-results');
    } finally {
      showLoadingOverlay(false);
    }
  };

  // 검색 버튼 클릭
  searchButton.addEventListener('click', performSearch);

  // 엔터키로 검색 실행
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      performSearch();
    }
  };

  // 키워드 등록 엔터키 핸들러
  const handleKeywordKeyDown = (e) => {
    if (e.key === 'Enter') {
      performKeywordRegister();
    }
  };

  authInput.addEventListener('keydown', handleKeyDown);
  searchInput.addEventListener('keydown', handleKeyDown);

  // 키워드 입력 필드들에 엔터키 이벤트 추가
  if (keywordAuthInput) keywordAuthInput.addEventListener('keydown', handleKeywordKeyDown);
  if (originalInput) originalInput.addEventListener('keydown', handleKeywordKeyDown);
  if (expandedInput) expandedInput.addEventListener('keydown', handleKeywordKeyDown);

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
  });

  // 기존 resetButton(입력폼)도 동작 유지 (만약 존재한다면)
  if (resetButton) {
    resetButton.addEventListener('click', () => {
      resultContainer.innerHTML = '';
      if (paginationControls) paginationControls.innerHTML = '';
      searchInput.value = '';
      clearInputError(authInput);
      clearInputError(searchInput);
      resetButton.style.display = 'none';
    });
  }

  // 키워드 관리 버튼 클릭 이벤트 - 키워드 섹션으로 전환
  keywordManageButton.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('키워드 관리 섹션으로 전환');
    
    // 키워드 입력 필드 초기화
    if (keywordAuthInput) keywordAuthInput.value = '';
    if (originalInput) originalInput.value = '';
    if (expandedInput) expandedInput.value = '';
    
    // 에러 상태 초기화
    clearInputError(keywordAuthInput);
    clearInputError(originalInput);
    clearInputError(expandedInput);
    
    setActiveSection('keyword');
  });

  // 키워드 등록 버튼 클릭
  if (registerButton) {
    registerButton.addEventListener('click', performKeywordRegister);
  }

  // 뒤로가기 버튼 (키워드 섹션에서 검색 폼으로)
  if (backToMainButton) {
    backToMainButton.addEventListener('click', () => {
      setActiveSection('form');
    });
  }

  // 새로 등록하기 버튼 (키워드 결과에서 키워드 폼으로)
  if (resetKeywordButton) {
    resetKeywordButton.addEventListener('click', () => {
      keywordResultContainer.innerHTML = '';
      if (keywordAuthInput) keywordAuthInput.value = '';
      if (originalInput) originalInput.value = '';
      if (expandedInput) expandedInput.value = '';
      clearInputError(keywordAuthInput);
      clearInputError(originalInput);
      clearInputError(expandedInput);
      setActiveSection('keyword');
    });
  }
});