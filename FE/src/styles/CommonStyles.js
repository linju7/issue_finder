import styled from 'styled-components';

// 컨테이너 스타일
export const Container = styled.div`
  min-height: 100vh;
  width: 100vw;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #f4f4f9;
  box-shadow: none;
  border-radius: 0;
  padding: 0;
  margin: 0;
  text-align: center;
`;

// 섹션 공통 스타일
export const Section = styled.div`
  width: 100%;
  max-width: ${props => props.maxWidth || '720px'};
  min-width: 340px;
  min-height: 420px;
  box-sizing: border-box;
  display: ${props => props.show ? 'flex' : 'none'};
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  background: #fff;
  border-radius: 22px;
  box-shadow: 0 8px 32px 0 rgba(49,130,246,0.13), 0 1.5px 6px 0 rgba(49,130,246,0.06);
  margin: 40px auto 40px auto;
  padding: ${props => props.padding || '48px 40px 40px 40px'};
  transition: box-shadow 0.2s, max-width 0.2s, padding 0.2s;
`;

// 폼 섹션
export const FormSection = styled(Section)`
  max-width: 420px !important;
  width: 100%;
  padding: 48px 32px 40px 32px !important;
  margin: 40px auto 40px auto;
`;

// 결과 섹션
export const ResultsSection = styled(Section)`
  max-width: 720px !important;
  width: 100%;
  padding: 48px 48px 40px 48px !important;
  margin: 40px auto 40px auto;
  display: ${props => props.show ? 'flex' : 'none'};
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
`;

// 키워드 섹션
export const KeywordSection = styled(Section)`
  max-width: 1200px !important;
  width: 100%;
  padding: 32px !important;
  margin: 40px auto 40px auto;
`;

// 폼 내부 스타일
export const FormInner = styled.div`
  width: 100%;
  max-width: ${props => props.maxWidth || '340px'};
  margin: 0 auto;
  padding: 0;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: center;
  gap: 28px;
`;

// 결과 내부 스타일
export const ResultsInner = styled.div`
  max-width: 100%;
  width: 100%;
  padding: 0;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: flex-start;
  height: 100%;
`;

// 페이지 가이드
export const PageGuide = styled.div`
  text-align: center;
  margin-bottom: 32px;

  @media (max-width: 600px) {
    margin-bottom: 24px;
  }
`;

export const GuideTitle = styled.div`
  font-size: 24px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
  letter-spacing: -0.5px;

  @media (max-width: 600px) {
    font-size: 20px;
  }
`;

export const GuideDesc = styled.div`
  font-size: 16px;
  color: #666;
  line-height: 1.5;

  @media (max-width: 600px) {
    font-size: 14px;
  }
`;

// 입력 그룹
export const InputGroup = styled.div`
  position: relative;
  margin-bottom: 28px;
`;

// 입력 라벨
export const InputLabel = styled.label`
  position: absolute;
  left: 0;
  top: ${props => props.focused || props.hasValue ? '-2px' : '16px'};
  font-size: ${props => props.focused || props.hasValue ? '13px' : '15px'};
  color: ${props => props.error ? '#ff4d4f' : props.focused || props.hasValue ? '#2575fc' : '#bdbdbd'};
  pointer-events: none;
  transition: all 0.25s cubic-bezier(.68,-0.55,.27,1.55);
  font-weight: ${props => props.focused || props.hasValue ? '600' : '500'};
  letter-spacing: -0.5px;
  font-family: 'Pretendard', 'Inter', sans-serif !important;
`;

// 기본 입력 필드
export const Input = styled.input`
  width: 100%;
  border: none;
  border-bottom: 2.5px solid ${props => props.error ? '#ff4d4f' : props.focused ? '#2575fc' : '#e0e0e0'};
  border-radius: 0 !important;
  background: transparent !important;
  font-size: 22px !important;
  font-family: 'Pretendard', 'Inter', sans-serif !important;
  font-weight: 600 !important;
  color: #222 !important;
  letter-spacing: 0.5px;
  padding: 16px 0 8px 0 !important;
  outline: none !important;
  transition: border-color 0.3s, box-shadow 0.3s;
  box-shadow: none !important;
  appearance: none;
  caret-color: #2575fc;
  
  &::placeholder {
    color: transparent !important;
  }

  &:-webkit-autofill {
    -webkit-box-shadow: 0 0 0 1000px #fff inset !important;
    -webkit-text-fill-color: #222 !important;
    font-family: 'Pretendard', 'Inter', sans-serif !important;
    font-size: 22px !important;
    font-weight: 600 !important;
  }

  &.error {
    border-bottom: 2.5px solid #ff4d4f !important;
    animation: shake 0.25s linear 2;
  }
`;

// 선택 박스 래퍼
export const SelectWrapper = styled.div`
  position: relative;
  width: 100%;
`;

// 선택 박스
export const Select = styled.select`
  width: 100%;
  border: none;
  border-bottom: 2.5px solid ${props => props.error ? '#ff4d4f' : props.focused ? '#2575fc' : '#e0e0e0'};
  border-radius: 0 !important;
  background: transparent !important;
  font-size: 18px !important;
  font-family: 'Pretendard', 'Inter', sans-serif !important;
  font-weight: 600 !important;
  color: #222 !important;
  letter-spacing: 0.5px;
  padding: 16px 30px 8px 0 !important;
  outline: none !important;
  transition: border-color 0.3s, box-shadow 0.3s;
  box-shadow: none !important;
  appearance: none;
  cursor: pointer;

  option {
    font-family: 'Pretendard', 'Inter', sans-serif;
    font-size: 14px;
    font-weight: 500;
    color: #222;
    background: #fff;
    padding: 12px 16px;
  }

  &.error {
    border-bottom: 2.5px solid #ff4d4f !important;
    animation: shake 0.25s linear 2;
  }

  &:disabled {
    color: #bdbdbd;
    cursor: not-allowed;
  }
`;

// 선택 박스 화살표
export const SelectArrow = styled.div`
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%) ${props => props.focused ? 'rotate(180deg)' : ''};
  pointer-events: none;
  color: ${props => props.focused ? '#2575fc' : '#bdbdbd'};
  transition: color 0.3s, transform 0.3s;

  svg {
    width: 12px;
    height: 8px;
  }
`;

// 버튼 스타일
export const Button = styled.button`
  width: 100%;
  padding: 16px 24px;
  background: ${props => props.variant === 'secondary' ? '#f8f9fa' : '#2575fc'};
  color: ${props => props.variant === 'secondary' ? '#333' : '#fff'};
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  font-family: 'Pretendard', 'Inter', sans-serif;
  cursor: pointer;
  transition: all 0.2s;
  letter-spacing: -0.5px;
  margin-bottom: ${props => props.marginBottom || '0'};

  &:hover {
    background: ${props => props.variant === 'secondary' ? '#e9ecef' : '#1e5ffc'};
    transform: translateY(-1px);
  }

  &:disabled {
    background: #f5f5f5;
    color: #bdbdbd;
    cursor: not-allowed;
    transform: none;
  }
`;

// 검색 폼 스타일
export const SearchForm = styled.div`
  display: block;
  width: 100%;
  margin: 0;
  padding: 0;
`; 