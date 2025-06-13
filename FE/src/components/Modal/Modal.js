import React, { useEffect } from 'react';
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
  max-width: 400px;
  width: 90%;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: ${props => props.show ? 'popIn 0.3s cubic-bezier(0.68, -0.55, 0.27, 1.55)' : 'none'};
`;

const ModalTitle = styled.div`
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
  line-height: 1.4;
  font-family: 'Pretendard', 'Inter', sans-serif;
`;

const ModalDesc = styled.div`
  font-size: 16px;
  color: #666;
  line-height: 1.5;
  margin-bottom: 24px;
  font-family: 'Pretendard', 'Inter', sans-serif;
`;

const ModalClose = styled.button`
  background: #3182f6;
  color: #fff;
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
    background: #2563eb;
    transform: translateY(-1px);
  }
`;

const Modal = ({ show, title, description, onClose, type }) => {
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

  if (!show) return null;

  return (
    <ModalOverlay show={show} onClick={handleOverlayClick}>
      <ModalBox show={show}>
        <ModalTitle>{title}</ModalTitle>
        <ModalDesc>{description}</ModalDesc>
        <ModalClose onClick={onClose}>확인</ModalClose>
      </ModalBox>
    </ModalOverlay>
  );
};

export default Modal; 