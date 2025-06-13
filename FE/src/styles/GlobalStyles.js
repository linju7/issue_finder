import { createGlobalStyle } from 'styled-components';

export const GlobalStyle = createGlobalStyle`
  /* 전체 화면 스타일 */
  body {
    font-family: 'Pretendard', sans-serif;
    margin: 0;
    padding: 0;
    background-color: #f4f4f9;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    overflow-x: hidden;
  }

  * {
    box-sizing: border-box;
  }

  button {
    font-family: 'Pretendard', 'Inter', sans-serif;
  }

  input, select {
    font-family: 'Pretendard', 'Inter', sans-serif;
  }

  /* 모달 열린 상태 스타일 */
  body.modal-open .form-section,
  body.modal-open .results-section,
  body.modal-open .keyword-section,
  body.modal-open .keyword-results-section {
    filter: blur(2px);
    pointer-events: none;
  }

  body.modal-open .modal-overlay {
    display: flex !important;
  }

  /* 로딩 애니메이션 */
  @keyframes bounce {
    0%, 80%, 100% { transform: translateY(0); }
    40% { transform: translateY(-10px); }
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes popIn {
    from { opacity: 0; transform: scale(0.8); }
    to { opacity: 1; transform: scale(1); }
  }

  @keyframes shake {
    0%, 50%, 100% { transform: translateX(0); }
    12.5%, 37.5% { transform: translateX(-5px); }
    25%, 62.5% { transform: translateX(5px); }
  }

  .error {
    animation: shake 0.25s linear 2;
  }
`; 