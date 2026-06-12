import React, { useState, useEffect, useRef } from 'react';
import { Input, Empty, Spin, Tag } from 'antd';
import {
  SearchOutlined,
  FileTextOutlined,
  TeamOutlined,
  UserOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { searchAPI } from '../api';
import {
  CASE_TYPE_OPTIONS,
  CASE_STATUS_OPTIONS,
  getOptionLabel,
  getOptionColor
} from '../utils/constants';

const { Search } = Input;

function GlobalSearch() {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState('');
  const [results, setResults] = useState({ cases: [], parties: [], users: [] });
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const searchRef = useRef(null);
  const dropdownRef = useRef(null);
  const debounceTimer = useRef(null);

  const flatResults = [
    ...results.cases.map(r => ({ ...r, _group: 'case' })),
    ...results.parties.map(r => ({ ...r, _group: 'party' })),
    ...results.users.map(r => ({ ...r, _group: 'user' }))
  ];

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(e.target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target)
      ) {
        setOpen(false);
        setActiveIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const doSearch = async (value) => {
    if (!value || value.trim() === '') {
      setResults({ cases: [], parties: [], users: [] });
      setOpen(false);
      return;
    }

    setLoading(true);
    setOpen(true);
    try {
      const res = await searchAPI.global(value.trim(), 10);
      setResults({
        cases: res.data?.cases || [],
        parties: res.data?.parties || [],
        users: res.data?.users || []
      });
      setActiveIndex(-1);
    } catch (e) {
      setResults({ cases: [], parties: [], users: [] });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value) => {
    setKeyword(value);
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    debounceTimer.current = setTimeout(() => {
      doSearch(value);
    }, 300);
  };

  const handlePressEnter = () => {
    if (flatResults.length > 0) {
      const target = activeIndex >= 0 ? flatResults[activeIndex] : flatResults[0];
      if (target && target.url && target.url !== '#') {
        setOpen(false);
        setKeyword('');
        navigate(target.url);
      }
    }
  };

  const handleKeyDown = (e) => {
    const total = flatResults.length;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => (prev + 1) % total);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => (prev - 1 + total) % total);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handlePressEnter();
    } else if (e.key === 'Escape') {
      setOpen(false);
      setActiveIndex(-1);
    }
  };

  const handleItemClick = (item) => {
    if (item.url && item.url !== '#') {
      setOpen(false);
      setKeyword('');
      navigate(item.url);
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'case':
        return <FileTextOutlined style={{ color: '#1890ff' }} />;
      case 'party':
        return <TeamOutlined style={{ color: '#722ed1' }} />;
      case 'user':
        return <UserOutlined style={{ color: '#52c41a' }} />;
      default:
        return <SearchOutlined />;
    }
  };

  const getGroupName = (type) => {
    switch (type) {
      case 'case': return '案件';
      case 'party': return '当事人';
      case 'user': return '律师/用户';
      default: return '其他';
    }
  };

  const renderGroupSection = (type, items) => {
    if (items.length === 0) return null;
    return (
      <div key={type}>
        <div className="search-group-header">
          <Tag color={type === 'case' ? 'blue' : type === 'party' ? 'purple' : 'green'} style={{ margin: 0 }}>
            {getGroupName(type)}
          </Tag>
        </div>
        {items.map((item, idx) => {
          const flatIdx = flatResults.findIndex(r => r.id === item.id && r.type === item.type);
          const isActive = flatIdx === activeIndex;
          return (
            <div
              key={`${type}-${item.id}`}
              className={`search-result-item ${isActive ? 'active' : ''}`}
              onMouseEnter={() => setActiveIndex(flatIdx)}
              onClick={() => handleItemClick(item)}
            >
              <div className="search-item-icon">{getTypeIcon(type)}</div>
              <div className="search-item-content">
                <div className="search-item-title">
                  {item.title}
                  {type === 'case' && item.extra?.status && (
                    <Tag
                      color={getOptionColor(CASE_STATUS_OPTIONS, item.extra.status)}
                      style={{ marginLeft: 8, fontSize: 11 }}
                    >
                      {getOptionLabel(CASE_STATUS_OPTIONS, item.extra.status)}
                    </Tag>
                  )}
                </div>
                <div className="search-item-subtitle">{item.subtitle}</div>
                {item.description && (
                  <div className="search-item-desc">{item.description}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="global-search-wrapper" ref={searchRef}>
      <Search
        placeholder="搜索案号、案由、当事人、律师..."
        allowClear
        size="middle"
        value={keyword}
        onChange={(e) => handleSearch(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (keyword.trim() && flatResults.length > 0) {
            setOpen(true);
          }
        }}
        style={{ width: 360 }}
        prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
      />

      {open && keyword.trim() && (
        <div className="global-search-dropdown" ref={dropdownRef}>
          {loading ? (
            <div className="search-loading">
              <Spin size="small" />
              <span style={{ marginLeft: 8 }}>搜索中...</span>
            </div>
          ) : flatResults.length === 0 ? (
            <Empty
              description="未找到相关结果"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              style={{ padding: '20px 0' }}
            />
          ) : (
            <div className="search-results-container">
              {renderGroupSection('case', results.cases)}
              {renderGroupSection('party', results.parties)}
              {renderGroupSection('user', results.users)}
              <div className="search-footer-hint">
                按 <kbd>↑</kbd> <kbd>↓</kbd> 选择，按 <kbd>Enter</kbd> 跳转
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default GlobalSearch;
