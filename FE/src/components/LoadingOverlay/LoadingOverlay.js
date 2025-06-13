import React from 'react';
import styled from 'styled-components';

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.5);
  display: ${props => props.show ? 'flex' : 'none'};
  justify-content: center;
  align-items: center;
  z-index: 9999;
  backdrop-filter: blur(3px);
`;

const LoadingText = styled.span`
  font-size: 18px;
  font-weight: 600;
  color: #fff;
  font-family: 'Pretendard', 'Inter', sans-serif;
  text-align: center;
  letter-spacing: -0.5px;
`;

const LoadingDots = styled.span`
  display: inline-block;
  margin-left: 4px;
`;

const LoadingDot = styled.span`
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #fff;
  margin: 0 2px;
  animation: bounce 1.4s infinite ease-in-out both;
  
  &:nth-child(1) { animation-delay: 0s; }
  &:nth-child(2) { animation-delay: 0.2s; }
  &:nth-child(3) { animation-delay: 0.4s; }
`;

const LoadingOverlay = ({ show, message = '이슈를 찾는 중' }) => {
  return (
    <Overlay show={show}>
      <LoadingText>
        {message}
        <LoadingDots>
          <LoadingDot />
          <LoadingDot />
          <LoadingDot />
        </LoadingDots>
      </LoadingText>
    </Overlay>
  );
};

export default LoadingOverlay; 