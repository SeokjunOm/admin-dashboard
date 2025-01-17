// src/components/NaverMapComponents.js
import React, { useState, useEffect, useRef } from 'react';

// 네이버 지도 검색 컴포넌트
// src/components/NaverMapComponents.js의 NaverMapSearch 컴포넌트 부분

const NaverMapSearch = ({ onPlaceSelect }) => {
  const [mapUrl, setMapUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const searchPlace = async (query) => {
    const response = await fetch('/api/v1/search/local.json', {
      headers: {
        'X-Naver-Client-Id': process.env.REACT_APP_NAVER_CLIENT_ID,
        'X-Naver-Client-Secret': process.env.REACT_APP_NAVER_CLIENT_SECRET
      },
      params: {
        query: query,
        display: 1
      }
    });

    if (!response.ok) throw new Error('검색에 실패했습니다');
    const data = await response.json();
    return data.items[0];  // 첫 번째 검색 결과 반환
  };

  const handleSearch = async () => {
    if (!mapUrl) return;
    
    setLoading(true);
    setError(null);

    try {
      let placeId;

      // URL 처리
      if (mapUrl.includes('naver.me')) {
        // 단축 URL의 경우 ID만 추출
        placeId = mapUrl.split('/').pop();
      } else if (mapUrl.includes('place/')) {
        // 일반 URL의 경우 place ID 추출
        const match = mapUrl.match(/place\/([^?]+)/);
        placeId = match ? match[1] : null;
      }

      if (!placeId) {
        throw new Error('올바른 네이버 지도 URL이 아닙니다');
      }

      // 1. 네이버 검색 API로 장소 정보 가져오기
      const placeData = await searchPlace(placeId);
      
      // 2. 지오코딩으로 주소와 좌표 가져오기
      const addressInfo = await new Promise((resolve, reject) => {
        naver.maps.Service.geocode({
          query: placeData.address  // 검색 API에서 받은 주소로 검색
        }, function(status, response) {
          if (status === naver.maps.Service.Status.ERROR) {
            reject(new Error('주소 검색에 실패했습니다'));
            return;
          }

          if (!response.v2.addresses || response.v2.addresses.length === 0) {
            reject(new Error('주소를 찾을 수 없습니다'));
            return;
          }

          const address = response.v2.addresses[0];
          resolve({
            address: address.roadAddress || address.jibunAddress,
            coordinates: {
              lat: parseFloat(address.y),
              lng: parseFloat(address.x)
            }
          });
        });
      });

      const placeInfo = {
        name: placeData.title.replace(/<[^>]*>/g, ''),  // HTML 태그 제거
        address: addressInfo.address,
        coordinates: addressInfo.coordinates
      };

      // 3. MockAPI에 데이터 임시 저장
      const response = await fetch('https://67866aa9f80b78923aa6bee6.mockapi.io/navermapdata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...placeInfo,
          link: mapUrl
        })
      });

      if (!response.ok) {
        throw new Error('데이터 저장에 실패했습니다');
      }

      const savedData = await response.json();
      onPlaceSelect(savedData);

    } catch (err) {
      console.error('Error:', err);
      setError(err.message || '장소 정보를 가져오는데 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="map-search">
      <div className="form-field">
        <label>네이버 지도 URL</label>
        <input
          type="text"
          value={mapUrl}
          onChange={(e) => setMapUrl(e.target.value)}
          placeholder="네이버 지도 URL을 붙여넣으세요 (축약 URL도 가능)"
          className="search-input"
          disabled={loading}
        />
        {loading && <p className="loading-message">장소 정보를 가져오는 중...</p>}
        {error && <p className="error-message">{error}</p>}
      </div>
      
      <button 
        className="next-btn"
        onClick={handleSearch}
        disabled={loading || !mapUrl}
      >
        다음 단계
      </button>
    </div>
  );
};

// 지도 표시 컴포넌트
const RestaurantMap = ({ restaurants, height = '400px' }) => {
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const infoWindowRef = useRef(null);

  // 숨고 오피스 위치 (테헤란로 133)
  const DEFAULT_CENTER = {
    lat: 37.5001,
    lng: 127.0335
  };

  useEffect(() => {
    const initializeMap = () => {
      if (!window.naver || !window.naver.maps || !mapRef.current) {
        setTimeout(initializeMap, 1000);
        return;
      }

      // 지도 초기화
      const map = new window.naver.maps.Map(mapRef.current, {
        center: new window.naver.maps.LatLng(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng),
        zoom: 15
      });

      // 기존 마커 제거
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];
      if (infoWindowRef.current) {
        infoWindowRef.current.setMap(null);
      }

      // 숨고 오피스 마커
      const officeMarker = new window.naver.maps.Marker({
        position: new window.naver.maps.LatLng(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng),
        map: map,
        icon: {
          content: '<div style="width: 12px; height: 12px; background: #FF4757; border-radius: 50%; border: 2px solid #FFF; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>',
          anchor: new window.naver.maps.Point(6, 6)
        }
      });

      const officeInfoWindow = new window.naver.maps.InfoWindow({
        content: `
          <div style="padding: 10px;">
            <strong>숨고 오피스</strong>
            <p style="margin: 5px 0 0; font-size: 12px;">테헤란로 133</p>
          </div>
        `,
        borderWidth: 0,
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
        pixelOffset: new window.naver.maps.Point(0, -10)
      });

      window.naver.maps.Event.addListener(officeMarker, 'mouseover', () => {
        officeInfoWindow.open(map, officeMarker);
      });
      window.naver.maps.Event.addListener(officeMarker, 'mouseout', () => {
        officeInfoWindow.close();
      });

      // 맛집 마커 추가
      const bounds = new window.naver.maps.LatLngBounds();
      bounds.extend(new window.naver.maps.LatLng(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng));

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
            content: '<div style="width: 10px; height: 10px; background: var(--primary); border-radius: 50%; border: 2px solid #FFF; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>',
            anchor: new window.naver.maps.Point(5, 5)
          }
        });

        const infoWindow = new window.naver.maps.InfoWindow({
          content: `
            <div style="padding: 10px;">
              <strong>${restaurant.name}</strong>
              <p style="margin: 5px 0 0; font-size: 12px;">${restaurant.category} · ${restaurant.sharedBy}</p>
              <p style="margin: 5px 0 0; color: #FFB800;">${'⭐'.repeat(restaurant.rating)}</p>
            </div>
          `,
          borderWidth: 0,
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
          pixelOffset: new window.naver.maps.Point(0, -10)
        });

        window.naver.maps.Event.addListener(marker, 'mouseover', () => {
          infoWindow.open(map, marker);
        });
        window.naver.maps.Event.addListener(marker, 'mouseout', () => {
          infoWindow.close();
        });

        bounds.extend(position);
        markersRef.current.push(marker);
      });

      if (markersRef.current.length > 0) {
        map.fitBounds(bounds);
      }
    };

    initializeMap();

    return () => {
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];
      if (infoWindowRef.current) {
        infoWindowRef.current.setMap(null);
      }
    };
  }, [restaurants]);

  return <div ref={mapRef} style={{ width: '100%', height }} />;
};

export { NaverMapSearch, RestaurantMap };