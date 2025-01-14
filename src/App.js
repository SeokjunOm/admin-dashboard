import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [stats, setStats] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newOrder, setNewOrder] = useState({ customerName: '', product: '', amount: '', status: 'pending', statusLabel: 'in progress' });
  const [editingOrder, setEditingOrder] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const statsResponse = await fetch('https://67866aa9f80b78923aa6bee6.mockapi.io/stats');
        const statsData = await statsResponse.json();
        setStats(statsData);

        const ordersResponse = await fetch('https://67866aa9f80b78923aa6bee6.mockapi.io/orders');
        const ordersData = await ordersResponse.json();
        setOrders(ordersData);
      } catch (err) {
        setError('데이터를 가져오는 중 에러가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // 데이터 추가 함수
  const addOrder = async () => {
    try {
      const response = await fetch('https://67866aa9f80b78923aa6bee6.mockapi.io/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOrder),
      });
      const data = await response.json();
      setOrders([...orders, data]);
      setNewOrder({ customerName: '', product: '', amount: '', status: 'pending', statusLabel: '대기중' });
    } catch (err) {
      console.error('추가 실패:', err);
    }
  };

  // 데이터 삭제 함수
  const deleteOrder = async (id) => {
    try {
      await fetch(`https://67866aa9f80b78923aa6bee6.mockapi.io/orders/${id}`, { method: 'DELETE' });
      setOrders(orders.filter((order) => order.id !== id));
    } catch (err) {
      console.error('삭제 실패:', err);
    }
  };

  // 데이터 수정 함수
  const updateOrder = async () => {
    try {
      const response = await fetch(`https://67866aa9f80b78923aa6bee6.mockapi.io/orders/${editingOrder.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingOrder),
      });
      const updatedOrder = await response.json();
      setOrders(orders.map((order) => (order.id === updatedOrder.id ? updatedOrder : order)));
      setEditingOrder(null);
    } catch (err) {
      console.error('수정 실패:', err);
    }
  };

  // 매출과 주문 카운트를 계산하는 함수
  const totalSales = orders.reduce((acc, order) => acc + parseFloat(order.amount), 0);
  const totalOrders = new Set(orders.map(order => order.id)).size; // 고유한 주문 ID 개수

  if (loading) return <div>로딩 중...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="admin-dashboard">
      {/* 헤더 */}
      <header>
        <h1>관리자 대시보드</h1>
      </header>

      {/* 통계 카드 */}
      <div className="stats-cards">
        <div className="card">
          <h2>매출</h2>
          <p className="value">{totalSales.toLocaleString()} 원</p>
          <p className="change">+23% 지난달 대비</p>
        </div>
        <div className="card">
          <h2>주문</h2>
          <p className="value">{totalOrders}</p>
          <p className="change">+8% 지난달 대비</p>
        </div>
      </div>

      {/* 새 주문 추가 */}
      <section>
        <h2>새 주문 추가</h2>
        <input
          type="text"
          placeholder="고객명"
          value={newOrder.customerName}
          onChange={(e) => setNewOrder({ ...newOrder, customerName: e.target.value })}
        />
        <input
          type="text"
          placeholder="상품"
          value={newOrder.product}
          onChange={(e) => setNewOrder({ ...newOrder, product: e.target.value })}
        />
        <input
          type="text"
          placeholder="금액"
          value={newOrder.amount}
          onChange={(e) => setNewOrder({ ...newOrder, amount: e.target.value })}
        />
        <button onClick={addOrder}>추가</button>
      </section>

      {/* 최근 주문 */}
      <section className="recent-orders">
        <h2>최근 주문</h2>
        <p>최근에 들어온 주문 목록입니다</p>
        <table>
          <thead>
            <tr>
              <th>주문번호</th>
              <th>고객명</th>
              <th>상품</th>
              <th>금액</th>
              <th>상태</th>
              <th>작업</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td>{order.id}</td>
                <td>{order.customerName}</td>
                <td>{order.product}</td>
                <td>{order.amount}</td>
                <td className={`status ${order.status}`}>{order.statusLabel}</td>
                <td>
                  <button onClick={() => setEditingOrder(order)}>수정</button>
                  <button onClick={() => deleteOrder(order.id)}>삭제</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* 수정 UI */}
      {editingOrder && (
        <section>
          <h2>주문 수정</h2>
          <input
            type="text"
            placeholder="고객명"
            value={editingOrder.customerName}
            onChange={(e) => setEditingOrder({ ...editingOrder, customerName: e.target.value })}
          />
          <input
            type="text"
            placeholder="상품"
            value={editingOrder.product}
            onChange={(e) => setEditingOrder({ ...editingOrder, product: e.target.value })}
          />
          <input
            type="text"
            placeholder="금액"
            value={editingOrder.amount}
            onChange={(e) => setEditingOrder({ ...editingOrder, amount: e.target.value })}
          />
          <button onClick={updateOrder}>수정 완료</button>
          <button onClick={() => setEditingOrder(null)}>취소</button>
        </section>
      )}
    </div>
  );
}

export default App;
