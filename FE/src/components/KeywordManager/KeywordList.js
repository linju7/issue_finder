import React, { useState } from 'react';
import styled from 'styled-components';

const Container = styled.div`
  max-height: 400px;
  overflow-y: auto;
  margin-top: 16px;
  scrollbar-width: thin;
  scrollbar-color: #e0e0e0 transparent;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: #e0e0e0;
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: #bdbdbd;
  }
`;

const NoKeywords = styled.p`
  text-align: center;
  color: #bdbdbd;
  font-size: 14px;
  padding: 40px 20px;
  margin: 0;

  &.error {
    color: #ff4d4f;
  }
`;

const KeywordItem = styled.div`
  background: #fff;
  border-radius: 12px;
  padding: 16px 20px;
  margin-bottom: 12px;
  border: 1px solid #e8f3ff;
  transition: all 0.3s ease, transform 0.3s ease, opacity 0.3s ease;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  position: relative;
  cursor: pointer;
  overflow: hidden;

  &:hover {
    border-color: #3182f6;
    box-shadow: 0 2px 8px rgba(49, 130, 246, 0.1);
  }

  &.selected {
    position: relative;
  }

  &.selected .keyword-content {
    filter: blur(3px);
    opacity: 0.3;
    pointer-events: none;
  }

  &.editing {
    cursor: default;
    border-color: #3182f6;
    box-shadow: 0 4px 16px rgba(49, 130, 246, 0.15);
  }

  &.editing .keyword-content {
    display: none;
  }

  &.editing .keyword-edit-form {
    display: flex;
  }
`;

const KeywordContent = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  width: 100%;
  transition: all 0.3s;
  position: relative;

  &::after {
    content: "⇄";
    font-size: 16px;
    color: #bdbdbd;
    font-weight: 400;
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    pointer-events: none;
    background: #fff;
    padding: 0 8px;
  }
`;

const KeywordText = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: #3182f6;
  flex: 1;
  min-width: 0;
  word-break: break-word;
  text-align: center;
`;

const KeywordActions = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: none;
  gap: 12px;
  z-index: 10;

  ${KeywordItem}.selected & {
    display: flex;
  }
`;

const ActionButton = styled.button`
  background: ${props => props.variant === 'delete' ? '#ef4444' : '#3182f6'};
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-family: 'Pretendard', 'Inter', sans-serif;

  &:hover {
    background: ${props => props.variant === 'delete' ? '#dc2626' : '#2563eb'};
    transform: translateY(-1px);
  }
`;

const KeywordEditForm = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: none;
  align-items: center;
  gap: 12px;
  width: calc(100% - 40px);
  z-index: 10;

  ${KeywordItem}.editing & {
    display: flex;
  }
`;

const EditInput = styled.input`
  flex: 1;
  background: #fff;
  border: 2px solid #3182f6;
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 14px;
  font-weight: 500;
  color: #333;
  outline: none;
  font-family: 'Pretendard', 'Inter', sans-serif;

  &:focus {
    border-color: #2563eb;
    box-shadow: 0 0 0 2px rgba(49, 130, 246, 0.2);
  }
`;

const EditSeparator = styled.span`
  font-size: 16px;
  color: #3182f6;
  font-weight: 600;
  padding: 0 4px;
`;

const EditActions = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const EditButton = styled.button`
  background: ${props => props.variant === 'cancel' ? '#f8f9fa' : '#3182f6'};
  color: ${props => props.variant === 'cancel' ? '#333' : '#fff'};
  border: none;
  border-radius: 6px;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-family: 'Pretendard', 'Inter', sans-serif;

  &:hover {
    background: ${props => props.variant === 'cancel' ? '#e9ecef' : '#2563eb'};
  }
`;

const KeywordList = ({ keywords, loading, onUpdate, onDelete }) => {
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editValues, setEditValues] = useState({ original: '', expanded: '' });

  const handleItemClick = (index, e) => {
    // 버튼이나 인풋 클릭은 무시
    if (e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT') {
      return;
    }
    
    // 편집 중이면 무시
    if (editingIndex === index) {
      return;
    }
    
    // 편집 중인 다른 아이템들 종료
    setEditingIndex(null);
    
    // 현재 아이템 선택 토글
    setSelectedIndex(selectedIndex === index ? null : index);
  };

  const startEdit = (index) => {
    const keyword = keywords[index];
    setEditValues({
      original: keyword.original,
      expanded: keyword.expanded
    });
    setEditingIndex(index);
    setSelectedIndex(null);
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setEditValues({ original: '', expanded: '' });
  };

  const confirmEdit = async (index) => {
    const keyword = keywords[index];
    const success = await onUpdate(
      keyword.original,
      keyword.expanded,
      editValues.original.trim(),
      editValues.expanded.trim()
    );
    
    if (success) {
      setEditingIndex(null);
      setEditValues({ original: '', expanded: '' });
    }
  };

  const handleDelete = async (index) => {
    const keyword = keywords[index];
    const success = await onDelete(keyword.original, keyword.expanded);
    
    if (success) {
      setSelectedIndex(null);
    }
  };

  const handleEditKeyDown = (e, index) => {
    if (e.key === 'Enter') {
      confirmEdit(index);
    } else if (e.key === 'Escape') {
      cancelEdit();
    }
  };

  if (loading) {
    return (
      <Container>
        <NoKeywords>키워드를 조회하는 중...</NoKeywords>
      </Container>
    );
  }

  if (!keywords || keywords.length === 0) {
    return (
      <Container>
        <NoKeywords>등록된 키워드가 없습니다.</NoKeywords>
      </Container>
    );
  }

  return (
    <Container>
      {keywords.map((keyword, index) => (
        <KeywordItem
          key={index}
          className={`${selectedIndex === index ? 'selected' : ''} ${editingIndex === index ? 'editing' : ''}`}
          onClick={(e) => handleItemClick(index, e)}
        >
          <KeywordContent className="keyword-content">
            <KeywordText>{keyword.original}</KeywordText>
            <KeywordText>{keyword.expanded}</KeywordText>
          </KeywordContent>

          <KeywordActions className="keyword-actions">
            <ActionButton onClick={() => startEdit(index)}>수정</ActionButton>
            <ActionButton variant="delete" onClick={() => handleDelete(index)}>삭제</ActionButton>
          </KeywordActions>

          <KeywordEditForm className="keyword-edit-form">
            <EditInput
              type="text"
              value={editValues.original}
              onChange={(e) => setEditValues(prev => ({ ...prev, original: e.target.value }))}
              onKeyDown={(e) => handleEditKeyDown(e, index)}
              placeholder="원본 키워드"
            />
            <EditSeparator>⇄</EditSeparator>
            <EditInput
              type="text"
              value={editValues.expanded}
              onChange={(e) => setEditValues(prev => ({ ...prev, expanded: e.target.value }))}
              onKeyDown={(e) => handleEditKeyDown(e, index)}
              placeholder="확장 키워드"
            />
            <EditActions>
              <EditButton onClick={() => confirmEdit(index)}>확인</EditButton>
              <EditButton variant="cancel" onClick={cancelEdit}>취소</EditButton>
            </EditActions>
          </KeywordEditForm>
        </KeywordItem>
      ))}
    </Container>
  );
};

export default KeywordList; 