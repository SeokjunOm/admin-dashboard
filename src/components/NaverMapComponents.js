// src/components/NaverMapComponents.js
import React, { useState, useEffect, useRef } from 'react';

// 네이버 지도 검색 컴포넌트
const NaverMapSearch = ({ onPlaceSelect }) => {
  const [mapUrl, setMapUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // URL에서 실제 장소 데이터 추출
  const getPlaceInfo = async (url) => {
    let searchQuery;
    const geocoder = new naver.maps.Service.Geocoder();

    if (url.includes('naver.me')) {
      const response = await fetch(`https://cors-anywhere.herokuapp.com/${url}`);
      if (!response.ok) throw new Error('단축 URL을 처리할 수 없습니다');
      const fullUrl = response.url;
      searchQuery = new URLSearchParams(new URL(fullUrl).search).get('query');
    } else {
      try {
        const parsedUrl = new URL(url);
        searchQuery = parsedUrl.pathname.split('/').pop() || 
                     parsedUrl.searchParams.get('query') || 
                     parsedUrl.searchParams.get('address');
      } catch (e) {
        throw new Error('올바른 네이버 지도 URL이 아닙니다');
      }
    }

    if (!searchQuery) {
      throw new Error('URL에서 장소 정보를 찾을 수 없습니다');
    }

    return new Promise((resolve, reject) => {
      geocoder.geocode({
        query: decodeURIComponent(searchQuery)
      }, function(status, response) {
        if (status !== naver.maps.Service.Status.OK) {
          reject(new Error('장소를 찾을 수 없습니다'));
          return;
        }

        const address = response.v2.addresses[0];
        if (!address) {
          reject(new Error('주소를 찾을 수 없습니다'));
          return;
        }

        resolve({
          name: searchQuery.split(' ')[0],
          address: address.roadAddress || address.jibunAddress,
          coordinates: {
            lat: parseFloat(address.y),
            lng: parseFloat(address.x)
          }
        });
      });
    });
  };

  const handleSearch = async () => {
    if (!mapUrl) return;
    
    setLoading(true);
    setError(null);

    try {
      // 1. 네이버 지도에서 장소 정보 가져오기
      const placeInfo = await getPlaceInfo(mapUrl);

      // 2. MockAPI에 데이터 임시 저장
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
      
      // 3. 부모 컴포넌트로 데이터 전달
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