// App.js
import React, { useState, useEffect } from 'react';
import './App.css';
import { RestaurantMap, getCoordinatesFromAddress, generateNaverMapDirectionLink } from './components/NaverMapComponents.js';
import { CATEGORY_EMOJIS, getCategoryWithEmoji } from './constants/categoryEmojis.js';

const SHARERS = ['아나킨', '퓨리오사', '베일리', '셀리나', '엘레나', '제이든', '루트', '요타', '벨라'];
const CATEGORIES = ['한식', '중식', '일식', '양식', '카페', '분식', '아시아', '기타'];
const RATINGS = [1, 2, 3, 4, 5];
const API_BASE_URL = 'https://67866aa9f80b78923aa6bee6.mockapi.io/restaurants';

function App() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [editingRestaurant, setEditingRestaurant] = useState(null);

  const [newRestaurant, setNewRestaurant] = useState({
    name: '',
    sharedBy: SHARERS[0],
    category: CATEGORIES[0],
    rating: 0,
    comment: '',
    address: '',
    coordinates: null
  });

  // 초기 데이터 로딩
  useEffect(() => {
    fetchRestaurants();
  }, []);

  // 전체 맛집 목록 가져오기
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

  // 새로운 맛집 추가
  const handleAddRestaurant = async () => {
    try {
      // 입력 필수값 검증
      if (!newRestaurant.name || !newRestaurant.address) {
        alert('가게명과 주소는 필수 입력사항입니다');
        return;
      }

      // 주소 좌표 변환
      const geocodeResult = await getCoordinatesFromAddress(newRestaurant.address);
      
      // 맛집 정보에 좌표 추가
      const restaurantToSave = {
        ...newRestaurant,
        coordinates: geocodeResult.coordinates,
        naverDirectionLink: generateNaverMapDirectionLink(newRestaurant.address)
      };

      // API 저장
      const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(restaurantToSave)
      });

      if (!response.ok) throw new Error('맛집 추가 실패');

      const addedRestaurant = await response.json();
      setRestaurants(prev => [...prev, addedRestaurant]);
      setIsDialogOpen(false);
      resetForm();
      alert('맛집이 추가되었습니다!');
    } catch (err) {
      alert(err.message);
    }
  };

  // 맛집 정보 수정
  const handleUpdateRestaurant = async () => {
    try {
      if (!editingRestaurant?.id) return;

      // 주소 좌표 변환
      const geocodeResult = await getCoordinatesFromAddress(editingRestaurant.address);
      
      // 수정된 정보에 좌표 및 길찾기 링크 추가
      const updatedRestaurantData = {
        ...editingRestaurant,
        coordinates: geocodeResult.coordinates,
        naverDirectionLink: generateNaverMapDirectionLink(editingRestaurant.address)
      };

      const response = await fetch(`${API_BASE_URL}/${editingRestaurant.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedRestaurantData)
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

  // 맛집 삭제
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

  // 폼 초기화
  const resetForm = () => {
    setNewRestaurant({
      name: '',
      sharedBy: SHARERS[0],
      category: CATEGORIES[0],
      rating: 0,
      comment: '',
      address: '',
      coordinates: null
    });
  };

  // 카테고리별 통계
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

  // 카테고리별 맛집 목록
  const getCategoryRestaurants = (category) => {
    return restaurants.filter(restaurant => restaurant.category === category);
  };

  // 검색 필터링
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
              <h3 className="stat-card-title">{getCategoryWithEmoji(category)}</h3>
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
              onClick={() => setIsDialogOpen(true)}
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
              <th>주소</th>
              <th>길찾기</th>
              <th>작업</th>
            </tr>
          </thead>
          <tbody>
            {filteredRestaurants.map(restaurant => (
              <tr key={restaurant.id}>
                <td>{restaurant.name}</td>
                <td>{restaurant.sharedBy}</td>
                <td>{getCategoryWithEmoji(restaurant.category)}</td>
                <td>{'⭐'.repeat(restaurant.rating)}</td>
                <td>{restaurant.comment}</td>
                <td>{restaurant.address}</td>
                <td>
                  {restaurant.naverDirectionLink && (
                    <a 
                      href={restaurant.naverDirectionLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="direction-link"
                    >
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

      {/* 맛집 추가 다이얼로그 */}
      {isDialogOpen && (
        <div className="dialog-overlay" onClick={() => {
          setIsDialogOpen(false);
          resetForm();
        }}>
          <div className="dialog-content" onClick={e => e.stopPropagation()}>
            <div className="dialog-header">
              <h2>새로운 맛집 추가하기</h2>
              <button className="close-btn" onClick={() => {
                setIsDialogOpen(false);
                resetForm();
              }}>✕</button>
            </div>
            
            <div className="dialog-form">
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

              <div className="form-field">
                <label>가게명</label>
                <input
                  type="text"
                  value={newRestaurant.name}
                  onChange={(e) => setNewRestaurant(prev => ({
                    ...prev,
                    name: e.target.value
                  }))}
                  placeholder="가게명을 입력하세요"
                />
              </div>

              <div className="form-field">
                <label>주소</label>
                <input
                  type="text"
                  value={newRestaurant.address}
                  onChange={(e) => setNewRestaurant(prev => ({
                    ...prev,
                    address: e.target.value
                  }))}
                  placeholder="도로명 주소를 입력하세요"
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
                    <option key={category} value={category}>
                      {getCategoryWithEmoji(category)}
                    </option>
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
                  className="save-btn" 
                  onClick={handleAddRestaurant}
                >
                  저장하기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 맛집 수정 다이얼로그 */}
      {isEditDialogOpen && editingRestaurant && (
        <div className="dialog-overlay" onClick={() => setIsEditDialogOpen(false)}>
          <div className="dialog-content" onClick={e => e.stopPropagation()}>
            <div className="dialog-header">
              <h2>맛집 정보 수정하기</h2>
              <button className="close-btn" onClick={() => setIsEditDialogOpen(false)}>✕</button>
            </div>
            <div className="dialog-form">
              <div className="form-field">
                <label>공유자</label>
                <select
                  value={editingRestaurant.sharedBy}
                  onChange={(e) => setEditingRestaurant(prev => ({
                    ...prev,
                    sharedBy: e.target.value
                  }))}
                >
                  {SHARERS.map(sharer => (
                    <option key={sharer} value={sharer}>{sharer}</option>
                  ))}
                </select>
              </div>

              <div className="form-field">
                <label>가게명</label>
                <input
                  type="text"
                  value={editingRestaurant.name}
                  onChange={(e) => setEditingRestaurant(prev => ({
                    ...prev,
                    name: e.target.value
                  }))}
                  placeholder="가게명을 입력하세요"
                />
              </div>

              <div className="form-field">
                <label>주소</label>
                <input
                  type="text"
                  value={editingRestaurant.address}
                  onChange={(e) => setEditingRestaurant(prev => ({
                    ...prev,
                    address: e.target.value
                  }))}
                  placeholder="도로명 주소를 입력하세요"
                />
              </div>

              <div className="form-field">
                <label>카테고리</label>
                <select
                  value={editingRestaurant.category}
                  onChange={(e) => setEditingRestaurant(prev => ({
                    ...prev,
                    category: e.target.value
                  }))}
                >
                  {CATEGORIES.map(category => (
                    <option key={category} value={category}>
                      {getCategoryWithEmoji(category)}
                    </option>
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
                      className={`rating-btn ${editingRestaurant.rating >= rating ? 'active' : ''}`}
                      onClick={() => setEditingRestaurant(prev => ({ ...prev, rating }))}
                    >
                      ⭐
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-field">
                <label>코멘트</label>
                <textarea
                  value={editingRestaurant.comment}
                  onChange={(e) => setEditingRestaurant(prev => ({
                    ...prev,
                    comment: e.target.value
                  }))}
                  placeholder="맛집에 대한 코멘트를 입력해주세요"
                />
              </div>

              <div className="form-actions">
                <button 
                  className="save-btn" 
                  onClick={handleUpdateRestaurant}
                >
                  수정 완료
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 카테고리별 맛집 목록 다이얼로그 */}
      {isCategoryDialogOpen && selectedCategory && (
        <div className="dialog-overlay" onClick={() => setIsCategoryDialogOpen(false)}>
          <div className="dialog-content category-dialog" onClick={e => e.stopPropagation()}>
            <div className="dialog-header">
              <h2>{getCategoryWithEmoji(selectedCategory)} 맛집 목록</h2>
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
                  <th>주소</th>
                  <th>길찾기</th>
                </tr>
              </thead>
              <tbody>
                {getCategoryRestaurants(selectedCategory).map(restaurant => (
                  <tr key={restaurant.id}>
                    <td>{restaurant.name}</td>
                    <td>{restaurant.sharedBy}</td>
                    <td>{'⭐'.repeat(restaurant.rating)}</td>
                    <td>{restaurant.comment}</td>
                    <td>{restaurant.address}</td>
                    <td>
                      {restaurant.naverDirectionLink && (
                        <a 
                          href={restaurant.naverDirectionLink} 
                          target="_blank" 
                          rel="noopener noreferrer"
                        >
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