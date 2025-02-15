// src/components/EditMatchesModal.js

import React, { useContext, useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import './EditMatchesModal.css';
import { SelectedMatchesContext } from '../context/SelectedMatchesContext';
import Checkbox from './Checkbox'; // Убедись, что этот компонент существует
import { FaTrash, FaSearch, FaTimes } from 'react-icons/fa';
import { FixedSizeList as List } from 'react-window';

const MatchItem = memo(({ match, onToggle, isSelected }) => (
  <li className="matchItem">
    <div className="matchInfo">
      <span className="matchLabel">{match.name}</span>
      <span className="matchDetails">{match.date} {match.time}</span>
    </div>
    <Checkbox
      id={`checkbox-${match.id}`}
      checked={isSelected}
      onChange={() => onToggle(match)}
    />
  </li>
));

const SelectedMatchItem = memo(({ match, onRemove }) => (
  <li className="matchItem">
    <div className="matchInfo">
      <span className="matchLabel">{match.name}</span>
      <span className="matchDetails">{match.date} {match.time}</span>
    </div>
    <button className="removeButton" onClick={() => onRemove(match.id)}>
      <FaTrash color="#E53935" size={20} />
    </button>
  </li>
));

const MatchRow = memo(({ data, index, style }) => {
  const match = data.matches[index];
  return (
    <div style={style}>
      <MatchItem
        match={match}
        onToggle={data.onToggle}
        isSelected={data.selectedSet.has(match.id)}
      />
    </div>
  );
});

const EditMatchesModal = ({ isVisible, onClose }) => {
  const navigate = useNavigate();
  const { allMatches, selectedMatches, setSelectedMatches } = useContext(SelectedMatchesContext);
  const [searchText, setSearchText] = useState("");
  const [showSelectedTab, setShowSelectedTab] = useState(true);
  const [error, setError] = useState(null);

  const modalRef = useRef(null);
  const searchInputRef = useRef(null);

  // Мемоизируем фильтрованные матчи
  const filteredMatches = useMemo(() => {
    if (showSelectedTab) return [];
    
    const lowercasedFilter = searchText.toLowerCase();
    return allMatches.filter(match => 
      match.name.toLowerCase().includes(lowercasedFilter) ||
      match.homeTeam?.toLowerCase().includes(lowercasedFilter) ||
      match.awayTeam?.toLowerCase().includes(lowercasedFilter)
    );
  }, [showSelectedTab, searchText, allMatches]);

  // Мемоизируем Set выбранных ID для быстрой проверки
  const selectedMatchesSet = useMemo(() => 
    new Set(selectedMatches.map(m => m.id)),
    [selectedMatches]
  );

  const toggleMatch = useCallback((match) => {
    setSelectedMatches(prev => {
      const isSelected = selectedMatchesSet.has(match.id);
      if (isSelected) {
        return prev.filter(m => m.id !== match.id);
      }
      return [...prev, match];
    });
  }, [setSelectedMatches, selectedMatchesSet]);

  const removeMatch = useCallback((matchId) => {
    setSelectedMatches(prev => prev.filter(match => match.id !== matchId));
  }, [setSelectedMatches]);

  const handleSearch = useCallback((e) => {
    setSearchText(e.target.value);
  }, []);

  const handleTabChange = useCallback((isSelectedTab) => {
    setShowSelectedTab(isSelectedTab);
    if (!isSelectedTab && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 0);
    }
  }, []);

  // Оптимизированный рендер списка матчей
  const renderMatchList = useMemo(() => {
    if (showSelectedTab) {
      return selectedMatches.map(match => (
        <SelectedMatchItem
          key={match.id}
          match={match}
          onRemove={removeMatch}
        />
      ));
    }

    return filteredMatches.map(match => (
      <MatchItem
        key={match.id}
        match={match}
        onToggle={toggleMatch}
        isSelected={selectedMatchesSet.has(match.id)}
      />
    ));
  }, [showSelectedTab, selectedMatches, filteredMatches, toggleMatch, removeMatch, selectedMatchesSet]);

  const renderVirtualizedList = useMemo(() => (
    <List
      height={400}
      itemCount={filteredMatches.length}
      itemSize={60}
      width="100%"
      itemData={{
        matches: filteredMatches,
        onToggle: toggleMatch,
        selectedSet: selectedMatchesSet
      }}
    >
      {MatchRow}
    </List>
  ), [filteredMatches, toggleMatch, selectedMatchesSet]);

  useEffect(() => {
    if (isVisible) {
      // Фокус на модал при открытии
      if (modalRef.current) {
        modalRef.current.focus();
      }
      // Фильтрация доступных матчей при открытии модала
      filterAvailableMatches();
    } else {
      setSearchText('');
    }
  }, [isVisible, allMatches, selectedMatches]);

  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isVisible) {
      window.addEventListener('keydown', handleEsc);
    }

    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isVisible, onClose]);

  const filterAvailableMatches = useCallback(() => {
    const lowercasedFilter = searchText.toLowerCase();
    return allMatches.filter((match) =>
      match.name.toLowerCase().includes(lowercasedFilter)
    );
  }, [searchText, allMatches]);

  const isMatchSelected = useCallback((matchId) => {
    return selectedMatches.some((m) => m.id === matchId);
  }, [selectedMatches]);

  const clearAllMatches = () => {
    if (window.confirm("Вы уверены, что хотите удалить все выбранные матчи?")) {
      setSelectedMatches([]);
    }
  };

  // Функция для перехода к выбору матчей
  const handleGoToMatches = () => {
    onClose(); // Закрываем модальное окно
    navigate('/'); // Переходим на главную страницу с матчами
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className="modalOverlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modalTitle"
    >
      <div
        className="modalContainer"
        onClick={(e) => e.stopPropagation()}
        tabIndex="-1"
        ref={modalRef}
      >
        <div className="modalHeader">
          <h2 id="modalTitle" className="modalTitle">Управление матчами</h2>
          <button className="closeButton" onClick={onClose} aria-label="Закрыть модальное окно">
            <FaTimes />
          </button>
        </div>

        <div className="tabContainer">
          <button
            className={`tabButton ${showSelectedTab ? 'active' : ''}`}
            onClick={() => handleTabChange(true)}
          >
            Выбранные
            {showSelectedTab && <div className="tabIndicator" />}
          </button>

          <button
            className="tabButton"
            onClick={handleGoToMatches}
          >
            Перейти к выбору матчей
          </button>
        </div>

        <div className="matchesContainer">
          {showSelectedTab ? (
            <>
              <div className="selectedHeader">
                <span className="selectedCount">
                  Выбрано: {selectedMatches.length}
                </span>
                <button 
                  className="clearAllButton" 
                  onClick={() => setSelectedMatches([])}
                  disabled={selectedMatches.length === 0}
                >
                  Очистить все
                </button>
              </div>
              <ul className="matchList">
                {renderMatchList}
                {selectedMatches.length === 0 && (
                  <p className="emptyText">Нет выбранных матчей.</p>
                )}
              </ul>
            </>
          ) : (
            <>
              <div className="searchContainer">
                <FaSearch className="searchIcon" />
                <input
                  ref={searchInputRef}
                  type="text"
                  className="searchInput"
                  placeholder="Поиск матчей..."
                  value={searchText}
                  onChange={handleSearch}
                />
              </div>
              <ul className="matchList">
                {renderVirtualizedList}
                {filteredMatches.length === 0 && (
                  <p className="emptyText">
                    {searchText ? 'Матчи не найдены' : 'Нет доступных матчей'}
                  </p>
                )}
              </ul>
            </>
          )}
        </div>

        <button className="saveButton" onClick={onClose}>
          <span className="saveButtonText">Сохранить</span>
        </button>
      </div>
    </div>
  );
};

export default memo(EditMatchesModal);
