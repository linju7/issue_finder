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
  SelectWrapper,
  Select,
  SelectArrow,
  Button,
  SearchForm as SearchFormDiv
} from '../../styles/CommonStyles';
import KeywordList from './KeywordList';

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

const KeywordManager = ({ show, onBack, initialService, initialAuth }) => {
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
    const newErrors = {
      service: !formData.service,
      auth: !formData.auth.trim(),
      original: !formData.original.trim(),
      expanded: !formData.expanded.trim()
    };

    setErrors(newErrors);

    if (Object.values(newErrors).some(error => error)) {
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
      } else {
        console.error('키워드 등록 실패:', response.status);
      }
    } catch (error) {
      console.error('키워드 등록 오류:', error);
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
      } else {
        console.error('키워드 수정 실패:', response.status);
        return false;
      }
    } catch (error) {
      console.error('키워드 수정 오류:', error);
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
      } else {
        console.error('키워드 삭제 실패:', response.status);
        return false;
      }
    } catch (error) {
      console.error('키워드 삭제 오류:', error);
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
              <SelectWrapper>
                <Select
                  value={formData.service}
                  onChange={(e) => handleInputChange('service', e.target.value)}
                  onFocus={() => handleFocus('service')}
                  onBlur={() => handleBlur('service')}
                  disabled={!!initialService}
                  error={errors.service}
                  focused={focused.service}
                >
                  <option value="" disabled>서비스를 선택하세요</option>
                  <option value="contact">Contact</option>
                  <option value="pc_app">PC App</option>
                </Select>
                <InputLabel
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