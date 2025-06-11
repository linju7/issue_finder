document.addEventListener('DOMContentLoaded', () => {
  const registerButton = document.getElementById('register-button');
  const backButton = document.getElementById('back-button');
  const resetButton2 = document.getElementById('reset-button2');
  const authInput = document.getElementById('auth-input');
  const originalInput = document.getElementById('original-input');
  const expandedInput = document.getElementById('expanded-input');
  const resultContainer = document.getElementById('result-container');

  let registeredKeywords = [];

  // section 참조
  const formSection = document.querySelector('.form-section');
  const resultsSection = document.querySelector('.results-section');
  const loadingOverlay = document.getElementById('loading-overlay');
  
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
  [authInput, originalInput, expandedInput].forEach(input => {
    input.addEventListener('focus', () => clearInputError(input));
    input.addEventListener('input', () => clearInputError(input));
  });

  // section 전환 함수
  function setActiveSection(active) {
    formSection.style.display = (active === 'form') ? 'flex' : 'none';
    resultsSection.style.display = (active === 'results') ? 'flex' : 'none';
  }

  // 최초 진입 시 등록폼만 중앙에 표시
  setActiveSection('form');

  // 로딩 오버레이
  function showLoadingOverlay(show) {
    loadingOverlay.style.display = show ? 'flex' : 'none';
  }

  // 등록된 키워드 결과 렌더링
  const renderResults = () => {
    if (!registeredKeywords.length) return resultContainer.innerHTML = '';
    
    resultContainer.innerHTML = '';
    registeredKeywords.forEach((keyword, index) => {
      const resultElement = document.createElement('div');
      resultElement.classList.add('result-item', 'result-default');
      resultElement.innerHTML = `
        <div class="result-content">
          <h3 class="result-title">${keyword.original} → ${keyword.expanded}</h3>
        </div>
        <span class="result-similarity sim-high">등록 완료</span>
      `;
      resultContainer.appendChild(resultElement);
    });
  };

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
    } else if (type === 'original-empty') {
      title = '원본 키워드가 입력되지 않았어요';
      desc = '확장할 원본 키워드를 입력해주세요';
    } else if (type === 'expanded-empty') {
      title = '확장 키워드가 입력되지 않았어요';
      desc = '원본 키워드에 대응하는 확장 키워드를 입력해주세요';
    } else if (type === 'register-success') {
      title = '키워드가 등록되었습니다!';
      desc = '키워드 확장이 성공적으로 등록되었습니다.';
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

  // 키워드 등록 실행 함수
  const performRegister = async () => {
    const auth = authInput.value.trim();
    const original = originalInput.value.trim();
    const expanded = expandedInput.value.trim();

    // 에러 표시 초기화
    [authInput, originalInput, expandedInput].forEach(input => {
      input.classList.remove('error');
    });

    // 입력값 체크 및 모달
    if (!auth && !original && !expanded) {
      authInput.classList.add('error');
      originalInput.classList.add('error');
      expandedInput.classList.add('error');
      showModal('auth-empty');
      return;
    }
    if (!auth) {
      authInput.classList.add('error');
      showModal('auth-empty');
      return;
    }
    if (!original) {
      originalInput.classList.add('error');
      showModal('original-empty');
      return;
    }
    if (!expanded) {
      expandedInput.classList.add('error');
      showModal('expanded-empty');
      return;
    }

    showLoadingOverlay(true);

    try {
      // 임시로 성공한 것처럼 처리 (실제 API 연결 시 이 부분 수정)
      await new Promise(resolve => setTimeout(resolve, 1500)); // 1.5초 대기
      
      // 등록된 키워드 추가
      registeredKeywords.push({
        original: original,
        expanded: expanded,
        timestamp: new Date().toLocaleString()
      });
      
      renderResults();
      setActiveSection('results');
      showLoadingOverlay(false);
      showModal('register-success');
      
    } catch (error) {
      showLoadingOverlay(false);
      modalTitle.textContent = '등록 실패';
      modalDesc.textContent = `오류 발생: ${error.message}`;
      modalOverlay.style.display = 'flex';
      document.body.classList.add('modal-open');
    }
  };

  // 등록 버튼 클릭
  registerButton.addEventListener('click', performRegister);

  // 엔터키로 등록 실행
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      performRegister();
    }
  };

  authInput.addEventListener('keydown', handleKeyDown);
  originalInput.addEventListener('keydown', handleKeyDown);
  expandedInput.addEventListener('keydown', handleKeyDown);

  // 뒤로가기 버튼 클릭
  backButton.addEventListener('click', () => {
    window.location.href = '../main/index.html';
  });

  // 새로 등록하기 버튼 클릭
  resetButton2.addEventListener('click', () => {
    originalInput.value = '';
    expandedInput.value = '';
    clearInputError(authInput);
    clearInputError(originalInput);
    clearInputError(expandedInput);
    setActiveSection('form');
    originalInput.focus();
  });
}); 