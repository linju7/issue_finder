import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import {
  KeywordSection,
  FormInner,
  PageGuide,
  GuideTitle,
  GuideDesc,
  InputGroup,
  InputLabel,
  Input,
  Button,
  SearchForm as SearchFormDiv
} from '../../styles/CommonStyles';
import KeywordList from './KeywordList';

const CustomSelectWrapper = styled.div`
  position: relative;
  width: 100%;
`;

const CustomSelectButton = styled.button`
  width: 100%;
  border: none;
  border-bottom: 2.5px solid ${props => props.error ? '#ff4d4f' : props.focused ? '#2575fc' : '#e0e0e0'};
  border-radius: 0;
  background: transparent;
  font-size: 22px;
  font-family: 'Pretendard', 'Inter', sans-serif;
  font-weight: 600;
  color: ${props => props.hasValue ? '#222' : '#bdbdbd'};
  letter-spacing: 0.5px;
  padding: 16px 0 8px 0;
  outline: none;
  transition: border-color 0.3s, box-shadow 0.3s, color 0.3s;
  cursor: pointer;
  text-align: left;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;

  &.error {
    border-bottom: 2.5px solid #ff4d4f;
    animation: shake 0.25s linear 2;
  }

  &:disabled {
    color: #bdbdbd;
    cursor: not-allowed;
    opacity: 0.6;
  }
`;

const CustomSelectText = styled.span`
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding-right: 8px;
  color: inherit;
`;

const CustomSelectArrow = styled.div`
  color: ${props => props.focused ? '#2575fc' : '#bdbdbd'};
  transition: color 0.3s, transform 0.3s;
  transform: ${props => props.isOpen ? 'rotate(180deg)' : 'rotate(0deg)'};
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;

  svg {
    width: 12px;
    height: 8px;
  }
`;

const CustomSelectDropdown = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  margin-top: 4px;
  opacity: ${props => props.isOpen ? 1 : 0};
  visibility: ${props => props.isOpen ? 'visible' : 'hidden'};
  transform: ${props => props.isOpen ? 'translateY(0)' : 'translateY(-10px)'};
  transition: all 0.2s ease;
`;

const CustomSelectOption = styled.div`
  padding: 12px 16px;
  font-size: 18px;
  font-weight: 600;
  color: #333;
  cursor: pointer;
  transition: background-color 0.2s;
  font-family: 'Pretendard', 'Inter', sans-serif;

  &:hover {
    background-color: #f8faff;
    color: #3182f6;
  }

  &:first-child {
    border-radius: 12px 12px 0 0;
  }

  &:last-child {
    border-radius: 0 0 12px 12px;
  }

  &:only-child {
    border-radius: 12px;
  }
`;

const KeywordLayout = styled.div`
  display: flex;
  gap: 32px;
  width: 100%;
  align-items: flex-start;

  @media (max-width: 900px) {
    flex-direction: column;
    gap: 24px;
  }
`;

const KeywordLeft = styled.div`
  flex: 1;
  min-width: 400px;
  background: #f8faff;
  border-radius: 16px;
  padding: 24px;
  border: 1px solid #e8f3ff;

  @media (max-width: 900px) {
    min-width: auto;
    width: 100%;
  }
`;

const KeywordRight = styled.div`
  flex: 1;
  min-width: 400px;

  @media (max-width: 900px) {
    min-width: auto;
    width: 100%;
  }
`;

const KeywordManager = ({ show, onBack, initialService, initialAuth, showModal }) => {
  const [formData, setFormData] = useState({
    service: initialService || '',
    auth: initialAuth || '',
    original: '',
    expanded: ''
  });
  const [focused, setFocused] = useState({
    service: false,
    auth: false,
    original: false,
    expanded: false
  });
  const [errors, setErrors] = useState({
    service: false,
    auth: false,
    original: false,
    expanded: false
  });
  const [keywords, setKeywords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // 초기 데이터 설정
  useEffect(() => {
    if (initialService && initialAuth) {
      setFormData(prev => ({
        ...prev,
        service: initialService,
        auth: initialAuth
      }));
      fetchKeywords(initialService, initialAuth);
    }
  }, [initialService, initialAuth]);

  const fetchKeywords = async (serviceName, authKey) => {
    if (!serviceName || !authKey) return;

    setLoading(true);
    try {
      const response = await fetch('/expand/retrieve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          service_name: serviceName, 
          auth: authKey 
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setKeywords(data.keywords || []);
      } else {
        console.error('키워드 조회 실패:', response.status);
        setKeywords([]);
      }
    } catch (error) {
      console.error('키워드 조회 오류:', error);
      setKeywords([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: false }));
    }
  };

  const handleFocus = (field) => {
    setFocused(prev => ({ ...prev, [field]: true }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: false }));
    }
  };

  const handleBlur = (field) => {
    setFocused(prev => ({ ...prev, [field]: false }));
  };

  const handleRegister = async () => {
    // 입력값 검증 및 모달 표시
    if (!formData.service) {
      showModal('service-empty');
      return;
    }
    
    if (!formData.auth || !formData.auth.trim()) {
      showModal('auth-empty');
      return;
    }
    
    if (!formData.original || !formData.original.trim()) {
      showModal('keyword-original-empty');
      return;
    }
    
    if (!formData.expanded || !formData.expanded.trim()) {
      showModal('keyword-expanded-empty');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/expand/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          service_name: formData.service,
          original_keyword: formData.original, 
          expanded_keyword: formData.expanded, 
          auth: formData.auth 
        }),
      });

      if (response.ok) {
        // 성공 시 폼 초기화 및 키워드 목록 새로고침
        setFormData(prev => ({
          ...prev,
          original: '',
          expanded: ''
        }));
        await fetchKeywords(formData.service, formData.auth);
        showModal('keyword-register-success');
      } else if (response.status === 401) {
        showModal('auth-wrong');
      } else if (response.status === 409) {
        showModal('keyword-duplicate');
      } else {
        showModal('keyword-register-error');
      }
    } catch (error) {
      console.error('키워드 등록 오류:', error);
      showModal('keyword-register-error');
    } finally {
      setLoading(false);
    }
  };

  const handleKeywordUpdate = async (originalKeyword, expandedKeyword, newOriginal, newExpanded) => {
    setLoading(true);
    try {
      const response = await fetch('/expand/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          service_name: formData.service,
          original_keyword: originalKeyword,
          expanded_keyword: expandedKeyword,
          new_original: newOriginal,
          new_expanded: newExpanded,
          auth: formData.auth 
        }),
      });

      if (response.ok) {
        await fetchKeywords(formData.service, formData.auth);
        return true;
      } else if (response.status === 401) {
        showModal('auth-wrong');
        return false;
      } else {
        showModal('keyword-update-error');
        return false;
      }
    } catch (error) {
      console.error('키워드 수정 오류:', error);
      showModal('keyword-update-error');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleKeywordDelete = async (originalKeyword, expandedKeyword) => {
    setLoading(true);
    try {
      const response = await fetch('/expand/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          service_name: formData.service,
          original_keyword: originalKeyword,
          expanded_keyword: expandedKeyword,
          auth: formData.auth 
        }),
      });

      if (response.ok) {
        await fetchKeywords(formData.service, formData.auth);
        return true;
      } else if (response.status === 401) {
        showModal('auth-wrong');
        return false;
      } else {
        showModal('keyword-delete-error');
        return false;
      }
    } catch (error) {
      console.error('키워드 삭제 오류:', error);
      showModal('keyword-delete-error');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleRegister();
    }
  };

  const handleDropdownToggle = () => {
    if (!initialService) {
      setDropdownOpen(!dropdownOpen);
      setFocused(prev => ({ ...prev, service: !dropdownOpen }));
    }
  };

  const handleOptionSelect = (value) => {
    if (!initialService) {
      handleInputChange('service', value);
      setDropdownOpen(false);
      setFocused(prev => ({ ...prev, service: false }));
    }
  };

  const getServiceLabel = (value) => {
    switch (value) {
      case 'contact': return 'Contact';
      case 'pc_app': return 'PC App';
      default: return '서비스를 선택하세요';
    }
  };

  // 드랍다운 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownOpen && !event.target.closest('.custom-select-wrapper')) {
        setDropdownOpen(false);
        setFocused(prev => ({ ...prev, service: false }));
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  return (
    <KeywordSection show={show}>
      <KeywordLayout>
        <KeywordLeft>
          <PageGuide>
            <GuideTitle>등록된 키워드</GuideTitle>
            <GuideDesc>현재 서비스의 확장 키워드 목록입니다.</GuideDesc>
          </PageGuide>
          <KeywordList 
            keywords={keywords}
            loading={loading}
            onUpdate={handleKeywordUpdate}
            onDelete={handleKeywordDelete}
          />
        </KeywordLeft>

        <KeywordRight>
          <FormInner maxWidth="none">
            <PageGuide>
              <GuideTitle>키워드 확장을 등록합니다.</GuideTitle>
              <GuideDesc>원본 키워드와 확장할 키워드들을 입력해주세요.</GuideDesc>
            </PageGuide>

            <InputGroup>
              <CustomSelectWrapper className="custom-select-wrapper">
                <CustomSelectButton
                  type="button"
                  onClick={handleDropdownToggle}
                  disabled={!!initialService}
                  error={errors.service}
                  focused={focused.service}
                  hasValue={!!formData.service}
                  className={errors.service ? 'error' : ''}
                >
                  <CustomSelectText>
                    {getServiceLabel(formData.service)}
                  </CustomSelectText>
                  <CustomSelectArrow focused={focused.service} isOpen={dropdownOpen && !initialService}>
                    <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
                      <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </CustomSelectArrow>
                </CustomSelectButton>
                <InputLabel
                  focused={focused.service}
                  hasValue={focused.service || !!formData.service}
                  error={errors.service}
                >
                  서비스
                </InputLabel>
                <CustomSelectDropdown isOpen={dropdownOpen && !initialService}>
                  <CustomSelectOption onClick={() => handleOptionSelect('contact')}>
                    Contact
                  </CustomSelectOption>
                  <CustomSelectOption onClick={() => handleOptionSelect('pc_app')}>
                    PC App
                  </CustomSelectOption>
                </CustomSelectDropdown>
              </CustomSelectWrapper>
            </InputGroup>

            <InputGroup>
              <Input
                type="text"
                value={formData.auth}
                onChange={(e) => handleInputChange('auth', e.target.value)}
                onFocus={() => handleFocus('auth')}
                onBlur={() => handleBlur('auth')}
                placeholder=" "
                autoComplete="off"
                readOnly={!!initialAuth}
                error={errors.auth}
                focused={focused.auth}
              />
              <InputLabel
                focused={focused.auth}
                hasValue={!!formData.auth}
                error={errors.auth}
              >
                인증 키
              </InputLabel>
            </InputGroup>

            <InputGroup>
              <Input
                type="text"
                value={formData.original}
                onChange={(e) => handleInputChange('original', e.target.value)}
                onFocus={() => handleFocus('original')}
                onBlur={() => handleBlur('original')}
                onKeyDown={handleKeyDown}
                placeholder=" "
                autoComplete="off"
                error={errors.original}
                focused={focused.original}
              />
              <InputLabel
                focused={focused.original}
                hasValue={!!formData.original}
                error={errors.original}
              >
                원본 키워드
              </InputLabel>
            </InputGroup>

            <InputGroup>
              <Input
                type="text"
                value={formData.expanded}
                onChange={(e) => handleInputChange('expanded', e.target.value)}
                onFocus={() => handleFocus('expanded')}
                onBlur={() => handleBlur('expanded')}
                onKeyDown={handleKeyDown}
                placeholder=" "
                autoComplete="off"
                error={errors.expanded}
                focused={focused.expanded}
              />
              <InputLabel
                focused={focused.expanded}
                hasValue={!!formData.expanded}
                error={errors.expanded}
              >
                확장 키워드
              </InputLabel>
            </InputGroup>

            <SearchFormDiv>
              <Button onClick={handleRegister} marginBottom="16px" disabled={loading}>
                키워드 등록
              </Button>
              <Button variant="secondary" onClick={onBack}>
                뒤로가기
              </Button>
            </SearchFormDiv>
          </FormInner>
        </KeywordRight>
      </KeywordLayout>
    </KeywordSection>
  );
};

export default KeywordManager; 