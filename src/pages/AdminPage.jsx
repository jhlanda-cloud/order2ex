import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog'

const ADMIN_EMAIL = 'admin@hotmail.com'

function statusBadgeClass(status) {
  if (status === '접수') return 'border-orange-300 bg-orange-100 text-orange-700 hover:bg-orange-100'
  if (status === '완료') return 'border-green-300 bg-green-100 text-green-700 hover:bg-green-100'
  return ''
}

export default function AdminPage() {
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      navigate('/auth', { replace: true })
      return
    }
    if (user.email !== ADMIN_EMAIL) {
      navigate('/', { replace: true })
      return
    }

    supabase
      .from('orders_ex')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setOrders(data ?? [])
        setLoading(false)
      })
  }, [authLoading, user, navigate])

  const handleComplete = async (id) => {
    const { error } = await supabase.from('orders_ex').update({ status: '완료' }).eq('id', id)
    if (error) return
    setOrders((prev) => prev.map((order) => (order.id === id ? { ...order, status: '완료' } : order)))
  }

  const handleDelete = async (id) => {
    const { error } = await supabase.from('orders_ex').delete().eq('id', id)
    if (error) return
    setOrders((prev) => prev.filter((order) => order.id !== id))
  }

  if (authLoading || !user || user.email !== ADMIN_EMAIL || loading) {
    return <p className="p-4">불러오는 중...</p>
  }

  return (
    <div className="p-4">
      <h1 className="mb-4 text-xl font-semibold">관리 화면</h1>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>주문자</TableHead>
            <TableHead>픽업 시간</TableHead>
            <TableHead>품목</TableHead>
            <TableHead>금액</TableHead>
            <TableHead>상태</TableHead>
            <TableHead>시각</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id}>
              <TableCell>{order.user_id}</TableCell>
              <TableCell>{order.pickup_time}</TableCell>
              <TableCell>{order.items}</TableCell>
              <TableCell>{order.total_price.toLocaleString()}원</TableCell>
              <TableCell>
                <Badge className={statusBadgeClass(order.status)}>{order.status}</Badge>
              </TableCell>
              <TableCell>{new Date(order.created_at).toLocaleString()}</TableCell>
              <TableCell className="flex gap-2">
                <Button size="sm" disabled={order.status === '완료'} onClick={() => handleComplete(order.id)}>
                  완료
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="outline">
                      삭제
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>주문을 삭제할까요?</AlertDialogTitle>
                      <AlertDialogDescription>
                        이 작업은 되돌릴 수 없습니다. 해당 주문 데이터가 완전히 삭제됩니다.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>취소</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(order.id)}>삭제</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
