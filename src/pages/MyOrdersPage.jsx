import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Badge } from '@/components/ui/badge'

function statusBadgeClass(status) {
  if (status === '접수') return 'border-orange-300 bg-orange-100 text-orange-700 hover:bg-orange-100'
  if (status === '완료') return 'border-green-300 bg-green-100 text-green-700 hover:bg-green-100'
  return ''
}

export default function MyOrdersPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('orders_ex')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setOrders(data ?? [])
        setLoading(false)
      })
  }, [])

  if (loading) return <p className="p-4">불러오는 중...</p>

  return (
    <div className="p-4">
      <h1 className="mb-4 text-xl font-semibold">내 주문</h1>

      {orders.length === 0 ? (
        <p>주문 내역이 없습니다.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {orders.map((order) => (
            <li key={order.id} className="rounded-lg border p-4">
              <p>{order.items}</p>
              <p>{order.total_price.toLocaleString()}원</p>
              <Badge className={statusBadgeClass(order.status)}>{order.status}</Badge>
              <p className="mt-1 text-sm text-muted-foreground">
                {new Date(order.created_at).toLocaleString()}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
