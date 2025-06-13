import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import {
  FormSection,
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

const SearchForm = ({ onSearch, onKeywordManage, show, showModal, externalErrors, clearExternalError }) => {
  const [formData, setFormData] = useState({
    service: '',
    auth: '',
    search: ''
  });
  const [focused, setFocused] = useState({
    service: false,
    auth: false,
    search: false
  });
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [errors, setErrors] = useState({
    service: false,
    auth: false,
    search: false
  });

  // 외부 에러와 내부 에러 합치기
  const combinedErrors = {
    service: errors.service || (externalErrors?.service || false),
    auth: errors.auth || (externalErrors?.auth || false),
    search: errors.search || (externalErrors?.search || false)
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // 입력 시 내부 에러 상태 해제
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: false }));
    }
    // 외부 에러가 있을 때도 해제 (사용자가 실제로 값을 변경하고 있음)
    if (externalErrors?.[field]) {
      clearExternalError(field);
    }
  };

  const handleFocus = (field) => {
    setFocused(prev => ({ ...prev, [field]: true }));
    // 포커스 시 에러 상태 해제
    if (combinedErrors[field]) {
      setErrors(prev => ({ ...prev, [field]: false }));
    }
  };

  const handleBlur = (field) => {
    setFocused(prev => ({ ...prev, [field]: false }));
  };

  const handleSubmit = () => {
    // 폼 검증 및 모달 표시
    const newErrors = {
      service: !formData.service,
      auth: !formData.auth.trim(),
      search: !formData.search.trim()
    };

    setErrors(newErrors);

    if (!formData.service) {
      showModal('service-empty');
      return;
    }
    
    if (!formData.auth || !formData.auth.trim()) {
      showModal('auth-empty');
      return;
    }
    
    if (!formData.search || !formData.search.trim()) {
      showModal('search-empty');
      return;
    }

    onSearch(formData);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  const handleDropdownToggle = () => {
    setDropdownOpen(!dropdownOpen);
    setFocused(prev => ({ ...prev, service: !dropdownOpen }));
  };

  const handleOptionSelect = (value) => {
    handleInputChange('service', value);
    setDropdownOpen(false);
    setFocused(prev => ({ ...prev, service: false }));
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
    <FormSection show={show}>
      <FormInner>
        <PageGuide>
          <GuideTitle>이슈를 검색합니다.</GuideTitle>
          <GuideDesc>찾고자 하는 이슈를 설명해주세요.</GuideDesc>
        </PageGuide>

        <InputGroup>
          <CustomSelectWrapper className="custom-select-wrapper">
            <CustomSelectButton
              type="button"
              onClick={handleDropdownToggle}
              error={combinedErrors.service}
              focused={focused.service}
              hasValue={!!formData.service}
              className={combinedErrors.service ? 'error' : ''}
            >
              <CustomSelectText>
                {getServiceLabel(formData.service)}
              </CustomSelectText>
              <CustomSelectArrow focused={focused.service} isOpen={dropdownOpen}>
                <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
                  <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </CustomSelectArrow>
            </CustomSelectButton>
            <CustomSelectDropdown isOpen={dropdownOpen}>
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
            onKeyDown={handleKeyDown}
            placeholder=" "
            autoComplete="off"
            error={combinedErrors.auth}
            focused={focused.auth}
          />
          <InputLabel
            htmlFor="auth-input"
            focused={focused.auth}
            hasValue={!!formData.auth}
            error={combinedErrors.auth}
          >
            인증 키
          </InputLabel>
        </InputGroup>

        <InputGroup>
          <Input
            type="text"
            value={formData.search}
            onChange={(e) => handleInputChange('search', e.target.value)}
            onFocus={() => handleFocus('search')}
            onBlur={() => handleBlur('search')}
            onKeyDown={handleKeyDown}
            placeholder=" "
            autoComplete="off"
            error={combinedErrors.search}
            focused={focused.search}
          />
          <InputLabel
            htmlFor="search-input"
            focused={focused.search}
            hasValue={!!formData.search}
            error={combinedErrors.search}
          >
            검색어
          </InputLabel>
        </InputGroup>

        <SearchFormDiv>
          <Button onClick={handleSubmit} marginBottom="16px">
            검색
          </Button>
          <Button variant="secondary" onClick={() => onKeywordManage(formData)}>
            확장 키워드 등록
          </Button>
        </SearchFormDiv>
      </FormInner>
    </FormSection>
  );
};

export default SearchForm; 