// App.js
import React, { useState, useEffect } from 'react';
import './App.css';

// 필요한 상수값들을 정의합니다
const SHARERS = ['김팀장', '이대리', '박사원', '최주임'];
const CATEGORIES = ['한식', '중식', '일식', '양식', '카페', '분식', '기타'];
const RATINGS = [1, 2, 3, 4, 5];
const API_BASE_URL = 'https://67866aa9f80b78923aa6bee6.mockapi.io/restaurants';

function App() {
 // 상태 관리 
 const [restaurants, setRestaurants] = useState([]);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState(null);
 const [searchQuery, setSearchQuery] = useState('');
 
 // 모달 상태 관리
 const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
 const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
 const [editingRestaurant, setEditingRestaurant] = useState(null);

 // 새로운 맛집 정보 상태 관리
 const [newRestaurant, setNewRestaurant] = useState({
   name: '',
   sharedBy: SHARERS[0],
   category: CATEGORIES[0],
   rating: RATINGS[4],
   comment: '',
   link: ''
 });

 // 초기 데이터 로딩
 useEffect(() => {
   fetchRestaurants();
 }, []);

 // 맛집 목록 데이터 가져오기
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

 // 맛집 추가 처리
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

 // 맛집 수정 처리
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

 // 맛집 삭제 처리
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

 // 입력 폼 초기화
 const resetForm = () => {
   setNewRestaurant({
     name: '',
     sharedBy: SHARERS[0],
     category: CATEGORIES[0], 
     rating: RATINGS[4],
     comment: '',
     link: ''
   });
 };

 // 카테고리별 통계 계산
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
       <h1>숨슐랭 가이드</h1>
       <p className="header-subtitle">맛있는 발견의 시작</p>
     </header>

     <div className="stats-cards">
       {getCategoryStats().map(({ category, count }) => (
         <div key={category} className="stat-card">
           <div className="stat-card-content">
             <h3 className="stat-card-title">{category}</h3>
             <p className="stat-card-value">{count}</p>
             <p className="stat-card-label">개의 맛집</p>
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
           {filteredRestaurants.map((restaurant) => (
             <tr key={restaurant.id}>
               <td>{restaurant.name}</td>
               <td>{restaurant.sharedBy}</td>
               <td>{restaurant.category}</td>
               <td>{'⭐'.repeat(restaurant.rating)}</td>
               <td>{restaurant.comment}</td>
               <td>
                 {restaurant.link && (
                   <a 
                     href={restaurant.link}
                     target="_blank"
                     rel="noopener noreferrer"
                     className="restaurant-link"
                   >
                     바로가기
                   </a>
                 )}
               </td>
               <td className="action-buttons">
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
       <div className="dialog-overlay" onClick={() => setIsAddDialogOpen(false)}>
         <div className="dialog-content" onClick={e => e.stopPropagation()}>
           <div className="dialog-header">
             <h2>새로운 맛집 추가하기</h2>
             <button className="close-btn" onClick={() => setIsAddDialogOpen(false)}>✕</button>
           </div>
           <div className="dialog-form">
             <div className="form-field">
               <label>가게명</label>
               <input
                 type="text"
                 value={newRestaurant.name}
                 onChange={(e) => setNewRestaurant(prev => ({
                   ...prev,
                   name: e.target.value
                 }))}
                 placeholder="가게 이름을 입력해주세요"
               />
             </div>
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
             <div className="form-field">
               <label>링크</label>
               <input
                 type="text"
                 value={newRestaurant.link}
                 onChange={(e) => setNewRestaurant(prev => ({
                   ...prev,
                   link: e.target.value.trim()
                 }))}
                 placeholder="네이버 지도 URL을 입력해주세요"
               />
             </div>
             <button className="save-btn" onClick={handleAddRestaurant}>
               저장하기
             </button>
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
   </div>
 );
}

export default App;