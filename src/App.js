// App.js
import React, { useState, useEffect } from 'react';
import './App.css';
import { NaverMapSearch, RestaurantMap } from './components/NaverMapComponents.js';

const SHARERS = ['아나킨', '퓨리오사', '베일리', '셀리나', '엘레나', '제이든', '루트', '요타', '벨라'];
const CATEGORIES = ['한식', '중식', '일식', '양식', '카페', '분식', '아시아','기타'];
const RATINGS = [1, 2, 3, 4, 5];
const API_BASE_URL = 'https://67866aa9f80b78923aa6bee6.mockapi.io/restaurants';

function App() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [editingRestaurant, setEditingRestaurant] = useState(null);
  const [addFormStep, setAddFormStep] = useState(1); // 추가: 폼 단계 상태

  const [newRestaurant, setNewRestaurant] = useState({
    name: '',
    sharedBy: SHARERS[0],
    category: CATEGORIES[0],
    rating: 0,
    comment: '',
    link: '',
    address: '',
    coordinates: null
  });

  useEffect(() => {
    fetchRestaurants();
  }, []);

  // App.js의 addFormStep 상태가 변경될 때 데이터를 불러오는 로직 추가
useEffect(() => {
  if (addFormStep === 2) {
    const fetchTempPlaceData = async () => {
      try {
        const response = await fetch('https://67866aa9f80b78923aa6bee6.mockapi.io/temp-place');
        if (!response.ok) throw new Error('데이터 로딩 실패');
        const data = await response.json();
        
        // 가장 최근 데이터 사용
        const latestData = data[data.length - 1];
        
        setNewRestaurant(prev => ({
          ...prev,
          name: latestData.name,
          address: latestData.address,
          coordinates: latestData.coordinates
        }));
      } catch (err) {
        console.error('데이터 로딩 실패:', err);
      }
    };

    fetchTempPlaceData();
  }
}, [addFormStep]);

  const fetchRestaurants = async () => {
    try {
      setLoading(true);
      const response = await fetch(API_BASE_URL);
      if (!response.ok) throw new Error('데이터 로딩 실패');
      const data = await response.json();
      setRestaurants(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRestaurant = async () => {
    try {
      if (!newRestaurant.name || !newRestaurant.link) {
        alert('가게명과 링크는 필수 입력사항입니다');
        return;
      }

      const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRestaurant)
      });

      if (!response.ok) throw new Error('맛집 추가 실패');

      const addedRestaurant = await response.json();
      setRestaurants(prev => [...prev, addedRestaurant]);
      setIsAddDialogOpen(false);
      resetForm();
      alert('맛집이 추가되었습니다!');
    } catch (err) {
      alert(err.message);
    }
  };

  const handleUpdateRestaurant = async () => {
    try {
      if (!editingRestaurant?.id) return;

      const response = await fetch(`${API_BASE_URL}/${editingRestaurant.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingRestaurant)
      });

      if (!response.ok) throw new Error('수정 실패');

      const updatedRestaurant = await response.json();
      setRestaurants(prev => 
        prev.map(rest => rest.id === updatedRestaurant.id ? updatedRestaurant : rest)
      );
      setIsEditDialogOpen(false);
      setEditingRestaurant(null);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteRestaurant = async (id) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('삭제 실패');
      setRestaurants(prev => prev.filter(rest => rest.id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  const resetForm = () => {
    setNewRestaurant({
      name: '',
      sharedBy: SHARERS[0],
      category: CATEGORIES[0],
      rating: 0,
      comment: '',
      link: '',
      address: '',
      coordinates: null
    });
    setAddFormStep(1); // 폼 단계 초기화
  };

  const getCategoryStats = () => {
    const stats = restaurants.reduce((acc, restaurant) => {
      const category = restaurant.category || '미분류';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(stats).map(([category, count]) => ({
      category,
      count
    }));
  };

  const getCategoryRestaurants = (category) => {
    return restaurants.filter(restaurant => restaurant.category === category);
  };

  const filteredRestaurants = restaurants.filter(restaurant => {
    const query = searchQuery.toLowerCase();
    return (
      restaurant.name?.toLowerCase().includes(query) ||
      restaurant.category?.toLowerCase().includes(query)
    );
  });

  if (loading) return <div className="loading">로딩중...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="admin-dashboard">
      <header className="dashboard-header">
        <h1>🍽️ 숨슐랭 가이드</h1>
        <p className="header-subtitle">맛있는 발견의 시작</p>
      </header>

      <div className="stats-cards">
        {getCategoryStats().map(({ category, count }) => (
          <div 
            key={category} 
            className="stat-card"
            onClick={() => {
              setSelectedCategory(category);
              setIsCategoryDialogOpen(true);
            }}
          >
            <div className="stat-card-content">
              <h3 className="stat-card-title">{category}</h3>
              <p className="stat-card-value">{count}</p>
              <span className="stat-card-label">맛집</span>
            </div>
          </div>
        ))}
      </div>

      <section className="restaurants-section">
        <div className="restaurants-header">
          <div className="header-content">
            <h2>맛집 리스트</h2>
            <p>숨고 오피스 근처의 맛집을 공유해주세요!</p>
          </div>
          <div className="header-actions">
            <input
              type="text"
              placeholder="맛집 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            <button 
              className="add-restaurant-btn"
              onClick={() => setIsAddDialogOpen(true)}
            >
              맛집 추가하기
            </button>
          </div>
        </div>

        <div className="map-container" style={{ marginBottom: '2rem' }}>
          <RestaurantMap restaurants={filteredRestaurants} />
        </div>

        <table className="restaurants-table">
          <thead>
            <tr>
              <th>가게명</th>
              <th>공유자</th>
              <th>카테고리</th>
              <th>평점</th>
              <th>코멘트</th>
              <th>링크</th>
              <th>작업</th>
            </tr>
          </thead>
          <tbody>
            {filteredRestaurants.map(restaurant => (
              <tr key={restaurant.id}>
                <td>{restaurant.name}</td>
                <td>{restaurant.sharedBy}</td>
                <td>{restaurant.category}</td>
                <td>{'⭐'.repeat(restaurant.rating)}</td>
                <td>{restaurant.comment}</td>
                <td>
                  {restaurant.link && (
                    <a href={restaurant.link} target="_blank" rel="noopener noreferrer">
                      바로가기
                    </a>
                  )}
                </td>
                <td>
                  <button 
                    className="edit-btn"
                    onClick={() => {
                      setEditingRestaurant(restaurant);
                      setIsEditDialogOpen(true);
                    }}
                  >
                    수정
                  </button>
                  <button 
                    className="delete-btn"
                    onClick={() => handleDeleteRestaurant(restaurant.id)}
                  >
                    삭제
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {isAddDialogOpen && (
        <div className="dialog-overlay" onClick={() => {
          setIsAddDialogOpen(false);
          resetForm();
        }}>
          <div className="dialog-content" onClick={e => e.stopPropagation()}>
            <div className="dialog-header">
              <h2>새로운 맛집 추가하기 {addFormStep}/2</h2>
              <button className="close-btn" onClick={() => {
                setIsAddDialogOpen(false);
                resetForm();
              }}>✕</button>
            </div>
            
            <div className="dialog-form">
              {addFormStep === 1 ? (
                // 1단계: 공유자 선택 & URL 입력
                <>
                  <div className="form-field">
                    <label>공유자</label>
                    <select
                      value={newRestaurant.sharedBy}
                      onChange={(e) => setNewRestaurant(prev => ({
                        ...prev,
                        sharedBy: e.target.value
                      }))}
                    >
                      {SHARERS.map(sharer => (
                        <option key={sharer} value={sharer}>{sharer}</option>
                      ))}
                    </select>
                  </div>

                  <NaverMapSearch 
                    onPlaceSelect={(placeInfo) => {
                      setNewRestaurant(prev => ({
                        ...prev,
                        name: placeInfo.name,
                        address: placeInfo.address,
                        rating: placeInfo.rating,
                        coordinates: placeInfo.coordinates,
                        link: placeInfo.link
                      }));
                      setAddFormStep(2); // 정보 가져오기 성공하면 다음 단계로
                    }}
                  />

                  <button 
                    className="next-btn" 
                    onClick={() => {
                      if (!newRestaurant.link) {
                        alert('네이버 지도 URL을 입력하고 검색해주세요.');
                        return;
                      }
                      setAddFormStep(2);
                    }}
                  >
                    다음 단계
                  </button>
                </>
              ) : (
                // 2단계: 나머지 정보 입력
                <>
                  <div className="form-field">
                    <label>가게명</label>
                    <input
                      type="text"
                      value={newRestaurant.name}
                      onChange={(e) => setNewRestaurant(prev => ({
                        ...prev,
                        name: e.target.value
                      }))}
                      disabled
                      className="disabled-input"
                    />
                  </div>

                  <div className="form-field">
                    <label>주소</label>
                    <input
                      type="text"
                      value={newRestaurant.address}
                      disabled
                      className="disabled-input"
                    />
                  </div>

                  <div className="form-field">
                    <label>카테고리</label>
                    <select
                      value={newRestaurant.category}
                      onChange={(e) => setNewRestaurant(prev => ({
                        ...prev,
                        category: e.target.value
                      }))}
                    >
                      {CATEGORIES.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-field">
                    <label>평점</label>
                    <div className="rating-selector">
                      {RATINGS.map(rating => (
                        <button
                          key={rating}
                          type="button"
                          className={`rating-btn ${newRestaurant.rating >= rating ? 'active' : ''}`}
                          onClick={() => setNewRestaurant(prev => ({ ...prev, rating }))}
                        >
                          ⭐
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="form-field">
                    <label>코멘트</label>
                    <textarea
                      value={newRestaurant.comment}
                      onChange={(e) => setNewRestaurant(prev => ({
                        ...prev,
                        comment: e.target.value
                      }))}
                      placeholder="맛집에 대한 코멘트를 입력해주세요"
                    />
                  </div>

                  <div className="form-actions">
                    <button 
                      className="back-btn" 
                      onClick={() => setAddFormStep(1)}
                    >
                      이전으로
                    </button>
                    <button 
                      className="save-btn" 
                      onClick={handleAddRestaurant}
                    >
                      저장하기
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {isEditDialogOpen && editingRestaurant && (
        <div className="dialog-overlay" onClick={() => setIsEditDialogOpen(false)}>
          <div className="dialog-content" onClick={e => e.stopPropagation()}>
            <div className="dialog-header">
              <h2>맛집 정보 수정하기</h2>
              <button className="close-btn" onClick={() => setIsEditDialogOpen(false)}>✕</button>
            </div>
            <div className="dialog-form">
              <div className="form-field">
                <label>코멘트</label>
                <textarea
                  value={editingRestaurant.comment}
                  onChange={(e) => setEditingRestaurant(prev => ({
                    ...prev,
                    comment: e.target.value
                  }))}
                />
              </div>
              <button className="save-btn" onClick={handleUpdateRestaurant}>
                수정 완료
              </button>
            </div>
          </div>
        </div>
      )}

      {isCategoryDialogOpen && selectedCategory && (
        <div className="dialog-overlay" onClick={() => setIsCategoryDialogOpen(false)}>
          <div className="dialog-content category-dialog" onClick={e => e.stopPropagation()}>
            <div className="dialog-header">
              <h2>{selectedCategory} 맛집 목록</h2>
              <button className="close-btn" onClick={() => setIsCategoryDialogOpen(false)}>✕</button>
            </div>

            <div className="map-container" style={{ marginBottom: '2rem' }}>
              <RestaurantMap 
                restaurants={getCategoryRestaurants(selectedCategory)}
                height="300px"
              />
            </div>

            <table className="category-table">
              <thead>
                <tr>
                  <th>가게명</th>
                  <th>공유자</th>
                  <th>평점</th>
                  <th>코멘트</th>
                  <th>링크</th>
                </tr>
              </thead>
              <tbody>
                {getCategoryRestaurants(selectedCategory).map(restaurant => (
                  <tr key={restaurant.id}>
                    <td>{restaurant.name}</td>
                    <td>{restaurant.sharedBy}</td>
                    <td>{'⭐'.repeat(restaurant.rating)}</td>
                    <td>{restaurant.comment}</td>
                    <td>
                      {restaurant.link && (
                        <a href={restaurant.link} target="_blank" rel="noopener noreferrer">
                          바로가기
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;