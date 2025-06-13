import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.6);
  display: ${props => props.show ? 'flex' : 'none'};
  justify-content: center;
  align-items: center;
  z-index: 10000;
  animation: ${props => props.show ? 'fadeIn 0.3s' : 'none'};
`;

const ModalBox = styled.div`
  background: #fff;
  border-radius: 20px;
  padding: 32px;
  max-width: 480px;
  width: 90%;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: ${props => props.show ? 'popIn 0.3s cubic-bezier(0.68, -0.55, 0.27, 1.55)' : 'none'};
`;

const ModalTitle = styled.div`
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin-bottom: 24px;
  line-height: 1.4;
  font-family: 'Pretendard', 'Inter', sans-serif;
`;

const InputGroup = styled.div`
  margin-bottom: 20px;
  text-align: left;
`;

const InputLabel = styled.label`
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
  font-family: 'Pretendard', 'Inter', sans-serif;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 500;
  color: #333;
  outline: none;
  transition: border-color 0.3s, box-shadow 0.3s;
  font-family: 'Pretendard', 'Inter', sans-serif;
  box-sizing: border-box;

  &:focus {
    border-color: #3182f6;
    box-shadow: 0 0 0 3px rgba(49, 130, 246, 0.1);
  }

  &::placeholder {
    color: #bdbdbd;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 24px;
  justify-content: center;
`;

const Button = styled.button`
  background: ${props => props.variant === 'secondary' ? '#f8f9fa' : '#3182f6'};
  color: ${props => props.variant === 'secondary' ? '#333' : '#fff'};
  border: none;
  border-radius: 12px;
  padding: 12px 24px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 80px;
  font-family: 'Pretendard', 'Inter', sans-serif;

  &:hover {
    background: ${props => props.variant === 'secondary' ? '#e9ecef' : '#2563eb'};
    transform: translateY(-1px);
  }

  &:disabled {
    background: #f5f5f5;
    color: #bdbdbd;
    cursor: not-allowed;
    transform: none;
  }
`;

const EditKeywordModal = ({ show, keyword, onClose, onSave, loading }) => {
  const [formData, setFormData] = useState({
    original: '',
    expanded: ''
  });

  useEffect(() => {
    if (show && keyword) {
      setFormData({
        original: keyword.original || '',
        expanded: keyword.expanded || ''
      });
    }
  }, [show, keyword]);

  useEffect(() => {
    if (show) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }

    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [show]);

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.original.trim() && formData.expanded.trim()) {
      onSave(formData.original.trim(), formData.expanded.trim());
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!show) return null;

  return (
    <ModalOverlay show={show} onClick={handleOverlayClick}>
      <ModalBox show={show}>
        <ModalTitle>키워드 수정</ModalTitle>
        <form onSubmit={handleSubmit}>
          <InputGroup>
            <InputLabel>원본 키워드</InputLabel>
            <Input
              type="text"
              value={formData.original}
              onChange={(e) => setFormData(prev => ({ ...prev, original: e.target.value }))}
              onKeyDown={handleKeyDown}
              placeholder="원본 키워드를 입력하세요"
              disabled={loading}
            />
          </InputGroup>
          
          <InputGroup>
            <InputLabel>확장 키워드</InputLabel>
            <Input
              type="text"
              value={formData.expanded}
              onChange={(e) => setFormData(prev => ({ ...prev, expanded: e.target.value }))}
              onKeyDown={handleKeyDown}
              placeholder="확장 키워드를 입력하세요"
              disabled={loading}
            />
          </InputGroup>

          <ButtonGroup>
            <Button 
              type="submit" 
              disabled={loading || !formData.original.trim() || !formData.expanded.trim()}
            >
              {loading ? '수정 중...' : '수정'}
            </Button>
            <Button variant="secondary" type="button" onClick={onClose} disabled={loading}>
              취소
            </Button>
          </ButtonGroup>
        </form>
      </ModalBox>
    </ModalOverlay>
  );
};

export default EditKeywordModal; 