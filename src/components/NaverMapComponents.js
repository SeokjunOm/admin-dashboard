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
        try {
          const id = url.split('/').pop();  // URL의 마지막 부분을 ID로 사용
          if (id && id.length > 0) {
            return id;
          }
        } catch (error) {
          console.error('축약 URL 처리 중 에러:', error);
        }
      }
      
      // 일반 URL 처리
      const patterns = [
        /place(?:%2F|\/)([\d]+)/,  // place/ 또는 place%2F 뒤의 숫자
        /entry\/place\/([\d]+)/,    // entry/place/ 뒤의 숫자
        /restaurant\/([\d]+)/,      // restaurant/ 뒤의 숫자
        /location\/([\d]+)/,        // location/ 뒤의 숫자
        /(\d+)$/                    // URL 끝의 숫자 (축약 URL용)
      ];

      for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
      }
      
      return null;
    } catch (err) {
      throw new Error('URL 처리 중 오류가 발생했습니다.');
    }
  };

  // URL 입력값이 변경될 때마다 실행되는 함수
  const handleUrlChange = async (e) => {
    const newUrl = e.target.value;
    setMapUrl(newUrl);
    
    if (newUrl) {
      setLoading(true);
      setError(null);
      
      try {
        const placeId = await extractPlaceId(newUrl);
        if (!placeId) {
          setError('올바른 네이버 지도 URL이 아닙니다');
          return;
        }

        // 네이버 지도 API 호출
        const map = window.naver.maps;
        
        // place ID를 통해 장소 상세 정보 조회
        const response = await fetch(`https://map.naver.com/v5/api/sites/summary/${placeId}?lang=ko`);
        if (!response.ok) throw new Error('장소 정보를 가져오는데 실패했습니다');
        
        const placeInfo = await response.json();
        
        // API 응답에서 필요한 데이터 추출
        onPlaceSelect({
          name: placeInfo.name,
          address: placeInfo.fullAddress || placeInfo.address,
          rating: placeInfo.reviewScore ? Math.round(placeInfo.reviewScore) : 0,
          coordinates: {
            lat: placeInfo.y,
            lng: placeInfo.x
          },
          link: newUrl
        });

      } catch (err) {
        console.error('API 호출 에러:', err);
        setError('장소 정보를 가져오는데 실패했습니다');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="map-search">
      <div className="form-field">
        <label>네이버 지도 URL</label>
        <input
          type="text"
          value={mapUrl}
          onChange={handleUrlChange}
          placeholder="네이버 지도 URL을 붙여넣으세요 (축약 URL도 가능)"
          className="search-input"
        />
        {error && <p className="error-message">{error}</p>}
      </div>
    </div>
  );
};

// 지도에 마커를 표시하는 컴포넌트
const RestaurantMap = ({ restaurants, height = '400px' }) => {
  const mapRef = useRef(null);
  const markersRef = useRef([]);

  // 숨고 오피스 위치 (테헤란로 427)
  const DEFAULT_CENTER = {
    lat: 37.5065,
    lng: 127.0536
  };

  useEffect(() => {
    // 네이버 맵 스크립트가 로드되었는지 확인
    const initializeMap = () => {
      if (!window.naver || !window.naver.maps || !mapRef.current) {
        setTimeout(initializeMap, 1000);
        return;
      }

      // 지도 초기화 시 기준점 설정
      const map = new window.naver.maps.Map(mapRef.current, {
        center: new window.naver.maps.LatLng(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng),
        zoom: 15  // 줌 레벨도 조정
      });

      // 기존 마커 제거
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];

      // 기준점 마커 추가
      new window.naver.maps.Marker({
        position: new window.naver.maps.LatLng(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng),
        map: map,
        icon: {
          content: `<div style="
            background: #FF4757;
            padding: 5px 10px;
            border-radius: 20px;
            color: white;
            font-size: 12px;
            font-weight: 600;
            box-shadow: 0 2px 6px rgba(0,0,0,0.1);
          ">숨고 오피스</div>`,
          anchor: new window.naver.maps.Point(60, 15)
        }
      });

      // 모든 레스토랑의 좌표를 포함하는 경계 설정
      const bounds = new window.naver.maps.LatLngBounds();
      bounds.extend(new window.naver.maps.LatLng(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng));

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