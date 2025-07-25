import React, { useState } from 'react';
import { GlobalStyle } from './styles/GlobalStyles';
import { Container } from './styles/CommonStyles';
import SearchForm from './components/SearchForm/SearchForm';
import ResultsList from './components/ResultsList/ResultsList';
import KeywordManager from './components/KeywordManager/KeywordManager';
import LoadingOverlay from './components/LoadingOverlay/LoadingOverlay';
import Modal from './components/Modal/Modal';

const MODAL_TYPES = {
  'auth-empty': {
    title: '인증키가 입력되지 않았어요.',
    description: '인증키는 반드시 입력해야합니다. 입력하여 다시 시도해주세요.'
  },
  'auth-wrong': {
    title: '인증키가 올바르지 않아요.',
    description: '인증키를 다시 입력하여 시도해주세요.'
  },
  'search-empty': {
    title: '검색어가 입력되지 않았어요',
    description: '검색어에 찾고자 하는 이슈를 설명해주세요'
  },
  'service-empty': {
    title: '서비스가 선택되지 않았어요',
    description: '서비스를 선택해주세요'
  },
  'keyword-original-empty': {
    title: '원본 키워드가 입력되지 않았어요',
    description: '원본 키워드를 입력해주세요'
  },
  'keyword-expanded-empty': {
    title: '확장 키워드가 입력되지 않았어요',
    description: '확장 키워드를 입력해주세요'
  },
  'keyword-register-success': {
    title: '키워드가 성공적으로 등록되었습니다',
    description: '키워드 확장이 정상적으로 등록되었습니다.'
  },
  'keyword-empty': {
    title: '키워드가 입력되지 않았어요',
    description: '원본 키워드와 확장 키워드를 모두 입력해주세요.'
  },
  'keyword-update-error': {
    title: '키워드 수정 중 오류가 발생했어요',
    description: '다시 시도해주세요. 문제가 지속되면 관리자에게 문의하세요.'
  },
  'keyword-delete-error': {
    title: '키워드 삭제 중 오류가 발생했어요',
    description: '다시 시도해주세요. 문제가 지속되면 관리자에게 문의하세요.'
  },
  'keyword-duplicate': {
    title: '이미 등록된 키워드입니다',
    description: '다른 키워드를 입력해주세요.'
  },
  'keyword-register-error': {
    title: '키워드 등록 중 오류가 발생했어요',
    description: '다시 시도해주세요. 문제가 지속되면 관리자에게 문의하세요.'
  }
};

const App = () => {
  const [currentView, setCurrentView] = useState('search'); // 'search', 'results', 'keyword'
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('이슈를 찾는 중');
  const [results, setResults] = useState([]);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [modal, setModal] = useState({ show: false, type: '', title: '', description: '' });
  const [searchData, setSearchData] = useState({ service: '', auth: '', search: '' });
  const [searchFormErrors, setSearchFormErrors] = useState({ service: false, auth: false, search: false });

  const showModal = (type) => {
    const modalData = MODAL_TYPES[type];
    if (modalData) {
      setModal({
        show: true,
        type,
        title: modalData.title,
        description: modalData.description
      });
    }
  };

  const closeModal = () => {
    // 에러 모달이 아닐 때만 에러 상태 초기화
    const errorModalTypes = ['auth-empty', 'auth-wrong', 'search-empty', 'service-empty'];
    if (!modal.type || !errorModalTypes.includes(modal.type)) {
      setSearchFormErrors({ service: false, auth: false, search: false });
    }
    setModal({ show: false, type: '', title: '', description: '' });
  };

  const clearSearchFormError = (field) => {
    setSearchFormErrors(prev => ({ ...prev, [field]: false }));
  };

  const performSearch = async (formData) => {
    setLoadingMessage('이슈를 찾는 중');
    setLoading(true);
    setResultsLoading(true);

    try {
      const response = await fetch('/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          target: formData.search, 
          auth: formData.auth 
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          setSearchFormErrors({ service: false, auth: true, search: false });
          showModal('auth-wrong');
          return;
        } else {
          throw new Error(`Error: ${response.status}`);
        }
      }

      const data = await response.json();
      setResults(data.results || []);
      setSearchData(formData);
      setCurrentView('results');
      
    } catch (error) {
      console.error('검색 오류:', error);
      setResults([]);
      setCurrentView('results');
    } finally {
      setLoading(false);
      setResultsLoading(false);
    }
  };

  const handleKeywordManage = async (formData) => {
    // 서비스와 인증키 검증
    if (!formData.service) {
      setSearchFormErrors({ service: true, auth: false, search: false });
      showModal('service-empty');
      return;
    }
    
    if (!formData.auth || !formData.auth.trim()) {
      setSearchFormErrors({ service: false, auth: true, search: false });
      showModal('auth-empty');
      return;
    }
    
    // 로딩 시작
    setLoadingMessage('인증키를 확인하는 중');
    setLoading(true);
    
    try {
      // 인증키 검증을 위한 API 호출
      const response = await fetch('/expand/retrieve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          service_name: formData.service, 
          auth: formData.auth 
        }),
      });

      if (response.ok) {
        // 검증 통과 시 키워드 관리 화면으로 이동
        setSearchData(formData);
        setCurrentView('keyword');
      } else if (response.status === 401) {
        setSearchFormErrors({ service: false, auth: true, search: false });
        showModal('auth-wrong');
      } else {
        setSearchFormErrors({ service: false, auth: true, search: false });
        showModal('auth-wrong');
      }
    } catch (error) {
      console.error('인증키 검증 오류:', error);
      showModal('auth-wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToSearch = () => {
    setCurrentView('search');
  };

  const handleResetSearch = () => {
    setCurrentView('search');
    setResults([]);
  };

  return (
    <>
      <GlobalStyle />
      <Container>
        <SearchForm 
          show={currentView === 'search'}
          onSearch={performSearch}
          onKeywordManage={handleKeywordManage}
          showModal={showModal}
          externalErrors={searchFormErrors}
          clearExternalError={clearSearchFormError}
        />
        
        <ResultsList 
          show={currentView === 'results'}
          results={results}
          loading={resultsLoading}
          onReset={handleResetSearch}
        />
        
        <KeywordManager 
          show={currentView === 'keyword'}
          onBack={handleBackToSearch}
          initialService={searchData.service}
          initialAuth={searchData.auth}
          showModal={showModal}
        />
      </Container>

      <LoadingOverlay 
        show={loading}
        message={loadingMessage}
      />

      <Modal
        show={modal.show}
        title={modal.title}
        description={modal.description}
        onClose={closeModal}
        type={modal.type}
      />
    </>
  );
};

export default App; 