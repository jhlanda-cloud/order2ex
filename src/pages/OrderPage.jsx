import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { menu } from '@/data/menu'
import MenuCard from '@/components/MenuCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'

export default function OrderPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [cart, setCart] = useState([]) // [{ id, quantity }]
  const [pickupTime, setPickupTime] = useState('')
  const [error, setError] = useState('')
  const [orderMessage, setOrderMessage] = useState('')

  const addToCart = (id) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === id)
      if (existing) {
        return prev.map((item) =>
          item.id === id ? { ...item, quantity: item.quantity + 1 } : item
        )
      }
      return [...prev, { id, quantity: 1 }]
    })
  }

  const changeQuantity = (id, delta) => {
    setCart((prev) =>
      prev
        .map((item) => (item.id === id ? { ...item, quantity: item.quantity + delta } : item))
        .filter((item) => item.quantity > 0)
    )
  }

  const cartItems = cart.map((cartItem) => {
    const menuItem = menu.find((item) => item.id === cartItem.id)
    return { ...cartItem, name: menuItem.name, price: menuItem.price }
  })

  const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0)
  const totalPrice = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  const handleSubmit = async () => {
    if (!pickupTime.trim()) {
      setError('픽업 희망 시간을 입력해주세요.')
      setOrderMessage('')
      return
    }
    setError('')

    const itemsText = cartItems.map((item) => `${item.name} x${item.quantity}`).join(', ')

    const { error: insertError } = await supabase.from('orders_ex').insert({
      user_id: user.id,
      pickup_time: pickupTime,
      items: itemsText,
      total_price: totalPrice,
    })

    if (insertError) {
      setError(insertError.message)
      return
    }

    setOrderMessage('주문이 접수되었습니다.')
    setCart([])
    setPickupTime('')
  }

  return (
    <div>
      <header className="flex items-center justify-between p-4">
        <h1>가게 이름</h1>
        <div className="flex items-center gap-3">
          <span>장바구니 {totalCount}</span>
          {user ? (
            <>
              <span className="text-sm text-muted-foreground">{user.email}</span>
              <Link to="/my">
                <Button variant="outline" size="sm">
                  내 주문
                </Button>
              </Link>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                로그아웃
              </Button>
            </>
          ) : (
            <Link to="/auth">
              <Button variant="outline" size="sm">
                로그인
              </Button>
            </Link>
          )}
        </div>
      </header>

      <main>
        <section className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 md:grid-cols-3">
          {menu.map((item) => (
            <MenuCard key={item.id} menu={item} onAdd={() => addToCart(item.id)} />
          ))}
        </section>

        <section className="p-4">
          <h2>주문서</h2>

          {cartItems.length === 0 ? (
            <p>담은 품목이 없습니다.</p>
          ) : (
            <ul>
              {cartItems.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-4 py-2">
                  <span>{item.name}</span>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => changeQuantity(item.id, -1)}>
                      −
                    </Button>
                    <span>{item.quantity}</span>
                    <Button size="sm" variant="outline" onClick={() => changeQuantity(item.id, 1)}>
                      +
                    </Button>
                  </div>
                  <span>{(item.price * item.quantity).toLocaleString()}원</span>
                </li>
              ))}
            </ul>
          )}

          <p>합계: {totalPrice.toLocaleString()}원</p>

          <div className="flex flex-col gap-1 py-2">
            <Label htmlFor="pickupTime">픽업 희망 시간</Label>
            <Input
              id="pickupTime"
              placeholder="예: 오후 3시"
              value={pickupTime}
              onChange={(e) => setPickupTime(e.target.value)}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          {user ? (
            <Button disabled={cartItems.length === 0} onClick={handleSubmit}>
              주문하기
            </Button>
          ) : (
            <Button disabled={cartItems.length === 0} onClick={() => navigate('/auth')}>
              로그인하고 주문하기
            </Button>
          )}

          {orderMessage && <p>{orderMessage}</p>}
        </section>
      </main>
    </div>
  )
}
