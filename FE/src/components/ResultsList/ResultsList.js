import React, { useState, useEffect, useRef, useCallback } from 'react';
import styled from 'styled-components';
import {
  ResultsSection,
  ResultsInner,
  PageGuide,
  GuideTitle,
  GuideDesc,
  Button
} from '../../styles/CommonStyles';

const ResultContainer = styled.div`
  width: 100%;
  max-width: 100%;
  height: 440px;
  min-height: 320px;
  max-height: 480px;
  padding: 0 0 0 0;
  margin: 0 auto;
  background: transparent;
  border-radius: 12px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  overflow-y: auto;
  overflow-x: hidden;
  overscroll-behavior: contain;
  scrollbar-width: none;
  -ms-overflow-style: none;
  position: relative;
  z-index: 1;

  &::-webkit-scrollbar {
    display: none;
  }

  &.fade-out {
    opacity: 0;
    transition: opacity 0.35s;
  }

  &.fade-in {
    opacity: 1;
    transition: opacity 0.35s;
  }
`;

const ResultItem = styled.div`
  width: 100%;
  min-height: 88px;
  background: #fff;
  border-radius: 16px;
  padding: 20px 24px;
  margin-bottom: 16px;
  border: 1px solid #f0f3ff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: all 0.3s ease, transform 0.3s ease;
  box-shadow: 0 2px 8px rgba(49, 130, 246, 0.08);

  &:hover {
    border-color: #3182f6;
    box-shadow: 0 4px 16px rgba(49, 130, 246, 0.15);
    transform: translateY(-2px);
  }

  &:last-child {
    margin-bottom: 0;
  }

  @media (max-width: 900px) {
    padding: 16px 20px;
    min-height: 80px;
  }

  @media (max-width: 800px) {
    padding: 14px 18px;
  }

  @media (max-width: 480px) {
    padding: 12px 16px;
  }
`;

const ResultContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  text-align: left;
  min-width: 0;
`;

const ResultTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0;
  line-height: 1.4;
  word-break: break-word;
  overflow-wrap: break-word;
  transition: color 0.3s;

  ${ResultItem}:hover & {
    color: #3182f6;
  }

  @media (max-width: 900px) {
    font-size: 16px;
  }

  @media (max-width: 800px) {
    font-size: 15px;
  }
`;

const ResultSimilarity = styled.span`
  font-size: 14px;
  font-weight: 600;
  padding: 6px 12px;
  border-radius: 20px;
  white-space: nowrap;
  letter-spacing: -0.3px;
  transition: all 0.3s;
  
  &.sim-high {
    background: linear-gradient(135deg, #3182f6 0%, #4f98fa 100%);
    color: #fff;
  }

  &.sim-low {
    background: #f8faff;
    color: #3182f6;
    border: 1px solid #e8f3ff;
  }

  ${ResultItem}:hover & {
    transform: scale(1.05);
  }

  @media (max-width: 900px) {
    font-size: 13px;
    padding: 5px 10px;
  }
`;

const LoadingText = styled.p`
  text-align: center;
  color: #666;
  font-size: 16px;
  padding: 40px 20px;
  margin: 0;
`;

const Sentinel = styled.div`
  height: 1px;
  width: 100%;
`;

const ResultsList = ({ results, show, onReset, loading }) => {
  const [loadedCount, setLoadedCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const sentinelRef = useRef(null);
  const containerRef = useRef(null);
  const LOAD_BATCH = 5;

  // 무한 스크롤 옵저버
  const observerCallback = useCallback((entries) => {
    if (entries[0].isIntersecting && loadedCount < results.length && !isLoading) {
      setIsLoading(true);
      setTimeout(() => {
        setLoadedCount(prev => Math.min(prev + LOAD_BATCH, results.length));
        setIsLoading(false);
      }, 100);
    }
  }, [loadedCount, results.length, isLoading]);

  useEffect(() => {
    if (!sentinelRef.current || !results.length) return;

    const observer = new IntersectionObserver(observerCallback, {
      root: containerRef.current,
      threshold: 1.0
    });

    observer.observe(sentinelRef.current);

    return () => observer.disconnect();
  }, [observerCallback, results.length]);

  // 결과가 변경될 때 로딩 카운트 초기화
  useEffect(() => {
    if (results.length > 0) {
      setLoadedCount(Math.min(LOAD_BATCH, results.length));
    } else {
      setLoadedCount(0);
    }
  }, [results]);

  const handleItemClick = (url) => {
    window.open(url, '_blank');
  };

  const getSimClass = (similarity) => {
    return similarity >= 0.6 ? 'sim-high' : 'sim-low';
  };

  const formatSimilarity = (similarity) => {
    return `유사도: ${(similarity * 100).toFixed(1)}%`;
  };

  if (loading) {
    return (
      <ResultsSection show={show}>
        <ResultsInner>
          <PageGuide>
            <GuideTitle>찾은 이슈</GuideTitle>
            <GuideDesc>유사도가 높은 순으로 정렬되어 표시됩니다.</GuideDesc>
          </PageGuide>
          <ResultContainer>
            <LoadingText>로딩 중...</LoadingText>
          </ResultContainer>
        </ResultsInner>
      </ResultsSection>
    );
  }

  return (
    <ResultsSection show={show}>
      <ResultsInner>
        <PageGuide>
          <GuideTitle>찾은 이슈</GuideTitle>
          <GuideDesc>유사도가 높은 순으로 정렬되어 표시됩니다.</GuideDesc>
        </PageGuide>
        
        <ResultContainer ref={containerRef}>
          {results.length === 0 ? (
            <LoadingText>검색 결과가 없습니다.</LoadingText>
          ) : (
            <>
              {results.slice(0, loadedCount).map((result, index) => (
                <ResultItem 
                  key={index} 
                  onClick={() => handleItemClick(result.link)}
                >
                  <ResultContent>
                    <ResultTitle>{result.title}</ResultTitle>
                  </ResultContent>
                  <ResultSimilarity className={getSimClass(result.similarity_score)}>
                    {formatSimilarity(result.similarity_score)}
                  </ResultSimilarity>
                </ResultItem>
              ))}
              {loadedCount < results.length && (
                <Sentinel ref={sentinelRef} />
              )}
            </>
          )}
        </ResultContainer>
        
        <Button 
          onClick={onReset}
          style={{ margin: '24px 0 0 0', display: 'block', position: 'relative' }}
        >
          다시 검색하기
        </Button>
      </ResultsInner>
    </ResultsSection>
  );
};

export default ResultsList; 