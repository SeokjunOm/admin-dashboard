// src/components/NaverMapComponents.js
import React, { useState, useEffect, useRef } from 'react';

const NaverMapSearch = ({ onPlaceSelect }) => {
  const [mapUrl, setMapUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleUrlChange = async (e) => {
    const newUrl = e.target.value;
    setMapUrl(newUrl);
    
    if (!newUrl) return;

    setLoading(true);
    setError(null);
    
    try {
      // 1. 네이버 지도 API를 통해 장소 정보 가져오기
      const map = new window.naver.maps.Map('temp-map-div', {
        center: new window.naver.maps.LatLng(37.5666805, 126.9784147),
        zoom: 15,
      });

      const urlObj = new URL(newUrl);
      const searchParams = new URLSearchParams(urlObj.search);
      let address;
      let placeId;
      
      if (newUrl.includes('naver.me')) {
        // 단축 URL인 경우, 실제 URL로 리다이렉트
        const response = await fetch(newUrl);
        const redirectUrl = response.url;
        placeId = redirectUrl.match(/place\/(\d+)/)?.[1];
        if (!placeId) {
          throw new Error('올바른 네이버 지도 URL이 아닙니다');
        }
        // 임시로 장소명과 주소를 설정 (실제로는 네이버 지도 API에서 가져와야 함)
        address = placeId;
      } else {
        placeId = newUrl.match(/place\/(\d+)/)?.[1];
        if (!placeId) {
          throw new Error('올바른 네이버 지도 URL이 아닙니다');
        }
        address = placeId;
      }

      if (!address) {
        throw new Error('주소를 찾을 수 없습니다.');
      }

      // 2. 네이버 지도 Geocoding으로 좌표 얻기
      const placeInfo = await new Promise((resolve, reject) => {
        window.naver.maps.Service.geocode({
          query: address
        }, function(status, response) {
          if (status !== window.naver.maps.Service.Status.OK) {
            reject(new Error('주소 검색에 실패했습니다.'));
            return;
          }

          const result = response.v2.addresses[0];
          const name = address.split(' ')[0]; // 가게명 추출

          resolve({
            name: "테스트 식당", // 실제로는 API에서 가져온 이름을 사용
            address: result.roadAddress || result.jibunAddress,
            coordinates: {
              lat: parseFloat(result.y),
              lng: parseFloat(result.x)
            }
          });
        });
      });

      // 3. MockAPI에 데이터 저장
      const mockResponse = await fetch('https://67866aa9f80b78923aa6bee6.mockapi.io/navermapdata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(placeInfo)
      });

      if (!mockResponse.ok) {
        throw new Error('데이터 저장에 실패했습니다');
      }

      const savedData = await mockResponse.json();
      
      // 4. 상위 컴포넌트에 데이터 전달
      onPlaceSelect({
        name: savedData.name,
        address: savedData.address,
        coordinates: savedData.coordinates,
        link: newUrl
      });

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
          onChange={handleUrlChange}
          placeholder="네이버 지도 URL을 붙여넣으세요 (축약 URL도 가능)"
          className="search-input"
          disabled={loading}
        />
        {loading && <p className="loading-message">장소 정보를 가져오는 중...</p>}
        {error && <p className="error-message">{error}</p>}
      </div>
      {/* 임시 지도 div - 화면에 보이지 않음 */}
      <div id="temp-map-div" style={{ display: 'none' }}></div>
    </div>
  );
};

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