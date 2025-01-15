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
          const response = await fetch(url);
          const fullUrl = response.url;
          return extractPlaceIdFromFullUrl(fullUrl);
        } catch (error) {
          // 축약 URL에서 직접 ID 추출 시도
          const id = url.split('/').pop();
          if (id && id.length > 0) {
            return id;
          }
          console.error('축약 URL 처리 중 에러:', error);
        }
      }
      
      return extractPlaceIdFromFullUrl(url);
    } catch (err) {
      throw new Error('URL 처리 중 오류가 발생했습니다.');
    }
  };

  const extractPlaceIdFromFullUrl = (url) => {
    const patterns = [
      /place(?:%2F|\/)([\d]+)/,
      /entry\/place\/([\d]+)/,
      /restaurant\/([\d]+)/,
      /location\/([\d]+)/,
      /(\d+)$/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
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
  
        // 테스트용 임시 데이터 (실제로는 네이버 API에서 가져와야 함)
        const placeInfo = {
          name: "테스트 식당",
          address: "서울시 강남구 테헤란로 133",
          coordinates: {
            lat: 37.4987,
            lng: 127.0297
          }
        };
  
        // Mock API에 데이터 저장
        const response = await fetch('https://67866aa9f80b78923aa6bee6.mockapi.io/navermapdata', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: placeInfo.name,
            address: placeInfo.address,
            coordinates: placeInfo.coordinates
          })
        });
  
        if (!response.ok) throw new Error('데이터 저장에 실패했습니다');
        const savedData = await response.json();
        
        onPlaceSelect({
          name: savedData.name,
          address: savedData.address,
          coordinates: savedData.coordinates,
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

      // 기존 마커와 정보창 제거
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];
      if (infoWindowRef.current) {
        infoWindowRef.current.setMap(null);
      }

      // 숨고 오피스 마커 추가
      const officeMarker = new window.naver.maps.Marker({
        position: new window.naver.maps.LatLng(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng),
        map: map,
        icon: {
          content: '<div style="width: 12px; height: 12px; background: #FF4757; border-radius: 50%; border: 2px solid #FFF; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>',
          anchor: new window.naver.maps.Point(6, 6)
        }
      });

      // 오피스 정보창
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

      // 오피스 마커 이벤트
      window.naver.maps.Event.addListener(officeMarker, 'mouseover', () => {
        officeInfoWindow.open(map, officeMarker);
      });
      window.naver.maps.Event.addListener(officeMarker, 'mouseout', () => {
        officeInfoWindow.close();
      });

      // 경계 설정
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
            content: '<div style="width: 10px; height: 10px; background: var(--primary); border-radius: 50%; border: 2px solid #FFF; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>',
            anchor: new window.naver.maps.Point(5, 5)
          }
        });

        // 마커에 마우스 오버시 표시할 정보창
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

        // 마커 이벤트
        window.naver.maps.Event.addListener(marker, 'mouseover', () => {
          infoWindow.open(map, marker);
        });
        window.naver.maps.Event.addListener(marker, 'mouseout', () => {
          infoWindow.close();
        });

        bounds.extend(position);
        markersRef.current.push(marker);
      });

      // 모든 마커가 보이도록 지도 조정
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