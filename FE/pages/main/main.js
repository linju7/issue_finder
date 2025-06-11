document.addEventListener('DOMContentLoaded', () => {
  const searchButton = document.getElementById('search-button');
  const resetButton = document.getElementById('reset-button'); // 다시 검색하기 버튼
  const keywordManageButton = document.getElementById('keyword-manage-button'); // 키워드 관리 버튼
  const searchInput = document.getElementById('search-input');
  const authInput = document.getElementById('auth-input');
  const resultContainer = document.getElementById('result-container');
  const paginationControls = document.getElementById('pagination-controls');
  
  // 서비스 선택 드롭다운
  const serviceSelect = document.getElementById('service-select');
  const keywordServiceSelect = document.getElementById('keyword-service-select');
  
  // 키워드 관리 관련 요소들
  const keywordAuthInput = document.getElementById('keyword-auth-input');
  const originalInput = document.getElementById('original-input');
  const expandedInput = document.getElementById('expanded-input');
  const registerButton = document.getElementById('register-button');
  const backToMainButton = document.getElementById('back-to-main-button');
  const keywordResultContainer = document.getElementById('keyword-result-container');
  const resetKeywordButton = document.getElementById('reset-keyword-button');
  const existingKeywordsContainer = document.getElementById('existing-keywords-container');

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
  [authInput, searchInput, originalInput, expandedInput, serviceSelect].forEach(input => {
    if (input) {
      input.addEventListener('focus', () => clearInputError(input));
      input.addEventListener('input', () => clearInputError(input));
      if (input.tagName === 'SELECT') {
        input.addEventListener('change', () => clearInputError(input));
      }
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

  // 키워드 목록 렌더링
  const renderExistingKeywords = (keywords) => {
    if (!keywords || keywords.length === 0) {
      existingKeywordsContainer.innerHTML = '<p class="no-keywords">등록된 키워드가 없습니다.</p>';
      return;
    }

    let html = '';
    keywords.forEach((keyword, index) => {
      html += `
        <div class="keyword-item" data-index="${index}" data-original="${keyword.original}" data-expanded="${keyword.expanded}">
          <div class="keyword-content">
            <div class="keyword-original">${keyword.original}</div>
            <div class="keyword-expanded">${keyword.expanded}</div>
          </div>
          <div class="keyword-edit-form">
            <input type="text" class="keyword-edit-input" id="edit-original-${index}" value="${keyword.original}">
            <span class="keyword-edit-separator">⇄</span>
            <input type="text" class="keyword-edit-input" id="edit-expanded-${index}" value="${keyword.expanded}">
            <div class="keyword-edit-actions">
              <button class="keyword-edit-btn confirm" onclick="confirmEdit(${index}, '${keyword.original}', '${keyword.expanded}')">확인</button>
              <button class="keyword-edit-btn cancel" onclick="cancelEdit(${index})">취소</button>
            </div>
          </div>
          <div class="keyword-actions">
            <button class="keyword-action-btn edit" onclick="startEdit(${index})">수정</button>
            <button class="keyword-action-btn delete" onclick="showDeleteModal('${keyword.original}', '${keyword.expanded}', ${index})">삭제</button>
          </div>
        </div>
      `;
    });
    existingKeywordsContainer.innerHTML = html;

    // 키워드 아이템 클릭 이벤트 추가
    const keywordItems = existingKeywordsContainer.querySelectorAll('.keyword-item');
    keywordItems.forEach(item => {
      item.addEventListener('click', function(e) {
        // 버튼이나 인풋 클릭은 무시
        if (e.target.classList.contains('keyword-action-btn') || 
            e.target.classList.contains('keyword-edit-btn') ||
            e.target.classList.contains('keyword-edit-input')) {
          return;
        }
        
        // 편집 중이면 무시
        if (this.classList.contains('editing')) {
          return;
        }
        
        // 다른 편집 중인 아이템들 종료
        cancelAllEditing();
        
        // 다른 아이템들의 선택 해제
        keywordItems.forEach(otherItem => {
          if (otherItem !== this) {
            otherItem.classList.remove('selected');
          }
        });
        
        // 현재 아이템 선택 토글
        this.classList.toggle('selected');
      });
    });

    // 전역 클릭 이벤트로 편집 모드 종료 (중복 방지)
    if (!globalClickEventAdded) {
      document.addEventListener('click', handleGlobalClick);
      globalClickEventAdded = true;
    }
  };

  // 전역 클릭 핸들러
  const handleGlobalClick = (e) => {
    // 키워드 컨테이너 외부 클릭 시 편집 모드 종료
    if (!existingKeywordsContainer.contains(e.target)) {
      cancelAllEditing();
    }
  };

  // 모든 편집 모드 종료
  const cancelAllEditing = () => {
    document.querySelectorAll('.keyword-item.editing').forEach(item => {
      const index = item.dataset.index;
      if (index !== undefined) {
        cancelEdit(parseInt(index));
      }
    });
  };

  // 키워드 조회 함수
  const fetchExistingKeywords = async (serviceName, authKey) => {
    if (!serviceName || !authKey) {
      existingKeywordsContainer.innerHTML = '<p class="no-keywords">서비스와 인증키를 선택해주세요.</p>';
      return;
    }

    showLoadingOverlay(true, '확장 키워드를 조회하는 중');

    try {
      const response = await fetch('/expand/retrieve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          service_name: serviceName, 
          auth: authKey 
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('인증키가 올바르지 않습니다.');
        } else {
          throw new Error(`서버 오류: ${response.status}`);
        }
      }

      const data = await response.json();
      renderExistingKeywords(data.keywords);
      
    } catch (error) {
      existingKeywordsContainer.innerHTML = `<p class="no-keywords error">오류: ${error.message}</p>`;
    } finally {
      showLoadingOverlay(false);
    }
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
    } else if (type === 'service-empty') {
      title = '서비스가 선택되지 않았어요';
      desc = '서비스를 선택해주세요';
    } else if (type === 'keyword-original-empty') {
      title = '원본 키워드가 입력되지 않았어요';
      desc = '원본 키워드를 입력해주세요';
    } else if (type === 'keyword-expanded-empty') {
      title = '확장 키워드가 입력되지 않았어요';
      desc = '확장 키워드를 입력해주세요';
    } else if (type === 'keyword-register-success') {
      title = '키워드가 성공적으로 등록되었습니다';
      desc = '키워드 확장이 정상적으로 등록되었습니다.';
    } else if (type === 'keyword-empty') {
      title = '키워드가 입력되지 않았어요';
      desc = '원본 키워드와 확장 키워드를 모두 입력해주세요.';
    } else if (type === 'keyword-update-error') {
      title = '키워드 수정 중 오류가 발생했어요';
      desc = '다시 시도해주세요. 문제가 지속되면 관리자에게 문의하세요.';
    } else if (type === 'keyword-delete-error') {
      title = '키워드 삭제 중 오류가 발생했어요';
      desc = '다시 시도해주세요. 문제가 지속되면 관리자에게 문의하세요.';
    } else if (type === 'keyword-duplicate') {
      title = '이미 등록된 키워드입니다';
      desc = '다른 키워드를 입력해주세요.';
    } else if (type === 'keyword-register-error') {
      title = '키워드 등록 중 오류가 발생했어요';
      desc = '다시 시도해주세요. 문제가 지속되면 관리자에게 문의하세요.';
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

  // 전역 클릭 이벤트 중복 방지 플래그
  let globalClickEventAdded = false;

  // 검색 실행 함수
  const performSearch = async () => {
    const query = searchInput.value.trim();
    const auth = authInput.value.trim();

    // 에러 표시 초기화
    authInput.classList.remove('error');
    searchInput.classList.remove('error');

    // 입력값 체크 및 모달
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
    const service = keywordServiceSelect.value;

    // 에러 표시 초기화
    keywordServiceSelect.classList.remove('error');
    keywordAuthInput.classList.remove('error');
    originalInput.classList.remove('error');
    expandedInput.classList.remove('error');

    // 입력값 체크 및 모달
    if (!service) {
      keywordServiceSelect.classList.add('error');
      showModal('service-empty');
      return;
    }
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
      const response = await fetch('/expand/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          service_name: service,
          original_keyword: original, 
          expanded_keyword: expanded, 
          auth: auth 
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          keywordAuthInput.classList.add('error');
          showModal('auth-wrong');
          showLoadingOverlay(false);
          return;
        } else {
          const errorData = await response.json().catch(() => null);
          const errorMessage = errorData?.detail || `서버 오류: ${response.status}`;
          if (errorMessage.includes('already exists')) {
            showModal('keyword-duplicate');
          } else {
            throw new Error(errorMessage);
          }
          showLoadingOverlay(false);
          return;
        }
      }

      const data = await response.json();
      
      // 등록 성공 시 성공 모달 표시
      showKeywordSuccessModal(original, expanded);
      
      // 입력 필드 초기화
      originalInput.value = '';
      expandedInput.value = '';
      clearInputError(originalInput);
      clearInputError(expandedInput);
      
    } catch (error) {
      showModal('keyword-register-error');
      console.error('등록 오류:', error);
    } finally {
      showLoadingOverlay(false);
    }
  };

  // 키워드 등록 성공 모달 표시
  const showKeywordSuccessModal = (original, expanded) => {
    const modal = document.getElementById('keyword-success-modal');
    const preview = document.getElementById('keyword-success-preview');
    
    preview.textContent = `${original} ⇄ ${expanded}`;
    modal.classList.add('show');
  };

  // 성공 모달 이벤트 설정
  const successModal = document.getElementById('keyword-success-modal');
  const successCloseBtn = document.getElementById('keyword-success-close');
  
  if (successModal && successCloseBtn) {
    const closeSuccessModal = () => {
      successModal.classList.remove('show');
      // 모달이 닫힌 후 키워드 목록 새로고침
      setTimeout(() => {
        const currentService = keywordServiceSelect.value;
        const currentAuth = keywordAuthInput.value.trim();
        if (currentService && currentAuth) {
          fetchExistingKeywords(currentService, currentAuth);
        }
      }, 300);
    };
    
    successCloseBtn.addEventListener('click', closeSuccessModal);
    
    successModal.addEventListener('click', (e) => {
      if (e.target === successModal) {
        closeSuccessModal();
      }
    });
  }

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

  // 키워드 입력 필드들에 엔터키 이벤트 추가 (readonly/disabled 필드 제외)
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
    
    const selectedService = serviceSelect.value;
    const selectedAuth = authInput.value.trim();
    
    // 서비스와 인증키 검증
    if (!selectedService) {
      serviceSelect.classList.add('error');
      showModal('service-empty');
      return;
    }
    if (!selectedAuth) {
      authInput.classList.add('error');
      showModal('auth-empty');
      return;
    }
    
    console.log('키워드 관리 섹션으로 전환');
    
    // 메인에서 선택한 값들을 키워드 섹션으로 전달
    if (keywordServiceSelect) keywordServiceSelect.value = selectedService;
    if (keywordAuthInput) keywordAuthInput.value = selectedAuth;
    if (originalInput) originalInput.value = '';
    if (expandedInput) expandedInput.value = '';
    
    // 에러 상태 초기화
    clearInputError(keywordServiceSelect);
    clearInputError(keywordAuthInput);
    clearInputError(originalInput);
    clearInputError(expandedInput);
    
    // 서비스명 표시 업데이트
    updateServiceDisplay(selectedService);
    
    // 키워드 조회 실행
    fetchExistingKeywords(selectedService, selectedAuth);
    
    setActiveSection('keyword');
  });

  // 서비스명 표시 업데이트 함수
  const updateServiceDisplay = (serviceName) => {
    const serviceDisplayElement = existingKeywordsContainer.parentElement.querySelector('.guide-title');
    if (serviceDisplayElement) {
      const displayName = serviceName === 'contact' ? 'Contact' : 
                         serviceName === 'pc_app' ? 'PC App' : serviceName;
      serviceDisplayElement.textContent = `${displayName} 서비스의 등록된 키워드`;
    }
  };

  // 키워드 등록 버튼 클릭
  if (registerButton) {
    registerButton.addEventListener('click', performKeywordRegister);
  }

  // 뒤로가기 버튼 (키워드 섹션에서 검색 폼으로)
  if (backToMainButton) {
    backToMainButton.addEventListener('click', () => {
      // 메인 페이지의 서비스와 인증키 초기화하지 않음 (유지)
      setActiveSection('form');
    });
  }

  // 새로 등록하기 버튼 (키워드 결과에서 키워드 폼으로)
  if (resetKeywordButton) {
    resetKeywordButton.addEventListener('click', () => {
      keywordResultContainer.innerHTML = '';
      // 서비스와 인증키는 유지, 키워드 입력만 초기화
      if (originalInput) originalInput.value = '';
      if (expandedInput) expandedInput.value = '';
      clearInputError(originalInput);
      clearInputError(expandedInput);
      
      // 현재 서비스로 키워드 목록 다시 조회
      const currentService = keywordServiceSelect.value;
      const currentAuth = keywordAuthInput.value.trim();
      if (currentService && currentAuth) {
        updateServiceDisplay(currentService);
        fetchExistingKeywords(currentService, currentAuth);
      }
      
      setActiveSection('keyword');
    });
  }

  // 키워드 수정 시작
  window.startEdit = (index) => {
    const item = document.querySelector(`[data-index="${index}"]`);
    if (item) {
      // 다른 편집 중인 아이템들 종료
      cancelAllEditing();
      
      // 선택 상태 해제하고 편집 모드로 전환
      item.classList.remove('selected');
      item.classList.add('editing');
      
      // 첫 번째 입력 필드에 포커스
      const firstInput = item.querySelector('.keyword-edit-input');
      if (firstInput) {
        setTimeout(() => firstInput.focus(), 100);
      }
      
      // 엔터키와 ESC키 이벤트 추가
      const inputs = item.querySelectorAll('.keyword-edit-input');
      inputs.forEach(input => {
        input.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            const originalKeyword = item.dataset.original;
            const expandedKeyword = item.dataset.expanded;
            confirmEdit(index, originalKeyword, expandedKeyword);
          } else if (e.key === 'Escape') {
            cancelEdit(index);
          }
        });
      });
    }
  };

  // 키워드 수정 확인
  window.confirmEdit = async (index, originalKeyword, expandedKeyword) => {
    const originalInput = document.getElementById(`edit-original-${index}`);
    const expandedInput = document.getElementById(`edit-expanded-${index}`);
    
    if (!originalInput || !expandedInput) return;
    
    const newOriginal = originalInput.value.trim();
    const newExpanded = expandedInput.value.trim();
    
    if (newOriginal === '' || newExpanded === '') {
      showModal('keyword-empty');
      return;
    }
    
    // 변경사항이 없으면 편집 모드만 종료
    if (newOriginal === originalKeyword && newExpanded === expandedKeyword) {
      cancelEdit(index);
      return;
    }
    
    try {
      showLoadingOverlay(true, '키워드를 수정하는 중');
      
      const response = await fetch('/expand/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_name: keywordServiceSelect.value,
          original_keyword: originalKeyword,
          expanded_keyword: expandedKeyword,
          new_original: newOriginal,
          new_expanded: newExpanded,
          auth: keywordAuthInput.value.trim()
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          showModal('auth-wrong');
          return;
        }
        throw new Error(`서버 오류: ${response.status}`);
      }

      // 성공 시 키워드 목록 새로고침
      const currentService = keywordServiceSelect.value;
      const currentAuth = keywordAuthInput.value.trim();
      fetchExistingKeywords(currentService, currentAuth);
      
    } catch (error) {
      showModal('keyword-update-error');
      console.error('수정 오류:', error);
    } finally {
      showLoadingOverlay(false);
    }
  };

  // 키워드 수정 취소
  window.cancelEdit = (index) => {
    const item = document.querySelector(`[data-index="${index}"]`);
    if (item) {
      item.classList.remove('editing');
      
      // 원래 값으로 되돌리기
      const originalInput = document.getElementById(`edit-original-${index}`);
      const expandedInput = document.getElementById(`edit-expanded-${index}`);
      const originalValue = item.dataset.original;
      const expandedValue = item.dataset.expanded;
      
      if (originalInput) originalInput.value = originalValue;
      if (expandedInput) expandedInput.value = expandedValue;
    }
  };

  // 삭제 모달 표시
  window.showDeleteModal = (originalKeyword, expandedKeyword, index) => {
    const modal = document.getElementById('keyword-delete-modal');
    const preview = document.getElementById('keyword-delete-preview');
    const confirmBtn = document.getElementById('keyword-delete-confirm');
    
    preview.textContent = `${originalKeyword} ⇄ ${expandedKeyword}`;
    modal.classList.add('show');
    
    // 확인 버튼에 이벤트 설정 (기존 이벤트 제거 후 새로 추가)
    const newConfirmBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
    
    newConfirmBtn.addEventListener('click', () => {
      modal.classList.remove('show');
      deleteKeyword(index, originalKeyword, expandedKeyword);
    });
  };

  // 삭제 모달 이벤트 설정
  const deleteModal = document.getElementById('keyword-delete-modal');
  const deleteCancelBtn = document.getElementById('keyword-delete-cancel');
  
  if (deleteModal && deleteCancelBtn) {
    deleteCancelBtn.addEventListener('click', () => {
      deleteModal.classList.remove('show');
    });
    
    deleteModal.addEventListener('click', (e) => {
      if (e.target === deleteModal) {
        deleteModal.classList.remove('show');
      }
    });
  }

  // 키워드 삭제 함수 (기존 confirm 제거)
  window.deleteKeyword = async (index, originalKeyword, expandedKeyword) => {
    try {
      showLoadingOverlay(true, '키워드를 삭제하는 중');
      
      const response = await fetch('/expand/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_name: keywordServiceSelect.value,
          original_keyword: originalKeyword,
          expanded_keyword: expandedKeyword,
          auth: keywordAuthInput.value.trim()
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          showModal('auth-wrong');
          return;
        }
        throw new Error(`서버 오류: ${response.status}`);
      }

      // 성공 시 애니메이션과 함께 UI에서 제거
      const keywordItem = document.querySelector(`[data-index="${index}"]`);
      if (keywordItem) {
        keywordItem.style.opacity = '0';
        keywordItem.style.transform = 'scale(0.95)';
        
        setTimeout(() => {
          const currentService = keywordServiceSelect.value;
          const currentAuth = keywordAuthInput.value.trim();
          fetchExistingKeywords(currentService, currentAuth);
        }, 300);
      }
      
    } catch (error) {
      showModal('keyword-delete-error');
      console.error('삭제 오류:', error);
    } finally {
      showLoadingOverlay(false);
    }
  };
});