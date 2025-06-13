import React, { useState } from 'react';
import {
  FormSection,
  FormInner,
  PageGuide,
  GuideTitle,
  GuideDesc,
  InputGroup,
  InputLabel,
  Input,
  SelectWrapper,
  Select,
  SelectArrow,
  Button,
  SearchForm as SearchFormDiv
} from '../../styles/CommonStyles';

const SearchForm = ({ onSearch, onKeywordManage, show }) => {
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
  const [errors, setErrors] = useState({
    service: false,
    auth: false,
    search: false
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // 입력 시 에러 상태 해제
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: false }));
    }
  };

  const handleFocus = (field) => {
    setFocused(prev => ({ ...prev, [field]: true }));
    // 포커스 시 에러 상태 해제
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: false }));
    }
  };

  const handleBlur = (field) => {
    setFocused(prev => ({ ...prev, [field]: false }));
  };

  const handleSubmit = () => {
    const newErrors = {
      service: !formData.service,
      auth: !formData.auth.trim(),
      search: !formData.search.trim()
    };

    setErrors(newErrors);

    if (Object.values(newErrors).some(error => error)) {
      return;
    }

    onSearch(formData);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <FormSection show={show}>
      <FormInner>
        <PageGuide>
          <GuideTitle>이슈를 검색합니다.</GuideTitle>
          <GuideDesc>찾고자 하는 이슈를 설명해주세요.</GuideDesc>
        </PageGuide>

        <InputGroup>
          <SelectWrapper>
            <Select
              value={formData.service}
              onChange={(e) => handleInputChange('service', e.target.value)}
              onFocus={() => handleFocus('service')}
              onBlur={() => handleBlur('service')}
              error={errors.service}
              focused={focused.service}
            >
              <option value="" disabled>서비스를 선택하세요</option>
              <option value="contact">Contact</option>
              <option value="pc_app">PC App</option>
            </Select>
            <InputLabel
              htmlFor="service-select"
              focused={focused.service}
              hasValue={!!formData.service}
              error={errors.service}
            >
              서비스
            </InputLabel>
            <SelectArrow focused={focused.service}>
              <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
                <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </SelectArrow>
          </SelectWrapper>
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
            error={errors.auth}
            focused={focused.auth}
          />
          <InputLabel
            htmlFor="auth-input"
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
            value={formData.search}
            onChange={(e) => handleInputChange('search', e.target.value)}
            onFocus={() => handleFocus('search')}
            onBlur={() => handleBlur('search')}
            onKeyDown={handleKeyDown}
            placeholder=" "
            autoComplete="off"
            error={errors.search}
            focused={focused.search}
          />
          <InputLabel
            htmlFor="search-input"
            focused={focused.search}
            hasValue={!!formData.search}
            error={errors.search}
          >
            검색어
          </InputLabel>
        </InputGroup>

        <SearchFormDiv>
          <Button onClick={handleSubmit} marginBottom="16px">
            검색
          </Button>
          <Button variant="secondary" onClick={onKeywordManage}>
            확장 키워드 등록
          </Button>
        </SearchFormDiv>
      </FormInner>
    </FormSection>
  );
};

export default SearchForm; 