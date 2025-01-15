// src/components/NaverMapComponents.js
import React, { useState, useEffect, useRef } from 'react';

// 네이버 지도 URL에서 장소 ID를 추출하는 컴포넌트
const NaverMapSearch = ({ onPlaceSelect }) => {
  const [mapUrl, setMapUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const extractPlaceId = async (url) => {
    try {
      // 축약 URL인 경우 (naver.me)
      if (url.includes('naver.me')) {
        // CORS 이슈를 피하기 위해 서버를 통해 리다이렉트 URL을 가져옴
        const response = await fetch(`${process.env.REACT_APP_API_URL}/expand-url?url=${encodeURIComponent(url)}`);
        if (!response.ok) throw new Error('URL 확장에 실패했습니다.');
        const { fullUrl } = await response.json();
        return extractPlaceIdFromFullUrl(fullUrl);
      }
      // 일반 URL인 경우
      return extractPlaceIdFromFullUrl(url);
    } catch (err) {
      throw new Error('URL 처리 중 오류가 발생했습니다.');
    }
  };

  const extractPlaceIdFromFullUrl = (url) => {
    // 다양한 형태의 네이버 지도 URL에서 place ID를 추출
    const patterns = [
      /place(?:%2F|\/)([\d]+)/,  // place/ 또는 place%2F 뒤의 숫자
      /entry\/place\/([\d]+)/,    // entry/place/ 뒤의 숫자
      /restaurant\/([\d]+)/,      // restaurant/ 뒤의 숫자
      /location\/([\d]+)/         // location/ 뒤의 숫자
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const placeId = await extractPlaceId(mapUrl);
      if (!placeId) {
        throw new Error('올바른 네이버 지도 URL이 아닙니다');
      }

      // Mock API 호출
      const response = await fetch(`${process.env.REACT_APP_API_URL}/place-info/${placeId}`);
      if (!response.ok) throw new Error('장소 정보를 가져오는데 실패했습니다');
      
      const placeInfo = await response.json();
      onPlaceSelect({
        name: placeInfo.name,
        address: placeInfo.address,
        rating: Math.round(placeInfo.rating || 0),
        coordinates: placeInfo.coordinates,
        link: mapUrl
      });

      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="map-search">
      <div className="form-field">
        <label>네이버 지도 URL</label>
        <div className="search-input-group">
          <input
            type="text"
            value={mapUrl}
            onChange={(e) => setMapUrl(e.target.value)}
            placeholder="네이버 지도 URL을 붙여넣으세요 (축약 URL도 가능)"
            className="search-input"
          />
          <button 
            onClick={handleSearch}
            disabled={loading || !mapUrl}
            className="search-btn"
          >
            {loading ? '검색중...' : '검색'}
          </button>
        </div>
        {error && <p className="error-message">{error}</p>}
      </div>
    </div>
  );
};

// 지도에 마커를 표시하는 컴포넌트
const RestaurantMap = ({ restaurants, height = '400px' }) => {
  const mapRef = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {
    // 네이버 맵 스크립트가 로드되었는지 확인
    const initializeMap = () => {
      if (!window.naver || !window.naver.maps || !mapRef.current) {
        // 1초 후에 다시 시도
        setTimeout(initializeMap, 1000);
        return;
      }

      // 지도 초기화
      const map = new window.naver.maps.Map(mapRef.current, {
        center: new window.naver.maps.LatLng(37.5666103, 126.9783882), // 서울 시청 기준
        zoom: 13
      });

      // 기존 마커 제거
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];

      // 모든 레스토랑의 좌표를 포함하는 경계 설정
      const bounds = new window.naver.maps.LatLngBounds();

      // 레스토랑 마커 생성
      restaurants.forEach(restaurant => {
        if (!restaurant.coordinates) return;
        
        const position = new window.naver.maps.LatLng(
          restaurant.coordinates.lat,
          restaurant.coordinates.lng
        );

        const marker = new window.naver.maps.Marker({
          position,
          map,
          title: restaurant.name,
          icon: {
            content: `<div style="
              background: var(--primary);
              padding: 5px 10px;
              border-radius: 20px;
              color: white;
              font-size: 12px;
              font-weight: 600;
              box-shadow: 0 2px 6px rgba(0,0,0,0.1);
            ">${restaurant.name}</div>`,
            anchor: new window.naver.maps.Point(60, 15)
          }
        });

        // 마커 클릭 시 표시할 정보창
        const infoWindow = new window.naver.maps.InfoWindow({
          content: `
            <div style="padding: 15px; max-width: 200px;">
              <h4 style="margin: 0 0 10px; font-size: 14px;">${restaurant.name}</h4>
              <p style="margin: 0 0 5px; font-size: 12px; color: #666;">
                ${restaurant.category} · ${restaurant.sharedBy}
              </p>
              <p style="margin: 0; color: #FFB800;">
                ${'⭐'.repeat(restaurant.rating)}
              </p>
            </div>
          `,
          borderWidth: 0,
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
        });

        // 마커 클릭 이벤트
        window.naver.maps.Event.addListener(marker, 'click', () => {
          if (infoWindow.getMap()) {
            infoWindow.close();
          } else {
            infoWindow.open(map, marker);
          }
        });

        bounds.extend(position);
        markersRef.current.push(marker);
      });

      // 모든 마커가 보이도록 지도 조정 (마커가 있을 경우에만)
      if (markersRef.current.length > 0) {
        map.fitBounds(bounds);
      }
    };

    // 초기화 시작
    initializeMap();

    // 컴포넌트 언마운트 시 마커 제거
    return () => {
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];
    };
  }, [restaurants]);

  return <div ref={mapRef} style={{ width: '100%', height }} />;
};

export { NaverMapSearch, RestaurantMap };