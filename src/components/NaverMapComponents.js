// src/components/NaverMapComponents.js
import React, { useEffect, useRef } from 'react';
import { CATEGORY_EMOJIS, getCategoryWithEmoji } from '../constants/categoryEmojis.js';

const DEFAULT_CENTER = {
  lat: 37.5001,
  lng: 127.0335
};

// 네이버 지도 길찾기 링크 생성 함수 - 좌표만 사용하는 버전
export const generateNaverMapDirectionLink = (_, coordinates) => {
  if (!coordinates) return null;
  return `https://map.naver.com/p/directions/${DEFAULT_CENTER.lng},${DEFAULT_CENTER.lat}/${coordinates.lng},${coordinates.lat}/-/transit?c=16.00,0,0,0,dh`;
};

// 주소 지오코딩 (좌표 변환) 함수
export const getCoordinatesFromAddress = (address) => {
  return new Promise((resolve, reject) => {
    if (!window.naver || !window.naver.maps || !window.naver.maps.Service) {
      reject(new Error('네이버 지도 API가 로드되지 않았습니다.'));
      return;
    }

    window.naver.maps.Service.geocode({
      query: address
    }, function(status, response) {
      if (status !== window.naver.maps.Service.Status.OK) {
        reject(new Error('주소를 찾을 수 없습니다.'));
        return;
      }

      const item = response.v2.addresses[0];
      const coordinates = {
        lat: parseFloat(item.y),
        lng: parseFloat(item.x)
      };

      resolve({
        coordinates,
        roadAddress: item.roadAddress,
        jibunAddress: item.jibunAddress
      });
    });
  });
};

// 지도 표시 컴포넌트
export const RestaurantMap = ({ restaurants, height = '400px' }) => {
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const infoWindowsRef = useRef([]);
  let activeInfoWindow = null;

  useEffect(() => {
    const initializeMap = () => {
      if (!window.naver || !window.naver.maps || !mapRef.current) {
        setTimeout(initializeMap, 1000);
        return;
      }

      const map = new window.naver.maps.Map(mapRef.current, {
        center: new window.naver.maps.LatLng(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng),
        zoom: 15
      });

      // 기존 마커와 정보창 제거
      markersRef.current.forEach(marker => marker.setMap(null));
      infoWindowsRef.current.forEach(infoWindow => infoWindow.setMap(null));
      markersRef.current = [];
      infoWindowsRef.current = [];

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
        pixelOffset: new window.naver.maps.Point(0, -10),
        zIndex: 100
      });

      // 오피스 마커 클릭 이벤트
      window.naver.maps.Event.addListener(officeMarker, 'click', () => {
        if (activeInfoWindow) activeInfoWindow.close();
        officeInfoWindow.open(map, officeMarker);
        activeInfoWindow = officeInfoWindow;
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
            content: `<div style="font-size: 24px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
              ${CATEGORY_EMOJIS[restaurant.category] || CATEGORY_EMOJIS['기타']}
            </div>`,
            anchor: new window.naver.maps.Point(12, 12)
          }
        });

        const infoWindow = new window.naver.maps.InfoWindow({
          content: `
            <div class="restaurant-info" style="padding: 10px; min-width: 200px;">
              <strong>${restaurant.name}</strong>
              <p style="margin: 5px 0 0; font-size: 12px;">
                ${getCategoryWithEmoji(restaurant.category)} · ${restaurant.sharedBy}
              </p>
              <p style="margin: 5px 0 0; color: #FFB800;">${'⭐'.repeat(restaurant.rating)}</p>
              <a href="${generateNaverMapDirectionLink(restaurant.address, restaurant.coordinates)}" 
                target="_blank" 
                rel="noopener noreferrer"
                style="display: inline-block; margin-top: 8px; padding: 4px 8px; background: #693bf2; color: white; text-decoration: none; border-radius: 4px; font-size: 12px;"
                onclick="event.stopPropagation();"
              >
                길찾기
              </a>
            </div>
          `,
          borderWidth: 0,
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
          pixelOffset: new window.naver.maps.Point(0, -10),
          zIndex: 100
        });

        infoWindowsRef.current.push(infoWindow);

        // 마커 클릭 이벤트
        window.naver.maps.Event.addListener(marker, 'click', () => {
          if (activeInfoWindow) activeInfoWindow.close();
          infoWindow.open(map, marker);
          activeInfoWindow = infoWindow;
        });

        bounds.extend(position);
        markersRef.current.push(marker);
      });

      if (markersRef.current.length > 0) {
        map.fitBounds(bounds);
      }

      // 지도 클릭 시 열린 정보창 닫기
      window.naver.maps.Event.addListener(map, 'click', () => {
        if (activeInfoWindow) {
          activeInfoWindow.close();
          activeInfoWindow = null;
        }
      });
    };

    initializeMap();

    return () => {
      markersRef.current.forEach(marker => marker.setMap(null));
      infoWindowsRef.current.forEach(infoWindow => infoWindow.setMap(null));
      markersRef.current = [];
      infoWindowsRef.current = [];
    };
  }, [restaurants]);

  return <div ref={mapRef} style={{ width: '100%', height }} />;
};