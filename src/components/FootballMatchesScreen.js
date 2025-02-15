import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import './FootballMatchesScreen.css';
import { FaFutbol, FaSearch } from 'react-icons/fa';
import axios from 'axios';
import TelegramEmulator from '../TelegramEmulator'; // Предполагается, что этот компонент существует
import { SelectedMatchesContext } from '../context/SelectedMatchesContext'; // Импортируем контекст
import { getCachedMatches, setCachedMatches } from '../services/cacheService';

const Telegram = window.Telegram || TelegramEmulator.WebApp;

const formatDateToDDMM = (dateStr) => {
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const month = parts[1];
    const day = parts[2];
    return `${day}.${month}`;
  }
  return dateStr;
};

const getDaysOfWeek = () => {
  const today = new Date();
  const days = [];
  const dayNames = ['ВС', 'ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ'];

  for (let i = 0; i < 7; i++) {
    const date = new Date();
    date.setDate(today.getDate() + i);
    const dayIndex = date.getDay();
    const label = i === 0 ? 'СЕГОДНЯ' : dayNames[dayIndex];
    const dayNum = date.getDate();
    const month = date.getMonth() + 1;
    const dateStr = `${dayNum < 10 ? '0' : ''}${dayNum}.${
      month < 10 ? '0' : ''
    }${month}`;
    days.push({ label, date: dateStr });
  }

  return days;
};

const TeamLogo = ({ uri }) => {
  const [error, setError] = useState(false);

  if (!uri || error) {
    return <div className="team-logo-placeholder" />;
  }

  return (
    <div className="team-logo-container">
      <img 
        src={uri} 
        alt="Team Logo" 
        className="team-logo"
        onError={() => setError(true)}
      />
    </div>
  );
};

const FootballMatchesScreen = () => {
  const { allMatches, setAllMatches, selectedMatches, setSelectedMatches } =
    useContext(SelectedMatchesContext);

  const [searchText, setSearchText] = useState('');
  const [selectedDay, setSelectedDay] = useState(getDaysOfWeek()[0]);
  const [daysOfWeek] = useState(getDaysOfWeek());
  const [filteredData, setFilteredData] = useState([]);
  const [selectedCount, setSelectedCount] = useState(selectedMatches.length);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  const sheetId = '1R2k3qsM2ggajeBu8IrP1d-LAolneeqcTrDNV_JHqtzc';
  const apiKey = 'AIzaSyDrCLUPUlzlNoj4KJlFAnP2KZrt8MXZbUE';
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Sheet1?key=${apiKey}`;

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(url);
      const [, ...rows] = response.data.values;
      
      const matches = rows.map((row, index) => {
        const homeTeam = row[3] || '';
        const awayTeam = row[4] || '';
        const time = row[2] || '';
        const date = formatDateToDDMM(row[1]) || '';
        const homeLogo = row[6] || '';
        const awayLogo = row[7] || '';
        
        const uniqueId = `${date}-${time}-${homeTeam}-${awayTeam}`.replace(/\s+/g, '-').toLowerCase();
        
        return {
          id: uniqueId,
          date: date,
          time: time,
          homeTeam: homeTeam,
          awayTeam: awayTeam,
          name: `${homeTeam} vs ${awayTeam}`,
          league: row[0] || '',
          homeLogo: homeLogo,
          awayLogo: awayLogo
        };
      });

      setAllMatches(matches);
      setCachedMatches(matches);

    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    if (Telegram && Telegram.MainButton) {
      Telegram.MainButton.show();
      Telegram.MainButton.setText('Готово');
      Telegram.MainButton.onClick(() => {
        console.log('Main button clicked');
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setSelectedCount(selectedMatches.length);
  }, [selectedMatches]);

  useEffect(() => {
    const applyFilters = () => {
      const lowercasedFilter = searchText.toLowerCase();

      const filteredMatches = allMatches.filter((match) => {
        const matchesSearch = 
          match.homeTeam.toLowerCase().includes(lowercasedFilter) ||
          match.awayTeam.toLowerCase().includes(lowercasedFilter);
        const matchesDate = match.date === selectedDay.date;
        return matchesSearch && matchesDate;
      });

      const groupedMatches = filteredMatches.reduce((acc, match) => {
        if (!acc[match.league]) {
          acc[match.league] = {
            league: match.league,
            data: []
          };
        }
        acc[match.league].data.push(match);
        return acc;
      }, {});

      setFilteredData(Object.values(groupedMatches));
    };

    applyFilters();
  }, [searchText, allMatches, selectedDay, selectedMatches]);

  const renderLeagueHeader = (league) => (
    <div className="league-header" key={`league-${league.league}`}>
      <FaFutbol size={20} color="#ffffff" />
      <span className="league-header-text">{league.league}</span>
    </div>
  );

  const toggleFavorite = (matchId) => {
    setSelectedMatches(prev => {
      const isSelected = prev.some(m => m.id === matchId);
      if (isSelected) {
        const newSelected = prev.filter(m => m.id !== matchId);
        return newSelected;
      } else {
        const matchToAdd = allMatches.find(m => m.id === matchId);
        if (matchToAdd) {
          const newSelected = [...prev, matchToAdd];
          return newSelected;
        }
        return prev;
      }
    });
  };

  const renderMatch = (match, league) => (
    <div 
      className="match-container" 
      key={`match-${match.id}`} // Используем только ID матча для ключа
    >
      <div className="match-row">
        <div className="time-section">
          <span className="match-time">{match.time}</span>
        </div>
        <div className="teams-container">
          <div className="team-row">
            <TeamLogo uri={match.homeLogo} />
            <span className="team-name">{match.homeTeam}</span>
          </div>
          <div className="team-row">
            <TeamLogo uri={match.awayLogo} />
            <span className="team-name">{match.awayTeam}</span>
          </div>
        </div>
        <div className="favorite-checkbox-container">
          <input
            type="checkbox"
            id={`checkbox-${match.id}`}
            className="match-checkbox"
            checked={selectedMatches.some(m => m.id === match.id)}
            onChange={() => toggleFavorite(match.id)}
          />
          <label
            htmlFor={`checkbox-${match.id}`}
            className="match-checkbox-label"
          ></label>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="loading-container">
          <div className="spinner"></div>
          <span className="loading-text">Загрузка данных...</span>
        </div>
      );
    }

    if (error) {
      return (
        <div className="error-container">
          <span className="error-text">Ошибка при загрузке данных:</span>
          <span className="error-message">{error}</span>
          <button className="retry-button" onClick={fetchData}>
            Попробовать снова
          </button>
        </div>
      );
    }

    if (filteredData.length === 0) {
      return (
        <div className="empty-container">
          <span className="empty-text">Нет матчей на выбранный день.</span>
        </div>
      );
    }

    return (
      <>
        {filteredData.map((league) => (
          <div key={`league-section-${league.league}`}>
            {renderLeagueHeader(league)}
            {league.data.map((match) => renderMatch(match, league))}
            <div className="separator"></div>
          </div>
        ))}

        <div className="bottom-panel">
          <button
            className={`button ${selectedCount <= 0 ? 'button-disabled' : ''}`}
            disabled={selectedCount <= 0}
            onClick={() => navigate('/strategy')}
          >
            <span className="button-text">Далее</span>
          </button>
          <span className="selected-text">Выбрано матчей: {selectedCount}</span>
        </div>
      </>
    );
  };

  return (
    <div className="safe-area">
      <div className="container">
        <div className="nav-bar">
          <div className="nav-left">
            <FaFutbol size={24} color="#ffffff" />
            <span className="nav-title">Футбол</span>
          </div>

          <div className="searchContainer">
            <FaSearch className="searchIcon" />
            <input
              type="text"
              className="searchInput"
              placeholder="Поиск матчей..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>
        </div>

        <div className="date-panel">
          <div className="date-list">
            {daysOfWeek.map((day, index) => {
              const isActive =
                selectedDay.label === day.label && selectedDay.date === day.date;
              return (
                <div
                  key={`day-${index}`}
                  className={`day-button ${isActive ? 'active-day-button' : ''}`}
                  onClick={() => setSelectedDay(day)}
                >
                  <span
                    className={`day-button-text ${
                      isActive ? 'active-day-button-text' : ''
                    }`}
                  >
                    {day.label}
                  </span>
                  <span
                    className={`date-text ${isActive ? 'active-date-text' : ''}`}
                  >
                    {day.date}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="list-container">{renderContent()}</div>
      </div>
    </div>
  );
};

export default FootballMatchesScreen;
